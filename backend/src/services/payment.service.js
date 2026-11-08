const crypto = require('crypto');
const Razorpay = require('razorpay');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

let client;
const MOCK_KEY_ID = 'rzp_mock_sandbox';
const MOCK_KEY_SECRET = 'mock_sandbox_secret_key_for_local_dev';

const isConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);
const isMockMode = () => !isConfigured();

function getEffectiveSecret() {
  return env.razorpay.keySecret || MOCK_KEY_SECRET;
}

function getEffectiveKeyId() {
  return env.razorpay.keyId || MOCK_KEY_ID;
}

function getClient() {
  if (!isConfigured()) return null;
  if (!client) client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Computes HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
function signOrderPayment(orderId, paymentId, secret = getEffectiveSecret()) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
function verifyPaymentSignature(orderId, paymentId, signature, secret = getEffectiveSecret()) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = signOrderPayment(orderId, paymentId, secret);
  return safeEqualHex(expected, String(signature));
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret) */
function verifyWebhookSignature(rawBody, signature, secret = env.razorpay.webhookSecret || MOCK_KEY_SECRET) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, String(signature));
}

async function createOrder(amountInRupees, receipt, notes = {}) {
  const paise = Math.round(amountInRupees * 100);
  if (!Number.isInteger(paise) || paise < 100) throw ApiError.badRequest('Invalid payment amount');
  const rzp = getClient();
  if (!rzp) {
    // Sandbox/mock fallback when Razorpay credentials are not set in .env
    const mockOrderId = `order_mock_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      id: mockOrderId,
      entity: 'order',
      amount: paise,
      amount_paid: 0,
      amount_due: paise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      status: 'created',
      notes,
      mock: true,
    };
  }
  try {
    return await rzp.orders.create({ amount: paise, currency: 'INR', receipt: receipt.slice(0, 40), notes });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error('Razorpay order error', e?.error || e);
    throw new ApiError(502, 'Payment gateway error. Please try again.');
  }
}

async function refundPayment(paymentId, amountInRupees) {
  const paise = Math.round(amountInRupees * 100);
  const rzp = getClient();
  if (!rzp || String(paymentId).startsWith('pay_mock_')) {
    return {
      id: `rfnd_mock_${Date.now().toString(36)}`,
      entity: 'refund',
      amount: paise,
      currency: 'INR',
      payment_id: paymentId,
      status: 'processed',
      mock: true,
    };
  }
  return rzp.payments.refund(paymentId, { amount: paise, speed: 'normal' });
}

module.exports = {
  isConfigured,
  isMockMode,
  getEffectiveKeyId,
  getEffectiveSecret,
  signOrderPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createOrder,
  refundPayment,
};
