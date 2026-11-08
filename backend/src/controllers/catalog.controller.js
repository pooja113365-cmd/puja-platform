const Puja = require('../models/Puja');
const Samagri = require('../models/Samagri');
const Muhurtham = require('../models/Muhurtham');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { SPECIALIZATIONS, LOCATION_TYPES, DEFAULT_SLOTS } = require('../utils/constants');
const {
  escapeRegex, parsePagination, slugify, isObjectId, isValidDateString, isValidTime, pick,
} = require('../utils/helpers');

// ================= Pujas =================
function cleanPuja(b, partial = false) {
  const out = pick(b, [
    'name', 'category', 'description', 'significance', 'durationMinutes', 'locationTypes',
    'samagriChecklist', 'samagriKit', 'priceTiers', 'image', 'isFeatured', 'isActive',
  ]);
  if (!partial) {
    for (const f of ['name', 'category', 'description', 'durationMinutes', 'locationTypes', 'priceTiers']) {
      if (out[f] === undefined || out[f] === '') throw ApiError.badRequest(`${f} is required`);
    }
  }
  if (out.category !== undefined && !SPECIALIZATIONS.includes(out.category)) throw ApiError.badRequest('Invalid category');
  if (out.locationTypes !== undefined) {
    if (!Array.isArray(out.locationTypes) || !out.locationTypes.length || out.locationTypes.some((l) => !LOCATION_TYPES.includes(l))) {
      throw ApiError.badRequest('Invalid locationTypes');
    }
  }
  if (out.priceTiers !== undefined) {
    if (!Array.isArray(out.priceTiers) || !out.priceTiers.length) throw ApiError.badRequest('At least one price tier required');
    out.priceTiers = out.priceTiers.map((t) => {
      if (!t || !t.name || !(Number(t.price) >= 0)) throw ApiError.badRequest('Each price tier needs a name and valid price');
      return { name: String(t.name), price: Number(t.price), description: t.description };
    });
  }
  if (out.durationMinutes !== undefined) out.durationMinutes = Number(out.durationMinutes);
  if (out.samagriKit === '' || out.samagriKit === null) out.samagriKit = undefined;
  if (out.samagriKit !== undefined && !isObjectId(String(out.samagriKit))) throw ApiError.badRequest('Invalid samagriKit id');
  return out;
}

exports.listPujas = asyncHandler(async (req, res) => {
  const { category, location, search, featured, language, maxPrice, maxDuration, hasSamagri } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 12);
  const isStaff = req.user && ['admin', 'ops'].includes(req.user.role);
  const filter = {};
  if (!(isStaff && req.query.includeInactive === 'true')) filter.isActive = true;
  if (category) filter.category = String(category);
  if (location) filter.locationTypes = String(location);
  if (featured === 'true') filter.isFeatured = true;
  if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
    filter['priceTiers.price'] = { $lte: Number(maxPrice) };
  }
  if (maxDuration !== undefined && maxDuration !== '' && !Number.isNaN(Number(maxDuration))) {
    filter.durationMinutes = { $lte: Number(maxDuration) };
  }
  if (hasSamagri === 'true') filter.samagriKit = { $ne: null };
  else if (hasSamagri === 'false') filter.samagriKit = null;
  if (language) {
    const Pandit = require('../models/Pandit');
    const cats = await Pandit.distinct('specializations', {
      'kyc.status': 'approved',
      isActive: true,
      languages: String(language),
    });
    filter.category = filter.category ? (cats.includes(filter.category) ? filter.category : '__none__') : { $in: cats };
  }
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const [items, total] = await Promise.all([
    Puja.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).populate('samagriKit', 'name price'),
    Puja.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getPuja = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const q = isObjectId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const puja = await Puja.findOne({ ...q, isActive: true }).populate('samagriKit');
  if (!puja) throw ApiError.notFound('Puja not found');
  res.json({ success: true, data: puja });
});

exports.createPuja = asyncHandler(async (req, res) => {
  const data = cleanPuja(req.body || {});
  data.slug = slugify(data.name);
  if (await Puja.exists({ slug: data.slug })) data.slug = `${data.slug}-${Date.now().toString(36)}`;
  const puja = await Puja.create(data);
  res.status(201).json({ success: true, data: puja });
});

exports.updatePuja = asyncHandler(async (req, res) => {
  const puja = await Puja.findById(req.params.id);
  if (!puja) throw ApiError.notFound('Puja not found');
  Object.assign(puja, cleanPuja(req.body || {}, true));
  await puja.save();
  res.json({ success: true, data: puja });
});

exports.deletePuja = asyncHandler(async (req, res) => {
  const puja = await Puja.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!puja) throw ApiError.notFound('Puja not found');
  res.json({ success: true, message: 'Puja deactivated' });
});

exports.pujaOptions = (_req, res) =>
  res.json({ success: true, data: { categories: SPECIALIZATIONS, locationTypes: LOCATION_TYPES } });

// ================= Samagri kits =================
function cleanKit(b, partial = false) {
  const out = pick(b, ['name', 'description', 'items', 'price', 'isActive']);
  if (!partial && (!out.name || out.price === undefined)) throw ApiError.badRequest('name and price are required');
  if (out.price !== undefined && !(Number(out.price) >= 0)) throw ApiError.badRequest('Invalid price');
  if (out.price !== undefined) out.price = Number(out.price);
  if (out.items !== undefined) {
    if (!Array.isArray(out.items) || out.items.some((i) => !i || !i.name)) throw ApiError.badRequest('Each item needs a name');
  }
  return out;
}

exports.listKits = asyncHandler(async (req, res) => {
  const staff = req.user && ['admin', 'ops'].includes(req.user.role);
  const kits = await Samagri.find(staff ? {} : { isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: kits });
});

exports.createKit = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await Samagri.create(cleanKit(req.body || {})) });
});

exports.updateKit = asyncHandler(async (req, res) => {
  const kit = await Samagri.findById(req.params.id);
  if (!kit) throw ApiError.notFound('Samagri kit not found');
  Object.assign(kit, cleanKit(req.body || {}, true));
  await kit.save();
  res.json({ success: true, data: kit });
});

exports.deleteKit = asyncHandler(async (req, res) => {
  const kit = await Samagri.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!kit) throw ApiError.notFound('Samagri kit not found');
  res.json({ success: true, message: 'Samagri kit deactivated' });
});

// ================= Muhurtham =================
function cleanMuhurtham(b, partial = false) {
  const out = pick(b, ['date', 'label', 'startTime', 'endTime', 'notes', 'isActive']);
  if (!partial && (!out.date || !out.label || !out.startTime || !out.endTime)) {
    throw ApiError.badRequest('date, label, startTime and endTime are required');
  }
  if (out.date !== undefined && !isValidDateString(out.date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
  for (const f of ['startTime', 'endTime']) {
    if (out[f] !== undefined && !isValidTime(out[f])) throw ApiError.badRequest(`${f} must be HH:mm`);
  }
  if (out.startTime && out.endTime && out.startTime >= out.endTime) throw ApiError.badRequest('endTime must be after startTime');
  return out;
}

exports.listMuhurthams = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    if ((from && !isValidDateString(from)) || (to && !isValidDateString(to))) throw ApiError.badRequest('from/to must be YYYY-MM-DD');
    filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  const staff = req.user && ['admin', 'ops'].includes(req.user.role);
  if (!staff) filter.isActive = true;
  res.json({ success: true, data: await Muhurtham.find(filter).sort({ date: 1, startTime: 1 }).limit(500) });
});

/** Bookable slots for a date: standard windows plus admin-defined muhurthams (flagged). */
exports.slotsForDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!isValidDateString(date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
  const special = await Muhurtham.find({ date, isActive: true }).sort({ startTime: 1 });
  const slots = [
    ...special.map((m) => ({ label: m.label, startTime: m.startTime, endTime: m.endTime, notes: m.notes, auspicious: true, muhurthamId: m._id })),
    ...DEFAULT_SLOTS.map((s) => ({ ...s, auspicious: false })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));
  res.json({ success: true, data: slots });
});

exports.createMuhurtham = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await Muhurtham.create(cleanMuhurtham(req.body || {})) });
});

exports.updateMuhurtham = asyncHandler(async (req, res) => {
  const m = await Muhurtham.findById(req.params.id);
  if (!m) throw ApiError.notFound('Muhurtham not found');
  const data = cleanMuhurtham(req.body || {}, true);
  Object.assign(m, data);
  if (m.startTime >= m.endTime) throw ApiError.badRequest('endTime must be after startTime');
  await m.save();
  res.json({ success: true, data: m });
});

exports.deleteMuhurtham = asyncHandler(async (req, res) => {
  const m = await Muhurtham.findByIdAndDelete(req.params.id);
  if (!m) throw ApiError.notFound('Muhurtham not found');
  res.json({ success: true, message: 'Muhurtham deleted' });
});

