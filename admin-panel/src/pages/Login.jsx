import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import { GoldenDiyaEmblem } from '../components/Layout';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{
        background: 'radial-gradient(circle at 50% 25%, #4A154B 0%, #2D0A30 52%, #1A051C 100%)',
      }}
    >
      {/* Subtle Ambient Gold Glows */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #F7B928 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #F58216 0%, transparent 70%)' }}
      />

      {/* Royal Translucent Plum & Gold Card (No Thick Stark White Box) */}
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm space-y-5 rounded-3xl border border-[#F7B928]/40 bg-[#360D3A]/85 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <GoldenDiyaEmblem className="h-16 w-16" />
          <h1 className="mt-3.5 text-center font-serif text-2xl font-bold tracking-wide text-white">
            Get<span className="text-[#F7B928]">Puja</span>
          </h1>
          <p className="mt-0.5 text-xs font-medium tracking-widest text-cream-200/70">
            Admin Panel
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-950/60 p-3 text-center text-xs font-medium text-red-200"
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#F7B928]/90"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3 z-10 h-4 w-4 text-[#300B32]/70" />
              <input
                id="email"
                type="email"
                required
                placeholder="admin@getpuja.com"
                className="w-full rounded-xl border border-[#F7B928]/50 bg-white/95 py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#300B32] placeholder-stone-400 outline-none transition focus:border-[#F7B928] focus:bg-white focus:ring-2 focus:ring-[#F7B928]/35"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#F7B928]/90"
              htmlFor="pw"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3 z-10 h-4 w-4 text-[#300B32]/70" />
              <input
                id="pw"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#F7B928]/50 bg-white/95 py-2.5 pl-10 pr-10 text-sm font-medium text-[#300B32] placeholder-stone-400 outline-none transition focus:border-[#F7B928] focus:bg-white focus:ring-2 focus:ring-[#F7B928]/35"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-[#300B32]/80 transition hover:text-[#F58216]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          className="w-full rounded-xl bg-gradient-to-r from-[#F7B928] to-[#F58216] py-2.5 text-sm font-bold text-[#300B32] shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
