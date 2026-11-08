import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { loadStoredToken, onUnauthorized, setAuthToken } from '../services/api';
import { closeSocket } from '../services/socket';
import type { SavedAddress, User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (p: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  updateProfile: (patch: { name?: string; phone?: string; addresses?: SavedAddress[] }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    closeSocket();
    await setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(() => { closeSocket(); setUser(null); });
    return () => onUnauthorized(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await loadStoredToken();
        if (!token) return;
        const res = await api.get('/auth/me');
        const u: User = res.data.data.user;
        if (!cancelled) {
          if (u.role === 'customer') setUser(u);
          else await logout();
        }
      } catch {
        // 401 is handled by the interceptor; network errors keep the user logged out for this session only.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [logout]);

  const finish = useCallback(async (data: { token: string; user: User }) => {
    if (data.user.role !== 'customer') {
      throw new Error('This app is for customers. Please use the admin panel or purohit tools.');
    }
    await setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email: email.trim(), password });
    await finish(res.data.data);
  }, [finish]);

  const register = useCallback(async (p: { name: string; email: string; phone: string; password: string }) => {
    const res = await api.post('/auth/register', { ...p, role: 'customer' });
    await finish(res.data.data);
  }, [finish]);

  const updateProfile = useCallback(async (patch: { name?: string; phone?: string; addresses?: SavedAddress[] }) => {
    const res = await api.patch('/auth/me', patch);
    setUser(res.data.data.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, updateProfile, logout }),
    [user, loading, login, register, updateProfile, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
