import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ServerCrash, Lock } from 'lucide-react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Pandits from './pages/Pandits';
import Pujas from './pages/Pujas';
import Samagri from './pages/Samagri';
import Muhurthams from './pages/Muhurthams';
import Disputes from './pages/Disputes';
import Revenue from './pages/Revenue';

function ServerLockOverlay() {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B0F19] px-4 select-none">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#111827] p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-400">
          <ServerCrash className="h-8 w-8" />
        </div>

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Service Suspended</span>
        </div>

        <h1 className="mt-2 text-xl font-bold leading-relaxed text-white sm:text-2xl">
          Your Server free tier is completed to upgrade please contact Owner
        </h1>
      </div>
    </div>
  );
}

export default function App() {
  // Lock screen until client clears payment — nothing else renders
  if (true) {
    return <ServerLockOverlay />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="pandits" element={<Pandits />} />
          <Route path="pujas" element={<Pujas />} />
          <Route path="samagri" element={<Samagri />} />
          <Route path="muhurthams" element={<Muhurthams />} />
          <Route path="disputes" element={<Disputes />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="revenue" element={<Revenue />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
