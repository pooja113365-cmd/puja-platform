import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return setError('Enter a valid 10-digit mobile number');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      await register(form);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="text-center text-3xl text-maroon-800">Create your account</h1>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label" htmlFor="name">Full name</label><input id="name" required minLength={2} className="input" value={form.name} onChange={set('name')} autoComplete="name" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" /></div>
        <div><label className="label" htmlFor="phone">Mobile</label><input id="phone" inputMode="numeric" maxLength={10} required className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={set('password')} autoComplete="new-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="text-center text-sm">Already registered? <Link to="/login" state={location.state} className="font-semibold text-saffron-600">Login</Link></p>
      </form>
    </div>
  );
}

