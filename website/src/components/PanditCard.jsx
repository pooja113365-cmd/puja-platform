import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Languages, MapPin, Award, ArrowRight } from 'lucide-react';
import { Stars } from './States';
import { getPanditPhoto } from '../utils/media';
import { useBookingModal } from '../context/BookingModalContext';

export default function PanditCard({ pandit, onSelect, selected }) {
  const { openBookingModal } = useBookingModal();
  const name = pandit.user?.name || 'Vedic Priest';
  const photo = getPanditPhoto(pandit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`card flex h-full flex-col justify-between p-5 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-200 ${
        selected ? 'ring-2 ring-saffron-500 bg-saffron-50/30' : ''
      }`}
    >
      <div>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={photo}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover shadow-sm ring-2 ring-amber-400/80 ring-offset-2"
              loading="lazy"
            />
            <span
              title="Verified Priest"
              className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-gold-300 bg-maroon-800 text-gold-300 shadow"
            >
              <BadgeCheck className="h-4 w-4" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-400 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-maroon-900">
              ✓ Verified Priest
            </span>
            <h3 className="mt-1 break-words font-serif text-xl font-bold leading-snug text-maroon-900">
              {name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-maroon-700">
              <Stars value={pandit.rating?.avg} count={pandit.rating?.count} />
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Award className="h-3.5 w-3.5 text-saffron-600" />
                {pandit.experienceYears} Yrs Exp
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 space-y-1 text-xs text-maroon-700">
          <p className="flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 shrink-0 text-saffron-600" />
            <span>{pandit.languages.join(', ')}</span>
          </p>
          {pandit.serviceCities?.length > 0 && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-saffron-600" />
              <span>{pandit.serviceCities.join(', ')}</span>
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 pb-3">
          {pandit.specializations.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full border border-saffron-200 bg-saffron-50 px-2.5 py-0.5 text-[11px] font-semibold text-saffron-700"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gold-300/40 pt-3.5">
        <Link
          to={`/purohits/${pandit._id}`}
          className="text-xs font-bold text-maroon-800 hover:text-saffron-600 hover:underline"
        >
          View Profile
        </Link>
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(pandit)}
            className={selected ? 'btn-primary !py-2 !px-4 text-xs' : 'btn-outline !py-2 !px-4 text-xs'}
          >
            {selected ? '✓ Selected' : 'Select Priest'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              openBookingModal({
                pandit,
                serviceTitle: `Priest Booking — ${name}`,
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-4 py-1.5 text-xs font-extrabold text-[#300B32] shadow-sm hover:brightness-105"
          >
            Book <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
