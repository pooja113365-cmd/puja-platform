const { round2 } = require('./helpers');

/**
 * Computes the full price breakdown of a booking.
 * Commission is charged on the total; the remainder is the purohit's earning.
 */
function computePricing({
  tierPrice, samagriPrice = 0, includeSamagri = false,
  paymentOption = 'advance', commissionRate, advancePercent,
}) {
  if (!Number.isFinite(tierPrice) || tierPrice < 0) throw new Error('Invalid tier price');
  const kit = includeSamagri ? Number(samagriPrice) || 0 : 0;
  const total = round2(tierPrice + kit);
  const advanceAmount = paymentOption === 'full' ? total : round2((total * advancePercent) / 100);
  const commissionAmount = round2(total * commissionRate);
  return {
    tierPrice: round2(tierPrice),
    samagriPrice: round2(kit),
    total,
    advanceAmount,
    commissionRate,
    commissionAmount,
    panditEarning: round2(total - commissionAmount),
  };
}

module.exports = { computePricing };

