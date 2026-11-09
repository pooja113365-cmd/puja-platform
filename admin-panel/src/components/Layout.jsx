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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/pandits', label: 'Pandits', icon: Users },
  { to: '/pujas', label: 'Pujas Catalog', icon: Flame },
  { to: '/samagri', label: 'Samagri Kits', icon: Package },
  { to: '/muhurthams', label: 'Muhurtham Slots', icon: CalendarDays },
  { to: '/disputes', label: 'Disputes', icon: MessageSquareWarning },
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

export function GoldenDiyaEmblem({ className = 'h-11 w-11' }) {
  return (
    <img
      src="/images/ibn-logo.jpg"
      alt="IBN — GetPuja Admin Logo"
      className={`${className} shrink-0 rounded-full object-cover ring-2 ring-[#F7B928] shadow-md`}
    />
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
        <span className="h-8 w-[1px] shrink-0 bg-[#F7B928]/60" aria-hidden="true" />
        <div className="min-w-0">
          <div className="font-serif text-xl font-bold leading-tight tracking-wide text-white">
            Get<span className="text-[#F7B928]">Puja</span>
          </div>
          <div className="mt-0.5 text-xs font-medium tracking-wider text-cream-200/75">
            Admin Panel
          </div>
        </div>
      </div>

      <div className="space-y-1" onClick={() => setOpen(false)}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <button
        type="button"
        className="mt-auto flex w-full items-center gap-3 rounded-xl border border-maroon-600/80 bg-maroon-900/70 px-3.5 py-2.5 text-sm font-semibold text-cream-200 transition hover:border-saffron-400 hover:bg-maroon-800 hover:text-saffron-300"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>Logout</span>
      </button>
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
        {/* Mobile-only Hamburger Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/90 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <GoldenDiyaEmblem className="h-8 w-8" />
            <div>
              <div className="font-serif text-lg font-bold leading-tight text-maroon-900">
                Get<span className="text-saffron-600">Puja</span>
              </div>
              <div className="text-[11px] font-medium tracking-wider text-stone-500">
                Admin Panel
              </div>
            </div>
          </div>
          <button
            className="rounded-lg border border-stone-200 p-1.5 text-maroon-800"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet context={{ selectedHub, setSelectedHub }} />
        </main>
      </div>
    </div>
  );
}
