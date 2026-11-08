const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { env } = require('./env');

let memoryServer = null;

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const isSrv = env.mongoUri.startsWith('mongodb+srv');
    await mongoose.connect(env.mongoUri, {
      dbName: 'puja_platform',
      serverSelectionTimeoutMS: isSrv ? 15000 : 3000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return { embedded: false };
  } catch (err) {
    console.warn(`Primary MongoDB connection failed (${err.message}); falling back to embedded MongoDB store...`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../../.data/mongodb');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const uri = memoryServer.getUri('puja_platform');
    await mongoose.connect(uri);
    console.log(`MongoDB (embedded persistent) connected: ${uri}`);
    return { embedded: true };
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop({ doCleanup: false });
    memoryServer = null;
  }
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
