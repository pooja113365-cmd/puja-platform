import { Link } from 'react-router-dom';
import { MapPin, PhoneCall, Globe, Building2 } from 'lucide-react';
import { GetPujaLotusLogo } from './Navbar';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gold-400/30 bg-gradient-to-b from-[#2E0938] to-maroon-900 text-cream-200">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <GetPujaLotusLogo className="h-9 w-9" />
            <span className="font-serif text-2xl font-bold text-white">
              Get<span className="text-gold-400">Puja</span>
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-gold-300">
            Book • Shop • Perform • Receive Your Pujas Online
          </p>
          <p className="mt-2 text-xs leading-relaxed text-cream-200/80">
            Your Trusted Platform for Online Puja, Puja Items &amp; Spiritual Services.
          </p>
        </div>

        <div className="text-sm">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-300">Quick Services</h4>
          <ul className="space-y-1.5 text-xs text-cream-200/85">
            <li><Link to="/pujas" className="hover:text-gold-300">Book Pujas &amp; Homams Online</Link></li>
            <li><Link to="/purohits" className="hover:text-gold-300">Verified &amp; Experienced Priests</Link></li>
            <li><Link to="/pujas?location=temple" className="hover:text-gold-300">Temple Services &amp; Special Rituals</Link></li>
            <li><Link to="/pujas?location=online" className="hover:text-gold-300">Attend Pujas Live (Online)</Link></li>
            <li><Link to="/pujas?hasSamagri=true" className="hover:text-gold-300">Shop Puja Items &amp; Samagri Kits</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-300">Company Details</h4>
          <p className="flex items-start gap-2 text-xs font-semibold text-white">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            <span>A Product of INTERNATIONAL BUSINESS NETWORK (IBN)</span>
          </p>
          <p className="mt-2 inline-block rounded-md bg-gold-400/20 border border-gold-400/50 px-2.5 py-1 text-xs font-bold text-gold-300">
            GSTIN: 36AAJFI4057Q1ZQ
          </p>
        </div>

        <div className="text-sm">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold-300">Registered Address</h4>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-cream-200/90">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
            <span>
              2-2-642/1/1, Bharat Nagar, Near Sri Ayyappa Swamy Temple, Secunderabad, Hyderabad, Telangana – 500044
            </span>
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-xs font-semibold text-gold-300">
            <a href="tel:9858945678" className="inline-flex items-center gap-1.5 hover:underline">
              <PhoneCall className="h-3.5 w-3.5 text-saffron-400" /> 9858945678
            </a>
            <span className="inline-flex items-center gap-1.5 text-cream-200/80">
              <Globe className="h-3.5 w-3.5 text-gold-400" /> www.getpuja.com
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-cream-200/60">
        © {new Date().getFullYear()} GetPuja — International Business Network (IBN). All rights reserved.
      </div>
    </footer>
  );
}
