const http = require('http');
const { env, assertEnv } = require('./config/env');
const connectDB = require('./config/db');
const { disconnectDB } = require('./config/db');
const app = require('./app');
const socket = require('./services/socket.service');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Puja = require('./models/Puja');
const { run: runSeed } = require('./seed');

const STALE_MINUTES = 30;

/** Releases slots held by bookings that were never paid. */
async function expireStaleBookings() {
  try {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
    const r = await Booking.updateMany(
      { status: 'pending', 'payment.status': 'unpaid', createdAt: { $lt: cutoff } },
      {
        $set: { status: 'cancelled', 'cancellation.reason': 'Payment not completed in time', 'cancellation.at': new Date() },
        $push: { statusHistory: { status: 'cancelled', at: new Date(), note: 'Payment not completed in time' } },
      }
    );
    if (r.modifiedCount) console.log(`Expired ${r.modifiedCount} unpaid booking(s)`);
  } catch (e) {
    console.error('Stale booking sweep failed', e.message);
  }
}

async function start() {
  assertEnv();
  const { embedded } = await connectDB();
  await Booking.syncIndexes();
  if ((await User.countDocuments()) === 0 || (await Puja.countDocuments({ image: { $exists: true } })) === 0) {
    console.log('Seeding initial Vedic catalog, scholar portraits & demo accounts...');
    await runSeed({ keepOpen: true });
  }
  const server = http.createServer(app);
  socket.init(server);
  server.listen(env.port, () => console.log(`Puja API listening on :${env.port} (${env.nodeEnv})`));

  const timer = setInterval(expireStaleBookings, 5 * 60 * 1000);
  timer.unref();

  const shutdown = async (sig) => {
    console.log(`${sig} received, shutting down`);
    clearInterval(timer);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

