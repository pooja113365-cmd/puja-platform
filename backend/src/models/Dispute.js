const mongoose = require('mongoose');

function generateTicketNumber() {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TKT-${Date.now().toString(36).toUpperCase().slice(-4)}${rand}`;
}

const disputeSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, default: generateTicketNumber, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['booking_issue', 'payment_refund', 'pandit_feedback', 'referral_wallet', 'general_support'],
      default: 'booking_issue',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    source: {
      type: String,
      enum: ['mobile_app', 'website', 'admin'],
      default: 'mobile_app',
    },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'rejected'], default: 'open', index: true },
    resolution: { type: String, trim: true, maxlength: 2000 },
    refundAmount: { type: Number, min: 0, default: 0 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
