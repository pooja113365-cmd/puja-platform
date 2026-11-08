const crypto = require('crypto');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { assertId } = require('../utils/helpers');
const payments = require('../services/payment.service');
const svc = require('../services/booking.service');

exports.createOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(assertId(req.body?.bookingId, 'bookingId')).populate('puja', 'name');
  if (!booking || String(booking.customer) !== String(req.user._id)) throw ApiError.notFound('Booking not found');
  if (booking.status === 'cancelled' || booking.status === 'completed') throw ApiError.badRequest(`Booking is ${booking.status}`);
  if (booking.payment.status === 'paid') throw ApiError.badRequest('Booking is already fully paid');

  const due = svc.amountDue(booking);
  if (due <= 0) throw ApiError.badRequest('Nothing due for this booking');

  const order = await payments.createOrder(due, booking.bookingNumber, {
    bookingId: String(booking._id),
    bookingNumber: booking.bookingNumber,
  });
  booking.payment.razorpayOrderId = order.id;
  booking.payment.pendingAmount = due;
  await booking.save();

  const mock = payments.isMockMode();
  let mockCredentials;
  if (mock) {
    const mockPaymentId = `pay_mock_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    mockCredentials = {
      razorpay_order_id: order.id,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: payments.signOrderPayment(order.id, mockPaymentId),
    };
  }

  res.json({
    success: true,
    data: {
      keyId: payments.getEffectiveKeyId(),
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      name: 'Puja Platform',
      description: `${booking.puja?.name || 'Puja'} (${booking.bookingNumber})`,
      prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone },
      bookingId: String(booking._id),
      mock,
      ...(mockCredentials ? { mockCredentials } : {}),
    },
  });
});

exports.verify = asyncHandler(async (req, res) => {
  const {
    bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature,
  } = req.body || {};
  if (![orderId, paymentId, signature].every((v) => typeof v === 'string' && v)) {
    throw ApiError.badRequest('Missing payment verification fields');
  }
  const booking = await Booking.findById(assertId(bookingId, 'bookingId'));
  if (!booking || String(booking.customer) !== String(req.user._id)) throw ApiError.notFound('Booking not found');

  if (booking.payment.razorpayPaymentIds.includes(paymentId)) {
    return res.json({ success: true, message: 'Payment already recorded', data: booking });
  }
  if (booking.payment.razorpayOrderId !== orderId) throw ApiError.badRequest('Order does not belong to this booking');
  if (!payments.verifyPaymentSignature(orderId, paymentId, signature)) {
    throw ApiError.badRequest('Payment signature verification failed');
  }
  const updated = await svc.finalizePayment(booking, paymentId, signature, req.user._id);
  return res.json({ success: true, message: 'Payment verified', data: updated });
});

/** Razorpay webhook. Mounted with express.raw so the signature is computed on the exact bytes. */
exports.webhook = asyncHandler(async (req, res) => {
  const raw = req.body;
  const signature = req.headers['x-razorpay-signature'];
  if (!Buffer.isBuffer(raw) || !payments.verifyWebhookSignature(raw, signature)) {
    throw ApiError.badRequest('Invalid webhook signature');
  }
  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch (_e) {
    throw ApiError.badRequest('Malformed webhook payload');
  }
  if (['payment.captured', 'order.paid'].includes(event.event)) {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      const booking = await Booking.findOne({ 'payment.razorpayOrderId': payment.order_id });
      if (booking) await svc.finalizePayment(booking, payment.id, null, undefined);
    }
  }
  res.json({ success: true });
});
