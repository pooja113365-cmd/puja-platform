import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/pujas', label: 'Pujas & Homams' },
  { to: '/purohits', label: 'Verified Priests' },
];

export function GetPujaLotusLogo({ className = 'h-9 w-9' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`${className} shrink-0 drop-shadow`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill="url(#gpBg)" stroke="#F5C451" strokeWidth="1.6" />
      {/* Center Lotus Petal */}
      <path
        d="M24 9C24 9 30 16.5 30 22.5C30 26.5 27.3 29.5 24 29.5C20.7 29.5 18 26.5 18 22.5C18 16.5 24 9 24 9Z"
        fill="url(#gpGold)"
        stroke="#FEF08A"
        strokeWidth="1"
      />
      {/* Left & Right Lotus Petals */}
      <path
        d="M17.5 15.5C13 17.5 10.5 22 12 26.5C14.5 28 18 27.5 19.5 25C17.8 22 17.2 18.5 17.5 15.5Z"
        fill="url(#gpGold)"
        opacity="0.9"
      />
      <path
        d="M30.5 15.5C35 17.5 37.5 22 36 26.5C33.5 28 30 27.5 28.5 25C30.2 22 30.8 18.5 30.5 15.5Z"
        fill="url(#gpGold)"
        opacity="0.9"
      />
      {/* Base Diya Bowl */}
      <path
        d="M13 31.5H35L32.5 36.5C30.8 38.5 27.6 39.5 24 39.5C20.4 39.5 17.2 38.5 15.5 36.5L13 31.5Z"
        fill="#F59E0B"
        stroke="#FDE68A"
        strokeWidth="1"
      />
      <defs>
        <linearGradient id="gpBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A1259" />
          <stop offset="0.5" stopColor="#6B1D1D" />
          <stop offset="1" stopColor="#2E0938" />
        </linearGradient>
        <linearGradient id="gpGold" x1="24" y1="9" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="0.55" stopColor="#F5C451" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const cls = ({ isActive }) =>
    `text-sm font-semibold transition hover:text-gold-300 ${
      isActive ? 'text-gold-300 underline decoration-gold-400 decoration-2 underline-offset-8' : 'text-cream-100'
    }`;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/35 bg-gradient-to-r from-[#2E0938] via-maroon-900 to-[#2E0938] shadow-lg backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <GetPujaLotusLogo />
          <div>
            <div className="font-serif text-2xl font-bold tracking-tight text-white">
              Get<span className="text-gold-400">Puja</span>
              <span className="text-lg font-sans font-semibold text-cream-200">.com</span>
            </div>
            <span className="block text-[10px] font-semibold tracking-wider text-gold-300">
              Book • Shop • Perform • Receive
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <span className="inline-flex items-center gap-1 rounded-full border border-gold-400/40 bg-white/10 px-3 py-1 text-xs font-semibold text-gold-300">
            <MapPin className="h-3.5 w-3.5 text-saffron-400" /> Hyderabad
          </span>

          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
              {l.label}
            </NavLink>
          ))}

          {user ? (
            <>
              <NavLink to="/bookings" className={cls}>
                My Bookings
              </NavLink>
              <span className="flex items-center gap-1 rounded-full border border-gold-400/40 bg-maroon-700/80 px-3 py-1 text-xs font-semibold text-gold-300">
                <User className="h-3.5 w-3.5" />
                {(user.name || 'Devotee').split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-medium text-cream-200 hover:text-saffron-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={cls}>
                Login
              </NavLink>
              <Link to="/pujas" className="btn-primary !py-2 !px-4 text-xs">
                Book a Puja
              </Link>
            </>
          )}
        </nav>

        <button
          className="text-cream-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div
          className="flex flex-col gap-3 border-t border-maroon-700 bg-maroon-900 px-6 py-4 md:hidden"
          onClick={() => setOpen(false)}
        >
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/bookings" className={cls}>
                My Bookings
              </NavLink>
              <button onClick={handleLogout} className="text-left text-sm text-cream-100">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={cls}>
                Login
              </NavLink>
              <NavLink to="/register" className={cls}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
