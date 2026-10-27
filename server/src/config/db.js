const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Sanitize MongoDB connection string for safe logging
 */
const sanitizeUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/i, 'mongodb$1://$2:***@');
};

const connectDB = async () => {
  // If already connected, reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  try {
    // Production environment: fail fast if MONGODB_URI is missing or fails
    if (process.env.NODE_ENV === 'production') {
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required in production.');
      }

      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    }

    // Development / Test environment: try MONGODB_URI if provided
    if (uri) {
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (uriErr) {
        console.warn(`[Database] Failed connecting to configured MONGODB_URI (${sanitizeUri(uri)}): ${uriErr.message}. Falling back to development database.`);
      }
    }

    // Attempt default local MongoDB
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/lifeledger', {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Connected to local MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.log('[Database] Local MongoDB not detected. Starting in-memory MongoDB instance for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] In-memory MongoDB Connected: ${memUri}`);
      return conn;
    }
  } catch (err) {
    console.error(`[Database Error] ${err.message}`);
    throw err;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB, sanitizeUri };

