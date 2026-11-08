# Puja Platform

Hindu puja & purohit booking platform — four independent apps:

| Folder | Stack | Default port |
| --- | --- | --- |
| `backend/` | Node, Express, MongoDB, JWT, Socket.io, Razorpay, Cloudinary | 5000 |
| `website/` | React (Vite), Tailwind | 5173 |
| `admin-panel/` | React (Vite), Tailwind | 5174 |
| `user-app/` | Expo (React Native, TypeScript), NativeWind | Expo |

## Quick start
1. Start MongoDB, then `cd backend && npm install && copy .env.example .env && npm run seed && npm run dev`
2. `cd website && npm install && copy .env.example .env && npm run dev`
3. `cd admin-panel && npm install && copy .env.example .env && npm run dev`
4. `cd user-app && npm install && copy .env.example .env && npx expo start`

Add Razorpay test keys to `backend/.env` to enable checkout. See each folder's README for details.

