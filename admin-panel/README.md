# Puja Platform – Admin Panel

React 18 (Vite) · Tailwind CSS · Lucide icons · React Router

Role-based: **admin** (everything, incl. revenue & payouts) and **ops** (bookings, purohits, catalog, disputes).

## Setup
```bash
cd admin-panel
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5174
npm run build
```
Add `http://localhost:5174` to the backend's `CLIENT_ORIGINS`. Sign in with a seeded account: `admin@puja.test` / `ops@puja.test` (password `Puja@12345`).

## Modules
- Dashboard – KPI cards, bookings by status
- Purohits – KYC review queue (approve / reject with reason), activate / deactivate
- Pujas – create/edit with price tiers, location types, samagri checklist and kit
- Samagri kits – kit items and rates
- Muhurthams – special auspicious windows shown to customers
- Bookings – filter, assign / auto-match purohit, status changes, meeting link for online pujas
- Disputes – review, resolve / reject, record refund
- Revenue & Payouts (admin) – gross, commission, purohit earnings, monthly report, settle payouts with a UTR

