const { Server } = require('socket.io');
const Booking = require('../models/Booking');
const Pandit = require('../models/Pandit');
const { userFromToken } = require('../middleware/auth');
const { env } = require('../config/env');
const { isObjectId } = require('../utils/helpers');

let io = null;
const STAFF = ['admin', 'ops'];

function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      socket.data.user = await userFromToken(token);
      return next();
    } catch (e) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;
    socket.join(`user:${user._id}`);
    if (STAFF.includes(user.role)) socket.join('staff');

    socket.on('booking:join', async (bookingId, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (!isObjectId(String(bookingId))) return reply({ ok: false, message: 'Invalid booking id' });
        const booking = await Booking.findById(bookingId).select('customer pandit').lean();
        if (!booking) return reply({ ok: false, message: 'Booking not found' });
        let allowed = STAFF.includes(user.role) || String(booking.customer) === String(user._id);
        if (!allowed && booking.pandit) {
          const p = await Pandit.findById(booking.pandit).select('user').lean();
          allowed = p && String(p.user) === String(user._id);
        }
        if (!allowed) return reply({ ok: false, message: 'Forbidden' });
        socket.join(`booking:${bookingId}`);
        return reply({ ok: true });
      } catch (e) {
        return reply({ ok: false, message: 'Server error' });
      }
    });

    socket.on('booking:leave', (bookingId) => {
      if (isObjectId(String(bookingId))) socket.leave(`booking:${bookingId}`);
    });
  });

  return io;
}

/** Broadcasts a booking change to the customer, assigned pandit, staff and anyone tracking it. */
async function emitBookingUpdate(booking) {
  if (!io) return;
  try {
    const payload = {
      id: String(booking._id),
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      pandit: booking.pandit ? String(booking.pandit._id || booking.pandit) : null,
      paymentStatus: booking.payment?.status,
      updatedAt: new Date().toISOString(),
    };
    let room = io.to(`booking:${payload.id}`).to(`user:${booking.customer._id || booking.customer}`).to('staff');
    if (payload.pandit) {
      const p = await Pandit.findById(payload.pandit).select('user').lean();
      if (p) room = room.to(`user:${p.user}`);
    }
    room.emit('booking:update', payload);
  } catch (e) {
    console.error('Socket emit failed', e.message);
  }
}

module.exports = { init, emitBookingUpdate };

