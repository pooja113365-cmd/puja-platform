import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Landmark,
  Languages,
  MapPin,
  CalendarCheck,
  Award,
  BookOpen,
  Sparkles,
  Clock,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { ProfileHeaderSkeleton, ErrorState, Stars } from '../components/States';
import { toYMD, fmtDate } from '../utils/format';
import { getPanditPhoto } from '../utils/media';
import { useBookingModal } from '../context/BookingModalContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PanditDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`/pandits/${id}`);
  const { openBookingModal } = useBookingModal();

  const calendarDays = useMemo(() => {
    const out = [];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const [selectedYmd, setSelectedYmd] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toYMD(tomorrow);
  });

  if (loading) return <ProfileHeaderSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { pandit: p, reviews } = data;
  const name = p.user?.name || 'Purohit';
  const photo = getPanditPhoto(p);
  const weeklyOff = p.availability?.weeklyOffDays || [];
  const blockedDates = p.availability?.unavailableDates || [];

  return (
    <div className="container-x py-10">
      <Link to="/purohits" className="text-sm font-semibold text-saffron-600 hover:underline">
        ← All Verified Vedic Scholars
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-gold-300/80 p-6 shadow-md lg:col-span-2"
        >
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative shrink-0 self-start">
              <img
                src={photo}
                alt={name}
                className="h-32 w-32 rounded-2xl object-cover shadow-md ring-2 ring-amber-400/80 ring-offset-2"
              />
              <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold-300 bg-maroon-800 text-gold-300 shadow">
                <BadgeCheck className="h-5 w-5" />
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400 bg-gradient-to-r from-amber-50 via-gold-300/35 to-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-maroon-900 shadow-sm">
                  ✓ Verified Veda Patasala Scholar
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Aadhaar &amp; Pramanapatra Verified
                </span>
              </div>

              <h1 className="mt-2 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">{name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <Stars value={p.rating?.avg} count={p.rating?.count} />
                <span className="text-xs text-maroon-700/80">
                  · {p.completedBookings} Sacred Ceremonies Conducted
                </span>
              </div>

              <ul className="mt-4 grid gap-2 text-sm text-maroon-800 sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4 shrink-0 text-saffron-600" />
                  <span>
                    <b>{p.experienceYears} years</b> of Vedic experience
                  </span>
                </li>
                {p.templeAffiliation && (
                  <li className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 shrink-0 text-saffron-600" />
                    <span className="truncate">{p.templeAffiliation}</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Languages className="h-4 w-4 shrink-0 text-saffron-600" />
                  <span>Fluent in {p.languages.join(', ')}</span>
                </li>
                {p.serviceCities?.length > 0 && (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-saffron-600" />
                    <span>Serves {p.serviceCities.join(', ')} &amp; Online</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {p.bio && (
            <div className="mt-6 rounded-2xl border border-gold-300/60 bg-gradient-to-r from-cream-100 to-amber-50/50 p-5">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-maroon-900">
                <BookOpen className="h-4 w-4 text-saffron-600" /> Vedic Parampara &amp; Scholarly Credentials
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-maroon-800/90">{p.bio}</p>
            </div>
          )}

          <div className="mt-5">
            <span className="label">Certified Ritual Specializations</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.specializations.map((s) => (
                <Link
                  key={s}
                  to={`/pujas?category=${encodeURIComponent(s)}`}
                  className="rounded-full border border-saffron-300 bg-saffron-50 px-3.5 py-1 text-xs font-bold text-saffron-700 hover:bg-saffron-500 hover:text-white transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                openBookingModal({
                  pandit: p,
                  serviceTitle: `Priest Booking — ${name}`,
                })
              }
              className="btn-primary !px-6 !py-3"
            >
              Book {name.split(' ')[1] || name} for Your Puja
            </button>
          </div>
        </motion.div>

        {/* Refactored 14-Day Auspicious Muhurtham & Availability Calendar */}
        <aside className="card border-gold-400/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-maroon-900">
              <CalendarCheck className="h-5 w-5 text-saffron-500" /> 14-Day Muhurtham Calendar
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Panchangam Sync
            </span>
          </div>
          <p className="mt-1 text-xs text-maroon-700/80">
            Select an available date below to inspect auspicious Muhurtham windows.
          </p>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs">
            {calendarDays.map((d, idx) => {
              const ymd = toYMD(d);
              const isOff = weeklyOff.includes(d.getDay()) || blockedDates.includes(ymd);
              const isAuspicious = !isOff && idx <= 10;
              const isSelected = selectedYmd === ymd && !isOff;

              return (
                <button
                  type="button"
                  key={ymd}
                  disabled={isOff}
                  onClick={() => setSelectedYmd(ymd)}
                  title={isOff ? 'Weekly Off / Unavailable' : `Auspicious Muhurtham available on ${ymd}`}
                  className={`relative rounded-xl border p-2 transition ${
                    isOff
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                      : isSelected
                      ? 'border-saffron-500 bg-maroon-800 text-gold-300 shadow-md ring-2 ring-gold-400'
                      : isAuspicious
                      ? 'border-gold-400 bg-gradient-to-b from-amber-50 to-emerald-50/70 text-maroon-900 hover:border-saffron-500'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-500'
                  }`}
                >
                  {isAuspicious && (
                    <span
                      className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold-500 text-[8px] text-white"
                      title="Shubh Muhurtham Day"
                    >
                      ✦
                    </span>
                  )}
                  <div className="text-[10px] font-semibold uppercase opacity-75">{WEEKDAYS[d.getDay()]}</div>
                  <div className="mt-0.5 text-sm font-bold">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {/* Highlighted Auspicious Muhurtham Windows for Selected Date */}
          <div className="mt-4 rounded-xl border border-gold-300/80 bg-cream-100 p-3.5 text-xs">
            <div className="flex items-center justify-between font-bold text-maroon-900">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-gold-600" /> Shubh Muhurthams
              </span>
              <span className="text-[11px] text-saffron-700">{fmtDate(selectedYmd)}</span>
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-gold-300/70 bg-white px-3 py-2">
                <div>
                  <div className="font-bold text-maroon-900">✦ Amrit Siddhi Muhurtham</div>
                  <div className="text-[11px] text-maroon-700/80">Rohini / Pushya · Ideal for Griha Pravesh</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                  <Clock className="h-3 w-3" /> 07:30–09:30
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gold-300/70 bg-white px-3 py-2">
                <div>
                  <div className="font-bold text-maroon-900">✦ Abhijit Shubh Muhurtham</div>
                  <div className="text-[11px] text-maroon-700/80">Vijaya Kala · Satyanarayan &amp; Homam</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                  <Clock className="h-3 w-3" /> 11:45–13:15
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-maroon-700">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> ✦ Shubh Muhurtham
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Weekly Off
            </span>
          </div>
        </aside>
      </div>

      <h2 className="mt-12 font-serif text-2xl font-bold text-maroon-900">
        Verified Devotee Reviews ({reviews.length})
      </h2>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-maroon-700">
          No reviews yet. Be the first to book and review {name}.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r._id} className="card border-gold-300/70 p-5">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs font-semibold text-maroon-700/80">
                  {r.customer?.name} · {r.puja?.name}
                </span>
              </div>
              {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-maroon-900">“{r.comment}”</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
