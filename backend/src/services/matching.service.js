const Pandit = require('../models/Pandit');
const Booking = require('../models/Booking');
const { weekdayOf } = require('../utils/helpers');

/** True when the pandit has not blocked the date (weekly off day or specific date). */
function isOpenOnDate(pandit, date) {
  const av = pandit.availability || {};
  if ((av.unavailableDates || []).includes(date)) return false;
  if ((av.weeklyOffDays || []).includes(weekdayOf(date))) return false;
  return true;
}

/** True when no non-cancelled booking overlaps the slot for this pandit. */
async function isFreeForSlot(panditId, date, startTime, endTime, excludeBookingId) {
  const q = {
    pandit: panditId,
    date,
    status: { $ne: 'cancelled' },
    'timeSlot.startTime': { $lt: endTime },
    'timeSlot.endTime': { $gt: startTime },
  };
  if (excludeBookingId) q._id = { $ne: excludeBookingId };
  return !(await Booking.exists(q));
}

async function isPanditAvailable(pandit, date, startTime, endTime, excludeBookingId) {
  if (!isOpenOnDate(pandit, date)) return false;
  return isFreeForSlot(pandit._id, date, startTime, endTime, excludeBookingId);
}

/**
 * Auto-match: best rated, then most experienced approved pandit who handles the
 * puja category, speaks the language and is free for the slot.
 */
async function findBestPandit({ category, language, date, startTime, endTime, city }) {
  const candidates = await Pandit.find({
    'kyc.status': 'approved',
    isActive: true,
    specializations: category,
    languages: language,
  })
    .sort({ 'rating.avg': -1, experienceYears: -1, completedBookings: -1 })
    .limit(100);

  const scored = candidates.sort((a, b) => {
    const ac = city && a.serviceCities.some((c) => c.toLowerCase() === city.toLowerCase()) ? 1 : 0;
    const bc = city && b.serviceCities.some((c) => c.toLowerCase() === city.toLowerCase()) ? 1 : 0;
    return bc - ac; // stable sort keeps rating order inside same city score
  });

  for (const p of scored) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPanditAvailable(p, date, startTime, endTime)) return p;
  }
  return null;
}

module.exports = { isOpenOnDate, isFreeForSlot, isPanditAvailable, findBestPandit };

