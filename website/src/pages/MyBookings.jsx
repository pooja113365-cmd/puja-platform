import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Sparkles, PhoneCall } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { CatalogGridSkeleton, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, fmtDate, STATUS_META, LOCATION_LABEL } from '../utils/format';

function SacredKalashIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="mx-auto mb-4 h-28 w-28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="56" fill="url(#emptyGlow)" stroke="#D4A017" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="60" cy="60" r="42" fill="#FFF8E7" stroke="#F5C451" strokeWidth="1.2" />
      {/* Sacred Diya & Flame */}
      <path
        d="M60 22C60 22 69 32 69 39C69 44.5 65 48.5 60 48.5C55 48.5 51 44.5 51 39C51 32 60 22 60 22Z"
        fill="url(#emptyFlame)"
      />
      {/* Mango Leaves */}
      <path d="M46 53C38 48 33 50 31 56C38 58 43 56 46 53Z" fill="#10B981" />
      <path d="M74 53C82 48 87 50 89 56C82 58 77 56 74 53Z" fill="#10B981" />
      {/* Kalash Vessel */}
      <rect x="44" y="50" width="32" height="5" rx="2.5" fill="#D4A017" />
      <path
        d="M41 56H79L83 72C85 81 76 90 60 90C44 90 35 81 37 72L41 56Z"
        fill="url(#emptyPot)"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <path d="M52 71H68M60 63V79" stroke="#6B1D1D" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="46" y="91" width="28" height="4" rx="2" fill="#B45309" />
      <defs>
        <radialGradient id="emptyGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(56)">
          <stop stopColor="#FEF3C7" />
          <stop offset="1" stopColor="#FFFDF7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emptyFlame" x1="60" y1="22" x2="60" y2="48.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.6" stopColor="#F97316" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="emptyPot" x1="37" y1="56" x2="83" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function MyBookings() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch('/bookings', { page, limit: 8 });

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-saffron-700">
            <Sparkles className="h-3.5 w-3.5" /> Devotee Sankalpam Dashboard
          </span>
          <h1 className="mt-2 font-serif text-4xl font-bold text-maroon-900">My Puja Bookings</h1>
          <p className="mt-1 text-sm text-maroon-700/80">
            Track live Purohit assignment, download Vedic receipts, or reschedule your Muhurtham.
          </p>
        </div>
        <Link to="/pujas" className="btn-primary !py-2.5 text-xs">
          + Book New Puja
        </Link>
      </div>

      {loading && (
        <div className="mt-8">
          <CatalogGridSkeleton count={3} />
        </div>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          illustration={<SacredKalashIllustration />}
          title="Begin Your Sacred Vedic Journey"
          message="You haven’t scheduled a Puja or Homam yet. Book a certified Veda Patasala Scholar in Hyderabad for Griha Pravesh, Satyanarayan Vrat, Rudrabhishek, or Navagraha Shanti with doorstep Samagri."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/pujas" className="btn-primary !px-6 !py-3">
                Explore Sacred Pujas
              </Link>
              <a
                href="https://wa.me/919000000001"
                target="_blank"
                rel="noreferrer"
                className="btn-outline !px-5 !py-3"
              >
                <PhoneCall className="h-4 w-4 text-emerald-700" /> Ask Muhurtham Desk
              </a>
            </div>
          }
        />
      )}

      {data && data.length > 0 && (
        <>
          <ul className="mt-6 space-y-4">
            {data.map((b) => (
              <motion.li
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
              >
                <Link
                  to={`/bookings/${b._id}`}
                  className="card flex flex-col gap-3 border-gold-300/80 p-5 transition hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl font-bold text-maroon-900">{b.puja?.name}</h3>
                      <StatusBadge status={b.status} meta={STATUS_META} />
                      <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-semibold text-maroon-800">
                        {b.tierName} Package
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 text-sm text-maroon-700">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-saffron-600" />
                        {fmtDate(b.date)} · {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-saffron-600" />
                        {LOCATION_LABEL[b.locationType]}
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-maroon-700/75">
                      Booking #{b.bookingNumber}
                      {b.pandit?.user?.name
                        ? ` · Assigned Scholar: ${b.pandit.user.name} (✓ Veda Patasala Verified)`
                        : ' · Auto-matching Veda Patasala Scholar'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-maroon-900">{inr(b.pricing.total)}</div>
                    <div className="text-xs font-semibold capitalize text-emerald-700">
                      {b.payment.status.replace('_', ' ')} ({inr(b.payment.amountPaid)} paid)
                    </div>
                    <span className="mt-1 inline-block text-xs font-bold text-saffron-600">
                      Open Live Tracker →
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
