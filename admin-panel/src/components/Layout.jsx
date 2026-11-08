import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flame,
  Package,
  CalendarDays,
  ClipboardList,
  IndianRupee,
  MessageSquareWarning,
  LogOut,
  Menu,
  X,
  MapPin,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Ops Overview', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'CRM Bookings', icon: ClipboardList },
  { to: '/pandits', label: 'Pandit KYC Desk', icon: Users },
  { to: '/pujas', label: 'Pujas Catalog', icon: Flame },
  { to: '/samagri', label: 'Samagri Kits', icon: Package },
  { to: '/muhurthams', label: 'Muhurtham Slots', icon: CalendarDays },
  { to: '/disputes', label: 'Disputes & SLA', icon: MessageSquareWarning },
  { to: '/revenue', label: 'Revenue & Payouts', icon: IndianRupee, roles: ['admin'] },
];

export const HYDERABAD_HUBS = [
  { value: '', label: 'All Hyderabad Hubs ▾' },
  { value: 'Gachibowli', label: '📍 Gachibowli & Financial Dist.' },
  { value: 'Kukatpally', label: '📍 Kukatpally & Miyapur' },
  { value: 'Madhapur', label: '📍 Madhapur & Hitec City' },
  { value: 'Jubilee Hills', label: '📍 Jubilee Hills & Banjara Hills' },
  { value: 'Secunderabad', label: '📍 Secunderabad & Kompally' },
];

export function GoldenDiyaEmblem({ className = 'h-10 w-10' }) {
  return (
    <svg
      viewBox="0 0 44 44"
      className={`${className} shrink-0 drop-shadow`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="21" fill="url(#adminKalashBg)" stroke="#F5C451" strokeWidth="1.5" />
      <path
        d="M22 6.5C22 6.5 26.2 11.2 26.2 14.4C26.2 16.8 24.3 18.6 22 18.6C19.7 18.6 17.8 16.8 17.8 14.4C17.8 11.2 22 6.5 22 6.5Z"
        fill="url(#adminFlameGrad)"
      />
      <path
        d="M22 10.2C22 10.2 24.1 12.7 24.1 14.5C24.1 15.7 23.2 16.7 22 16.7C20.8 16.7 19.9 15.7 19.9 14.5C19.9 12.7 22 10.2 22 10.2Z"
        fill="#FFFBEB"
      />
      <path d="M16 20.5C13.2 18.5 11.5 19.5 10.8 21.5C13.2 22.2 15.2 21.8 16 20.5Z" fill="#34D399" />
      <path d="M28 20.5C30.8 18.5 32.5 19.5 33.2 21.5C30.8 22.2 28.8 21.8 28 20.5Z" fill="#34D399" />
      <rect x="15.5" y="19.5" width="13" height="2.4" rx="1.2" fill="#F5C451" />
      <path
        d="M14.5 22.2H29.5L31.2 28.5C31.8 31.8 28.2 35.2 22 35.2C15.8 35.2 12.2 31.8 12.8 28.5L14.5 22.2Z"
        fill="url(#adminPotGrad)"
        stroke="#FDE68A"
        strokeWidth="0.9"
      />
      <path d="M18.5 27.5H25.5M22 24.5V30.5" stroke="#7C1D1D" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="16.5" y="35.3" width="11" height="2" rx="1" fill="#D4A017" />
      <defs>
        <linearGradient id="adminKalashBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6B1D1D" />
          <stop offset="1" stopColor="#2A0808" />
        </linearGradient>
        <linearGradient id="adminFlameGrad" x1="22" y1="6.5" x2="22" y2="18.6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="0.55" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="adminPotGrad" x1="13" y1="22" x2="31" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState('');
  const navigate = useNavigate();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm ring-1 ring-gold-300/50'
        : 'text-cream-200/90 hover:bg-maroon-700/80 hover:text-white'
    }`;

  const sidebar = (
    <nav className="flex h-full flex-col border-r border-gold-400/25 bg-gradient-to-b from-maroon-900 via-maroon-800 to-maroon-900 p-4 text-cream-100">
      <div className="mb-6 flex items-center gap-3 border-b border-maroon-700/80 px-1.5 pb-4">
        <GoldenDiyaEmblem />
        <div className="min-w-0">
          <div className="font-serif text-lg font-bold leading-tight tracking-wide text-cream-100">
            VedaPujas Ops &amp; Admin
          </div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
            Hyderabad Command Cockpit
          </div>
        </div>
      </div>

      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gold-300/75">
        Operations Modules
      </div>
      <div className="space-y-1" onClick={() => setOpen(false)}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto rounded-xl border border-gold-400/30 bg-maroon-900/70 p-3.5 text-sm text-cream-200">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-cream-100">{user.name}</p>
            <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gold-300">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> {user.role} Desk
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-maroon-600 bg-maroon-800 px-2.5 py-1.5 text-xs font-semibold text-cream-200 transition hover:border-saffron-400 hover:text-saffron-300"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-stone-50" style={{ backgroundColor: '#FAF9F6' }}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col bg-stone-50" style={{ backgroundColor: '#FAF9F6' }}>
        {/* Persistent Top Operations Header Bar with Locality Hub Filter */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/90 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-stone-200 p-1.5 text-maroon-800 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Dispatch Active
              </span>
              <span className="hidden items-center gap-1 text-xs font-medium text-stone-600 lg:inline-flex">
                <Radio className="h-3.5 w-3.5 text-saffron-600" />
                GHMC &amp; Cyberabad Ritual Operations
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-xs font-bold uppercase tracking-wider text-maroon-800 sm:inline-flex">
                <MapPin className="h-3.5 w-3.5 text-saffron-600" /> Locality Hub:
              </span>
              <select
                aria-label="Locality Hub Filter"
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="cursor-pointer rounded-xl border border-amber-300/90 bg-amber-50/60 px-3.5 py-1.5 text-xs font-bold text-maroon-900 shadow-sm transition hover:border-saffron-500 focus:border-saffron-500 focus:outline-none"
              >
                {HYDERABAD_HUBS.map((h) => (
                  <option key={h.label} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedHub && (
              <button
                type="button"
                onClick={() => setSelectedHub('')}
                className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-maroon-800 hover:bg-stone-200"
              >
                Clear Hub ({selectedHub}) ✕
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet context={{ selectedHub, setSelectedHub }} />
        </main>
      </div>
    </div>
  );
}
