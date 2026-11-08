const mongoose = require('mongoose');
const { SPECIALIZATIONS, LANGUAGES } = require('../utils/constants');

const panditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specializations: {
      type: [{ type: String, enum: SPECIALIZATIONS }],
      validate: [(v) => v.length > 0, 'At least one specialization is required'],
    },
    languages: {
      type: [{ type: String, enum: LANGUAGES }],
      validate: [(v) => v.length > 0, 'At least one language is required'],
    },
    experienceYears: { type: Number, min: 0, max: 80, default: 0 },
    templeAffiliation: { type: String, trim: true, maxlength: 150 },
    bio: { type: String, trim: true, maxlength: 1500 },
    photo: { type: String },
    pujaCharge: { type: Number, min: 0, default: 0 },
    hourlyCharge: { type: Number, min: 0, default: 0 },
    serviceCities: { type: [String], default: [] },
    kyc: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
      documents: [{ type: { type: String, trim: true }, url: { type: String, required: true } }],
      rejectionReason: String,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    availability: {
      weeklyOffDays: { type: [{ type: Number, min: 0, max: 6 }], default: [] },
      unavailableDates: { type: [String], default: [] }, // YYYY-MM-DD
    },
    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    completedBookings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

panditSchema.index({ specializations: 1 });
panditSchema.index({ languages: 1 });
panditSchema.index({ 'rating.avg': -1 });

module.exports = mongoose.model('Pandit', panditSchema);

