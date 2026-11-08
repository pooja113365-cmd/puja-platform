const Pandit = require('../models/Pandit');
const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { SPECIALIZATIONS, LANGUAGES } = require('../utils/constants');
const {
  escapeRegex, parsePagination, toStringArray, isValidDateString, isValidTime, pick,
} = require('../utils/helpers');
const { isPanditAvailable } = require('../services/matching.service');

const PUBLIC_SELECT = '-kyc.documents -kyc.rejectionReason -kyc.reviewedBy';
const SORTS = {
  rating: { 'rating.avg': -1, 'rating.count': -1 },
  experience: { experienceYears: -1 },
  charge: { pujaCharge: 1 },
};

exports.search = asyncHandler(async (req, res) => {
  const {
    search, specialization, language, city, minExperience, maxCharge, sort = 'rating',
    date, startTime, endTime,
  } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { 'kyc.status': 'approved', isActive: true };
  if (specialization) filter.specializations = String(specialization);
  if (language) filter.languages = String(language);
  if (city) filter.serviceCities = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (minExperience !== undefined && !Number.isNaN(Number(minExperience))) filter.experienceYears = { $gte: Number(minExperience) };
  if (maxCharge !== undefined && !Number.isNaN(Number(maxCharge))) filter.pujaCharge = { $lte: Number(maxCharge) };
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 60)), 'i');
    const users = await User.find({ name: rx, role: 'pandit' }).select('_id').lean();
    filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { templeAffiliation: rx }];
  }

  const sortBy = SORTS[sort] || SORTS.rating;
  let items; let total;

  if (date) {
    if (!isValidDateString(date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
    const s = isValidTime(startTime) ? startTime : '00:00';
    const e = isValidTime(endTime) ? endTime : '23:59';
    const all = await Pandit.find(filter).select(PUBLIC_SELECT).sort(sortBy).limit(300).populate('user', 'name avatar');
    const flags = await Promise.all(all.map((p) => isPanditAvailable(p, date, s, e)));
    const available = all.filter((_, i) => flags[i]);
    total = available.length;
    items = available.slice(skip, skip + limit);
  } else {
    [items, total] = await Promise.all([
      Pandit.find(filter).select(PUBLIC_SELECT).sort(sortBy).skip(skip).limit(limit).populate('user', 'name avatar'),
      Pandit.countDocuments(filter),
    ]);
  }

  res.json({
    success: true,
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const pandit = await Pandit.findOne({ _id: req.params.id, 'kyc.status': 'approved', isActive: true })
    .select(PUBLIC_SELECT)
    .populate('user', 'name avatar');
  if (!pandit) throw ApiError.notFound('Purohit not found');
  const reviews = await Review.find({ pandit: pandit._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customer', 'name')
    .populate('puja', 'name');
  res.json({ success: true, data: { pandit, reviews } });
});

exports.options = (_req, res) => res.json({ success: true, data: { specializations: SPECIALIZATIONS, languages: LANGUAGES } });

// ---------- Pandit self-service ----------
const loadOwn = async (userId) => {
  const pandit = await Pandit.findOne({ user: userId });
  if (!pandit) throw ApiError.notFound('Purohit profile not found');
  return pandit;
};

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loadOwn(req.user._id).then((p) => p.populate('user', 'name email phone avatar')) });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const pandit = await loadOwn(req.user._id);
  const b = req.body || {};
  const updates = pick(b, ['experienceYears', 'templeAffiliation', 'bio', 'photo', 'pujaCharge', 'hourlyCharge']);
  if (b.specializations !== undefined) {
    updates.specializations = toStringArray(b.specializations);
    if (updates.specializations.some((s) => !SPECIALIZATIONS.includes(s))) throw ApiError.badRequest('Invalid specialization');
  }
  if (b.languages !== undefined) {
    updates.languages = toStringArray(b.languages);
    if (updates.languages.some((l) => !LANGUAGES.includes(l))) throw ApiError.badRequest('Invalid language');
  }
  if (b.serviceCities !== undefined) updates.serviceCities = toStringArray(b.serviceCities);
  Object.assign(pandit, updates);
  await pandit.save();
  res.json({ success: true, data: pandit });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const pandit = await loadOwn(req.user._id);
  const { weeklyOffDays, unavailableDates } = req.body || {};
  if (weeklyOffDays !== undefined) {
    if (!Array.isArray(weeklyOffDays) || weeklyOffDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      throw ApiError.badRequest('weeklyOffDays must be integers 0-6');
    }
    pandit.availability.weeklyOffDays = [...new Set(weeklyOffDays)];
  }
  if (unavailableDates !== undefined) {
    if (!Array.isArray(unavailableDates) || unavailableDates.some((d) => !isValidDateString(d))) {
      throw ApiError.badRequest('unavailableDates must be YYYY-MM-DD strings');
    }
    pandit.availability.unavailableDates = [...new Set(unavailableDates)].sort();
  }
  await pandit.save();
  res.json({ success: true, data: pandit.availability });
});

exports.submitKyc = asyncHandler(async (req, res) => {
  const pandit = await loadOwn(req.user._id);
  const { documents } = req.body || {};
  if (!Array.isArray(documents) || !documents.length) throw ApiError.badRequest('Provide at least one KYC document');
  const clean = documents.map((d) => {
    if (!d || typeof d.url !== 'string' || !/^https?:\/\//.test(d.url)) throw ApiError.badRequest('Each document needs a valid url');
    return { type: String(d.type || 'ID Proof').slice(0, 50), url: d.url };
  });
  pandit.kyc.documents = clean;
  pandit.kyc.status = 'pending';
  pandit.kyc.rejectionReason = undefined;
  await pandit.save();
  res.json({ success: true, data: pandit.kyc });
});

