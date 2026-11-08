import { Navigate, Route, Routes } from 'react-router-dom';
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

export default function App() {
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

