# Puja Platform – Customer Mobile App

Expo SDK 52 · TypeScript · Expo Router · NativeWind v4 · AsyncStorage · Socket.io · Razorpay Checkout (WebView)

## Setup
```bash
cd user-app
npm install
cp .env.example .env     # Windows: copy .env.example .env
npx expo start           # press a (Android) / i (iOS) or scan the QR with Expo Go
npm run typecheck
```
Set `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` in `.env`:
- Android emulator: `http://10.0.2.2:5000`
- iOS simulator: `http://localhost:5000`
- Physical device: `http://<your-computer-LAN-IP>:5000`

The backend must be running with Razorpay test keys configured.

## Features
- Login / register with persisted session (AsyncStorage), automatic redirect on expired session
- Home, puja catalog with search + category chips, puja details with samagri checklist
- Booking flow: package → date, muhurtham slot & language → home/temple/online + address + samagri kit → auto-match or choose purohit → Razorpay payment
- Booking history with pull-to-refresh, live tracking of status and purohit assignment (Socket.io), cancel, pay balance, review

## Structure
`app/` (Expo Router routes, thin re-exports) · `src/screens` · `src/components` · `src/context` · `src/services` · `src/hooks` · `src/utils` · `src/types`

> Payments use Razorpay Checkout inside a WebView so the app works in Expo Go. For UPI-intent app switching in production, move to `react-native-razorpay` with an Expo development build.

