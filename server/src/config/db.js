const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri) {
      const conn = await mongoose.connect(uri);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // Attempt default local MongoDB
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/lifeledger', {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Connected to local MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Database] Local MongoDB not detected. Starting in-memory MongoDB instance for development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB Connected: ${memUri}`);
        return conn;
      }
      throw localErr;
    }
  } catch (err) {
    console.error(`[Database Error] ${err.message}`);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
