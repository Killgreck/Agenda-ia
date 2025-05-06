import mongoose from 'mongoose';
import { log } from './vite';
import { MongoMemoryServer } from 'mongodb-memory-server';

// MongoDB connection settings
const dbName = 'productivity-app';

// We'll use a separate environment variable for MongoDB to avoid conflicts with PostgreSQL
const MONGODB_URI = process.env.MONGODB_URI || '';

// Create an instance of MongoMemoryServer
let mongoMemoryServer: MongoMemoryServer | null = null;

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

// Connect to MongoDB with retry mechanism
export async function connectToDatabase() {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // First try to use the environment variable if provided
      if (MONGODB_URI) {
        log(`Attempting to connect to MongoDB using environment variable (attempt ${retries + 1}/${MAX_RETRIES})`, 'mongodb');
        await mongoose.connect(MONGODB_URI, options);
        log('Connected to MongoDB successfully using environment variable!', 'mongodb');
        return mongoose.connection;
      }
      
      // If no environment variable, use in-memory MongoDB server
      log(`Starting in-memory MongoDB server (attempt ${retries + 1}/${MAX_RETRIES})...`, 'mongodb');
      
      // Cleanup any existing server instance before creating a new one
      if (mongoMemoryServer) {
        log('Cleaning up previous in-memory MongoDB server instance', 'mongodb');
        await mongoMemoryServer.stop();
        mongoMemoryServer = null;
      }
      
      // Create with specific configuration for stability
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName,
          // Set specific port to avoid conflicts
          port: 27018 + retries, // Use different ports for each attempt
        },
        binary: {
          version: '5.0.6', // Specify a stable version
        }
      });
      
      const memoryServerUri = mongoMemoryServer.getUri();
      log(`In-memory MongoDB server started with URI: ${memoryServerUri}`, 'mongodb');
      
      await mongoose.connect(memoryServerUri, options);
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
        log('Maximum connection attempts reached. Falling back to alternative storage.', 'mongodb');
        // During transition, we'll gracefully handle MongoDB connection failures
        log('Continuing with PostgreSQL database since MongoDB connection failed', 'mongodb');
        
        // Make sure there's no hanging server instance
        if (mongoMemoryServer) {
          try {
            await mongoMemoryServer.stop();
          } catch (stopError) {
            log(`Error stopping MongoDB memory server: ${stopError}`, 'mongodb');
          }
          mongoMemoryServer = null;
        }
        
        return null;
      }
    }
  }
  
  return null; // This shouldn't be reached due to the return in the last else block
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

// Initialize counters for all collections with retry mechanism
export async function initializeCounters() {
  const MAX_RETRIES = 3;
  
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
      let retries = 0;
      let success = false;
      
      while (retries < MAX_RETRIES && !success) {
        try {
          // Check if counter exists
          const counter = await Counter.findById(collection);
          if (!counter) {
            // Create counter with initial value
            await Counter.create({
              _id: collection,
              sequence_value: 0
            });
          }
          log(`Initialized counter for ${collection}`, 'mongodb');
          success = true;
        } catch (err) {
          retries++;
          log(`Error initializing counter for ${collection} (attempt ${retries}/${MAX_RETRIES}): ${err}`, 'mongodb');
          
          if (retries < MAX_RETRIES) {
            log(`Retrying counter initialization for ${collection} in 1 second...`, 'mongodb');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            log(`Failed to initialize counter for ${collection} after ${MAX_RETRIES} attempts`, 'mongodb');
          }
        }
      }
    }
    
    log('All counters initialized', 'mongodb');
    return true;
  } catch (error) {
    log(`Failed to initialize counters: ${error}`, 'mongodb');
    // Continue even if counters fail to initialize
    // This allows the application to fall back to PostgreSQL
    return false;
  }
}