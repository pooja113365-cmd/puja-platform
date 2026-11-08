import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../services/api';
import { closeSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    closeSocket();
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => !cancelled && setUser(res.data.data.user))
      .catch((err) => {
        // Only drop the session on auth failures, not on transient network errors.
        if (!cancelled && err.response?.status === 401) logout();
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', { ...payload, role: 'customer' });
    localStorage.setItem(TOKEN_KEY, res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

