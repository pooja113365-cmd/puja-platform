import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { BookingModalProvider } from './context/BookingModalContext';
import Home from './pages/Home';
import Pujas from './pages/Pujas';
import PujaDetail from './pages/PujaDetail';
import Purohits from './pages/Purohits';
import PanditDetail from './pages/PanditDetail';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/919858945678?text=Namaste%20GetPuja.com%2C%20I%20want%20to%20book%20a%20Puja"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp Support"
        title="Chat on WhatsApp (+91 9858945678)"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-white/80 transition-all duration-200 hover:-translate-y-1 hover:bg-[#1EBE5D] hover:shadow-2xl active:scale-95"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
          <path d="M16.01 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.71 6.41L3.1 28.8l6.58-1.72a12.74 12.74 0 0 0 6.33 1.68h.01c7.06 0 12.79-5.73 12.79-12.8 0-3.42-1.33-6.64-3.75-9.05A12.72 12.72 0 0 0 16.01 3.2zm0 23.4h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9.99 1.04-3.8-.25-.4a10.58 10.58 0 0 1-1.63-5.68c0-5.85 4.76-10.61 10.62-10.61 2.83 0 5.5 1.1 7.5 3.11a10.54 10.54 0 0 1 3.11 7.5c0 5.86-4.76 10.6-10.69 10.6zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.83.76.33 1.36.53 1.82.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37z" />
        </svg>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BookingModalProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="pujas" element={<Pujas />} />
          <Route path="pujas/:id" element={<PujaDetail />} />
          <Route path="purohits" element={<Purohits />} />
          <Route path="purohits/:id" element={<PanditDetail />} />
          <Route path="book/:pujaId" element={<Booking />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BookingModalProvider>
  );
}

