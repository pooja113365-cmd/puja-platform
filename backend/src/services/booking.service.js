const Booking = require('../models/Booking');
const Pandit = require('../models/Pandit');
const Puja = require('../models/Puja');
const ApiError = require('../utils/ApiError');
const { round2, eventStart } = require('../utils/helpers');
const { findBestPandit } = require('./matching.service');
const payments = require('./payment.service');
const { emitBookingUpdate } = require('./socket.service');

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pandit_assigned', 'cancelled'],
  pandit_assigned: ['confirmed', 'in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

function setStatus(booking, status, byUserId, note) {
  booking.status = status;
  booking.statusHistory.push({ status, by: byUserId, note, at: new Date() });
}

function generateBookingNumber() {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `PJ${Date.now().toString(36).toUpperCase()}${rand}`;
}

/** Amount still payable for this booking in rupees. */
function amountDue(booking) {
  const total = booking.pricing.total;
  const paid = booking.payment.amountPaid || 0;
  if (booking.payment.status === 'unpaid') {
    return booking.paymentOption === 'full' ? total : booking.pricing.advanceAmount;
  }
  return round2(Math.max(total - paid, 0));
}

/** Refund policy based on hours until the ceremony starts. */
function refundPercent(booking, now = new Date()) {
  const hours = (eventStart(booking.date, booking.timeSlot.startTime) - now) / 36e5;
  if (hours >= 48) return 1;
  if (hours >= 24) return 0.5;
  return 0;
}

/** Marks a Razorpay payment as received and advances the booking. Idempotent per paymentId. */
async function finalizePayment(booking, paymentId, signature, byUserId) {
  if (booking.payment.razorpayPaymentIds.includes(paymentId)) return booking;
  if (booking.status === 'cancelled') {
    booking.payment.refundStatus = 'manual_required';
    booking.payment.razorpayPaymentIds.push(paymentId);
    booking.payment.amountPaid = round2(booking.payment.amountPaid + (booking.payment.pendingAmount || 0));
    booking.payment.pendingAmount = 0;
    await booking.save();
    return booking;
  }

  booking.payment.amountPaid = round2(booking.payment.amountPaid + (booking.payment.pendingAmount || 0));
  booking.payment.pendingAmount = 0;
  booking.payment.razorpayPaymentIds.push(paymentId);
  if (signature) booking.payment.lastSignature = signature;
  booking.payment.paidAt = new Date();
  booking.payment.status = booking.payment.amountPaid + 0.005 >= booking.pricing.total ? 'paid' : 'partial';

  if (booking.status === 'pending') {
    setStatus(booking, 'confirmed', byUserId, 'Payment received');
    if (booking.pandit) {
      setStatus(booking, 'pandit_assigned', byUserId, 'Purohit selected by customer');
    } else {
      await autoAssign(booking, byUserId, false);
    }
  }
  await booking.save();
  await emitBookingUpdate(booking);
  return booking;
}

/** Tries to auto-match a pandit. Mutates (does not save) the booking unless save=true. */
async function autoAssign(booking, byUserId, save = true) {
  const puja = await Puja.findById(booking.puja).select('category');
  const pandit = await findBestPandit({
    category: puja.category,
    language: booking.language,
    date: booking.date,
    startTime: booking.timeSlot.startTime,
    endTime: booking.timeSlot.endTime,
    city: booking.address?.city,
  });
  if (!pandit) return null;
  booking.pandit = pandit._id;
  if (booking.status === 'confirmed') setStatus(booking, 'pandit_assigned', byUserId, 'Auto-matched purohit');
  if (save) {
    await booking.save();
    await emitBookingUpdate(booking);
  }
  return pandit;
}

async function cancelBooking(booking, byUserId, reason) {
  const paid = booking.payment.amountPaid || 0;
  let refund = 0;
  if (paid > 0) refund = round2(paid * refundPercent(booking));

  if (refund > 0) {
    const paymentId = booking.payment.razorpayPaymentIds[0];
    try {
      if (!paymentId) throw new Error('No payment id');
      await payments.refundPayment(paymentId, refund);
      booking.payment.refundStatus = 'processed';
      booking.payment.refundedAmount = refund;
      booking.payment.status = refund >= paid ? 'refunded' : 'partially_refunded';
    } catch (e) {
      console.error('Refund failed', e?.error || e.message);
      booking.payment.refundStatus = 'failed';
    }
  } else if (paid > 0) {
    booking.payment.refundStatus = 'none';
  }
  booking.cancellation = { reason, by: byUserId, at: new Date() };
  booking.payout.status = 'not_due';
  setStatus(booking, 'cancelled', byUserId, reason);
  await booking.save();
  await emitBookingUpdate(booking);
  return { booking, refund };
}

async function completeBooking(booking, byUserId) {
  setStatus(booking, 'completed', byUserId, 'Puja completed');
  booking.payout.status = 'pending';
  await booking.save();
  if (booking.pandit) await Pandit.findByIdAndUpdate(booking.pandit, { $inc: { completedBookings: 1 } });
  await emitBookingUpdate(booking);
  return booking;
}

module.exports = {
  TRANSITIONS, canTransition, setStatus, generateBookingNumber, amountDue,
  refundPercent, finalizePayment, autoAssign, cancelBooking, completeBooking, Booking, ApiError,
};

