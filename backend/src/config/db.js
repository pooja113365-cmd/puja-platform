const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { env } = require('./env');

let memoryServer = null;

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return { embedded: false };
  } catch (err) {
    if (env.isProd) throw err;
    console.log(`Local MongoDB daemon not detected on ${env.mongoUri}; starting embedded MongoDB (WiredTiger persistent store)...`);
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
