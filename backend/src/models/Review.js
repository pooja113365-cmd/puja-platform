const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pandit: { type: mongoose.Schema.Types.ObjectId, ref: 'Pandit', required: true, index: true },
    puja: { type: mongoose.Schema.Types.ObjectId, ref: 'Puja', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.statics.recalculate = async function recalculate(panditId) {
  const [agg] = await this.aggregate([
    { $match: { pandit: new mongoose.Types.ObjectId(String(panditId)) } },
    { $group: { _id: '$pandit', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const Pandit = mongoose.model('Pandit');
  await Pandit.findByIdAndUpdate(panditId, {
    rating: { avg: agg ? Math.round(agg.avg * 10) / 10 : 0, count: agg ? agg.count : 0 },
  });
};

module.exports = mongoose.model('Review', reviewSchema);

