# Puja Platform – Website

React 18 (Vite) · Tailwind CSS · Lucide icons · React Router · Socket.io client · Razorpay Checkout

## Setup
```bash
cd website
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5173
npm run build            # production build in dist/
```
The backend must be running (see `../backend/README.md`) and `http://localhost:5173` must be in its `CLIENT_ORIGINS`.

## Features
- Landing page, puja catalog (search, category, location filters), puja detail with samagri checklist
- Purohit discovery (specialization, language, city, sort) with profile + reviews
- 5-step booking flow: package → date & muhurtham slot + language → location/address/samagri kit → auto-match or choose purohit → review & Razorpay payment
- My bookings, live booking tracking (Socket.io), cancellation, balance payment, reviews, dispute reporting
- Loading / empty / error states, session-expiry redirect to login

## Structure
`src/components` · `src/pages` · `src/context` (auth) · `src/services` (api, socket, payment) · `src/hooks` · `src/utils`

