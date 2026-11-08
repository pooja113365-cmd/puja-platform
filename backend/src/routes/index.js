const express = require('express');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const validateId = require('../middleware/validateObjectId');
const upload = require('../middleware/upload');

const auth = require('../controllers/auth.controller');
const pandit = require('../controllers/pandit.controller');
const catalog = require('../controllers/catalog.controller');
const booking = require('../controllers/booking.controller');
const payment = require('../controllers/payment.controller');
const engagement = require('../controllers/engagement.controller');
const admin = require('../controllers/admin.controller');
const uploads = require('../controllers/upload.controller');

const router = express.Router();
const STAFF = ['admin', 'ops'];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

// ---- Auth ----
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);
router.patch('/auth/me', protect, auth.updateMe);
router.post('/auth/change-password', protect, auth.changePassword);

// ---- Pandits ----
router.get('/pandits/options', pandit.options);
router.get('/pandits/me', protect, authorize('pandit'), pandit.getMe);
router.patch('/pandits/me', protect, authorize('pandit'), pandit.updateMe);
router.put('/pandits/me/availability', protect, authorize('pandit'), pandit.updateAvailability);
router.post('/pandits/me/kyc', protect, authorize('pandit'), pandit.submitKyc);
router.get('/pandits', pandit.search);
router.get('/pandits/:id', validateId(), pandit.getById);

// ---- Catalog ----
router.get('/pujas/options', catalog.pujaOptions);
router.get('/pujas', optionalAuth, catalog.listPujas);
router.get('/pujas/:id', catalog.getPuja);
router.post('/pujas', protect, authorize(...STAFF), catalog.createPuja);
router.patch('/pujas/:id', protect, authorize(...STAFF), validateId(), catalog.updatePuja);
router.delete('/pujas/:id', protect, authorize('admin'), validateId(), catalog.deletePuja);

router.get('/samagri', optionalAuth, catalog.listKits);
router.post('/samagri', protect, authorize(...STAFF), catalog.createKit);
router.patch('/samagri/:id', protect, authorize(...STAFF), validateId(), catalog.updateKit);
router.delete('/samagri/:id', protect, authorize('admin'), validateId(), catalog.deleteKit);

router.get('/muhurthams/slots', catalog.slotsForDate);
router.get('/muhurthams', optionalAuth, catalog.listMuhurthams);
router.post('/muhurthams', protect, authorize(...STAFF), catalog.createMuhurtham);
router.patch('/muhurthams/:id', protect, authorize(...STAFF), validateId(), catalog.updateMuhurtham);
router.delete('/muhurthams/:id', protect, authorize(...STAFF), validateId(), catalog.deleteMuhurtham);

// ---- Bookings ----
router.post('/bookings/inquiry', optionalAuth, booking.createInquiry);
router.post('/bookings', optionalAuth, booking.create);
router.get('/bookings', protect, booking.list);
router.get('/bookings/:id', protect, validateId(), booking.getOne);
router.patch('/bookings/:id/status', protect, validateId(), booking.updateStatus);
router.patch('/bookings/:id/reschedule', protect, validateId(), booking.reschedule);
router.patch('/bookings/:id/meeting-link', protect, authorize('pandit', ...STAFF), validateId(), booking.setMeetingLink);
router.post('/bookings/:id/assign', protect, authorize(...STAFF), validateId(), booking.assign);
router.post('/bookings/:id/auto-assign', protect, authorize(...STAFF), validateId(), booking.autoAssign);

// ---- Payments (webhook is mounted in app.js with a raw body parser) ----
router.post('/payments/create-order', protect, authorize('customer'), payment.createOrder);
router.post('/payments/verify', protect, authorize('customer'), payment.verify);

// ---- Reviews & disputes ----
router.post('/reviews', protect, authorize('customer'), engagement.createReview);
router.get('/reviews/pandit/:id', validateId(), engagement.panditReviews);
router.post('/disputes', protect, authorize('customer'), engagement.createDispute);
router.get('/disputes', protect, engagement.listDisputes);
router.patch('/disputes/:id', protect, authorize(...STAFF), validateId(), engagement.updateDispute);

// ---- Uploads ----
router.post('/uploads', protect, upload.single('file'), uploads.uploadFile);

// ---- Admin / Ops ----
router.get('/admin/stats', protect, authorize(...STAFF), admin.stats);
router.get('/admin/revenue', protect, authorize('admin'), admin.revenue);
router.get('/admin/payouts', protect, authorize('admin'), admin.payoutSummary);
router.post('/admin/payouts/:id/mark-paid', protect, authorize('admin'), validateId(), admin.markPayoutPaid);
router.get('/admin/pandits', protect, authorize(...STAFF), admin.listPandits);
router.post('/admin/pandits', protect, authorize(...STAFF), admin.createPandit);
router.patch('/admin/pandits/:id/kyc', protect, authorize(...STAFF), validateId(), admin.reviewKyc);
router.patch('/admin/pandits/:id', protect, authorize(...STAFF), validateId(), admin.updatePandit);
router.get('/admin/users', protect, authorize(...STAFF), admin.listUsers);
router.patch('/admin/users/:id/active', protect, authorize(...STAFF), validateId(), admin.setUserActive);
router.post('/admin/staff', protect, authorize('admin'), admin.createStaff);

module.exports = router;

