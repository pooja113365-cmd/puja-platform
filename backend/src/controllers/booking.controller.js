const Booking = require('../models/Booking');
const Puja = require('../models/Puja');
const Pandit = require('../models/Pandit');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { LANGUAGES } = require('../utils/constants');
const {
  assertId, isValidDateString, isValidTime, eventStart, parsePagination, escapeRegex,
} = require('../utils/helpers');
const { computePricing } = require('../utils/pricing');
const { isPanditAvailable } = require('../services/matching.service');
const svc = require('../services/booking.service');
const { emitBookingUpdate } = require('../services/socket.service');

const STAFF = ['admin', 'ops'];
const isStaff = (u) => STAFF.includes(u.role);

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

exports.create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const puja = await Puja.findOne({ _id: assertId(b.pujaId, 'pujaId'), isActive: true }).populate('samagriKit');
  if (!puja) throw ApiError.notFound('Puja not found');

  const tier = b.tierName
    ? puja.priceTiers.find((t) => t.name === b.tierName)
    : puja.priceTiers.length === 1 ? puja.priceTiers[0] : null;
  if (!tier) throw ApiError.badRequest('Select a valid price tier');

  if (!isValidDateString(b.date)) throw ApiError.badRequest('date must be YYYY-MM-DD');
  const slot = b.timeSlot || {};
  if (!slot.label || !isValidTime(slot.startTime) || !isValidTime(slot.endTime) || slot.startTime >= slot.endTime) {
    throw ApiError.badRequest('Select a valid time slot / muhurtham');
  }
  if (eventStart(b.date, slot.startTime) - Date.now() < 2 * 36e5) {
    throw ApiError.badRequest('Bookings must be made at least 2 hours before the ceremony');
  }
  if (!LANGUAGES.includes(b.language)) throw ApiError.badRequest('Select a valid language');
  if (!puja.locationTypes.includes(b.locationType)) throw ApiError.badRequest('This puja is not available at the selected location type');

  let address;
  if (b.locationType === 'home' || b.locationType === 'temple') {
    const a = b.address || {};
    if (b.locationType === 'home' && (!a.line1 || !a.city || !/^\d{6}$/.test(String(a.pincode || '')))) {
      throw ApiError.badRequest('Home address requires line1, city and a 6-digit pincode');
    }
    if (a.line1 || a.city) {
      address = {
        line1: String(a.line1 || '').slice(0, 200), line2: a.line2 ? String(a.line2).slice(0, 200) : undefined,
        city: String(a.city || '').slice(0, 80), state: a.state ? String(a.state).slice(0, 80) : undefined,
        pincode: a.pincode ? String(a.pincode) : undefined,
      };
    }
  }

  const includeSamagri = Boolean(b.includeSamagri);
  if (includeSamagri) {
    if (b.locationType === 'online') throw ApiError.badRequest('Samagri kit delivery is not available for online pujas');
    if (!puja.samagriKit || !puja.samagriKit.isActive) throw ApiError.badRequest('No samagri kit is available for this puja');
  }

  const paymentOption = b.paymentOption === 'full' ? 'full' : 'advance';

  let panditId;
  if (b.panditId) {
    const pandit = await Pandit.findOne({ _id: assertId(b.panditId, 'panditId'), 'kyc.status': 'approved', isActive: true });
    if (!pandit) throw ApiError.notFound('Purohit not found');
    if (!pandit.specializations.includes(puja.category)) throw ApiError.badRequest('This purohit does not perform the selected puja');
    if (!pandit.languages.includes(b.language)) throw ApiError.badRequest('This purohit does not speak the selected language');
    if (!(await isPanditAvailable(pandit, b.date, slot.startTime, slot.endTime))) {
      throw ApiError.conflict('This purohit is not available for the selected date and slot');
    }
    panditId = pandit._id;
  }

  const pricing = computePricing({
    tierPrice: tier.price,
    samagriPrice: puja.samagriKit?.price,
    includeSamagri,
    paymentOption,
    commissionRate: env.commissionRate,
    advancePercent: env.advancePercent,
  });

  const booking = await Booking.create({
    bookingNumber: svc.generateBookingNumber(),
    customer: req.user._id,
    puja: puja._id,
    pandit: panditId,
    tierName: tier.name,
    date: b.date,
    timeSlot: { label: String(slot.label).slice(0, 80), startTime: slot.startTime, endTime: slot.endTime },
    language: b.language,
    locationType: b.locationType,
    address,
    includeSamagri,
    samagriKit: includeSamagri ? puja.samagriKit._id : undefined,
    notes: b.notes ? String(b.notes).slice(0, 500) : undefined,
    paymentOption,
    pricing,
    statusHistory: [{ status: 'pending', by: req.user._id, note: 'Booking created' }],
  });

  await emitBookingUpdate(booking);
  res.status(201).json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
});

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
  if (search) filter.bookingNumber = new RegExp(escapeRegex(String(search).slice(0, 30)), 'i');

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
  if (['in_progress', 'completed'].includes(status) && booking.payment.amountPaid <= 0 && !isStaff(user)) {
    throw ApiError.badRequest('Booking has not been paid for');
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
  if (!['confirmed', 'pandit_assigned'].includes(booking.status)) {
    throw ApiError.badRequest('Only confirmed bookings can be assigned a purohit');
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

