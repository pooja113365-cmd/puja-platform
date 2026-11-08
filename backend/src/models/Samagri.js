const mongoose = require('mongoose');

const samagriSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600 },
    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: String, trim: true, default: '1' },
      },
    ],
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Samagri', samagriSchema);

