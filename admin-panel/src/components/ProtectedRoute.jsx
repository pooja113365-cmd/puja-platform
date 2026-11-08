import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, EmptyState } from './States';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <EmptyState title="Access restricted" message="Your role does not have permission to view this page." />;
  }
  return <Outlet />;
}

