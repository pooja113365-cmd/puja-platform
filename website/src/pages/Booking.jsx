import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sparkles, Info } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { payForBooking } from '../services/payment';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PanditCard from '../components/PanditCard';
import { PanditGridSkeleton } from '../components/PanditCardSkeleton';
import { SlotGridSkeleton, ProfileHeaderSkeleton, ErrorState, EmptyState } from '../components/States';
import { inr, toYMD, fmtDate, LOCATION_LABEL } from '../utils/format';

const STEPS = ['Package', 'Date & Muhurtham', 'Location', 'Purohit', 'Review & Pay'];
const ADVANCE_PERCENT = 30;

export default function Booking() {
  const { pujaId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: puja, loading, error, reload } = useFetch(`/pujas/${pujaId}`);
  const { data: opts } = useFetch('/pandits/options');

  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    tierName: sp.get('tier') || '', date: '', slot: null, language: '', locationType: '',
    address: { line1: '', line2: '', city: 'Hyderabad', state: 'Telangana', pincode: '' },
    includeSamagri: true, paymentOption: 'advance', panditMode: 'auto', panditId: '', notes: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const tier = puja?.priceTiers.find((t) => t.name === f.tierName);
  const today = toYMD(new Date());

  const slotsUrl = f.date ? '/muhurthams/slots' : null;
  const slotsQ = useFetch(slotsUrl, { date: f.date });
  const slots = useMemo(() => {
    const list = slotsQ.data || [];
    if (f.date !== today) return list;
    const cutoff = new Date(Date.now() + 2 * 3600 * 1000);
    const hhmm = `${String(cutoff.getHours()).padStart(2, '0')}:${String(cutoff.getMinutes()).padStart(2, '0')}`;
    return list.filter((s) => s.startTime > hhmm);
  }, [slotsQ.data, f.date, today]);

  const panditsQ = useFetch(
    step === 3 && f.panditMode === 'choose' && puja && f.slot ? '/pandits' : null,
    puja && f.slot ? { specialization: puja.category, language: f.language, date: f.date, startTime: f.slot.startTime, endTime: f.slot.endTime, limit: 50 } : {}
  );
  const chosen = panditsQ.data?.find((p) => p._id === f.panditId);

  useEffect(() => {
    if (puja) {
      setF((s) => ({
        ...s,
        tierName: s.tierName || puja.priceTiers[0].name,
        locationType: s.locationType || puja.locationTypes[0],
        includeSamagri: Boolean(puja.samagriKit),
      }));
    }
  }, [puja]);

  const total = (tier?.price || 0) + (f.includeSamagri && f.locationType !== 'online' && puja?.samagriKit ? puja.samagriKit.price : 0);
  const payNow = f.paymentOption === 'full' ? total : Math.round(total * ADVANCE_PERCENT) / 100;

  if (user && user.role !== 'customer') {
    return <EmptyState title="Customer account required" message="Please log in with a customer account to book a puja." />;
  }
  if (loading) return <ProfileHeaderSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!puja) return null;

  const needsAddress = f.locationType === 'home';
  const addrOk = !needsAddress || (f.address.line1.trim() && f.address.city.trim() && /^\d{6}$/.test(f.address.pincode));
  const canNext = [
    Boolean(f.tierName),
    Boolean(f.date && f.slot && f.language),
    Boolean(f.locationType && addrOk),
    f.panditMode === 'auto' || Boolean(f.panditId),
  ][step];

  const submit = async () => {
    setSubmitError('');
    setBusy(true);
    let booking;
    try {
      const res = await api.post('/bookings', {
        pujaId: puja._id,
        tierName: f.tierName,
        date: f.date,
        timeSlot: { label: f.slot.label, startTime: f.slot.startTime, endTime: f.slot.endTime },
        language: f.language,
        locationType: f.locationType,
        address: f.locationType === 'online' ? undefined : f.address,
        includeSamagri: f.includeSamagri && f.locationType !== 'online',
        paymentOption: f.paymentOption,
        panditId: f.panditMode === 'choose' ? f.panditId : undefined,
        notes: f.notes || undefined,
      });
      booking = res.data.data;
    } catch (err) {
      setSubmitError(errorMessage(err));
      setBusy(false);
      return;
    }
    try {
      const outcome = await payForBooking(booking._id);
      navigate(`/bookings/${booking._id}`, { replace: true, state: { notice: outcome === 'paid' ? 'Payment successful! Your booking is confirmed.' : 'Booking created. Complete the payment to confirm it.' } });
    } catch (err) {
      navigate(`/bookings/${booking._id}`, { replace: true, state: { notice: `Booking created, but payment did not complete: ${errorMessage(err)}` } });
    }
  };

  return (
    <div className="container-x py-10">
      <Link to={`/pujas/${puja._id}`} className="text-sm font-semibold text-saffron-600 hover:underline">
        ← {puja.name}
      </Link>
      <h1 className="mt-2 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">Book {puja.name}</h1>

      {/* Connected Step Wizard Progress Track with Smooth Framer Motion Progress Bar */}
      <div className="card mt-6 border-gold-300/80 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-maroon-800">
          <span>
            Step {step + 1} of {STEPS.length}: <b className="text-maroon-900">{STEPS[step]}</b>
          </span>
          <span className="text-saffron-600">{Math.round(((step + 1) / STEPS.length) * 100)}% Complete</span>
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-amber-900/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-saffron-500 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>
        <ol className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      active
                        ? 'bg-maroon-800 text-gold-300 shadow-md ring-2 ring-amber-400'
                        : done
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-gold-300 bg-cream-100 text-maroon-700/60'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4 stroke-[2.5]" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-xs font-bold sm:inline ${
                      active ? 'text-maroon-900' : done ? 'text-emerald-800' : 'text-maroon-700/50'
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 h-1 flex-1 overflow-hidden rounded-full bg-cream-200 sm:mx-4">
                    <motion.div
                      className={`h-full ${done ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      initial={{ width: '0%' }}
                      animate={{ width: done ? '100%' : active ? '50%' : '0%' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden border-gold-300/80 p-6 shadow-md lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && (
                <div className="space-y-3">
                  <h2 className="font-serif text-2xl font-bold text-maroon-900">Choose a Vedic Package</h2>
                  {puja.priceTiers.map((t) => (
                    <label
                      key={t.name}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                        f.tierName === t.name
                          ? 'border-saffron-500 bg-saffron-50/70 shadow-sm'
                          : 'border-gold-300/60 hover:bg-cream-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tier"
                          checked={f.tierName === t.name}
                          onChange={() => set({ tierName: t.name })}
                        />
                        <span>
                          <b className="text-base text-maroon-900">{t.name}</b>
                          {t.description && (
                            <span className="block text-xs text-maroon-700/80">{t.description}</span>
                          )}
                        </span>
                      </span>
                      <b className="text-lg font-bold text-maroon-900">{inr(t.price)}</b>
                    </label>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-2xl font-bold text-maroon-900">
                    Select Date, Shubh Muhurtham &amp; Mantra Language
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="date">Ceremony Date</label>
                      <input
                        id="date"
                        type="date"
                        min={today}
                        className="input"
                        value={f.date}
                        onChange={(e) => set({ date: e.target.value, slot: null })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="lang">Preferred Mantra Language</label>
                      <select
                        id="lang"
                        className="input"
                        value={f.language}
                        onChange={(e) => set({ language: e.target.value, panditId: '' })}
                      >
                        <option value="">Select language (e.g., Telugu)</option>
                        {(opts?.languages || []).map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {f.date && (
                    <div>
                      <span className="label">Available Muhurtham &amp; Time Windows</span>
                      {slotsQ.loading && <SlotGridSkeleton count={4} />}
                      {slotsQ.error && <ErrorState message={slotsQ.error} onRetry={slotsQ.reload} />}
                      {!slotsQ.loading && !slotsQ.error && slots.length === 0 && (
                        <p className="text-sm text-maroon-700">
                          No slots left for this date. Please pick another day.
                        </p>
                      )}
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {slots.map((s) => {
                          const sel = f.slot?.label === s.label && f.slot?.startTime === s.startTime;
                          return (
                            <button
                              type="button"
                              key={`${s.label}-${s.startTime}`}
                              onClick={() => set({ slot: s })}
                              className={`rounded-xl border p-3.5 text-left text-sm transition ${
                                sel
                                  ? 'border-saffron-500 bg-saffron-50 shadow-sm ring-1 ring-saffron-500'
                                  : 'border-gold-300/70 hover:bg-cream-100'
                              }`}
                            >
                              <span className="flex items-center justify-between font-bold text-maroon-900">
                                <span className="flex items-center gap-1">
                                  {s.auspicious && <Sparkles className="h-4 w-4 text-gold-500" />}
                                  {s.label}
                                </span>
                                {s.auspicious && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                    SHUBH
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-xs text-maroon-700">
                                {s.startTime} – {s.endTime}
                                {s.notes ? ` · ${s.notes}` : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-maroon-900">
                    Venue &amp; Samagri Kit Delivery
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {puja.locationTypes.map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() =>
                          set({
                            locationType: l,
                            includeSamagri: l === 'online' ? false : f.includeSamagri,
                          })
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                          f.locationType === l
                            ? 'border-saffron-500 bg-saffron-500 text-white shadow'
                            : 'border-gold-300 hover:bg-cream-100'
                        }`}
                      >
                        {LOCATION_LABEL[l]}
                      </button>
                    ))}
                  </div>
                  {f.locationType === 'online' && (
                    <p className="rounded-xl bg-cream-100 p-4 text-sm">
                      Your Veda Patasala Acharya will share a live interactive video sankalpam link on your booking dashboard before the ceremony.
                    </p>
                  )}
                  {f.locationType !== 'online' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="label">House / Flat / Plot &amp; Street {needsAddress && '*'}</label>
                        <input
                          className="input"
                          placeholder="e.g., Flat 402, My Home Bhooja, Madhapur"
                          value={f.address.line1}
                          onChange={(e) => set({ address: { ...f.address, line1: e.target.value } })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Landmark / Locality</label>
                        <input
                          className="input"
                          placeholder="e.g., Near Raidurg Metro Station, Gachibowli"
                          value={f.address.line2}
                          onChange={(e) => set({ address: { ...f.address, line2: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="label">City {needsAddress && '*'}</label>
                        <input
                          className="input"
                          value={f.address.city}
                          onChange={(e) => set({ address: { ...f.address, city: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input
                          className="input"
                          value={f.address.state}
                          onChange={(e) => set({ address: { ...f.address, state: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label className="label">Pincode {needsAddress && '*'}</label>
                        <input
                          className="input"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="500081"
                          value={f.address.pincode}
                          onChange={(e) =>
                            set({ address: { ...f.address, pincode: e.target.value.replace(/\D/g, '') } })
                          }
                        />
                      </div>
                    </div>
                  )}
                  {f.locationType !== 'online' && puja.samagriKit && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={f.includeSamagri}
                        onChange={(e) => set({ includeSamagri: e.target.checked })}
                      />
                      <span>
                        <b className="text-maroon-900">Include {puja.samagriKit.name}</b> —{' '}
                        <b className="text-emerald-800">{inr(puja.samagriKit.price)}</b>
                        <span className="block text-xs text-maroon-700/80">
                          Complete Vedic dravyas, Kalash, Navadhanya, pure cow ghee &amp; Havan samagri delivered to your doorstep.
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-maroon-900">
                    Assign a Certified Veda Patasala Scholar
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => set({ panditMode: 'auto', panditId: '' })}
                      className={`rounded-xl border p-4 text-left transition ${
                        f.panditMode === 'auto'
                          ? 'border-saffron-500 bg-saffron-50 shadow-sm'
                          : 'border-gold-300/60'
                      }`}
                    >
                      <b>Auto-Match Senior Acharya (Recommended)</b>
                      <span className="mt-1 block text-xs text-maroon-700/80">
                        We assign the highest-rated available scholar fluent in {f.language || 'your language'}.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ panditMode: 'choose' })}
                      className={`rounded-xl border p-4 text-left transition ${
                        f.panditMode === 'choose'
                          ? 'border-saffron-500 bg-saffron-50 shadow-sm'
                          : 'border-gold-300/60'
                      }`}
                    >
                      <b>Hand-Pick My Purohit</b>
                      <span className="mt-1 block text-xs text-maroon-700/80">
                        Browse scholars available for your selected Muhurtham window.
                      </span>
                    </button>
                  </div>
                  {f.panditMode === 'choose' && (
                    <>
                      {panditsQ.loading && <PanditGridSkeleton count={2} />}
                      {panditsQ.error && <ErrorState message={panditsQ.error} onRetry={panditsQ.reload} />}
                      {panditsQ.data?.length === 0 && (
                        <EmptyState
                          title="No purohits available for this exact filter"
                          message="Try Auto-Match or pick another language/slot."
                        />
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(panditsQ.data || []).map((p) => (
                          <PanditCard
                            key={p._id}
                            pandit={p}
                            selected={f.panditId === p._id}
                            onSelect={() => set({ panditId: p._id })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-2xl font-bold text-maroon-900">
                    Review Sankalpam &amp; Secure Payment
                  </h2>
                  <dl className="grid gap-3 rounded-xl bg-cream-100 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="label">Ritual &amp; Package</dt>
                      <dd className="font-semibold text-maroon-900">
                        {puja.name} — {f.tierName}
                      </dd>
                    </div>
                    <div>
                      <dt className="label">Date &amp; Muhurtham</dt>
                      <dd className="font-semibold text-maroon-900">
                        {fmtDate(f.date)}, {f.slot.label} ({f.slot.startTime}–{f.slot.endTime})
                      </dd>
                    </div>
                    <div>
                      <dt className="label">Mantra Language</dt>
                      <dd className="font-semibold text-maroon-900">{f.language}</dd>
                    </div>
                    <div>
                      <dt className="label">Venue</dt>
                      <dd className="font-semibold text-maroon-900">
                        {LOCATION_LABEL[f.locationType]}
                        {f.locationType !== 'online' && f.address.city
                          ? ` — ${f.address.line1}, ${f.address.city}`
                          : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="label">Vedic Scholar</dt>
                      <dd className="font-semibold text-maroon-900">
                        {f.panditMode === 'auto'
                          ? 'Auto-matched Senior Acharya'
                          : chosen?.user?.name || 'Selected Scholar'}
                      </dd>
                    </div>
                    <div>
                      <dt className="label">Samagri Kit</dt>
                      <dd className="font-semibold text-maroon-900">
                        {f.includeSamagri && f.locationType !== 'online' ? '✓ Included' : 'Self-arranged'}
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <label className="label" htmlFor="notes">
                      Gotra, Nakshatra or Special Notes for Acharya (optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      maxLength={500}
                      placeholder="e.g., Bharadwaja Gotram, Rohini Nakshatram, East-facing entrance…"
                      className="input"
                      value={f.notes}
                      onChange={(e) => set({ notes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="label">Payment Option</span>
                    {[
                      ['advance', `Pay ${ADVANCE_PERCENT}% Advance Now (${inr(Math.round(total * ADVANCE_PERCENT) / 100)}) — Lock Muhurtham`],
                      ['full', `Pay 100% Full Amount Now (${inr(total)})`],
                    ].map(([v, l]) => (
                      <label
                        key={v}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm font-medium ${
                          f.paymentOption === v
                            ? 'border-saffron-500 bg-saffron-50'
                            : 'border-gold-300/60'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={f.paymentOption === v}
                          onChange={() => set({ paymentOption: v })}
                        />{' '}
                        {l}
                      </label>
                    ))}
                  </div>
                  {submitError && (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between border-t border-gold-300/40 pt-5">
            <button
              className="btn-outline"
              disabled={step === 0 || busy}
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < 4 ? (
              <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                className="btn-primary !px-7 active:scale-[0.98]"
                disabled={busy}
                onClick={submit}
              >
                {busy ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Processing Payment…</span>
                  </>
                ) : (
                  `Confirm & Proceed to Payment (${inr(payNow)})`
                )}
              </button>
            )}
          </div>
        </div>

        <aside className="card h-fit border-gold-400/80 p-5 text-sm shadow-md lg:sticky lg:top-28">
          <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-600">
            VedaPujas Summary
          </span>
          <h3 className="mt-0.5 font-serif text-xl font-bold text-maroon-900">{puja.name}</h3>
          <div className="mt-3 flex justify-between">
            <span>{f.tierName || 'Package'} Dakshina</span>
            <b>{inr(tier?.price)}</b>
          </div>
          {f.includeSamagri && f.locationType !== 'online' && puja.samagriKit && (
            <div className="mt-1.5 flex justify-between text-emerald-800">
              <span>+ {puja.samagriKit.name}</span>
              <b>{inr(puja.samagriKit.price)}</b>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-gold-300/50 pt-3 text-base font-bold text-maroon-900">
            <span>Total Ritual Dakshina</span>
            <span>{inr(total)}</span>
          </div>
          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <div className="flex justify-between font-bold text-saffron-700">
              <span>Payable Now ({f.paymentOption === 'full' ? '100%' : '30% Advance'})</span>
              <span>{inr(payNow)}</span>
            </div>
            {f.paymentOption === 'advance' && (
              <p className="mt-1.5 flex items-start gap-1.5 border-t border-amber-200/80 pt-1.5 text-[11px] leading-relaxed text-maroon-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>
                  <b>Balance Dakshina ({inr(Math.max(total - payNow, 0))} · 70%):</b> Payable after Sankalpam &amp; ritual completion via UPI or online dashboard.
                </span>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
