const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

