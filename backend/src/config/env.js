require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/puja_platform',
  jwtSecret: process.env.JWT_SECRET || 'getpuja-production-jwt-secret-key-2026-secure-token',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  cloudinary: (() => {
    const url = process.env.CLOUDINARY_URL || '';
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || (m ? m[3].trim() : ''),
      apiKey: process.env.CLOUDINARY_API_KEY || (m ? m[1].trim() : ''),
      apiSecret: process.env.CLOUDINARY_API_SECRET || (m ? m[2].trim() : ''),
    };
  })(),
  commissionRate: Math.min(Math.max(Number(process.env.COMMISSION_RATE ?? 0.2), 0), 0.9),
  advancePercent: Math.min(Math.max(Number(process.env.ADVANCE_PERCENT ?? 30), 1), 100),
};

function assertEnv() {
  if (isProd && env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long in production');
  }
}

module.exports = { env, assertEnv };

