// Este archivo ahora solo usa MongoDB
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
          log('MongoDB connection failed', 'mongodb');
          setMongoAvailability(true); // Mantener MongoDB como disponible
          return false;
        }
      }),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    log(`Failed to initialize MongoDB: ${error}`, 'mongodb');
    setMongoAvailability(true); // Mantener MongoDB como disponible
    return false;
  }
};
