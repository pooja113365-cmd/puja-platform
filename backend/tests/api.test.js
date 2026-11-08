process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
// Intentionally leave RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET unset to verify sandbox/mock fallback mode.
delete process.env.RAZORPAY_KEY_ID;
delete process.env.RAZORPAY_KEY_SECRET;

const crypto = require('crypto');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Pandit = require('../src/models/Pandit');
const Puja = require('../src/models/Puja');
const Samagri = require('../src/models/Samagri');
const Booking = require('../src/models/Booking');
const {
  verifyPaymentSignature,
  verifyWebhookSignature,
  signOrderPayment,
  createOrder,
  isMockMode,
} = require('../src/services/payment.service');
const { computePricing } = require('../src/utils/pricing');
const { canTransition } = require('../src/services/booking.service');
const { isValidDateString, isObjectId } = require('../src/utils/helpers');

describe('Razorpay signature verification & sandbox fallback', () => {
  const sig = (o, p, s) => crypto.createHmac('sha256', s).update(`${o}|${p}`).digest('hex');

  test('detects sandbox/mock mode when Razorpay keys are unset', async () => {
    expect(isMockMode()).toBe(true);
    const order = await createOrder(1500, 'PJTEST01');
    expect(order.mock).toBe(true);
    expect(order.amount).toBe(150000);
    expect(order.id).toMatch(/^order_mock_/);
    const mockSig = signOrderPayment(order.id, 'pay_mock_123');
    expect(verifyPaymentSignature(order.id, 'pay_mock_123', mockSig)).toBe(true);
  });

  test('accepts a valid custom secret signature', () => {
    expect(verifyPaymentSignature('order_1', 'pay_1', sig('order_1', 'pay_1', 'test_secret'), 'test_secret')).toBe(true);
  });

  test('rejects tampered / malformed / missing signatures', () => {
    const good = sig('order_1', 'pay_1', 'test_secret');
    expect(verifyPaymentSignature('order_1', 'pay_2', good, 'test_secret')).toBe(false);
    expect(verifyPaymentSignature('order_1', 'pay_1', good.slice(0, -2), 'test_secret')).toBe(false);
    expect(verifyPaymentSignature('order_1', 'pay_1', '', 'test_secret')).toBe(false);
    expect(verifyPaymentSignature('order_1', 'pay_1', undefined, 'test_secret')).toBe(false);
    expect(verifyPaymentSignature('order_1', 'pay_1', good, '')).toBe(false);
  });

  test('verifies webhook signatures over raw bytes', () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const s = crypto.createHmac('sha256', 'whsec').update(body).digest('hex');
    expect(verifyWebhookSignature(body, s, 'whsec')).toBe(true);
    expect(verifyWebhookSignature(Buffer.from('{"event":"x"}'), s, 'whsec')).toBe(false);
  });
});

describe('Pricing & commission calculations', () => {
  test('advance and commission math', () => {
    const p = computePricing({ tierPrice: 5000, samagriPrice: 1000, includeSamagri: true, paymentOption: 'advance', commissionRate: 0.2, advancePercent: 30 });
    expect(p.total).toBe(6000);
    expect(p.advanceAmount).toBe(1800);
    expect(p.commissionAmount).toBe(1200);
    expect(p.panditEarning).toBe(4800);
  });

  test('ignores samagri when not included; full payment', () => {
    const p = computePricing({ tierPrice: 2100, samagriPrice: 900, includeSamagri: false, paymentOption: 'full', commissionRate: 0.1, advancePercent: 30 });
    expect(p.total).toBe(2100);
    expect(p.advanceAmount).toBe(2100);
  });
});

describe('Booking state machine & helpers', () => {
  test('valid and invalid transitions', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'pandit_assigned')).toBe(true);
    expect(canTransition('pandit_assigned', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('pending', 'completed')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  test('date and id validators', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-02-28')).toBe(true);
    expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isObjectId('abc')).toBe(false);
  });
});

describe('HTTP error boundaries (stateless)', () => {
  test('health endpoint returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('unknown route -> 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('protected route without token -> 401', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  test('invalid token -> 401', async () => {
    const res = await request(app).get('/api/bookings').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  test('invalid ObjectId -> 400 before DB access', async () => {
    const res = await request(app).get('/api/pandits/not-an-id');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test('malformed JSON -> 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });

  test('register validation -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad' });
    expect(res.status).toBe(400);
  });

  test('webhook with bad signature rejected', async () => {
    const res = await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').send('{}');
    expect(res.status).toBe(400);
  });
});

describe('Full Integration Suite: Auth, Pandit Search, Upload Fallback & Booking-to-Payment Lifecycle', () => {
  // In-memory store backing Mongoose queries when a live MongoDB daemon is not running
  const stores = { User: [], Pandit: [], Puja: [], Samagri: [], Booking: [] };
  let dbConnected = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/puja_platform_test', {
        serverSelectionTimeoutMS: 1200,
      });
      dbConnected = true;
      await Promise.all([User, Pandit, Puja, Samagri, Booking].map((m) => m.deleteMany({})));
    } catch (_err) {
      dbConnected = false;
      setupInMemoryModelMocks(stores);
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await Promise.all([User, Pandit, Puja, Samagri, Booking].map((m) => m.deleteMany({})));
      await mongoose.disconnect();
    } else {
      jest.restoreAllMocks();
    }
  });

  let customerToken;
  let panditId;
  let pujaId;
  let bookingId;

  test('1. Auth: registers a customer and logs in', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Arjun Rao',
      email: 'arjun@puja.test',
      phone: '9876543210',
      password: 'Password@123',
      role: 'customer',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.token).toBeDefined();
    expect(reg.body.data.user.email).toBe('arjun@puja.test');
    expect(reg.body.data.user.password).toBeUndefined();

    const login = await request(app).post('/api/auth/login').send({
      email: 'arjun@puja.test',
      password: 'Password@123',
    });
    expect(login.status).toBe(200);
    customerToken = login.body.data.token;

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${customerToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.name).toBe('Arjun Rao');
  });

  test('2. Pandit onboarding & search filter', async () => {
    const pUser = await User.create({
      name: 'Pt. Madhava Sastry',
      email: 'madhava@puja.test',
      phone: '9123456789',
      password: 'Password@123',
      role: 'pandit',
    });
    const pandit = await Pandit.create({
      user: pUser._id,
      specializations: ['Griha Pravesh', 'Satyanarayan'],
      languages: ['Telugu', 'Sanskrit', 'Hindi'],
      experienceYears: 18,
      templeAffiliation: 'Sri Venkateswara Swamy Temple',
      pujaCharge: 3100,
      serviceCities: ['Hyderabad'],
      rating: { avg: 4.9, count: 25 },
      kyc: { status: 'approved', documents: [{ type: 'Aadhaar', url: 'https://example.com/a.pdf' }] },
      isActive: true,
    });
    panditId = String(pandit._id);

    const searchRes = await request(app)
      .get('/api/pandits')
      .query({ specialization: 'Satyanarayan', language: 'Telugu' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(String(searchRes.body.data[0]._id)).toBe(panditId);
  });

  test('3. Catalog & Booking creation -> Sandbox Order -> Signature Verification -> Confirmation', async () => {
    const kit = await Samagri.create({
      name: 'Satyanarayan Kit',
      price: 1000,
      items: [{ name: 'Kalash', quantity: '1' }],
      isActive: true,
    });
    const puja = await Puja.create({
      name: 'Sri Satyanarayan Vrat',
      slug: 'sri-satyanarayan-vrat-test',
      category: 'Satyanarayan',
      description: 'Complete Satyanarayan Vrat with Katha and Aarti.',
      durationMinutes: 120,
      locationTypes: ['home', 'online'],
      samagriKit: kit._id,
      samagriChecklist: [{ name: 'Kalash', quantity: '1', providedInKit: true }],
      priceTiers: [{ name: 'Standard', price: 2500 }],
      isActive: true,
    });
    pujaId = String(puja._id);

    const futureDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    const createRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        pujaId,
        tierName: 'Standard',
        date: futureDate,
        timeSlot: { label: 'Morning Muhurtham', startTime: '08:00', endTime: '10:00' },
        language: 'Telugu',
        locationType: 'home',
        address: { line1: '12 Lotus Park', city: 'Hyderabad', pincode: '500033' },
        includeSamagri: true,
        paymentOption: 'advance',
        panditId,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('pending');
    expect(createRes.body.data.pricing.total).toBe(3500);
    expect(createRes.body.data.pricing.advanceAmount).toBe(1050);
    bookingId = String(createRes.body.data._id);

    // Create payment order (runs in sandbox/mock mode because Razorpay keys are unset)
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId });

    expect(orderRes.status).toBe(200);
    expect(orderRes.body.data.mock).toBe(true);
    expect(orderRes.body.data.amount).toBe(105000);
    expect(orderRes.body.data.mockCredentials).toBeDefined();

    // Verify signature using the sandbox credentials
    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId,
        ...orderRes.body.data.mockCredentials,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('pandit_assigned');
    expect(verifyRes.body.data.payment.status).toBe('partial');
    expect(verifyRes.body.data.payment.amountPaid).toBe(1050);
  });

  test('4. Local disk upload fallback works when Cloudinary credentials are unset', async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', pngHeader, { filename: 'kalash.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.storage).toBe('local');
    expect(res.body.data.url).toMatch(/\/uploads\/images\/.+\.png$/);
  });
});

// Lightweight in-memory adapter so the full integration suite runs even on machines without a local mongod process
function setupInMemoryModelMocks(stores) {
  const bcrypt = require('bcryptjs');

  const makeQuery = (result) => {
    const q = {
      select: () => q,
      sort: () => q,
      skip: () => q,
      limit: () => q,
      populate: () => q,
      lean: () => Promise.resolve(result),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return q;
  };

  jest.spyOn(User, 'exists').mockImplementation(async (filter) =>
    stores.User.some((u) => !filter.email || u.email === filter.email.toLowerCase()) ? { _id: '1' } : null
  );
  jest.spyOn(User, 'create').mockImplementation(async (data) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: await bcrypt.hash(data.password, 4),
      role: data.role || 'customer',
      addresses: data.addresses || [],
      isActive: true,
      comparePassword(plain) {
        return bcrypt.compare(plain, this.password);
      },
      toJSON() {
        return { _id: this._id, name: this.name, email: this.email, phone: this.phone, role: this.role, addresses: this.addresses, isActive: this.isActive };
      },
      save: async function save() { return this; },
    };
    stores.User.push(doc);
    return doc;
  });
  jest.spyOn(User, 'findOne').mockImplementation((filter) => {
    const found = stores.User.find((u) => !filter.email || u.email === filter.email);
    return makeQuery(found || null);
  });
  jest.spyOn(User, 'findById').mockImplementation((id) => {
    const found = stores.User.find((u) => String(u._id) === String(id));
    return makeQuery(found || null);
  });

  jest.spyOn(Pandit, 'create').mockImplementation(async (data) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      availability: { weeklyOffDays: [], unavailableDates: [] },
      ...data,
      save: async function save() { return this; },
    };
    stores.Pandit.push(doc);
    return doc;
  });
  jest.spyOn(Pandit, 'find').mockImplementation((filter = {}) => {
    const list = stores.Pandit.filter((p) => {
      if (filter.specializations && !p.specializations.includes(filter.specializations)) return false;
      if (filter.languages && !p.languages.includes(filter.languages)) return false;
      return true;
    });
    return makeQuery(list);
  });
  jest.spyOn(Pandit, 'countDocuments').mockImplementation(async () => stores.Pandit.length);
  jest.spyOn(Pandit, 'findOne').mockImplementation((filter = {}) => {
    const found = stores.Pandit.find((p) => (filter._id ? String(p._id) === String(filter._id) : true));
    return makeQuery(found || null);
  });
  jest.spyOn(Pandit, 'findById').mockImplementation((id) => {
    const found = stores.Pandit.find((p) => String(p._id) === String(id));
    return makeQuery(found || null);
  });

  jest.spyOn(Samagri, 'create').mockImplementation(async (data) => {
    const doc = { _id: new mongoose.Types.ObjectId(), isActive: true, ...data };
    stores.Samagri.push(doc);
    return doc;
  });

  jest.spyOn(Puja, 'create').mockImplementation(async (data) => {
    const doc = { _id: new mongoose.Types.ObjectId(), isActive: true, ...data };
    stores.Puja.push(doc);
    return doc;
  });
  jest.spyOn(Puja, 'findOne').mockImplementation((filter = {}) => {
    const found = stores.Puja.find((p) => String(p._id) === String(filter._id));
    if (!found) return makeQuery(null);
    const kit = stores.Samagri.find((k) => String(k._id) === String(found.samagriKit));
    return makeQuery({ ...found, samagriKit: kit || found.samagriKit });
  });
  jest.spyOn(Puja, 'findById').mockImplementation((id) => {
    const found = stores.Puja.find((p) => String(p._id) === String(id));
    return makeQuery(found || null);
  });

  jest.spyOn(Booking, 'exists').mockImplementation(async () => null);
  jest.spyOn(Booking, 'create').mockImplementation(async (data) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      status: 'pending',
      payment: { status: 'unpaid', amountPaid: 0, pendingAmount: 0, razorpayPaymentIds: [], refundStatus: 'none', refundedAmount: 0 },
      payout: { status: 'not_due' },
      ...data,
      save: async function save() { return this; },
    };
    stores.Booking.push(doc);
    return doc;
  });
  jest.spyOn(Booking, 'findById').mockImplementation((id) => {
    const found = stores.Booking.find((b) => String(b._id) === String(id));
    return makeQuery(found || null);
  });
}
