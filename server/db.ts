// This file now acts as a bridge between the old PostgreSQL setup and the new MongoDB setup
// Imports kept for backward compatibility during transition
import * as schema from "@shared/schema";
import { log } from './vite';
import { connectToDatabase, initializeCounters } from './mongodb';
import { setMongoAvailability } from './storage';

// Initialize MongoDB connection and set up counters
export const initializeDatabase = async () => {
  try {
    // Set a timeout for the whole operation to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("MongoDB connection timeout")), 10000);
    });
    
    // Try to connect with a timeout
    const result = await Promise.race([
      connectToDatabase().then(async (connection) => {
        if (connection) {
          await initializeCounters();
          log('MongoDB database initialized successfully', 'mongodb');
          // Set MongoDB as available - will use MongoDB for storage operations
          setMongoAvailability(true);
          return true;
        } else {
          log('MongoDB connection returned null, falling back to PostgreSQL', 'mongodb');
          // Set MongoDB as unavailable - will use PostgreSQL for storage operations
          setMongoAvailability(false);
          return false;
        }
      }),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    log(`Failed to initialize MongoDB: ${error}`, 'mongodb');
    log('Falling back to PostgreSQL database', 'mongodb');
    // Set MongoDB as unavailable - will use PostgreSQL for storage operations
    setMongoAvailability(false);
    return false;
  }
};

// These are kept as dummy objects to prevent breaking existing code during transition
export const pool = {};
export const db = {};
