import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, CheckCircle2, Package, ShieldCheck, Check, UserCheck, Gift } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { ProfileHeaderSkeleton, ErrorState } from '../components/States';
import { inr, duration, LOCATION_LABEL } from '../utils/format';
import { getPujaImage } from '../utils/media';

export default function PujaDetail() {
  const { id } = useParams();
  const { data: puja, loading, error, reload } = useFetch(`/pujas/${id}`);
  const [selectedTierName, setSelectedTierName] = useState('');

  useEffect(() => {
    if (puja?.priceTiers?.length) {
      const defaultTier = puja.priceTiers[1]?.name || puja.priceTiers[0].name;
      setSelectedTierName((prev) => prev || defaultTier);
    }
  }, [puja]);

  if (loading) return <ProfileHeaderSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!puja) return null;

  const imgUrl = getPujaImage(puja);
  const activeTier = selectedTierName || puja.priceTiers[1]?.name || puja.priceTiers[0]?.name;

  return (
    <div className="container-x py-8">
      <Link to="/pujas" className="text-xs font-bold text-saffron-600 hover:underline">
        ← Back to Pujas
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          {/* Hero Ritual Image */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 shadow-md">
            <img
              src={imgUrl}
              alt={puja.name}
              className="w-full h-72 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold-300 bg-maroon-900/90 px-3 py-0.5 text-xs font-bold text-gold-300">
                  {puja.category}
                </span>
                {puja.samagriKit && (
                  <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                    ✓ Samagri Kit Available
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{puja.name}</h1>
            </div>
          </div>

          {/* 4 Visual Quick-Understand Cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card flex items-center gap-2.5 p-3">
              <Clock className="h-5 w-5 shrink-0 text-saffron-600" />
              <div>
                <div className="text-[11px] text-maroon-700/70">Duration</div>
                <div className="text-xs font-bold text-maroon-900">{duration(puja.durationMinutes)}</div>
              </div>
            </div>
            <div className="card flex items-center gap-2.5 p-3">
              <UserCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <div className="text-[11px] text-maroon-700/70">Priest</div>
                <div className="text-xs font-bold text-maroon-900">Verified Priest</div>
              </div>
            </div>
            <div className="card flex items-center gap-2.5 p-3">
              <MapPin className="h-5 w-5 shrink-0 text-saffron-600" />
              <div>
                <div className="text-[11px] text-maroon-700/70">Location</div>
                <div className="text-xs font-bold text-maroon-900">
                  {puja.locationTypes.map((l) => LOCATION_LABEL[l]).join(' / ')}
                </div>
              </div>
            </div>
            <div className="card flex items-center gap-2.5 p-3">
              <Gift className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <div className="text-[11px] text-maroon-700/70">Puja Items</div>
                <div className="text-xs font-bold text-maroon-900">
                  {puja.samagriKit ? 'Doorstep Kit' : 'Checklist'}
                </div>
              </div>
            </div>
          </div>

          {/* Short, Clear Overview */}
          <div className="card mt-4 p-5">
            <h2 className="font-serif text-xl font-bold text-maroon-900">About This Puja</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-maroon-800/90">{puja.description}</p>
            {puja.significance && (
              <p className="mt-3 rounded-xl border-l-4 border-gold-500 bg-cream-100 p-3.5 text-xs leading-relaxed text-maroon-800">
                <b>Why Perform:</b> {puja.significance}
              </p>
            )}
          </div>

          {/* Visual Samagri Items Grid */}
          {puja.samagriChecklist.length > 0 && (
            <div className="card mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-maroon-900">
                  <Package className="h-5 w-5 text-saffron-500" />
                  Puja Items &amp; Samagri ({puja.samagriChecklist.length})
                </h2>
                {puja.samagriKit && (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    Full Kit: {inr(puja.samagriKit.price)}
                  </span>
                )}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {puja.samagriChecklist.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center gap-2 rounded-xl border border-gold-300/40 bg-cream-50/70 px-3 py-2 text-xs"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        s.providedInKit ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    />
                    <span className="truncate font-semibold text-maroon-900" title={s.name}>
                      {s.name} <span className="font-normal text-maroon-700/70">({s.quantity})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Simple, Clear Package Selector */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card border-gold-400/80 p-5 shadow-lg">
            <h2 className="font-serif text-2xl font-bold text-maroon-900">Choose Package</h2>
            <p className="text-xs text-maroon-700/75">Select a package to book your Puja online</p>

            <ul className="mt-4 space-y-2.5" role="radiogroup" aria-label="Choose Package">
              {puja.priceTiers.map((t, idx) => {
                const isSelected = activeTier === t.name;
                return (
                  <li
                    key={t.name}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setSelectedTierName(t.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTierName(t.name);
                      }
                    }}
                    className={`cursor-pointer rounded-xl p-3.5 transition-all ${
                      isSelected
                        ? 'border-2 border-amber-500 bg-amber-50/90 shadow-sm'
                        : 'border border-gold-300/70 bg-white hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-amber-600 bg-amber-500 text-white'
                              : 'border-gold-400 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                        <b className="text-base text-maroon-900">{t.name}</b>
                        {idx === 1 && (
                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-maroon-900">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <span className="font-serif text-xl font-bold text-maroon-900">{inr(t.price)}</span>
                    </div>
                    {t.description && (
                      <p className="mt-1 pl-7 text-xs text-maroon-700/80 line-clamp-2">{t.description}</p>
                    )}
                  </li>
                );
              })}
            </ul>

            <Link
              to={`/book/${puja._id}?tier=${encodeURIComponent(activeTier || '')}`}
              className="btn-primary mt-5 w-full !py-3 text-base shadow-md active:scale-[0.98]"
            >
              Book {activeTier} Package →
            </Link>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs text-maroon-700/80">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified Priests · Pay Only 30% Advance
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
