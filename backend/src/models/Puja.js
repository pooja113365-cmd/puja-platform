const mongoose = require('mongoose');
const { SPECIALIZATIONS, LOCATION_TYPES } = require('../utils/constants');

const pujaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, enum: SPECIALIZATIONS, required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    significance: { type: String, trim: true, maxlength: 3000 },
    durationMinutes: { type: Number, required: true, min: 15, max: 1440 },
    locationTypes: {
      type: [{ type: String, enum: LOCATION_TYPES }],
      validate: [(v) => v.length > 0, 'At least one location type is required'],
    },
    // Checklist of materials. providedInKit=true => included when the samagri kit is bought.
    samagriChecklist: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: String, trim: true, default: '1' },
        providedInKit: { type: Boolean, default: true },
      },
    ],
    samagriKit: { type: mongoose.Schema.Types.ObjectId, ref: 'Samagri' },
    priceTiers: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          price: { type: Number, required: true, min: 0 },
          description: { type: String, trim: true },
        },
      ],
      validate: [(v) => v.length > 0, 'At least one price tier is required'],
    },
    image: { type: String },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

pujaSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Puja', pujaSchema);

