import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

function CornerMandala({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="92" stroke="#F7B928" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.55" />
      <circle cx="100" cy="100" r="76" stroke="#F58216" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="58" stroke="#F7B928" strokeWidth="1.2" opacity="0.6" />
      <circle cx="100" cy="100" r="38" stroke="#F7B928" strokeWidth="1.5" opacity="0.65" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = i * 22.5;
        return (
          <g key={i} transform={`rotate(${angle} 100 100)`}>
            <path
              d="M100 10 C108 32, 112 48, 100 62 C88 48, 92 32, 100 10 Z"
              stroke="#F7B928"
              strokeWidth="1.1"
              fill="#F58216"
              fillOpacity="0.12"
            />
            <circle cx="100" cy="20" r="2.2" fill="#F7B928" opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
}

function HangingDiyaPair({ side = 'left' }) {
  const isLeft = side === 'left';
  return (
    <svg
      viewBox="0 0 180 260"
      className={`pointer-events-none absolute top-0 hidden h-56 w-44 select-none sm:block lg:h-64 lg:w-48 ${
        isLeft ? 'left-6 lg:left-16' : 'right-6 lg:right-16'
      }`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`flameGlow-${side}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF6B3" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#F7B928" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F58216" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`brassBowl-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE07D" />
          <stop offset="50%" stopColor="#D98A16" />
          <stop offset="100%" stopColor="#7C4205" />
        </linearGradient>
      </defs>

      {/* First Hanging Diya (Longer Chain) */}
      <g transform={isLeft ? 'translate(45, 0)' : 'translate(115, 0)'}>
        <line x1="0" y1="0" x2="0" y2="165" stroke="#F7B928" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="0" cy="148" r="28" fill={`url(#flameGlow-${side})`} />
        <path d="M0 128 C-7 140, -8 152, 0 160 C8 152, 7 140, 0 128 Z" fill="#FFA812" />
        <path d="M0 134 C-4 142, -4 150, 0 157 C4 150, 4 142, 0 134 Z" fill="#FFF9C4" />
        <path
          d="M-26 162 Q0 156 26 162 C22 180, 12 188, 0 188 C-12 188, -22 180, -26 162 Z"
          fill={`url(#brassBowl-${side})`}
          stroke="#FFE07D"
          strokeWidth="1"
        />
        <ellipse cx="0" cy="190" rx="11" ry="3" fill="#B66B0E" />
      </g>

      {/* Second Hanging Diya (Shorter Chain) */}
      <g transform={isLeft ? 'translate(115, 0)' : 'translate(45, 0)'}>
        <line x1="0" y1="0" x2="0" y2="120" stroke="#F7B928" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="0" cy="104" r="26" fill={`url(#flameGlow-${side})`} />
        <path d="M0 86 C-6 96, -7 107, 0 115 C7 107, 6 96, 0 86 Z" fill="#FFA812" />
        <path d="M0 92 C-3.5 99, -3.5 106, 0 112 C3.5 106, 3.5 99, 0 92 Z" fill="#FFF9C4" />
        <path
          d="M-24 117 Q0 111 24 117 C20 133, 10 140, 0 140 C-10 140, -20 133, -24 117 Z"
          fill={`url(#brassBowl-${side})`}
          stroke="#FFE07D"
          strokeWidth="1"
        />
        <ellipse cx="0" cy="142" rx="10" ry="2.8" fill="#B66B0E" />
      </g>
    </svg>
  );
}

function SacredKalashScene() {
  return (
    <svg
      viewBox="0 0 320 260"
      className="pointer-events-none absolute bottom-2 left-2 hidden h-52 w-64 select-none md:block lg:left-8 lg:h-64 lg:w-80"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="kalashPotGrad" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF099" />
          <stop offset="35%" stopColor="#F5A623" />
          <stop offset="75%" stopColor="#B45B08" />
          <stop offset="100%" stopColor="#682E02" />
        </radialGradient>
        <radialGradient id="diyaStandGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF6B3" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F7B928" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#F58216" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Base Shadow */}
      <ellipse cx="155" cy="238" rx="135" ry="14" fill="#18041A" opacity="0.55" />

      {/* Standing Brass Lamp (Left) */}
      <g transform="translate(65, 115)">
        <circle cx="0" cy="22" r="34" fill="url(#diyaStandGlow)" />
        <path d="M0 -4 C-8 10, -8 24, 0 34 C8 24, 8 10, 0 -4 Z" fill="#FF9E0D" />
        <path d="M0 5 C-4 15, -4 24, 0 31 C4 24, 4 15, 0 5 Z" fill="#FFFBD1" />
        {/* Bowl */}
        <path d="M-32 35 Q0 28 32 35 C26 52, 14 58, 0 58 C-14 58, -26 52, -32 35 Z" fill="url(#kalashPotGrad)" stroke="#FDE08D" strokeWidth="1" />
        {/* Stem & Base */}
        <rect x="-5" y="57" width="10" height="36" rx="3" fill="url(#kalashPotGrad)" />
        <ellipse cx="0" cy="75" rx="11" ry="4" fill="#D98A16" />
        <path d="M-24 108 L24 108 L16 92 L-16 92 Z" fill="url(#kalashPotGrad)" stroke="#FDE08D" strokeWidth="0.8" />
        <ellipse cx="0" cy="110" rx="28" ry="5" fill="#8C4806" />
      </g>

      {/* Sacred Kalash with Coconut & Mango Leaves (Center-Right) */}
      <g transform="translate(175, 65)">
        {/* Mango Leaves */}
        <path d="M0 62 C-38 40, -52 12, -38 -4 C-22 10, -12 36, 0 62 Z" fill="#2E8B3C" stroke="#53B863" strokeWidth="1" />
        <path d="M0 62 C38 40, 52 12, 38 -4 C22 10, 12 36, 0 62 Z" fill="#2E8B3C" stroke="#53B863" strokeWidth="1" />
        <path d="M-12 65 C-32 52, -55 44, -60 28 C-40 30, -24 46, -12 65 Z" fill="#236E2E" />
        <path d="M12 65 C32 52, 55 44, 60 28 C40 30, 24 46, 12 65 Z" fill="#236E2E" />

        {/* Sacred Coconut */}
        <path d="M0 -8 C-22 12, -26 42, 0 58 C26 42, 22 12, 0 -8 Z" fill="#8B4C19" stroke="#B66E32" strokeWidth="1.2" />
        <path d="M-6 4 C-14 22, -12 42, 0 54" stroke="#63320B" strokeWidth="1.5" fill="none" />
        <path d="M6 4 C14 22, 12 42, 0 54" stroke="#63320B" strokeWidth="1.5" fill="none" />

        {/* Kalash Neck & Rim */}
        <ellipse cx="0" cy="60" rx="32" ry="7" fill="url(#kalashPotGrad)" stroke="#FFE494" strokeWidth="1.2" />
        <rect x="-24" y="60" width="48" height="14" rx="4" fill="#B8640B" />

        {/* Kalash Pot Body */}
        <path
          d="M-26 72 C-62 92, -64 145, -24 162 L24 162 C64 145, 62 92, 26 72 Z"
          fill="url(#kalashPotGrad)"
          stroke="#FFE494"
          strokeWidth="1.2"
        />
        {/* Red Kumkum Swastika / Om Symbol on Kalash */}
        <text
          x="0"
          y="128"
          textAnchor="middle"
          fill="#B91C1C"
          fontSize="34"
          fontWeight="bold"
          fontFamily="serif"
        >
          ॐ
        </text>
        {/* Base Ring */}
        <ellipse cx="0" cy="164" rx="30" ry="6" fill="#9E5006" stroke="#F7B928" strokeWidth="1" />
      </g>

      {/* Marigold & Rose Blossoms at Base */}
      {[
        { cx: 108, cy: 224, r: 12, fill: '#F59E0B', inner: '#D97706' },
        { cx: 132, cy: 230, r: 11, fill: '#E11D48', inner: '#9F1239' },
        { cx: 215, cy: 228, r: 12, fill: '#FBBF24', inner: '#D97706' },
        { cx: 238, cy: 222, r: 13, fill: '#E11D48', inner: '#881337' },
        { cx: 262, cy: 228, r: 11, fill: '#F59E0B', inner: '#B45309' },
        { cx: 42, cy: 226, r: 11, fill: '#FBBF24', inner: '#B45309' },
      ].map((fl, idx) => (
        <g key={idx}>
          <circle cx={fl.cx} cy={fl.cy} r={fl.r} fill={fl.fill} opacity="0.95" />
          <circle cx={fl.cx} cy={fl.cy} r={fl.r * 0.55} fill={fl.inner} />
          <circle cx={fl.cx} cy={fl.cy} r={fl.r * 0.25} fill="#FEF08A" />
        </g>
      ))}
    </svg>
  );
}

function TempleGopuramSilhouette() {
  return (
    <svg
      viewBox="0 0 380 340"
      className="pointer-events-none absolute bottom-0 right-0 hidden h-72 w-80 select-none opacity-65 md:block lg:h-80 lg:w-96"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="templeGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F7B928" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#C86D18" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#4A1525" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Warm Temple Sunset Aura */}
      <circle cx="220" cy="190" r="135" fill="#F58216" opacity="0.18" />

      {/* Palm Trees Left of Gopuram */}
      <g transform="translate(82, 185)" opacity="0.55" fill="#3B1028">
        <path d="M18 110 Q14 55 10 15 L14 15 Q20 55 23 110 Z" />
        <path d="M12 16 Q-12 6 -24 20 Q-6 16 12 18 Z" />
        <path d="M12 16 Q-8 -4 -20 2 Q-2 6 12 16 Z" />
        <path d="M12 16 Q16 -6 34 4 Q20 8 12 16 Z" />
        <path d="M12 16 Q26 8 38 22 Q22 16 12 18 Z" />
      </g>

      {/* Stepped South Indian Gopuram Tower */}
      <g fill="url(#templeGoldGrad)" stroke="#F7B928" strokeWidth="0.7" strokeOpacity="0.45">
        {/* Top Kalasham Finials */}
        <circle cx="205" cy="44" r="3" fill="#FFE07D" />
        <circle cx="220" cy="42" r="3.5" fill="#FFE07D" />
        <circle cx="235" cy="44" r="3" fill="#FFE07D" />
        <path d="M192 60 Q220 42 248 60 Z" />

        {/* Tier 1 */}
        <rect x="188" y="60" width="64" height="22" rx="2" />
        {/* Tier 2 */}
        <polygon points="178,82 262,82 268,106 172,106" />
        {/* Tier 3 */}
        <polygon points="168,108 272,108 279,136 161,136" />
        {/* Tier 4 */}
        <polygon points="156,138 284,138 292,170 148,170" />
        {/* Tier 5 */}
        <polygon points="144,172 296,172 305,208 135,208" />
        {/* Base Mandapam Wall */}
        <rect x="115" y="210" width="210" height="75" />
        {/* Carved Temple Pillars & Archways */}
        {[135, 160, 185, 210, 235, 260, 285].map((x) => (
          <rect key={x} x={x} y="222" width="12" height="50" rx="6" fill="#2E0B26" opacity="0.55" />
        ))}
      </g>
    </svg>
  );
}

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background:
          'radial-gradient(circle at 50% 55%, rgba(245, 130, 22, 0.25) 0%, transparent 55%), linear-gradient(180deg, #300B32 0%, #3E1038 45%, #5C1A24 80%, #3B0E1D 100%)',
      }}
    >
      {/* Corner Mandalas */}
      <CornerMandala className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 opacity-45" />
      <CornerMandala className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 opacity-45" />
      <CornerMandala className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 opacity-45" />

      {/* Hanging Golden Diyas (Left & Right) */}
      <HangingDiyaPair side="left" />
      <HangingDiyaPair side="right" />

      {/* Bottom-Left Sacred Kalash, Standing Diya & Marigolds */}
      <SacredKalashScene />

      {/* Bottom-Right Temple Gopuram Architecture */}
      <TempleGopuramSilhouette />

      {/* Center Ivory Devotional Login Card (#FFF8ED, 24px radius, Gold Border) */}
      <div className="relative z-10 mt-8 w-full max-w-[420px]">
        {/* Overlapping Top Circular IBN Logo */}
        <div className="absolute -top-11 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-full bg-gradient-to-b from-[#FFE58F] via-[#F7B928] to-[#C97B10] p-1 shadow-[0_0_28px_rgba(247,185,40,0.65)]">
            <img
              src="/images/ibn-logo.jpg"
              alt="IBN — GetPuja Admin Logo"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-[#300B32]"
            />
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{ backgroundColor: '#FFF8ED', borderRadius: '24px' }}
          className="relative overflow-hidden border-2 border-[#F7B928] px-7 pb-6 pt-12 shadow-[0_24px_65px_rgba(0,0,0,0.55),0_0_30px_rgba(247,185,40,0.2)] sm:px-9"
        >
          {/* Inner Subtle Gold Frame Border */}
          <div
            className="pointer-events-none absolute inset-1.5 rounded-[19px] border border-[#F7B928]/45"
            aria-hidden="true"
          />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#300B32]">
              Get<span className="text-[#F58216]">Puja</span>
            </h1>

            {/* Dedicated Admin Panel Badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#F7B928]/80 bg-gradient-to-r from-[#FDE7B6] via-[#FAD78C] to-[#FDE7B6] px-4 py-1 text-xs font-bold text-[#4A192C] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-[#5B1A32]" />
              <span>Admin Panel</span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-[#EED9B3]" />

          {/* Section Heading */}
          <div className="text-center">
            <h2 className="font-serif text-xl font-bold text-[#300B32]">Admin Login</h2>
            <p className="mt-0.5 text-xs text-[#5E4352]">
              Access and manage the GetPuja platform
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-300 bg-red-50 p-2.5 text-center text-xs font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          {/* Form Fields */}
          <div className="mt-4 space-y-3.5">
            <div>
              <label
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#300B32]"
                htmlFor="email"
              >
                <Mail className="h-3.5 w-3.5 text-[#5B1A32]" />
                <span>Email</span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="admin@getpuja.com"
                className="w-full rounded-xl border border-[#D5DCE6] bg-[#EEF3FA] px-3.5 py-2.5 text-sm font-medium text-[#23192D] placeholder-[#8A8194] outline-none transition focus:border-[#F58216] focus:bg-white focus:ring-2 focus:ring-[#F7B928]/35"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#300B32]"
                htmlFor="pw"
              >
                <Lock className="h-3.5 w-3.5 text-[#5B1A32]" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  id="pw"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-[#D5DCE6] bg-[#EEF3FA] py-2.5 pl-3.5 pr-10 text-sm font-medium text-[#23192D] placeholder-[#8A8194] outline-none transition focus:border-[#F58216] focus:bg-white focus:ring-2 focus:ring-[#F7B928]/35"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#300B32] transition hover:text-[#F58216]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Prominent Orange Sign In Button */}
          <button
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F7941D] via-[#F58216] to-[#E2630A] py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(245,130,22,0.45)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
            disabled={busy}
          >
            <LogIn className="h-4 w-4" />
            <span>{busy ? 'Signing in…' : 'Sign In'}</span>
          </button>

          {/* Subtle Lotus Motif at Bottom */}
          <div className="mt-4 flex justify-center">
            <svg viewBox="0 0 64 32" className="h-5 w-10 text-[#E5B85B]" fill="none" aria-hidden="true">
              <path
                d="M32 4 C27 12, 26 20, 32 26 C38 20, 37 12, 32 4 Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M32 26 C22 24, 16 17, 18 10 C24 13, 28 19, 32 26 Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M32 26 C42 24, 48 17, 46 10 C40 13, 36 19, 32 26 Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M32 26 C18 27, 10 22, 8 16 C16 17, 23 22, 32 26 Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M32 26 C46 27, 54 22, 56 16 C48 17, 41 22, 32 26 Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          </div>
        </form>

        {/* Bottom Center Gold Sparkle Glow */}
        <div
          className="pointer-events-none mx-auto -mt-2 h-3 w-36 rounded-full bg-[#F7B928] opacity-70 blur-md"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
