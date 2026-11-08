import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, MapPin, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HYDERABAD_LOCATIONS = [
  { label: 'Hyderabad (All Areas)', short: 'Hyderabad', area: '' },
  { label: 'Gachibowli & Financial Dist.', short: 'Gachibowli', area: 'Gachibowli' },
  { label: 'Madhapur & Hitech City', short: 'Madhapur', area: 'Madhapur' },
  { label: 'Kukatpally & KPHB', short: 'Kukatpally', area: 'Kukatpally' },
  { label: 'Jubilee Hills & Banjara Hills', short: 'Jubilee Hills', area: 'Jubilee Hills' },
  { label: 'Kondapur & Miyapur', short: 'Kondapur', area: 'Kondapur' },
  { label: 'Secunderabad & Bharat Nagar', short: 'Secunderabad', area: 'Secunderabad' },
  { label: 'Kompally & Alwal', short: 'Kompally', area: 'Kompally' },
  { label: 'Manikonda & Kokapet', short: 'Manikonda', area: 'Manikonda' },
  { label: 'Online e-Puja (Live Video)', short: 'Online e-Puja', area: 'Online' },
];

const TAGLINE_TEXT = 'Book • Shop • Perform • Receive';

function TypewriterTagline() {
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    if (!isDeleting && displayed.length < TAGLINE_TEXT.length) {
      timer = setTimeout(() => {
        setDisplayed(TAGLINE_TEXT.slice(0, displayed.length + 1));
      }, 65);
    } else if (!isDeleting && displayed.length === TAGLINE_TEXT.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2400);
    } else if (isDeleting && displayed.length > 0) {
      timer = setTimeout(() => {
        setDisplayed(TAGLINE_TEXT.slice(0, displayed.length - 1));
      }, 30);
    } else if (isDeleting && displayed.length === 0) {
      timer = setTimeout(() => {
        setIsDeleting(false);
      }, 350);
    }
    return () => clearTimeout(timer);
  }, [displayed, isDeleting]);

  return (
    <span className="flex h-3.5 min-w-[135px] items-center text-[9px] font-semibold tracking-wider text-white/95 sm:min-w-[168px] sm:text-[10px]">
      <span>{displayed}</span>
      <span className="ml-0.5 inline-block h-2.5 w-[1.5px] animate-pulse bg-[#F7B928]" />
    </span>
  );
}

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/pujas', label: 'Pujas & Homams' },
  { to: '/purohits', label: 'Verified Priests' },
];

export function GetPujaLotusLogo({ className = 'h-10 w-10' }) {
  return (
    <img
      src="/images/ibn-logo.jpg"
      alt="IBN — GetPuja Logo"
      className={`${className} shrink-0 rounded-full object-cover ring-2 ring-[#F7B928] shadow-md`}
    />
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(HYDERABAD_LOCATIONS[0]);
  const locRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutside(e) {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setLocOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelectLocation = (loc) => {
    setSelectedLoc(loc);
    setLocOpen(false);
    if (loc.area === 'Online') {
      navigate('/pujas?location=online');
    } else if (loc.area) {
      navigate(`/pujas?area=${encodeURIComponent(loc.area)}`);
    } else {
      navigate('/pujas');
    }
  };

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
    <header className="sticky top-0 z-40 border-b border-[#F7B928]/35 bg-[#300B32] shadow-lg backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <GetPujaLotusLogo className="h-9 w-9 sm:h-11 sm:w-11" />
            <span className="h-7 w-[1px] bg-[#F7B928]/60 sm:h-8" aria-hidden="true" />
            <div>
              <div className="font-serif text-xl font-bold leading-none tracking-tight text-white sm:text-2xl">
                Get<span className="text-[#F7B928]">Puja</span>
              </div>
              <div className="mt-0.5 sm:mt-1">
                <TypewriterTagline />
              </div>
            </div>
          </Link>

          {/* Interactive Location Dropdown (Visible on both Mobile & Desktop in same colors) */}
          <div className="relative" ref={locRef}>
            <button
              type="button"
              onClick={() => setLocOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-[#F7B928]/55 bg-[#3E1041]/80 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:border-[#F7B928] hover:bg-[#3E1041] sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-xs"
            >
              <MapPin className="h-3 w-3 shrink-0 text-[#F7B928] sm:h-3.5 sm:w-3.5" />
              <span className="max-w-[72px] truncate sm:max-w-none">{selectedLoc.short}</span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 text-[#F7B928] transition-transform duration-200 sm:h-3.5 sm:w-3.5 ${
                  locOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {locOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#F7B928]/60 bg-[#300B32] py-2 shadow-2xl ring-1 ring-black/40">
                <div className="border-b border-[#F7B928]/20 px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F7B928]">
                  Select Service Location
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {HYDERABAD_LOCATIONS.map((loc) => {
                    const active = selectedLoc.label === loc.label;
                    return (
                      <button
                        key={loc.label}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                          active
                            ? 'bg-[#F7B928]/20 font-bold text-[#F7B928]'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F7B928]" />
                          <span>{loc.label}</span>
                        </span>
                        {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#F7B928]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
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
              <span className="flex items-center gap-1 rounded-full border border-[#F7B928]/40 bg-white/10 px-3 py-1 text-xs font-semibold text-[#F7B928]">
                <User className="h-3.5 w-3.5" />
                {(user.name || 'Devotee').split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-medium text-white/90 hover:text-[#F7B928]"
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
              <Link
                to="/pujas"
                className="rounded-xl bg-gradient-to-b from-[#F7B928] to-[#F58216] px-5 py-2 text-xs font-extrabold text-[#300B32] shadow-md transition hover:brightness-105 active:scale-[0.98]"
              >
                Book a Puja
              </Link>
            </>
          )}
        </nav>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div
          className="flex flex-col gap-3 border-t border-[#F7B928]/30 bg-[#300B32] px-6 py-4 md:hidden"
        >
          <div className="mb-1">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F7B928]">
              Service Location (Hyderabad)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HYDERABAD_LOCATIONS.slice(0, 6).map((loc) => (
                <button
                  key={loc.label}
                  type="button"
                  onClick={() => {
                    handleSelectLocation(loc);
                    setOpen(false);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    selectedLoc.label === loc.label
                      ? 'border-[#F7B928] bg-[#F7B928] text-[#300B32]'
                      : 'border-[#F7B928]/40 text-white/90'
                  }`}
                >
                  {loc.short}
                </button>
              ))}
            </div>
          </div>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/bookings" className={cls} onClick={() => setOpen(false)}>
                My Bookings
              </NavLink>
              <button onClick={handleLogout} className="text-left text-sm text-white">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={cls} onClick={() => setOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" className={cls} onClick={() => setOpen(false)}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
