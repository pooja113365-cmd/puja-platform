const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { env } = require('./config/env');
const routes = require('./routes');
const payment = require('./controllers/payment.controller');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients, whitelisted origins, and deployed frontend domains (.onrender.com, .vercel.app, .netlify.app).
      if (
        !origin ||
        env.clientOrigins.includes('*') ||
        env.clientOrigins.includes(origin) ||
        /\.(onrender\.com|vercel\.app|netlify\.app)$/.test(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Root status endpoint for Render health checks and browser visits.
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'GetPuja.com Backend API',
    status: 'online',
    health: '/api/health',
    endpoints: ['/api/pujas', '/api/pandits', '/api/auth', '/api/bookings'],
  });
});

// Serve local disk fallback uploads when Cloudinary is not configured.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Razorpay webhook needs the untouched raw body for signature verification.
app.post('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }), payment.webhook);

app.use(express.json({ limit: '1mb' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
