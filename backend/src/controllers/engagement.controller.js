const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { assertId, parsePagination, round2 } = require('../utils/helpers');

// ---------------- Reviews ----------------
exports.createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body || {};
  const booking = await Booking.findById(assertId(bookingId, 'bookingId'));
  if (!booking || String(booking.customer) !== String(req.user._id)) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'completed') throw ApiError.badRequest('Only completed bookings can be reviewed');
  if (!booking.pandit) throw ApiError.badRequest('Booking has no purohit');
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw ApiError.badRequest('Rating must be an integer between 1 and 5');
  if (await Review.exists({ booking: booking._id })) throw ApiError.conflict('You have already reviewed this booking');

  const review = await Review.create({
    booking: booking._id, customer: req.user._id, pandit: booking.pandit, puja: booking.puja,
    rating: r, comment: comment ? String(comment).slice(0, 1000) : undefined,
  });
  booking.reviewed = true;
  await booking.save();
  await Review.recalculate(booking.pandit);
  res.status(201).json({ success: true, data: review });
});

exports.panditReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const filter = { pandit: req.params.id };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customer', 'name').populate('puja', 'name'),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// ---------------- Disputes ----------------
exports.createDispute = asyncHandler(async (req, res) => {
  const { bookingId, subject, description } = req.body || {};
  const booking = await Booking.findById(assertId(bookingId, 'bookingId'));
  if (!booking || String(booking.customer) !== String(req.user._id)) throw ApiError.notFound('Booking not found');
  if (typeof subject !== 'string' || subject.trim().length < 3) throw ApiError.badRequest('Subject is required');
  if (typeof description !== 'string' || description.trim().length < 10) throw ApiError.badRequest('Please describe the issue (min 10 characters)');
  if (await Dispute.exists({ booking: booking._id, status: { $in: ['open', 'in_review'] } })) {
    throw ApiError.conflict('An open dispute already exists for this booking');
  }
  const dispute = await Dispute.create({ booking: booking._id, raisedBy: req.user._id, subject, description });
  res.status(201).json({ success: true, data: dispute });
});

exports.listDisputes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 15);
  const filter = {};
  if (!['admin', 'ops'].includes(req.user.role)) filter.raisedBy = req.user._id;
  if (req.query.status) filter.status = String(req.query.status);
  const [items, total] = await Promise.all([
    Dispute.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('raisedBy', 'name email phone')
      .populate({ path: 'booking', select: 'bookingNumber date status pricing payment puja', populate: { path: 'puja', select: 'name' } }),
    Dispute.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.updateDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id).populate('booking');
  if (!dispute) throw ApiError.notFound('Dispute not found');
  const { status, resolution, refundAmount } = req.body || {};
  if (!['in_review', 'resolved', 'rejected'].includes(status)) throw ApiError.badRequest('Invalid status');
  if (['resolved', 'rejected'].includes(dispute.status)) throw ApiError.badRequest('Dispute is already closed');
  if (['resolved', 'rejected'].includes(status)) {
    if (typeof resolution !== 'string' || resolution.trim().length < 5) throw ApiError.badRequest('Resolution notes are required');
    const refund = round2(Number(refundAmount) || 0);
    const paid = dispute.booking?.payment?.amountPaid || 0;
    if (refund < 0 || refund > paid) throw ApiError.badRequest('Refund cannot exceed the amount paid');
    dispute.refundAmount = status === 'resolved' ? refund : 0;
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    if (status === 'resolved' && refund > 0 && dispute.booking) {
      const payments = require('../services/payment.service');
      const bk = dispute.booking;
      const paymentId = bk.payment?.razorpayPaymentIds?.[0] || 'pay_mock_dispute';
      try {
        await payments.refundPayment(paymentId, refund);
        bk.payment.refundedAmount = round2((bk.payment.refundedAmount || 0) + refund);
        bk.payment.refundStatus = 'processed';
        bk.payment.status = bk.payment.refundedAmount >= paid ? 'refunded' : 'partially_refunded';
        await bk.save();
      } catch (_err) {
        bk.payment.refundStatus = 'manual_required';
        await bk.save();
      }
    }
  }
  dispute.status = status;
  await dispute.save();
  res.json({ success: true, data: dispute });
});

