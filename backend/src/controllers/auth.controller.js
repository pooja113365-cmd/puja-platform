const User = require('../models/User');
const Pandit = require('../models/Pandit');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');
const { signToken } = require('../middleware/auth');
const { SPECIALIZATIONS, LANGUAGES } = require('../utils/constants');
const { toStringArray, pick } = require('../utils/helpers');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

async function ensureUserReferralCode(user) {
  if (user && !user.referralCode) {
    user.referralCode = User.generateReferralCode(user.name);
    await user.save();
  }
  return user;
}

const authPayload = (user, pandit) => ({
  token: signToken(user),
  user: user.toJSON(),
  ...(pandit ? { pandit } : {}),
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'customer', referralCode } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2) throw ApiError.badRequest('Name must be at least 2 characters');
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) throw ApiError.badRequest('A valid email is required');
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) throw ApiError.badRequest('A valid 10-digit Indian mobile number is required');
  if (typeof password !== 'string' || password.length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
  if (!['customer', 'pandit'].includes(role)) throw ApiError.badRequest('Invalid role');

  let specializations;
  let languages;
  if (role === 'pandit') {
    specializations = toStringArray(req.body.specializations);
    languages = toStringArray(req.body.languages);
    if (!specializations.length || specializations.some((s) => !SPECIALIZATIONS.includes(s))) {
      throw ApiError.badRequest('Select valid Vedic specializations');
    }
    if (!languages.length || languages.some((l) => !LANGUAGES.includes(l))) {
      throw ApiError.badRequest('Select valid spoken languages');
    }
  }

  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict('Email already registered');

  let referrer = null;
  const cleanRefCode = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
  if (cleanRefCode) {
    referrer = await User.findOne({ referralCode: cleanRefCode });
    if (!referrer) throw ApiError.badRequest('Invalid referral code');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password,
    role,
    ...(referrer
      ? {
          referredBy: referrer._id,
          referredByCode: referrer.referralCode,
          walletBalance: env.referral.refereeReward,
        }
      : {}),
  });

  if (referrer) {
    await User.findByIdAndUpdate(referrer._id, {
      $inc: {
        walletBalance: env.referral.referrerReward,
        referralEarnings: env.referral.referrerReward,
        referralCount: 1,
      },
    });
  }

  let pandit;
  if (role === 'pandit') {
    try {
      pandit = await Pandit.create({
        user: user._id,
        specializations,
        languages,
        experienceYears: Math.max(Number(req.body.experienceYears) || 0, 0),
        templeAffiliation: req.body.templeAffiliation,
        bio: req.body.bio,
        pujaCharge: Math.max(Number(req.body.pujaCharge) || 0, 0),
        serviceCities: toStringArray(req.body.serviceCities),
      });
    } catch (e) {
      await User.findByIdAndDelete(user._id);
      throw e;
    }
  }
  res.status(201).json({ success: true, data: authPayload(user, pandit) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Your account has been disabled');
  await ensureUserReferralCode(user);
  const pandit = user.role === 'pandit' ? await Pandit.findOne({ user: user._id }) : undefined;
  res.json({ success: true, data: authPayload(user, pandit) });
});

exports.me = asyncHandler(async (req, res) => {
  await ensureUserReferralCode(req.user);
  const pandit = req.user.role === 'pandit' ? await Pandit.findOne({ user: req.user._id }) : undefined;
  res.json({ success: true, data: { user: req.user.toJSON(), ...(pandit ? { pandit } : {}) } });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const updates = pick(req.body || {}, ['name', 'phone', 'avatar', 'addresses']);
  if (updates.phone !== undefined && !PHONE_RE.test(String(updates.phone))) throw ApiError.badRequest('Invalid phone number');
  if (updates.addresses !== undefined && !Array.isArray(updates.addresses)) throw ApiError.badRequest('addresses must be an array');
  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toJSON() } });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw ApiError.badRequest('New password must be at least 8 characters');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(String(currentPassword || '')))) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

exports.getReferralInfo = asyncHandler(async (req, res) => {
  await ensureUserReferralCode(req.user);
  const referredUsers = await User.find({ referredBy: req.user._id })
    .select('name createdAt')
    .sort({ createdAt: -1 })
    .limit(25);
  res.json({
    success: true,
    data: {
      referralCode: req.user.referralCode,
      walletBalance: req.user.walletBalance || 0,
      referralCount: req.user.referralCount || referredUsers.length,
      referralEarnings: req.user.referralEarnings || 0,
      referredByCode: req.user.referredByCode || null,
      referrerReward: env.referral.referrerReward,
      refereeReward: env.referral.refereeReward,
      referredUsers,
    },
  });
});

exports.applyReferralCode = asyncHandler(async (req, res) => {
  await ensureUserReferralCode(req.user);
  if (req.user.referredBy || req.user.referredByCode) {
    throw ApiError.conflict('You have already redeemed a referral code');
  }
  const code = String(req.body?.referralCode || '').trim().toUpperCase();
  if (!code) throw ApiError.badRequest('Please enter a referral code');
  if (code === req.user.referralCode) throw ApiError.badRequest('You cannot use your own referral code');

  const referrer = await User.findOne({ referralCode: code });
  if (!referrer) throw ApiError.notFound('Invalid referral code');

  req.user.referredBy = referrer._id;
  req.user.referredByCode = referrer.referralCode;
  req.user.walletBalance = (req.user.walletBalance || 0) + env.referral.refereeReward;
  await req.user.save();

  await User.findByIdAndUpdate(referrer._id, {
    $inc: {
      walletBalance: env.referral.referrerReward,
      referralEarnings: env.referral.referrerReward,
      referralCount: 1,
    },
  });

  res.json({
    success: true,
    message: `Referral code applied! ₹${env.referral.refereeReward} credited to your wallet.`,
    data: {
      user: req.user.toJSON(),
      walletBalance: req.user.walletBalance,
    },
  });
});
