import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);
const STAFF = ['admin', 'ops'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const u = res.data.data.user;
        if (STAFF.includes(u.role)) setUser(u); else logout();
      })
      .catch((err) => { if (!cancelled && err.response?.status === 401) logout(); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    if (!STAFF.includes(u.role)) {
      const err = new Error('This portal is for admin and operations staff only.');
      err.local = true;
      throw err;
    }
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, isAdmin: user?.role === 'admin' }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

