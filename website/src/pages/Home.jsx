import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, ArrowRight } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { PujaGridSkeleton } from '../components/PujaCardSkeleton';
import { ErrorState } from '../components/States';

const SEARCH_PHRASES = [
  'Search for Satyanarayan Vrat & Katha...',
  'Search for Griha Pravesh Puja...',
  'Search for Navagraha Shanti Havan...',
  'Search for Puja Samagri & Kalash Kits...',
  'Search for Verified Priests in Hyderabad...',
];

const QUICK_CATEGORIES = [
  { title: 'Pujas', subtitle: 'Home & Office', img: '/images/hero-puja.jpg', to: '/pujas' },
  { title: 'Homams', subtitle: 'Havan & Shanti', img: '/images/navagraha.jpg', to: '/pujas?category=Navagraha' },
  { title: 'Puja Items', subtitle: 'Samagri Kits', img: '/images/puja-items.jpg', to: '/pujas?hasSamagri=true' },
  { title: 'Temple Services', subtitle: 'Special Rituals', img: '/images/rudrabhishek.jpg', to: '/pujas?location=temple' },
  { title: 'Astrology', subtitle: 'Muhurtham & Dosha', img: '/images/pandit-1.jpg', to: '/purohits' },
  { title: 'Festivals', subtitle: 'Vrat & Celebrations', img: '/images/vivah.jpg', to: '/pujas?category=Vivah' },
];

const PUJA_ITEMS_SHOP = [
  {
    name: 'Puja Samagri',
    tag: 'Complete Kits',
    price: '₹850+',
    img: '/images/puja-items.jpg',
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
    tag: 'Energized Beads',
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
    img: '/images/hero-puja.jpg',
    to: '/pujas?category=Griha+Pravesh',
  },
];

const SPARKLE_PARTICLES = [
  { left: '12%', top: '68%', size: 5, delay: 0, dur: 4.5 },
  { left: '28%', top: '35%', size: 4, delay: 1.1, dur: 5.2 },
  { left: '44%', top: '60%', size: 6, delay: 0.6, dur: 4.8 },
  { left: '53%', top: '28%', size: 5, delay: 1.8, dur: 5.5 },
  { left: '65%', top: '75%', size: 6, delay: 0.3, dur: 4.2 },
  { left: '88%', top: '42%', size: 5, delay: 1.4, dur: 5.0 },
  { left: '76%', top: '22%', size: 4, delay: 2.1, dur: 4.6 },
];

/* Custom Golden SVG Icons (#F7B928 / #F58216) */
function IconCalendarSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <rect x="3.5" y="5.5" width="21" height="19" rx="3" stroke="#F7B928" strokeWidth="2" />
      <path d="M3.5 11H24.5" stroke="#F7B928" strokeWidth="2" />
      <path d="M9 3V7M19 3V7" stroke="#F58216" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9.5" cy="15.5" r="1.4" fill="#F7B928" />
      <circle cx="14" cy="15.5" r="1.4" fill="#F7B928" />
      <circle cx="18.5" cy="15.5" r="1.4" fill="#F7B928" />
      <circle cx="9.5" cy="19.8" r="1.4" fill="#F58216" />
      <circle cx="14" cy="19.8" r="1.4" fill="#F7B928" />
      <circle cx="18.5" cy="19.8" r="1.4" fill="#F7B928" />
    </svg>
  );
}

function IconShieldSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <path
        d="M14 3L23 6.8V13.8C23 19.4 19.1 23.6 14 25.5C8.9 23.6 5 19.4 5 13.8V6.8L14 3Z"
        stroke="#F7B928"
        strokeWidth="2"
        fill="#F7B928"
        fillOpacity="0.1"
      />
      <path d="M10 14.2L12.8 17L18.5 11.2" stroke="#F7B928" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTempleSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <path d="M14 2.5L16 6H12L14 2.5Z" fill="#F58216" />
      <path d="M9 6H19L21 11H7L9 6Z" stroke="#F7B928" strokeWidth="1.8" fill="#F7B928" fillOpacity="0.15" />
      <path d="M6 11H22L23.5 16.5H4.5L6 11Z" stroke="#F7B928" strokeWidth="1.8" />
      <path d="M4 16.5H24V24.5H4V16.5Z" stroke="#F7B928" strokeWidth="1.8" />
      <path d="M11.5 24.5V19.5C11.5 18.2 12.6 17.2 14 17.2C15.4 17.2 16.5 18.2 16.5 19.5V24.5" fill="#F58216" />
      <line x1="2.5" y1="24.5" x2="25.5" y2="24.5" stroke="#F7B928" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCartSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <path
        d="M3.5 5H7L9.6 17.2C9.8 18.2 10.7 19 11.8 19H21.2C22.2 19 23.1 18.3 23.4 17.3L25 10H8"
        stroke="#F7B928"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="23" r="2" fill="#F58216" />
      <circle cx="20.5" cy="23" r="2" fill="#F58216" />
    </svg>
  );
}

function IconLiveVideoSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <rect x="3" y="5.5" width="22" height="15.5" rx="2.8" stroke="#F7B928" strokeWidth="2" />
      <path d="M12 10.2L17.8 13.3L12 16.4V10.2Z" fill="#F7B928" />
      <path d="M8.5 24H19.5" stroke="#F58216" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGiftSvg() {
  return (
    <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" fill="none">
      <rect x="4" y="11" width="20" height="4.5" rx="1.2" stroke="#F7B928" strokeWidth="1.9" />
      <path d="M5.5 15.5H22.5V23.5C22.5 24.3 21.8 25 21 25H7C6.2 25 5.5 24.3 5.5 23.5V15.5Z" stroke="#F7B928" strokeWidth="1.9" />
      <path d="M14 11V25" stroke="#F58216" strokeWidth="2" />
      <path
        d="M14 11C14 11 10 11 9 8.2C8.2 6.2 10 4.5 11.8 5.8C13.2 6.8 14 11 14 11Z"
        stroke="#F7B928"
        strokeWidth="1.8"
      />
      <path
        d="M14 11C14 11 18 11 19 8.2C19.8 6.2 18 4.5 16.2 5.8C14.8 6.8 14 11 14 11Z"
        stroke="#F7B928"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const HERO_SIX_FEATURES = [
  {
    Icon: IconCalendarSvg,
    line1: 'Book Pujas &',
    line2: 'Homams Online',
    to: '/pujas',
  },
  {
    Icon: IconShieldSvg,
    line1: 'Verified &',
    line2: 'Experienced Priests',
    to: '/purohits',
  },
  {
    Icon: IconTempleSvg,
    line1: 'Temple Services &',
    line2: 'Special Rituals',
    to: '/pujas?location=temple',
  },
  {
    Icon: IconCartSvg,
    line1: 'Shop Puja Items',
    line2: '& Spiritual Essentials',
    to: '/pujas?hasSamagri=true',
  },
  {
    Icon: IconLiveVideoSvg,
    line1: 'Attend Pujas',
    line2: 'Live (Online)',
    to: '/pujas?location=online',
  },
  {
    Icon: IconGiftSvg,
    line1: 'Receive Prasad',
    line2: 'at Your Doorstep',
    to: '/pujas?hasSamagri=true',
  },
];

/* Animated Swaying Hanging Diyas with Flickering Flames (Visible on Mobile & Desktop) */
function HangingDiyas() {
  return (
    <div className="pointer-events-none absolute left-1 top-0 z-10 block h-44 w-24 origin-top-left scale-[0.72] select-none sm:scale-90 lg:left-2 lg:h-52 lg:w-28 lg:scale-100" aria-hidden="true">
      {/* Left Swaying Diya */}
      <motion.svg
        viewBox="0 0 60 200"
        className="absolute left-0 top-0 h-48 w-16 origin-top"
        animate={{ rotate: [-2.8, 2.8, -2.8] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        fill="none"
      >
        <line x1="30" y1="0" x2="30" y2="128" stroke="#F7B928" strokeWidth="1.6" strokeDasharray="3 2" />
        <motion.circle
          cx="30"
          cy="122"
          r="22"
          fill="url(#diyaGlowL)"
          animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.92, 1.12, 0.92] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M30 100C30 100 36.5 110 36.5 117C36.5 121.5 33.5 124.5 30 124.5C26.5 124.5 23.5 121.5 23.5 117C23.5 110 30 100 30 100Z"
          fill="url(#flameGradL)"
          style={{ transformOrigin: '30px 124px' }}
          animate={{ scaleY: [1, 1.18, 0.93, 1.12, 1], scaleX: [1, 0.94, 1.06, 0.96, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d="M13 125H47L41.5 135C38.5 138 34 139 30 139C26 139 21.5 138 18.5 135L13 125Z" fill="url(#brassGradL)" />
        <path d="M24 139H36L38 143.5H22L24 139Z" fill="#F58216" />
        <defs>
          <radialGradient id="diyaGlowL" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F7B928" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F58216" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flameGradL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F7B928" />
            <stop offset="100%" stopColor="#F58216" />
          </linearGradient>
          <linearGradient id="brassGradL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#F7B928" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Right Swaying Diya */}
      <motion.svg
        viewBox="0 0 60 170"
        className="absolute left-10 top-0 h-40 w-16 origin-top"
        animate={{ rotate: [2.4, -2.4, 2.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        fill="none"
      >
        <line x1="30" y1="0" x2="30" y2="92" stroke="#F7B928" strokeWidth="1.6" strokeDasharray="3 2" />
        <motion.circle
          cx="30"
          cy="88"
          r="19"
          fill="url(#diyaGlowL)"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.15, 0.95] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M30 69C30 69 35.5 78 35.5 84C35.5 88 33 91 30 91C27 91 24.5 88 24.5 84C24.5 78 30 69 30 69Z"
          fill="url(#flameGradL)"
          style={{ transformOrigin: '30px 91px' }}
          animate={{ scaleY: [1, 1.15, 0.92, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d="M15 92H45L40.5 100.5C38 103 34 104 30 104C26 104 22 103 19.5 100.5L15 92Z" fill="url(#brassGradL)" />
        <path d="M24 104H36L38 108H22L24 104Z" fill="#F58216" />
      </motion.svg>
    </div>
  );
}

function LotusBadgeIcon() {
  return (
    <motion.svg
      viewBox="0 0 28 22"
      className="h-4 w-5 shrink-0"
      fill="none"
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M14 2C14 2 18.5 8 18.5 13C18.5 16 16.5 18.5 14 18.5C11.5 18.5 9.5 16 9.5 13C9.5 8 14 2 14 2Z"
        fill="#F7B928"
      />
      <path d="M9 7C5 9 3 13 4.5 16.5C7 18 10 17.5 11.5 15.5C9.8 13 9 10 9 7Z" fill="#F58216" />
      <path d="M19 7C23 9 25 13 23.5 16.5C21 18 18 17.5 16.5 15.5C18.2 13 19 10 19 7Z" fill="#F58216" />
    </motion.svg>
  );
}

function OmOrnamentDivider() {
  return (
    <div className="mx-auto my-2.5 flex max-w-xs items-center gap-3 sm:max-w-md lg:mx-0" aria-hidden="true">
      <div className="flex flex-1 items-center">
        <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#F7B928]/85 to-[#F7B928]" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[#F7B928]" />
      </div>
      <motion.span
        animate={{ scale: [1, 1.15, 1], filter: ['drop-shadow(0 0 4px #F7B928)', 'drop-shadow(0 0 12px #F58216)', 'drop-shadow(0 0 4px #F7B928)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="font-serif text-xl font-bold leading-none text-[#F7B928]"
      >
        ॐ
      </motion.span>
      <div className="flex flex-1 items-center">
        <span className="h-1.5 w-1.5 rotate-45 bg-[#F7B928]" />
        <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#F7B928]/85 to-[#F7B928]" />
      </div>
    </div>
  );
}

/**
 * Transparent decorative SVG illustration at the base of the Sacred Temple Arch:
 * Kalash with Coconut & Mango Leaves, Marigold Flowers, Kumkum/Haldi Thali & Multi-Flame Brass Deepam.
 */
function SacredKalashAndDeepamDecor() {
  return (
    <motion.svg
      initial={{ opacity: 0, y: 70 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      viewBox="0 0 380 185"
      className="pointer-events-none absolute -bottom-5 left-2 z-20 w-[82%] max-w-[330px] drop-shadow-[0_12px_20px_rgba(0,0,0,0.65)] select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="potGold" cx="0.38" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#F7B928" />
          <stop offset="72%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <linearGradient id="coconutBrown" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="55%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <radialGradient id="lampFlameGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F7B928" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F58216" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="deepamFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F7B928" />
          <stop offset="100%" stopColor="#F58216" />
        </linearGradient>
      </defs>

      {/* Base Green Banana / Mango Leaves */}
      <path d="M18 158C45 142 82 146 105 162C75 168 42 168 18 158Z" fill="#15803D" />
      <path d="M165 162C190 146 225 144 252 158C225 168 192 168 165 162Z" fill="#15803D" />

      {/* Mango Leaves under Coconut */}
      <path d="M115 78C90 62 72 72 68 92C88 92 104 86 115 78Z" fill="#16A34A" />
      <path d="M155 78C180 62 198 72 202 92C182 92 166 86 155 78Z" fill="#16A34A" />
      <path d="M122 74C104 50 92 54 88 74C104 78 114 76 122 74Z" fill="#22C55E" />
      <path d="M148 74C166 50 178 54 182 74C166 78 156 76 148 74Z" fill="#22C55E" />

      {/* Sacred Coconut on Top of Kalash */}
      <path
        d="M135 20C152 34 162 54 158 72C155 82 146 86 135 86C124 86 115 82 112 72C108 54 118 34 135 20Z"
        fill="url(#coconutBrown)"
        stroke="#F7B928"
        strokeWidth="1.2"
      />
      <text x="135" y="62" textAnchor="middle" fill="#DC2626" fontSize="18" fontWeight="bold" fontFamily="serif">
        ॐ
      </text>

      {/* Brass Kalash Neck & Rim */}
      <ellipse cx="135" cy="84" rx="28" ry="6" fill="#F7B928" stroke="#92400E" strokeWidth="1" />
      <path d="M112 84H158L152 96H118L112 84Z" fill="url(#potGold)" />

      {/* Brass Kalash Rounded Body */}
      <ellipse cx="135" cy="130" rx="46" ry="38" fill="url(#potGold)" stroke="#F7B928" strokeWidth="1.2" />
      <path d="M92 115Q135 124 178 115" stroke="#DC2626" strokeWidth="2.5" fill="none" />
      <text x="135" y="142" textAnchor="middle" fill="#DC2626" fontSize="22" fontWeight="bold" fontFamily="serif">
        ॐ
      </text>

      {/* Marigold Flower Garland at Base of Kalash */}
      {[
        { cx: 64, cy: 148, r: 11, c: '#FACC15' },
        { cx: 78, cy: 158, r: 12, c: '#F58216' },
        { cx: 94, cy: 164, r: 12, c: '#DC2626' },
        { cx: 112, cy: 168, r: 13, c: '#FACC15' },
        { cx: 132, cy: 170, r: 13, c: '#F7B928' },
        { cx: 152, cy: 168, r: 13, c: '#FACC15' },
        { cx: 170, cy: 163, r: 12, c: '#F58216' },
        { cx: 185, cy: 154, r: 11, c: '#FEF08A' },
      ].map((fl, idx) => (
        <g key={idx}>
          <circle cx={fl.cx} cy={fl.cy} r={fl.r} fill={fl.c} stroke="#B45309" strokeWidth="0.8" />
          <circle cx={fl.cx} cy={fl.cy} r={fl.r * 0.55} fill="#F58216" opacity="0.65" />
        </g>
      ))}

      {/* Brass Puja Thali with Kumkum & Haldi Bowls */}
      <ellipse cx="248" cy="162" rx="58" ry="14" fill="url(#potGold)" stroke="#F7B928" strokeWidth="1.5" />
      <ellipse cx="222" cy="158" rx="18" ry="6" fill="#92400E" />
      <path d="M206 158Q222 144 238 158Z" fill="#FACC15" />
      <path d="M205 158H239L234 167H210L205 158Z" fill="url(#potGold)" />
      <ellipse cx="262" cy="154" rx="18" ry="6" fill="#92400E" />
      <path d="M246 154Q262 140 278 154Z" fill="#DC2626" />
      <path d="M245 154H279L274 164H250L245 154Z" fill="url(#potGold)" />

      {/* Tall Standing Multi-Wick Brass Deepam on Right */}
      <circle cx="316" cy="76" r="34" fill="url(#lampFlameGlow)" />
      <ellipse cx="316" cy="165" rx="26" ry="7" fill="url(#potGold)" stroke="#F7B928" strokeWidth="1" />
      <path d="M306 162L311 86H321L326 162H306Z" fill="url(#potGold)" />
      <ellipse cx="316" cy="86" rx="30" ry="7" fill="url(#potGold)" stroke="#F7B928" strokeWidth="1.2" />
      <path d="M316 54L322 84H310L316 54Z" fill="url(#potGold)" />
      {[290, 302, 316, 330, 342].map((fx, i) => (
        <path
          key={i}
          d={`M${fx} ${i === 2 ? 44 : 64} C${fx} ${i === 2 ? 44 : 64} ${fx + 4.5} ${i === 2 ? 53 : 73} ${fx + 4.5} ${i === 2 ? 58 : 78} C${fx + 4.5} ${i === 2 ? 62 : 82} ${fx + 2.5} ${i === 2 ? 64 : 84} ${fx} ${i === 2 ? 64 : 84} C${fx - 2.5} ${i === 2 ? 64 : 84} ${fx - 4.5} ${i === 2 ? 62 : 82} ${fx - 4.5} ${i === 2 ? 58 : 78} C${fx - 4.5} ${i === 2 ? 53 : 73} ${fx} ${i === 2 ? 44 : 64} Z`}
          fill="url(#deepamFlame)"
        />
      ))}
    </motion.svg>
  );
}

function FeatureCardsGrid({ className = '' }) {
  return (
    <div className={`grid grid-cols-3 gap-2 sm:gap-2.5 ${className}`}>
      {HERO_SIX_FEATURES.map(({ Icon, line1, line2, to }) => (
        <Link
          key={line1 + line2}
          to={to}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#F7B928]/45 bg-[#300B32]/85 px-2 py-2.5 text-center shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#F7B928] hover:bg-[#3E1041]/90 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2 lg:text-left"
        >
          <Icon />
          <span className="text-[11px] font-medium leading-tight text-white sm:text-xs">
            {line1}
            <br />
            <span className="text-white/95">{line2}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const { data, loading, error, reload } = useFetch('/pujas', { featured: 'true', limit: 6 });
  const [searchText, setSearchText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isDeletingPlaceholder, setIsDeletingPlaceholder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentPhrase = SEARCH_PHRASES[phraseIdx];
    let timer;
    if (!isDeletingPlaceholder && typedPlaceholder.length < currentPhrase.length) {
      timer = setTimeout(() => {
        setTypedPlaceholder(currentPhrase.slice(0, typedPlaceholder.length + 1));
      }, 55);
    } else if (!isDeletingPlaceholder && typedPlaceholder.length === currentPhrase.length) {
      timer = setTimeout(() => {
        setIsDeletingPlaceholder(true);
      }, 1800);
    } else if (isDeletingPlaceholder && typedPlaceholder.length > 0) {
      timer = setTimeout(() => {
        setTypedPlaceholder(currentPhrase.slice(0, typedPlaceholder.length - 1));
      }, 28);
    } else if (isDeletingPlaceholder && typedPlaceholder.length === 0) {
      setIsDeletingPlaceholder(false);
      setPhraseIdx((prev) => (prev + 1) % SEARCH_PHRASES.length);
    }
    return () => clearTimeout(timer);
  }, [typedPlaceholder, isDeletingPlaceholder, phraseIdx]);

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
      {/* Hero Section — Deep Purple #300B32, Primary Gold #F7B928, Secondary Orange #F58216 */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#300B32] text-white lg:min-h-[calc(100vh-4rem)] lg:w-full lg:flex-row lg:items-center">
        {/* Warm Ambient Gradient Overlay (Identical rich warm amber-purple glow on Mobile & Desktop) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 60% 45%, rgba(245, 130, 22, 0.34) 0%, rgba(247, 185, 40, 0.16) 38%, rgba(48, 11, 50, 0.95) 76%)',
          }}
        />

        {/* Animated Swaying Hanging Diyas on Top-Left */}
        <HangingDiyas />

        {/* Continuously Rotating Top-Right Sacred Lotus Mandala Chakra */}
        <motion.svg
          viewBox="0 0 220 220"
          className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 opacity-25 lg:-right-10 lg:-top-10 lg:h-80 lg:w-80 lg:opacity-20"
          fill="none"
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="110" cy="110" r="96" stroke="#F7B928" strokeWidth="1.4" strokeDasharray="5 5" />
          <circle cx="110" cy="110" r="72" stroke="#F58216" strokeWidth="1.2" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx="110"
              cy="50"
              rx="15"
              ry="42"
              stroke="#F7B928"
              strokeWidth="1.3"
              transform={`rotate(${i * 30} 110 110)`}
            />
          ))}
        </motion.svg>

        {/* Floating Golden Divya Jyoti Sparkle Particles */}
        {SPARKLE_PARTICLES.map((sp, i) => (
          <motion.span
            key={i}
            style={{ left: sp.left, top: sp.top, width: sp.size, height: sp.size }}
            className="pointer-events-none absolute rounded-full bg-[#F7B928] shadow-[0_0_10px_#F7B928]"
            animate={{
              y: [0, -28, 0],
              opacity: [0.2, 0.9, 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: sp.dur,
              delay: sp.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Warm Illuminated Charminar Silhouette in Center Backdrop (Desktop) */}
        <div className="pointer-events-none absolute inset-y-0 left-[46%] hidden w-[360px] -translate-x-1/2 items-center justify-center lg:flex">
          <div className="relative h-80 w-full">
            <img
              src="/images/charminar-bg.jpg"
              alt=""
              className="h-full w-full object-cover opacity-40 mix-blend-screen"
              style={{
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 72%)',
                filter: 'sepia(1) hue-rotate(-10deg) saturate(3) brightness(1.05)',
              }}
            />
          </div>
        </div>

        <div className="container-x relative z-10 grid w-full items-center gap-5 pt-6 pb-2 sm:py-8 lg:grid-cols-12 lg:gap-6">
          {/* Left Column (Heading, Divider, Subtitle, Search Bar + Desktop Feature Cards) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center lg:col-span-6 lg:text-left"
          >
            {/* 3-Line Serif Heading */}
            <h1 className="font-serif text-[2.35rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Book Pujas, Buy
              <br />
              Puja Items &amp;
              <br />
              <span className="text-[#F7B928]">Spiritual Essentials</span>
            </h1>

            {/* Ornamental Gold Om Divider */}
            <OmOrnamentDivider />

            {/* Subtitle with Shield-Check Icon on Mobile */}
            <div className="mx-auto flex max-w-md items-center justify-center gap-2.5 text-left lg:mx-0 lg:max-w-xl lg:justify-start">
              <span className="shrink-0 lg:hidden">
                <IconShieldSvg />
              </span>
              <p className="text-xs font-medium leading-snug text-white/95 sm:text-base">
                <span className="hidden lg:inline">• </span>Your Trusted Platform for Online Puja, Puja Items &amp; Verified Priests in Hyderabad.
              </p>
            </div>

            {/* White Pill Search Bar with Gold/Orange CTA */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-4 flex max-w-xl items-center gap-1.5 rounded-full border border-[#F7B928]/45 bg-white p-1.5 shadow-xl lg:mx-0"
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-[#300B32]" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={typedPlaceholder || 'Search for Pujas, Homams, Items...'}
                className="w-full min-w-0 bg-transparent px-1.5 py-1 text-xs text-[#300B32] outline-none placeholder:text-[#300B32]/65 sm:text-sm"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-4 py-2 text-xs font-extrabold text-[#300B32] shadow-md transition hover:brightness-105 active:scale-[0.98] sm:px-6"
              >
                Get Started →
              </button>
            </form>

            {/* Desktop 6 Feature Cards in 3x2 Grid */}
            <FeatureCardsGrid className="mt-5 hidden lg:grid" />
          </motion.div>

          {/* Right Column — Large Wide Cusped Sacred Temple Arch Shape + Mobile 3x2 Feature Cards Below Arch */}
          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-6"
          >
            {/* Pulsing Golden-Orange Aura Behind Arch */}
            <motion.div
              animate={{ scale: [0.96, 1.05, 0.96], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-tr from-[#F58216]/35 via-[#F7B928]/25 to-transparent blur-2xl"
            />

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto w-full max-w-[680px] lg:scale-[1.04]"
            >
              <svg
                viewBox="0 0 640 480"
                className="w-full drop-shadow-[0_22px_48px_rgba(0,0,0,0.75)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Extra-Wide & Tall Cusped Temple Arch Clip Path */}
                  <clipPath id="wideTempleArchClip">
                    <path d="M 320 8 C 358 46, 422 52, 466 76 C 562 76, 632 138, 632 226 L 632 352 C 632 404, 590 434, 536 434 L 104 434 C 50 434, 8 404, 8 352 L 8 226 C 8 138, 78 76, 174 76 C 218 52, 282 46, 320 8 Z" />
                  </clipPath>
                  <linearGradient id="wideArchGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="28%" stopColor="#F7B928" />
                    <stop offset="65%" stopColor="#F58216" />
                    <stop offset="100%" stopColor="#F7B928" />
                  </linearGradient>
                  <radialGradient id="kalashBrass" cx="0.38" cy="0.35" r="0.65">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="32%" stopColor="#F7B928" />
                    <stop offset="72%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#78350F" />
                  </radialGradient>
                </defs>

                {/* Full Landscape Family & Priest Havan Image Rising From Bottom Inside Wide Arch */}
                <g clipPath="url(#wideTempleArchClip)">
                  <motion.image
                    href="/images/hero-puja.jpg"
                    x="6"
                    y="6"
                    width="628"
                    height="432"
                    preserveAspectRatio="none"
                    initial={{ y: 110, opacity: 0, scale: 1.05 }}
                    animate={{ y: 6, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.95, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </g>

                {/* Outer Glowing Golden Arch Border */}
                <path
                  d="M 320 8 C 358 46, 422 52, 466 76 C 562 76, 632 138, 632 226 L 632 352 C 632 404, 590 434, 536 434 L 104 434 C 50 434, 8 404, 8 352 L 8 226 C 8 138, 78 76, 174 76 C 218 52, 282 46, 320 8 Z"
                  fill="none"
                  stroke="url(#wideArchGold)"
                  strokeWidth="7.5"
                  strokeLinejoin="round"
                />
                {/* Inner Fine Gold Trim */}
                <path
                  d="M 320 17 C 356 52, 418 58, 461 82 C 554 82, 622 142, 622 226 L 622 350 C 622 398, 584 426, 532 426 L 108 426 C 56 426, 18 398, 18 350 L 18 226 C 18 142, 86 82, 179 82 C 222 58, 284 52, 320 17 Z"
                  fill="none"
                  stroke="#FFFBEB"
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Centered Bottom Kalash, Mango Leaves, Yellow & Red Flowers (Exact match with desktop view) */}
                <g transform="translate(320, 428)">
                  {/* Left & Right Green Mango Leaves at Base */}
                  <path d="M -52 12 C -85 -4, -120 8, -138 26 C -106 32, -74 26, -52 12 Z" fill="#16A34A" />
                  <path d="M -46 22 C -76 16, -104 28, -118 42 C -88 42, -64 34, -46 22 Z" fill="#15803D" />
                  <path d="M 52 12 C 85 -4, 120 8, 138 26 C 106 32, 74 26, 52 12 Z" fill="#16A34A" />
                  <path d="M 46 22 C 76 16, 104 28, 118 42 C 88 42, 64 34, 46 22 Z" fill="#15803D" />

                  {/* Outer Yellow/Orange Marigold Flowers */}
                  <g transform="translate(-76, 18)">
                    <circle cx="0" cy="0" r="18" fill="#F7B928" />
                    <circle cx="0" cy="0" r="11" fill="#F58216" />
                    <circle cx="0" cy="0" r="5" fill="#FACC15" />
                  </g>
                  <g transform="translate(76, 18)">
                    <circle cx="0" cy="0" r="18" fill="#F7B928" />
                    <circle cx="0" cy="0" r="11" fill="#F58216" />
                    <circle cx="0" cy="0" r="5" fill="#FACC15" />
                  </g>

                  {/* Inner Red Flowers */}
                  <circle cx="-48" cy="24" r="11" fill="#DC2626" />
                  <circle cx="-48" cy="24" r="5" fill="#F7B928" />
                  <circle cx="48" cy="24" r="11" fill="#DC2626" />
                  <circle cx="48" cy="24" r="5" fill="#F7B928" />

                  {/* Top Mango Leaves & Coconut on Kalash */}
                  <path d="M -12 -32 C -32 -48, -46 -38, -48 -20 C -32 -20, -20 -26, -12 -32 Z" fill="#16A34A" />
                  <path d="M 12 -32 C 32 -48, 46 -38, 48 -20 C 32 -20, 20 -26, 12 -32 Z" fill="#16A34A" />
                  <path d="M 0 -52 C -14 -40, -18 -24, 0 -18 C 18 -24, 14 -40, 0 -52 Z" fill="#15803D" />

                  {/* Brass Kalash Rim & Body */}
                  <ellipse cx="0" cy="-22" rx="24" ry="5.5" fill="url(#kalashBrass)" stroke="#F7B928" strokeWidth="1" />
                  <path d="M -20 -22 H 20 L 16 -12 H -16 Z" fill="url(#kalashBrass)" />
                  <ellipse cx="0" cy="14" rx="40" ry="31" fill="url(#kalashBrass)" stroke="#F7B928" strokeWidth="1.5" />
                  <text x="0" y="23" textAnchor="middle" fill="#B91C1C" fontSize="22" fontWeight="bold" fontFamily="serif">
                    ॐ
                  </text>
                </g>
              </svg>
            </motion.div>

            {/* Mobile 3x2 Feature Cards Placed Directly Below the Arch */}
            <FeatureCardsGrid className="mt-3 lg:hidden" />
          </motion.div>
        </div>

        {/* Bottom Illuminated Golden Charminar Panorama on Mobile */}
        <div className="pointer-events-none relative mt-2 h-36 w-full overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#300B32] via-transparent to-[#300B32] z-10" />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 65%, rgba(247, 185, 40, 0.45) 0%, rgba(245, 130, 22, 0.2) 45%, transparent 75%)',
            }}
          />
          <img
            src="/images/charminar-bg.jpg"
            alt="Charminar Hyderabad"
            className="mx-auto h-full w-full max-w-md object-cover object-center opacity-75 mix-blend-screen"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 82%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 82%)',
              filter: 'sepia(1) hue-rotate(-10deg) saturate(3.2) brightness(1.1)',
            }}
          />
        </div>
      </section>

      {/* 6 Visual Category Cards */}
      <section className="container-x mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-[#300B32] sm:text-3xl">Explore by Category</h2>
          <Link to="/pujas" className="text-xs font-bold text-[#F58216] hover:underline">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              to={cat.to}
              className="group overflow-hidden rounded-2xl border border-[#F7B928]/60 bg-white text-center shadow-sm hover:-translate-y-1 hover:border-[#F58216] hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-200"
            >
              <div className="h-28 w-full overflow-hidden bg-[#300B32]">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="font-serif text-base font-bold text-[#300B32] group-hover:text-[#F58216]">
                  {cat.title}
                </div>
                <div className="text-[11px] text-[#300B32]/75">{cat.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Pujas & Homams Grid */}
      <section className="container-x mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#300B32] sm:text-3xl">
              Popular Pujas &amp; Homams
            </h2>
            <p className="text-xs text-[#300B32]/80">
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

      {/* Shop Puja Items Online Section */}
      <section className="container-x mt-14">
        <div className="rounded-3xl border-2 border-[#F7B928]/70 bg-[#300B32] p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F7B928] bg-[#431146] text-[#F7B928] shadow">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#F7B928] sm:text-3xl">
                  Shop Puja Items Online
                </h2>
                <p className="text-xs text-white/90">All Your Spiritual Needs in One Place</p>
              </div>
            </div>
            <Link
              to="/pujas?hasSamagri=true"
              className="rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-5 py-2 text-xs font-extrabold text-[#300B32] shadow hover:brightness-105 active:scale-[0.98]"
            >
              View All Kits <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PUJA_ITEMS_SHOP.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className="group overflow-hidden rounded-2xl border border-[#F7B928]/55 bg-white text-center text-[#300B32] shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              >
                <div className="relative h-32 w-full overflow-hidden bg-cream-100">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-[#300B32]/90 px-2 py-0.5 text-[10px] font-bold text-[#F7B928]">
                    {item.price}
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-serif text-base font-bold leading-snug text-[#300B32] group-hover:text-[#F58216]">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#300B32]/75">{item.tag}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
