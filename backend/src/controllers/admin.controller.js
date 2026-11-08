const Booking = require('../models/Booking');
const Pandit = require('../models/Pandit');
const User = require('../models/User');
const Puja = require('../models/Puja');
const Dispute = require('../models/Dispute');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { SPECIALIZATIONS, LANGUAGES } = require('../utils/constants');
const {
  parsePagination, escapeRegex, isValidDateString, toStringArray, round2, pick,
} = require('../utils/helpers');

const PAID_FILTER = { 'payment.amountPaid': { $gt: 0 }, status: { $ne: 'cancelled' } };

exports.stats = asyncHandler(async (req, res) => {
  const [byStatus, gbvAgg, customers, pandits, pendingKyc, openDisputes, pujas] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, gbv: { $sum: '$pricing.total' } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    Pandit.countDocuments({ 'kyc.status': 'approved' }),
    Pandit.countDocuments({ 'kyc.status': 'pending' }),
    Dispute.countDocuments({ status: { $in: ['open', 'in_review'] } }),
    Puja.countDocuments({ isActive: true }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const data = {
    bookings: { total: byStatus.reduce((a, s) => a + s.count, 0), byStatus: counts },
    grossBookingValue: round2(gbvAgg[0]?.gbv || 0),
    customers, pandits, pendingKyc, openDisputes, pujas,
  };
  if (req.user.role === 'admin') {
    const [rev] = await Booking.aggregate([
      { $match: PAID_FILTER },
      { $group: { _id: null, collected: { $sum: '$payment.amountPaid' } } },
    ]);
    data.revenueCollected = round2(rev?.collected || 0);
  }
  res.json({ success: true, data });
});

exports.revenue = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: 'completed' };
  if (from || to) {
    if ((from && !isValidDateString(from)) || (to && !isValidDateString(to))) throw ApiError.badRequest('from/to must be YYYY-MM-DD');
    match.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  const [totals, monthly, pendingPayouts, collected] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: null, gross: { $sum: '$pricing.total' }, commission: { $sum: '$pricing.commissionAmount' }, panditEarnings: { $sum: '$pricing.panditEarning' }, bookings: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: { $substrBytes: ['$date', 0, 7] }, gross: { $sum: '$pricing.total' }, commission: { $sum: '$pricing.commissionAmount' }, bookings: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: { 'payout.status': 'pending' } },
      { $group: { _id: null, amount: { $sum: '$pricing.panditEarning' }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([{ $match: PAID_FILTER }, { $group: { _id: null, amount: { $sum: '$payment.amountPaid' } } }]),
  ]);
  const t = totals[0] || { gross: 0, commission: 0, panditEarnings: 0, bookings: 0 };
  res.json({
    success: true,
    data: {
      completed: { bookings: t.bookings, gross: round2(t.gross), commission: round2(t.commission), panditEarnings: round2(t.panditEarnings) },
      pendingPayouts: { amount: round2(pendingPayouts[0]?.amount || 0), count: pendingPayouts[0]?.count || 0 },
      collected: round2(collected[0]?.amount || 0),
      monthly: monthly.map((m) => ({ month: m._id, gross: round2(m.gross), commission: round2(m.commission), bookings: m.bookings })),
    },
  });
});

/** Pending/paid payouts grouped per purohit. */
exports.payoutSummary = asyncHandler(async (req, res) => {
  const status = req.query.status === 'paid' ? 'paid' : 'pending';
  const rows = await Booking.aggregate([
    { $match: { 'payout.status': status, pandit: { $exists: true } } },
    { $group: { _id: '$pandit', amount: { $sum: '$pricing.panditEarning' }, bookings: { $sum: 1 }, bookingIds: { $push: '$_id' } } },
    { $sort: { amount: -1 } },
  ]);
  const pandits = await Pandit.find({ _id: { $in: rows.map((r) => r._id) } }).populate('user', 'name phone');
  const map = new Map(pandits.map((p) => [String(p._id), p]));
  res.json({
    success: true,
    data: rows.map((r) => ({
      pandit: map.get(String(r._id)) ? { _id: r._id, name: map.get(String(r._id)).user?.name, phone: map.get(String(r._id)).user?.phone } : { _id: r._id },
      amount: round2(r.amount), bookings: r.bookings, bookingIds: r.bookingIds,
    })),
  });
});

exports.markPayoutPaid = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.payout.status !== 'pending') throw ApiError.badRequest('No pending payout for this booking');
  const reference = String(req.body?.reference || '').trim();
  if (reference.length < 3) throw ApiError.badRequest('Payout reference (UTR / transaction id) is required');
  booking.payout = { status: 'paid', paidAt: new Date(), reference: reference.slice(0, 100) };
  await booking.save();
  res.json({ success: true, data: booking });
});

exports.listPandits = asyncHandler(async (req, res) => {
  const { kyc, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 15);
  const filter = {};
  if (kyc) filter['kyc.status'] = String(kyc);
  if (search) {
    const users = await User.find({ name: new RegExp(escapeRegex(String(search).slice(0, 60)), 'i') }).select('_id').lean();
    filter.user = { $in: users.map((u) => u._id) };
  }
  const [items, total] = await Promise.all([
    Pandit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email phone isActive'),
    Pandit.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.reviewKyc = asyncHandler(async (req, res) => {
  const { status, reason } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) throw ApiError.badRequest('status must be approved or rejected');
  if (status === 'rejected' && (typeof reason !== 'string' || reason.trim().length < 3)) {
    throw ApiError.badRequest('A rejection reason is required');
  }
  const pandit = await Pandit.findById(req.params.id);
  if (!pandit) throw ApiError.notFound('Purohit not found');
  if (status === 'approved' && !pandit.kyc.documents.length) {
    throw ApiError.badRequest('Cannot approve: no KYC documents were submitted');
  }
  pandit.kyc.status = status;
  pandit.kyc.rejectionReason = status === 'rejected' ? reason : undefined;
  pandit.kyc.reviewedAt = new Date();
  pandit.kyc.reviewedBy = req.user._id;
  await pandit.save();
  res.json({ success: true, data: pandit });
});

exports.updatePandit = asyncHandler(async (req, res) => {
  const pandit = await Pandit.findById(req.params.id);
  if (!pandit) throw ApiError.notFound('Purohit not found');
  const updates = pick(req.body || {}, ['isActive', 'pujaCharge', 'hourlyCharge', 'experienceYears', 'templeAffiliation', 'bio']);
  Object.assign(pandit, updates);
  await pandit.save();
  res.json({ success: true, data: pandit });
});

/** Admin onboarding of a purohit (created already approved). */
exports.createPandit = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const specializations = toStringArray(b.specializations);
  const languages = toStringArray(b.languages);
  if (!specializations.length || specializations.some((s) => !SPECIALIZATIONS.includes(s))) throw ApiError.badRequest('Invalid specializations');
  if (!languages.length || languages.some((l) => !LANGUAGES.includes(l))) throw ApiError.badRequest('Invalid languages');
  if (await User.exists({ email: String(b.email || '').toLowerCase() })) throw ApiError.conflict('Email already registered');
  const user = await User.create({ name: b.name, email: b.email, phone: b.phone, password: b.password, role: 'pandit' });
  try {
    const pandit = await Pandit.create({
      user: user._id, specializations, languages,
      experienceYears: Number(b.experienceYears) || 0, templeAffiliation: b.templeAffiliation, bio: b.bio,
      pujaCharge: Number(b.pujaCharge) || 0, serviceCities: toStringArray(b.serviceCities),
      kyc: { status: 'approved', reviewedAt: new Date(), reviewedBy: req.user._id, documents: [] },
    });
    res.status(201).json({ success: true, data: pandit });
  } catch (e) {
    await User.findByIdAndDelete(user._id);
    throw e;
  }
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = {};
  if (role) filter.role = String(role);
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.setUserActive = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw ApiError.badRequest('You cannot disable your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin' && req.user.role !== 'admin') throw ApiError.forbidden();
  user.isActive = Boolean(req.body?.isActive);
  await user.save();
  res.json({ success: true, data: user });
});

exports.createStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body || {};
  if (!['ops', 'admin'].includes(role)) throw ApiError.badRequest('role must be ops or admin');
  if (await User.exists({ email: String(email || '').toLowerCase() })) throw ApiError.conflict('Email already registered');
  const user = await User.create({ name, email, phone, password, role });
  res.status(201).json({ success: true, data: user });
});

