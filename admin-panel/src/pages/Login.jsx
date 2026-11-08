import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import { GoldenDiyaEmblem } from '../components/Layout';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.local ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-maroon-800 to-saffron-600 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 border-gold-300/70 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <GoldenDiyaEmblem className="h-14 w-14" />
          <h1 className="mt-3 text-center text-2xl font-bold text-maroon-900">VedaPujas Ops &amp; Admin</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-saffron-600">Hyderabad Command Cockpit</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

