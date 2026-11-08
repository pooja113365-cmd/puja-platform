# Puja Platform – Backend API

Node.js · Express · MongoDB (Mongoose) · JWT · Socket.io · Razorpay · Multer + Cloudinary

## Prerequisites
- Node.js 18+
- MongoDB 6+ running locally or an Atlas URI

## Setup
```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env  — then edit values
npm run seed              # optional demo data (WIPES the target database)
npm run dev               # http://localhost:5000  (npm start for production)
npm test                  # Jest + Supertest (no database required)
```

Seed logins (password `Puja@12345`): `admin@puja.test`, `ops@puja.test`, `customer@puja.test`, `ramakrishna@puja.test` (purohit).

## Environment (`.env`)
| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | ≥ 32 chars in production (server refuses to boot otherwise) |
| `CLIENT_ORIGINS` | Comma separated CORS origins (website, admin) |
| `RAZORPAY_KEY_ID / KEY_SECRET` | Required for checkout. Without them payment endpoints return 503 |
| `RAZORPAY_WEBHOOK_SECRET` | Enables `POST /api/payments/webhook` (event `payment.captured` / `order.paid`) |
| `CLOUDINARY_*` | Required for `POST /api/uploads`. Without them it returns 503 |
| `COMMISSION_RATE` | Platform commission (0.2 = 20%) |
| `ADVANCE_PERCENT` | Advance payment percentage (default 30) |

## Structure
```
src/
  config/       env, db, cloudinary
  models/       User, Pandit, Puja, Samagri, Muhurtham, Booking, Review, Dispute
  controllers/  auth, pandit, catalog (puja/samagri/muhurtham), booking, payment, engagement (reviews/disputes), admin, upload
  services/     payment (Razorpay + signature checks), booking (state machine, refunds), matching (auto-assign), socket
  middleware/   auth (JWT + roles), validateObjectId, error, upload
  routes/       all routes mounted under /api
tests/          Jest suites
```

## API summary (`/api`)
| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `POST /auth/change-password` |
| Purohits | `GET /pandits` (search, `specialization`, `language`, `city`, `minExperience`, `maxCharge`, `sort`, `date`+`startTime`+`endTime` availability), `GET /pandits/:id`, `GET /pandits/options`, pandit self-service `/pandits/me`, `/pandits/me/availability`, `/pandits/me/kyc` |
| Catalog | `GET /pujas`, `GET /pujas/:idOrSlug`, `/samagri`, `/muhurthams`, `GET /muhurthams/slots?date=` (staff CRUD) |
| Bookings | `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `POST /bookings/:id/assign`, `POST /bookings/:id/auto-assign`, `PATCH /bookings/:id/meeting-link` |
| Payments | `POST /payments/create-order`, `POST /payments/verify`, `POST /payments/webhook` |
| Engagement | `POST /reviews`, `GET /reviews/pandit/:id`, `/disputes` |
| Admin/Ops | `/admin/stats`, `/admin/revenue`*, `/admin/payouts`*, `/admin/pandits` (+ `/kyc`), `/admin/users`, `/admin/staff`* (*admin only) |

Responses: `{ success: true, data, meta? }` or `{ success: false, message, details? }`.

## Business rules
- Status flow: `pending → confirmed → pandit_assigned → in_progress → completed`, `cancelled` from any pre-progress state.
- Paying (advance or full) confirms the booking, then assigns the chosen purohit or auto-matches (specialization + language + availability, best rating first).
- Pandit double-booking is prevented by an overlap check **and** a partial unique index.
- Unpaid `pending` bookings are auto-cancelled after 30 minutes to release the slot.
- Cancellation refund: 100% if ≥ 48 h before, 50% if ≥ 24 h, else 0 (processed through Razorpay refunds; failures are flagged for manual handling).
- Completed bookings create a pending payout (`total − commission`); admin marks it paid with a UTR reference.
- Socket.io: authenticate with `auth: { token }`; emit `booking:join` with a booking id; receive `booking:update`.

