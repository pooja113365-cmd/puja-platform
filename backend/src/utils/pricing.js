const { round2 } = require('./helpers');

/**
 * Computes the full price breakdown of a booking.
 * Commission is charged on the subtotal; walletDiscount is deducted from the customer's payable total.
 */
function computePricing({
  tierPrice,
  samagriPrice = 0,
  includeSamagri = false,
  walletDiscount = 0,
  paymentOption = 'advance',
  commissionRate,
  advancePercent,
}) {
  if (!Number.isFinite(tierPrice) || tierPrice < 0) throw new Error('Invalid tier price');
  const kit = includeSamagri ? Number(samagriPrice) || 0 : 0;
  const subtotal = round2(tierPrice + kit);
  const appliedWalletDiscount = round2(Math.min(Math.max(Number(walletDiscount) || 0, 0), subtotal));
  const total = round2(Math.max(subtotal - appliedWalletDiscount, 0));
  const advanceAmount = paymentOption === 'full' ? total : round2((total * advancePercent) / 100);
  const commissionAmount = round2(subtotal * commissionRate);
  return {
    tierPrice: round2(tierPrice),
    samagriPrice: round2(kit),
    walletDiscount: appliedWalletDiscount,
    total,
    advanceAmount,
    commissionRate,
    commissionAmount,
    panditEarning: round2(Math.max(subtotal - commissionAmount, 0)),
  };
}

module.exports = { computePricing };
