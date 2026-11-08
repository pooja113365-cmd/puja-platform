import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, PackageCheck, ArrowRight } from 'lucide-react';
import { inr, duration, LOCATION_LABEL } from '../utils/format';
import { getPujaImage } from '../utils/media';

export default function PujaCard({ puja }) {
  const tiers = Array.isArray(puja?.priceTiers) && puja.priceTiers.length > 0 ? puja.priceTiers : [{ price: 2100 }];
  const from = Math.min(...tiers.map((t) => Number(t.price) || 2100));
  const imgUrl = getPujaImage(puja);
  const hasSamagri = Boolean(puja?.samagriKit);
  const locationTypes = Array.isArray(puja?.locationTypes) ? puja.locationTypes : ['home'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="h-full"
    >
      <Link
        to={`/pujas/${puja._id}`}
        className="card group flex h-full flex-col overflow-hidden border-gold-300/70 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-200"
      >
        <div className="relative h-52 w-full overflow-hidden bg-maroon-900">
          <img
            src={imgUrl}
            alt={puja.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Category Pill */}
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-gold-300/70 bg-maroon-900/90 px-3 py-0.5 text-[11px] font-bold text-gold-300">
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
            <h3 className="font-serif text-2xl font-bold leading-tight drop-shadow">
              {puja.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-cream-100/95">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gold-400" />
                {duration(puja.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gold-400" />
                {locationTypes.map((l) => LOCATION_LABEL[l] || l).join(' · ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <p className="line-clamp-1 text-xs text-maroon-700/85">
            {puja.description}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-gold-300/40 pt-3">
            <div>
              <span className="text-xs text-maroon-700/75">Starts at </span>
              <b className="font-serif text-xl font-bold text-maroon-900">{inr(from)}</b>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-saffron-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm group-hover:bg-saffron-600 transition-all duration-200 active:scale-[0.98]">
              Book Now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
