import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  UserCheck,
  Landmark,
  Video,
  Gift,
  ShoppingCart,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { PujaGridSkeleton } from '../components/PujaCardSkeleton';
import { ErrorState } from '../components/States';

const QUICK_CATEGORIES = [
  { title: 'Pujas', subtitle: 'Home & Office', img: '/images/satyanarayan.jpg', to: '/pujas' },
  { title: 'Homams', subtitle: 'Havan & Shanti', img: '/images/navagraha.jpg', to: '/pujas?category=Navagraha' },
  { title: 'Puja Items', subtitle: 'Samagri Kits', img: '/images/griha-pravesh.jpg', to: '/pujas?hasSamagri=true' },
  { title: 'Temple Services', subtitle: 'Special Rituals', img: '/images/rudrabhishek.jpg', to: '/pujas?location=temple' },
  { title: 'Astrology', subtitle: 'Muhurtham & Dosha', img: '/images/pandit-1.jpg', to: '/purohits' },
  { title: 'Festivals', subtitle: 'Vrat & Celebrations', img: '/images/vivah.jpg', to: '/pujas?category=Vivah' },
];

const FIVE_PILLARS = [
  { icon: CalendarCheck, title: 'Book Pujas & Homams Online', to: '/pujas' },
  { icon: UserCheck, title: 'Verified & Experienced Priests', to: '/purohits' },
  { icon: Landmark, title: 'Temple Services & Special Rituals', to: '/pujas?location=temple' },
  { icon: Video, title: 'Attend Pujas Live (Online)', to: '/pujas?location=online' },
  { icon: Gift, title: 'Receive Prasad at Your Doorstep', to: '/pujas?hasSamagri=true' },
];

const PUJA_ITEMS_SHOP = [
  {
    name: 'Puja Samagri',
    tag: 'Complete Kits',
    price: '₹850+',
    img: '/images/griha-pravesh.jpg',
    to: '/pujas?hasSamagri=true',
  },
  {
    name: 'Kumkum & Turmeric',
    tag: 'Pure Organic',
    price: '₹199+',
    img: '/images/satyanarayan.jpg',
    to: '/pujas?hasSamagri=true',
  },
  {
    name: 'Rudraksha & Malas',
    tag: ' Energized Beads',
    price: '₹499+',
    img: '/images/rudrabhishek.jpg',
    to: '/pujas?category=Rudrabhishek',
  },
  {
    name: 'Agarbatti & Dhoop',
    tag: 'Temple Fragrance',
    price: '₹149+',
    img: '/images/navagraha.jpg',
    to: '/pujas?hasSamagri=true',
  },
  {
    name: 'Kalash & More',
    tag: 'Copper & Brass',
    price: '₹650+',
    img: '/images/vivah.jpg',
    to: '/pujas?category=Griha+Pravesh',
  },
];

export default function Home() {
  const { data, loading, error, reload } = useFetch('/pujas', { featured: 'true', limit: 6 });
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/pujas?search=${encodeURIComponent(searchText.trim())}`);
    } else {
      navigate('/pujas');
    }
  };

  return (
    <>
      {/* Hero Banner — Visual, Short & Clear like GetPuja.com Poster */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2E0938] via-maroon-900 to-[#4A1259] text-cream-100">
        <div className="pointer-events-none absolute -right-10 -top-10 select-none text-[20rem] leading-none text-white/5">
          ॐ
        </div>
        <div className="container-x relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/60 bg-white/10 px-4 py-1 text-xs font-bold text-gold-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              <span>Book • Shop • Perform • Receive Your Pujas Online</span>
            </div>

            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
              Book Pujas, Buy <span className="text-gold-400">Puja Items</span> &amp; Spiritual Essentials
            </h1>
            <p className="mt-3 max-w-xl text-base text-cream-200/90">
              Your Trusted Platform for Online Puja, Puja Items &amp; Verified Priests in Hyderabad.
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-5 flex max-w-xl items-center gap-2 rounded-full border border-gold-400/50 bg-white p-1.5 shadow-lg"
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-maroon-700" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search for Pujas, Homams, Items, Temples..."
                className="w-full bg-transparent px-2 py-1.5 text-sm text-maroon-900 outline-none placeholder:text-maroon-700/60"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-saffron-500 px-5 py-2 text-xs font-extrabold text-maroon-900 shadow transition hover:from-amber-300 hover:to-saffron-400 active:scale-[0.98]"
              >
                Get Started →
              </button>
            </form>

            {/* 5 Visual Service Pills from the GetPuja Poster */}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {FIVE_PILLARS.map(({ icon: Icon, title, to }) => (
                <Link
                  key={title}
                  to={to}
                  className="flex items-center gap-2.5 rounded-full border border-gold-400/50 bg-maroon-900/60 px-3.5 py-2 text-xs font-semibold text-cream-100 transition hover:-translate-y-0.5 hover:border-gold-300 hover:bg-maroon-800/80"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{title}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Right Hero Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="lg:col-span-5"
          >
            <div className="overflow-hidden rounded-3xl border-2 border-gold-400/80 bg-maroon-900 shadow-2xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src="/images/griha-pravesh.jpg"
                  alt="Book Your Puja Online"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-900 via-maroon-900/25 to-transparent" />
                <span className="absolute bottom-3 left-4 rounded-full border border-gold-400 bg-maroon-900/90 px-3 py-1 text-xs font-bold text-gold-300">
                  ✓ Verified Priests &amp; Doorstep Samagri
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-serif text-2xl font-bold text-white">Book Your Puja Online</h2>
                <p className="mt-1 text-xs text-cream-200/90">
                  Connect with Verified Priests and Perform Sacred Rituals at Home, Temple, or Live Online.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    to="/pujas"
                    className="flex-1 rounded-full bg-gradient-to-r from-amber-400 to-saffron-500 py-2.5 text-center text-xs font-extrabold text-maroon-900 shadow hover:from-amber-300 hover:to-saffron-400 active:scale-[0.98]"
                  >
                    Book a Puja →
                  </Link>
                  <Link
                    to="/purohits"
                    className="rounded-full border border-gold-400/70 px-4 py-2.5 text-xs font-bold text-gold-300 hover:bg-white/10 active:scale-[0.98]"
                  >
                    View Priests
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6 Visual Category Cards (Image + Short Title — just like the App Screen) */}
      <section className="container-x mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Explore by Category</h2>
          <Link to="/pujas" className="text-xs font-bold text-saffron-600 hover:underline">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              to={cat.to}
              className="group overflow-hidden rounded-2xl border border-amber-300/80 bg-white text-center shadow-sm hover:-translate-y-1 hover:border-saffron-500 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-200"
            >
              <div className="h-28 w-full overflow-hidden bg-maroon-900">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="font-serif text-base font-bold text-maroon-900 group-hover:text-saffron-600">
                  {cat.title}
                </div>
                <div className="text-[11px] text-maroon-700/75">{cat.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Pujas & Homams Grid */}
      <section className="container-x mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
              Popular Pujas &amp; Homams
            </h2>
            <p className="text-xs text-maroon-700/80">
              Select a Puja to view package price, Samagri kit &amp; book your priest.
            </p>
          </div>
          <Link to="/pujas" className="btn-outline !py-2 text-xs">
            See All Pujas →
          </Link>
        </div>

        {loading && <PujaGridSkeleton count={6} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <PujaCard key={p._id} puja={p} />
            ))}
          </div>
        )}
      </section>

      {/* Shop Puja Items Online Section (Exact 5 Items from the Poster) */}
      <section className="container-x mt-14">
        <div className="rounded-3xl border-2 border-gold-400/70 bg-gradient-to-br from-[#2E0938] via-maroon-900 to-maroon-800 p-6 sm:p-8 text-cream-100 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-400 bg-maroon-800 text-gold-300 shadow">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-bold text-gold-300 sm:text-3xl">
                  Shop Puja Items Online
                </h2>
                <p className="text-xs text-cream-200/90">All Your Spiritual Needs in One Place</p>
              </div>
            </div>
            <Link
              to="/pujas?hasSamagri=true"
              className="rounded-full bg-gold-400 px-5 py-2 text-xs font-extrabold text-maroon-900 shadow hover:bg-gold-300 active:scale-[0.98]"
            >
              View All Kits <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PUJA_ITEMS_SHOP.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="group overflow-hidden rounded-2xl border border-gold-400/60 bg-white text-center text-maroon-900 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              >
                <div className="relative h-32 w-full overflow-hidden bg-cream-100">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-maroon-900/90 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                    {item.price}
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-serif text-base font-bold leading-snug text-maroon-900 group-hover:text-saffron-600">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-maroon-700/75">{item.tag}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
