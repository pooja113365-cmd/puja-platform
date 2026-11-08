import { useState } from 'react';
import { X, CheckCircle2, Sparkles, Phone, User, Calendar, MapPin, FileText, Globe } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toYMD } from '../utils/format';

const LANGUAGES = ['Telugu', 'Hindi', 'Sanskrit', 'Tamil', 'Kannada', 'English'];
const TIME_WINDOWS = [
  { label: 'Morning (07:30 – 10:00 AM)', startTime: '07:30', endTime: '10:00' },
  { label: 'Forenoon (10:30 – 01:00 PM)', startTime: '10:30', endTime: '13:00' },
  { label: 'Evening (05:00 – 07:30 PM)', startTime: '17:00', endTime: '19:30' },
  { label: 'Flexible / Consult Priest', startTime: '08:00', endTime: '10:00' },
];

export default function BookServiceModal({ initialData = {}, onClose }) {
  const { user } = useAuth();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toYMD(d);
  })();

  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    serviceTitle: initialData.serviceTitle || 'Vedic Puja / Homam Service',
    tierName: initialData.tierName || 'Standard',
    date: tomorrow,
    slotIndex: 0,
    language: 'Telugu',
    locationType: 'home',
    area: '',
    city: 'Hyderabad',
    pincode: '500081',
    includeSamagri: initialData.defaultSamagri !== false,
    serviceDetails: '',
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    const cleanPhone = form.customerPhone.replace(/\D/g, '').slice(-10);
    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      setErr('Please enter your full name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErr('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!form.serviceDetails.trim()) {
      setErr('Please explain the details of the puja or service you need.');
      return;
    }

    setBusy(true);
    try {
      const selectedSlot = TIME_WINDOWS[form.slotIndex] || TIME_WINDOWS[0];
      const res = await api.post('/bookings/inquiry', {
        customerName: form.customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: form.customerEmail.trim() || undefined,
        pujaId: initialData.puja?._id,
        panditId: initialData.pandit?._id,
        serviceTitle: form.serviceTitle.trim(),
        tierName: form.tierName,
        date: form.date || tomorrow,
        timeSlot: selectedSlot,
        language: form.language,
        locationType: form.locationType,
        address: {
          line1: form.area.trim() || 'Hyderabad',
          city: form.city.trim() || 'Hyderabad',
          state: 'Telangana',
          pincode: form.pincode.trim() || '500081',
        },
        includeSamagri: form.includeSamagri,
        serviceDetails: form.serviceDetails.trim(),
      });
      setCreatedBooking(res.data.data);
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-[#F7B928] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sacred Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F7B928]/40 bg-[#300B32] px-4 py-3 text-white sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F7B928] bg-[#431146] text-[#F7B928]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold leading-tight text-[#F7B928] sm:text-xl">
                Book Your Puja / Service
              </h2>
              <p className="text-[11px] text-white/85">
                Share your details &amp; requirements — our Vedic desk will assist you
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {createdBooking ? (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#300B32]">
              Booking Request Received!
            </h3>
            <p className="text-sm text-[#300B32]/80">
              Namaste <b>{createdBooking.customerName || form.customerName}</b>, your booking details have been saved in our CRM. Our Vedic coordinator will call you shortly on <b>+91 {createdBooking.customerPhone || form.customerPhone}</b>.
            </p>
            <div className="mx-auto max-w-md rounded-2xl border border-[#F7B928]/60 bg-amber-50/70 p-4 text-left text-xs text-[#300B32] space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-[#300B32]/70">Booking Reference:</span>
                <span className="rounded bg-[#300B32] px-2 py-0.5 font-mono font-bold text-[#F7B928]">
                  #{createdBooking.bookingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#300B32]/70">Service:</span>
                <span className="font-bold">{createdBooking.serviceTitle || form.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#300B32]/70">Preferred Date &amp; Language:</span>
                <span>{createdBooking.date} · {createdBooking.language}</span>
              </div>
              <div className="border-t border-[#F7B928]/40 pt-1.5">
                <span className="font-semibold text-[#300B32]/70">Your Requirement Details:</span>
                <p className="mt-0.5 text-[#300B32]">{createdBooking.serviceDetails || form.serviceDetails}</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-8 py-2.5 text-sm font-extrabold text-[#300B32] shadow-md hover:brightness-105"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden text-xs sm:text-sm">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {err && (
                <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
                  {err}
                </div>
              )}

              {/* Name & Mobile Number */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <User className="h-3.5 w-3.5 text-[#F58216]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={form.customerName}
                    onChange={(e) => update({ customerName: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <Phone className="h-3.5 w-3.5 text-[#F58216]" /> Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={form.customerPhone}
                    onChange={(e) => update({ customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  />
                </div>
              </div>

              {/* Service Name & Preferred Language */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <Sparkles className="h-3.5 w-3.5 text-[#F58216]" /> Service / Puja Needed *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Satyanarayan Puja..."
                    value={form.serviceTitle}
                    onChange={(e) => update({ serviceTitle: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <Globe className="h-3.5 w-3.5 text-[#F58216]" /> Preferred Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => update({ language: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Date & Time Window */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <Calendar className="h-3.5 w-3.5 text-[#F58216]" /> Preferred Date
                  </label>
                  <input
                    type="date"
                    min={toYMD(new Date())}
                    value={form.date}
                    onChange={(e) => update({ date: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    Preferred Time Slot
                  </label>
                  <select
                    value={form.slotIndex}
                    onChange={(e) => update({ slotIndex: Number(e.target.value) })}
                    className="input w-full truncate !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  >
                    {TIME_WINDOWS.map((slot, idx) => (
                      <option key={slot.label} value={idx}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Venue Type & Locality / Address */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    <MapPin className="h-3.5 w-3.5 text-[#F58216]" /> Venue Type
                  </label>
                  <select
                    value={form.locationType}
                    onChange={(e) => update({ locationType: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  >
                    <option value="home">At Home / Office</option>
                    <option value="temple">At Temple</option>
                    <option value="online">Online Live e-Puja</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                    Locality / Address (Hyderabad)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Gachibowli, Madhapur..."
                    value={form.area}
                    onChange={(e) => update({ area: e.target.value })}
                    className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                  />
                </div>
              </div>

              {/* Samagri Checkbox */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#F7B928]/50 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-[#300B32]">
                <input
                  type="checkbox"
                  checked={form.includeSamagri}
                  onChange={(e) => update({ includeSamagri: e.target.checked })}
                  className="h-4 w-4 shrink-0 accent-[#F58216]"
                />
                <span>Also include Complete Puja Samagri Kit &amp; Spiritual Items</span>
              </label>

              {/* Detailed Service Explanation Text Box */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#300B32]">
                  <FileText className="h-3.5 w-3.5 text-[#F58216]" /> Explain in Detail About the Service You Need *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the puja, homam, or items you need, family Gotram/Nakshatram, or special ritual requirements..."
                  value={form.serviceDetails}
                  onChange={(e) => update({ serviceDetails: e.target.value })}
                  className="input !py-1.5 border-[#F7B928]/70 focus:border-[#F58216]"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#F7B928]/35 bg-stone-50 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#300B32]/30 px-4 py-1.5 text-xs font-bold text-[#300B32] hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-gradient-to-r from-[#F7B928] to-[#F58216] px-6 py-2 text-xs font-extrabold text-[#300B32] shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50 sm:text-sm"
              >
                {busy ? 'Submitting...' : 'Book Now →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
