import mongoose from 'mongoose';
import { log } from './vite';
import { MongoMemoryServer } from 'mongodb-memory-server';

// MongoDB connection settings
const dbName = 'productivity-app';

// We'll use a separate environment variable for MongoDB to avoid conflicts with PostgreSQL
const MONGODB_URI = process.env.MONGODB_URI || '';

// Create an instance of MongoMemoryServer
let mongoMemoryServer: MongoMemoryServer | null = null;

// Connection Options
const options = {
  // Set a timeout for the connection to prevent hanging
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
} as mongoose.ConnectOptions;

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    // First try to use the environment variable if provided
    if (MONGODB_URI) {
      log(`Attempting to connect to MongoDB using environment variable`, 'mongodb');
      await mongoose.connect(MONGODB_URI, options);
      log('Connected to MongoDB successfully using environment variable!', 'mongodb');
      return mongoose.connection;
    }
    
    // If no environment variable, use in-memory MongoDB server
    log('Starting in-memory MongoDB server...', 'mongodb');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName
      }
    });
    
    const memoryServerUri = mongoMemoryServer.getUri();
    log(`In-memory MongoDB server started with URI: ${memoryServerUri}`, 'mongodb');
    
    await mongoose.connect(memoryServerUri, options);
    log('Connected to in-memory MongoDB successfully!', 'mongodb');
    return mongoose.connection;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    
    // During transition, we'll gracefully handle MongoDB connection failures
    log('Continuing with PostgreSQL database since MongoDB connection failed', 'mongodb');
    return null;
  }
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
  
  // For other collections, use auto-incrementing sequence
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  
  return sequenceDocument.sequence_value;
}

// Initialize counters for all collections
export async function initializeCounters() {
  try {
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
    
    for (const collection of collections) {
      try {
        // Check if counter exists
        const counter = await Counter.findById(collection);
        if (!counter) {
          // Create counter with initial value
          await Counter.create({
            _id: collection,
            sequence_value: 0
          });
          log(`Initialized counter for ${collection}`, 'mongodb');
        }
      } catch (err) {
        log(`Error initializing counter for ${collection}: ${err}`, 'mongodb');
      }
    }
    
    log('All counters initialized', 'mongodb');
  } catch (error) {
    log(`Failed to initialize counters: ${error}`, 'mongodb');
    // Continue even if counters fail to initialize
    // This allows the application to fall back to PostgreSQL
  }
}