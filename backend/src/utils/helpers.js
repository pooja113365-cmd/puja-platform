const ApiError = require('./ApiError');

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const isObjectId = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);

function assertId(value, name = 'id') {
  if (!isObjectId(String(value ?? ''))) throw ApiError.badRequest(`Invalid ${name}`);
  return String(value);
}

function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const isValidTime = (s) => typeof s === 'string' && TIME_RE.test(s);

// Event time is always interpreted in IST (platform operates in India).
const eventStart = (date, time) => new Date(`${date}T${time}:00+05:30`);

const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parsePagination(query, defaultLimit = 12, maxLimit = 100) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const toStringArray = (v) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((x) => String(x).trim())
    .filter(Boolean);

module.exports = {
  isObjectId, assertId, isValidDateString, isValidTime, eventStart, weekdayOf,
  escapeRegex, parsePagination, round2, pick, slugify, toStringArray,
};

