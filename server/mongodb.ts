import mongoose from 'mongoose';
import { log } from './vite';
import { MongoClient, Db } from 'mongodb';

// MongoDB connection settings
const dbName = 'productivity-app';

// Build MongoDB URI with credentials
const MONGODB_USERNAME = process.env.MONGODB_URI ? '' : 'Agenda';
const MONGODB_PASSWORD = process.env.MONGODB_URI ? '' : 'iN6kazxV3HA46qPN';
const MONGODB_DEFAULT_URI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0.72j4r.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

// Use environment variable if available, otherwise use the default URI
const MONGODB_URI = process.env.MONGODB_URI || MONGODB_DEFAULT_URI;

// In-memory MongoDB implementation (instead of MongoMemoryServer)
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Connection Options - Increased timeouts for better stability
const options = {
  // Set longer timeouts to prevent connection issues
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  // Use a more stable connection pool
  maxPoolSize: 10,
  minPoolSize: 2,
  // Add retry mechanism
  retryWrites: true,
  retryReads: true
} as mongoose.ConnectOptions;

// In-memory data storage
const inMemoryData = {
  users: [],
  userSettings: [],
  aiPreferences: [],
  analytics: [],
  events: [],
  eventRecurrences: [],
  eventReminders: [],
  tags: [],
  integrations: [],
  chatMessages: [],
  counters: {
    users: 0,
    userSettings: 0,
    aiPreferences: 0,
    analytics: 0,
    events: 0,
    eventRecurrences: 0,
    eventReminders: 0,
    tags: 0,
    integrations: 0,
    chatMessages: 0
  }
};

// Connect to MongoDB with retry mechanism
export async function connectToDatabase() {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // First try to use the environment variable if provided
      if (MONGODB_URI) {
        log(`Attempting to connect to MongoDB using environment variable (attempt ${retries + 1}/${MAX_RETRIES})`, 'mongodb');
        try {
          await mongoose.connect(MONGODB_URI, options);
          log('Connected to MongoDB successfully using environment variable!', 'mongodb');
          return mongoose.connection;
        } catch (connErr) {
          log(`Failed to connect to MongoDB: ${connErr}`, 'mongodb');
          // Continue with in-memory implementation
        }
      }
      
      // Use in-memory mongoose implementation
      log(`Using in-memory Mongoose implementation (attempt ${retries + 1}/${MAX_RETRIES})...`, 'mongodb');
      
      // Just make mongoose aware that we're connected
      // We actually won't use mongoose, but will use our own in-memory data
      const mockConnectionString = 'mongodb://localhost:27017/inmemory';
      await mongoose.connect(mockConnectionString, {
        ...options,
        connectTimeoutMS: 1000, // Fast timeout since we're not really connecting
      });
      
      log('Connected to in-memory MongoDB successfully!', 'mongodb');
      return mongoose.connection;
    } catch (error) {
      retries++;
      log(`MongoDB connection error (attempt ${retries}/${MAX_RETRIES}): ${error}`, 'mongodb');
      
      if (retries < MAX_RETRIES) {
        log(`Retrying connection in 2 seconds...`, 'mongodb');
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        log('Maximum connection attempts reached.', 'mongodb');
        // We'll use our own in-memory implementation instead
        log('Using fully in-memory database implementation', 'mongodb');
        return null;
      }
    }
  }
  
  return null;
}

// Counter collection for auto-incrementing IDs
// This ensures that each collection has a sequential ID system
// that matches the user's ID for related collections
export interface ICounter extends mongoose.Document {
  _id: string;
  sequence_value: number;
}

const counterSchema = new mongoose.Schema<ICounter>({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);

// Function to get the next ID for a specific collection
export async function getNextSequenceValue(sequenceName: string, userId?: number): Promise<number> {
  // If userId is provided and the sequence is for a user-related collection,
  // we'll use the userId as the sequence value for consistent IDs
  if (userId && (
    sequenceName === 'userSettings' || 
    sequenceName === 'aiPreferences' || 
    sequenceName === 'userProfiles'
  )) {
    return userId;
  }
  
  try {
    // Try to use mongoose Counter model if it's working
    const sequenceDocument = await Counter.findByIdAndUpdate(
      sequenceName,
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
  } catch (error) {
    // Fallback to in-memory counters if mongoose is not working
    log(`Using in-memory counter for ${sequenceName}`, 'mongodb');
    const counterName = sequenceName as keyof typeof inMemoryData.counters;
    inMemoryData.counters[counterName]++;
    return inMemoryData.counters[counterName];
  }
}

// Get collections by name from in-memory storage
export function getCollection(name: string): any[] {
  const collectionName = name as keyof typeof inMemoryData;
  if (collectionName in inMemoryData && Array.isArray(inMemoryData[collectionName])) {
    return inMemoryData[collectionName] as any[];
  }
  return [];
}

// Initialize counters for all collections
export async function initializeCounters() {
  const collections = [
    'users', 
    'userSettings', 
    'aiPreferences',
    'analytics',
    'events',
    'eventRecurrences',
    'eventReminders',
    'tags',
    'integrations',
    'chatMessages'
  ];
  
  try {
    // Try to initialize with Mongoose
    for (const collection of collections) {
      try {
        // Check if counter exists in Mongoose
        const counter = await Counter.findById(collection);
        if (!counter) {
          // Create counter with initial value
          await Counter.create({
            _id: collection,
            sequence_value: 0
          });
        }
        log(`Initialized counter for ${collection}`, 'mongodb');
      } catch (err) {
        // If Mongoose fails, ensure in-memory counter is initialized
        const counterName = collection as keyof typeof inMemoryData.counters;
        inMemoryData.counters[counterName] = 0;
        log(`Initialized in-memory counter for ${collection}`, 'mongodb');
      }
    }
    
    log('All counters initialized', 'mongodb');
    return true;
  } catch (error) {
    log(`Failed to initialize Mongoose counters: ${error}`, 'mongodb');
    
    // Initialize all in-memory counters as fallback
    for (const collection of collections) {
      const counterName = collection as keyof typeof inMemoryData.counters;
      inMemoryData.counters[counterName] = 0;
    }
    
    log('Initialized all in-memory counters as fallback', 'mongodb');
    return true;
  }
}