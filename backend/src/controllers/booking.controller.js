const Booking = require('../models/Booking');
const Puja = require('../models/Puja');
const Pandit = require('../models/Pandit');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { LANGUAGES, LOCATION_TYPES } = require('../utils/constants');
const {
  assertId, isObjectId, isValidDateString, isValidTime, eventStart, parsePagination, escapeRegex,
} = require('../utils/helpers');
const { computePricing } = require('../utils/pricing');
const { isPanditAvailable } = require('../services/matching.service');
const svc = require('../services/booking.service');
const { emitBookingUpdate } = require('../services/socket.service');

const STAFF = ['admin', 'ops'];
const isStaff = (u) => u && STAFF.includes(u.role);

function defaultTomorrowYmd() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

async function resolveOrCreateCustomer(reqUser, { name, phone, email }) {
  if (reqUser && reqUser._id) return reqUser;
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  const validPhone = /^[6-9]\d{9}$/.test(cleanPhone) ? cleanPhone : '9000000099';
  const cleanEmail =
    email && /^\S+@\S+\.\S+$/.test(String(email).trim())
      ? String(email).trim().toLowerCase()
      : `devotee.${validPhone}.${Date.now()}@getpuja.com`;

  let existing = await User.findOne({ $or: [{ phone: validPhone }, { email: cleanEmail }] });
  if (existing) return existing;

  try {
    existing = await User.create({
      name: String(name || 'Devotee').trim().slice(0, 80) || 'Devotee',
      email: cleanEmail,
      phone: validPhone,
      password: `GetPuja@${validPhone}`,
      role: 'customer',
    });
    return existing;
  } catch (_e) {
    return User.findOne({ role: 'customer' });
  }
}

const populateBooking = (q) =>
  q
    .populate('puja', 'name slug category image durationMinutes')
    .populate({ path: 'pandit', select: 'user photo experienceYears rating languages templeAffiliation', populate: { path: 'user', select: 'name phone avatar' } })
    .populate('customer', 'name phone email')
    .populate('samagriKit', 'name price');

/** Loads booking and verifies the caller may see it. Returns { booking, pandit } */
async function loadAuthorized(req, { forWrite = false } = {}) {
  const booking = await Booking.findById(assertId(req.params.id, 'booking id'));
  if (!booking) throw ApiError.notFound('Booking not found');
  const { user } = req;
  if (isStaff(user)) return { booking };
  if (user.role === 'customer' && String(booking.customer) === String(user._id)) return { booking };
  if (user.role === 'pandit') {
    const pandit = await Pandit.findOne({ user: user._id });
    if (pandit && booking.pandit && String(booking.pandit) === String(pandit._id)) return { booking, pandit };
  }
  throw forWrite ? ApiError.forbidden() : ApiError.notFound('Booking not found');
}

exports.createInquiry = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const customerName = String(b.customerName || b.name || req.user?.name || '').trim();
  const rawPhone = String(b.customerPhone || b.phone || req.user?.phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  const customerEmail = String(b.customerEmail || b.email || req.user?.email || '').trim();
  const serviceDetails = String(b.serviceDetails || b.notes || '').trim();

  if (!customerName || customerName.length < 2) {
    throw ApiError.badRequest('Please enter your full name');
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw ApiError.badRequest('Please enter a valid 10-digit mobile number');
  }
  if (!serviceDetails) {
    throw ApiError.badRequest('Please describe the puja or service you need');
  }

  let puja = null;
  if (b.pujaId && isObjectId(String(b.pujaId))) {
    puja = await Puja.findById(b.pujaId).populate('samagriKit');
  }
  if (!puja && b.serviceTitle) {
    puja = await Puja.findOne({
      name: new RegExp(escapeRegex(String(b.serviceTitle).trim().slice(0, 40)), 'i'),
    }).populate('samagriKit');
  }
  if (!puja) {
    puja = await Puja.findOne({ isActive: true }).populate('samagriKit');
  }

  let panditId;
  if (b.panditId && isObjectId(String(b.panditId))) {
    const p = await Pandit.findById(b.panditId);
    if (p) panditId = p._id;
  }

  const customerDoc = await resolveOrCreateCustomer(req.user, {
    name: customerName,
    phone: cleanPhone,
    email: customerEmail,
  });

  const date = isValidDateString(b.date) ? b.date : defaultTomorrowYmd();
  const slot = b.timeSlot && b.timeSlot.startTime && b.timeSlot.endTime
    ? {
        label: String(b.timeSlot.label || 'Preferred Slot').slice(0, 80),
        startTime: b.timeSlot.startTime,
        endTime: b.timeSlot.endTime,
      }
    : {
        label: String(b.preferredTime || 'Morning Shubh Muhurtham').slice(0, 80),
        startTime: '08:00',
        endTime: '10:00',
      };

  const language = LANGUAGES.includes(b.language) ? b.language : 'Telugu';
  const locationType = LOCATION_TYPES.includes(b.locationType) ? b.locationType : 'home';
  const tierName = String(b.tierName || puja?.priceTiers?.[0]?.name || 'Standard').slice(0, 80);
  const serviceTitle = String(b.serviceTitle || puja?.name || 'Custom Puja Service').trim().slice(0, 200);
  const includeSamagri = Boolean(b.includeSamagri);

  const addrInput = b.address || {};
  const address = {
    line1: String(addrInput.line1 || b.area || 'Hyderabad').slice(0, 200),
    line2: addrInput.line2 ? String(addrInput.line2).slice(0, 200) : undefined,
    city: String(addrInput.city || 'Hyderabad').slice(0, 80),
    state: String(addrInput.state || 'Telangana').slice(0, 80),
    pincode: String(addrInput.pincode || '500081').slice(0, 10),
  };

  const pricing = computePricing({
    tierPrice: 0,
    samagriPrice: 0,
    includeSamagri,
    paymentOption: 'advance',
    commissionRate: env.commissionRate,
    advancePercent: env.advancePercent,
  });

  const booking = await Booking.create({
    bookingNumber: svc.generateBookingNumber(),
    customer: customerDoc?._id,
    customerName,
    customerPhone: cleanPhone,
    customerEmail: customerEmail || undefined,
    serviceTitle,
    serviceDetails: serviceDetails.slice(0, 2000),
    puja: puja?._id,
    pandit: panditId,
    tierName,
    date,
    timeSlot: slot,
    language,
    locationType,
    address,
    includeSamagri,
    samagriKit: includeSamagri && puja?.samagriKit ? puja.samagriKit._id : undefined,
    notes: serviceDetails.slice(0, 2000),
    paymentOption: 'advance',
    pricing,
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        by: customerDoc?._id,
        note: `Service inquiry submitted by ${customerName} (${cleanPhone})`,
      },
    ],
  });

  await emitBookingUpdate(booking);
  const populated = await populateBooking(Booking.findById(booking._id));
  res.status(201).json({ success: true, data: populated });
});

exports.create = exports.createInquiry;

exports.list = asyncHandler(async (req, res) => {
  const { status, date, from, to, search, pandit: panditQ, payout } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 10);
  const filter = {};

  if (req.user.role === 'customer') filter.customer = req.user._id;
  else if (req.user.role === 'pandit') {
    const p = await Pandit.findOne({ user: req.user._id }).select('_id');
    if (!p) return res.json({ success: true, data: [], meta: { page, limit, total: 0, pages: 0 } });
    filter.pandit = p._id;
  } else if (panditQ) filter.pandit = assertId(panditQ, 'pandit');

  if (status) {
    const list = String(status).split(',');
    filter.status = list.length > 1 ? { $in: list } : list[0];
  }
  if (payout && isStaff(req.user)) filter['payout.status'] = String(payout);
  if (date) {
    if (!isValidDateString(date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
    filter.date = date;
  } else if (from || to) {
    if ((from && !isValidDateString(from)) || (to && !isValidDateString(to))) throw ApiError.badRequest('from/to must be YYYY-MM-DD');
    filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).slice(0, 50)), 'i');
    filter.$or = [
      { bookingNumber: rx },
      { customerName: rx },
      { customerPhone: rx },
      { serviceTitle: rx },
      { serviceDetails: rx },
      { notes: rx },
    ];
  }

  const [items, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { booking } = await loadAuthorized(req);
  const full = await populateBooking(Booking.findById(booking._id));
  res.json({ success: true, data: full });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { booking, pandit } = await loadAuthorized(req, { forWrite: true });
  const { status, note, reason } = req.body || {};
  const { user } = req;

  if (!Object.keys(svc.TRANSITIONS).includes(status)) throw ApiError.badRequest('Invalid status');
  if (!svc.canTransition(booking.status, status)) {
    throw ApiError.badRequest(`Cannot change booking from ${booking.status} to ${status}`);
  }

  if (user.role === 'customer' && status !== 'cancelled') throw ApiError.forbidden('Customers can only cancel bookings');
  if (user.role === 'pandit' && !['in_progress', 'completed'].includes(status)) {
    throw ApiError.forbidden('Purohits can only start or complete assigned bookings');
  }

  if (status === 'cancelled') {
    if (user.role === 'customer' && booking.status === 'in_progress') throw ApiError.badRequest('Cannot cancel a puja in progress');
    const result = await svc.cancelBooking(booking, user._id, String(reason || note || 'Cancelled').slice(0, 300));
    return res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)), refund: result.refund });
  }
  if (status === 'completed') await svc.completeBooking(booking, user._id);
  else {
    if (status === 'pandit_assigned' && !booking.pandit) throw ApiError.badRequest('Assign a purohit first');
    if (status === 'confirmed' && booking.status === 'pandit_assigned') booking.pandit = undefined;
    svc.setStatus(booking, status, user._id, note ? String(note).slice(0, 300) : undefined);
    await booking.save();
    await emitBookingUpdate(booking);
  }
  void pandit;
  return res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

exports.assign = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!['pending', 'confirmed', 'pandit_assigned'].includes(booking.status)) {
    throw ApiError.badRequest('Only active bookings can be assigned a purohit');
  }
  const pandit = await Pandit.findOne({ _id: assertId(req.body?.panditId, 'panditId'), 'kyc.status': 'approved', isActive: true });
  if (!pandit) throw ApiError.notFound('Purohit not found or not approved');
  if (!(await isPanditAvailable(pandit, booking.date, booking.timeSlot.startTime, booking.timeSlot.endTime, booking._id))) {
    throw ApiError.conflict('Purohit is not available for this slot');
  }
  booking.pandit = pandit._id;
  svc.setStatus(booking, 'pandit_assigned', req.user._id, 'Purohit assigned by ops');
  await booking.save();
  await emitBookingUpdate(booking);
  res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

exports.autoAssign = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'confirmed') throw ApiError.badRequest('Booking must be confirmed and unassigned');
  const pandit = await svc.autoAssign(booking, req.user._id, true);
  if (!pandit) throw ApiError.conflict('No available purohit matches this booking');
  res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

exports.setMeetingLink = asyncHandler(async (req, res) => {
  const { booking } = await loadAuthorized(req, { forWrite: true });
  if (req.user.role === 'customer') throw ApiError.forbidden();
  const { meetingLink } = req.body || {};
  if (typeof meetingLink !== 'string' || !/^https:\/\/\S+$/.test(meetingLink)) throw ApiError.badRequest('A valid https meeting link is required');
  if (booking.locationType !== 'online') throw ApiError.badRequest('Only online bookings have a meeting link');
  booking.meetingLink = meetingLink;
  await booking.save();
  await emitBookingUpdate(booking);
  res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

exports.reschedule = asyncHandler(async (req, res) => {
  const { booking } = await loadAuthorized(req, { forWrite: true });
  if (!['pending', 'confirmed', 'pandit_assigned'].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot reschedule a booking that is ${booking.status}`);
  }
  const { date, timeSlot } = req.body || {};
  if (!isValidDateString(date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
  const slot = timeSlot || {};
  if (!slot.label || !isValidTime(slot.startTime) || !isValidTime(slot.endTime) || slot.startTime >= slot.endTime) {
    throw ApiError.badRequest('Select a valid time slot / muhurtham');
  }
  if (eventStart(date, slot.startTime) - Date.now() < 2 * 36e5) {
    throw ApiError.badRequest('Rescheduled ceremony must be at least 2 hours from now');
  }
  if (booking.pandit) {
    const pandit = await Pandit.findById(booking.pandit);
    if (pandit && !(await isPanditAvailable(pandit, date, slot.startTime, slot.endTime, booking._id))) {
      // Unassign previous pandit and attempt auto-match for the new slot
      booking.pandit = undefined;
      if (booking.status === 'pandit_assigned') booking.status = 'confirmed';
    }
  }
  booking.date = date;
  booking.timeSlot = { label: String(slot.label).slice(0, 80), startTime: slot.startTime, endTime: slot.endTime };
  booking.statusHistory.push({
    status: booking.status,
    by: req.user._id,
    note: `Rescheduled to ${date} (${slot.label} ${slot.startTime}–${slot.endTime})`,
    at: new Date(),
  });
  if (!booking.pandit && booking.status === 'confirmed') {
    await svc.autoAssign(booking, req.user._id, false);
  }
  await booking.save();
  await emitBookingUpdate(booking);
  res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

