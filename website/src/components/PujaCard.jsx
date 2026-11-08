import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, PackageCheck, ArrowRight } from 'lucide-react';
import { duration, LOCATION_LABEL } from '../utils/format';
import { getPujaImage } from '../utils/media';
import { useBookingModal } from '../context/BookingModalContext';

export default function PujaCard({ puja }) {
  const { openBookingModal } = useBookingModal();
  const imgUrl = getPujaImage(puja);
  const hasSamagri = Boolean(puja?.samagriKit);
  const locationTypes = Array.isArray(puja?.locationTypes) ? puja.locationTypes : ['home'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div className="card group flex h-full flex-col overflow-hidden border-[#F7B928]/60 hover:-translate-y-1 hover:border-[#F58216] hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-200">
        <Link to={`/pujas/${puja._id}`} className="relative aspect-[16/10] w-full overflow-hidden bg-[#300B32] block">
          <img
            src={imgUrl}
            alt={puja.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#300B32]/90 via-black/15 to-transparent" />

          {/* Category Pill */}
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-[#F7B928]/80 bg-[#300B32]/90 px-3 py-0.5 text-[11px] font-bold text-[#F7B928]">
              {puja.category}
            </span>
            {hasSamagri && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                <PackageCheck className="h-3 w-3" /> + Samagri Kit
              </span>
            )}
          </div>

          {/* Title & Quick Info Overlay on Image */}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
            <h3 className="font-serif text-xl font-bold leading-snug drop-shadow sm:text-2xl">
              {puja.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/95">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#F7B928]" />
                {duration(puja.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#F7B928]" />
                {locationTypes.map((l) => LOCATION_LABEL[l] || l).join(' · ')}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between p-4">
          <p className="line-clamp-2 text-xs text-[#300B32]/80">
            {puja.description}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-[#F7B928]/35 pt-3">
            <Link
              to={`/pujas/${puja._id}`}
              className="text-xs font-bold text-[#300B32]/80 hover:text-[#F58216] hover:underline"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={() => openBookingModal({ puja, serviceTitle: puja.name })}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-5 py-1.5 text-xs font-extrabold text-[#300B32] shadow-sm hover:brightness-105 transition-all duration-200 active:scale-[0.98]"
            >
              Book <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
