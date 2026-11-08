const mongoose = require('mongoose');
const { LOCATION_TYPES, LANGUAGES, BOOKING_STATUS, ACTIVE_BOOKING_STATUSES } = require('../utils/constants');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    customerName: { type: String, trim: true, maxlength: 120 },
    customerPhone: { type: String, trim: true, maxlength: 30 },
    customerEmail: { type: String, trim: true, maxlength: 120 },
    serviceTitle: { type: String, trim: true, maxlength: 200 },
    serviceDetails: { type: String, trim: true, maxlength: 2000 },
    puja: { type: mongoose.Schema.Types.ObjectId, ref: 'Puja', required: false },
    pandit: { type: mongoose.Schema.Types.ObjectId, ref: 'Pandit', index: true },
    tierName: { type: String, default: 'Standard' },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD (IST)
    timeSlot: {
      label: { type: String, default: 'Shubh Muhurtham' },
      startTime: { type: String, default: '08:00' },
      endTime: { type: String, default: '10:00' },
    },
    language: { type: String, enum: LANGUAGES, default: 'Telugu' },
    locationType: { type: String, enum: LOCATION_TYPES, default: 'home' },
    address: {
      line1: String, line2: String, city: String, state: String, pincode: String,
    },
    meetingLink: { type: String, trim: true },
    includeSamagri: { type: Boolean, default: false },
    samagriKit: { type: mongoose.Schema.Types.ObjectId, ref: 'Samagri' },
    notes: { type: String, trim: true, maxlength: 2000 },
    paymentOption: { type: String, enum: ['advance', 'full'], default: 'advance' },
    pricing: {
      tierPrice: Number,
      samagriPrice: Number,
      total: Number,
      advanceAmount: Number,
      commissionRate: Number,
      commissionAmount: Number,
      panditEarning: Number,
    },
    payment: {
      status: {
        type: String,
        enum: ['unpaid', 'partial', 'paid', 'refunded', 'partially_refunded'],
        default: 'unpaid',
      },
      amountPaid: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 },
      razorpayOrderId: String,
      razorpayPaymentIds: { type: [String], default: [] },
      lastSignature: String,
      paidAt: Date,
      refundedAmount: { type: Number, default: 0 },
      refundStatus: { type: String, enum: ['none', 'processed', 'failed', 'manual_required'], default: 'none' },
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        _id: false,
      },
    ],
    payout: {
      status: { type: String, enum: ['not_due', 'pending', 'paid'], default: 'not_due' },
      paidAt: Date,
      reference: String,
    },
    cancellation: {
      reason: String,
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
    },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ pandit: 1, date: 1, status: 1 });
// Hard guarantee against double-booking a pandit in the same slot (race conditions).
bookingSchema.index(
  { pandit: 1, date: 1, 'timeSlot.startTime': 1 },
  {
    unique: true,
    partialFilterExpression: {
      pandit: { $type: 'objectId' },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);

