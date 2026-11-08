import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="text-center text-3xl text-maroon-800">Welcome back</h1>
        {location.state?.from && <p className="text-center text-sm text-maroon-700">Please log in to continue.</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        <p className="text-center text-sm">New here? <Link to="/register" state={location.state} className="font-semibold text-saffron-600">Create an account</Link></p>
      </form>
    </div>
  );
}

