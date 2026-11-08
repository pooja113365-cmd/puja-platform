const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

function extractToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

async function userFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (e) {
    throw ApiError.unauthorized(e.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');
  return user;
}

const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();
  req.user = await userFromToken(token);
  next();
});

// Attaches req.user when a valid token is present; never rejects the request.
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await userFromToken(token);
    } catch (_e) {
      req.user = undefined;
    }
  }
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

module.exports = { protect, optionalAuth, authorize, signToken, userFromToken };
