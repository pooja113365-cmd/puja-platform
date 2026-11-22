const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

function generateReferralCode(name = '') {
  const prefix = String(name || 'GPJ')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'G');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `${prefix}${rand}`;
}

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home', maxlength: 40 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    avatar: { type: String },
    addresses: { type: [addressSchema], default: [] },
    referralCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    referredByCode: { type: String, uppercase: true, trim: true },
    walletBalance: { type: Number, default: 0, min: 0 },
    referralCount: { type: Number, default: 0, min: 0 },
    referralEarnings: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('validate', function ensureRefCode(next) {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode(this.name);
  }
  next();
});

userSchema.pre('save', async function hash(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.statics.generateReferralCode = generateReferralCode;

module.exports = mongoose.model('User', userSchema);
