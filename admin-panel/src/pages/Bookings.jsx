import { useMemo, useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  MapPin,
  PackageCheck,
  Package,
  FileText,
  PhoneCall,
  SlidersHorizontal,
  Printer,
  CheckCircle2,
  CalendarClock,
  UserCheck,
  Search,
} from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, fmtDate, fmtDateTime, STATUS_META, NEXT_STATUS, LOCATION_LABEL } from '../utils/format';

function MuhurthamSlipModal({ booking: b, onClose }) {
  if (!b) return null;
  const locality = b.address?.line1
    ? `${b.address.line1}, ${b.address.city || 'Hyderabad'} ${b.address.pincode || ''}`.trim()
    : b.locationType === 'online'
      ? 'Online Live e-Puja (Video Sankalpam)'
      : 'Hyderabad Temple Venue';

  return (
    <Modal title={`Muhurtham & Dispatch Slip — #${b.bookingNumber}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-saffron-700">
                VedaPujas Hyderabad · Official Ritual Dispatch Slip
              </span>
              <h3 className="font-serif text-xl font-bold text-maroon-900">{b.puja?.name}</h3>
            </div>
            <div className="text-right">
              <span className="rounded-lg bg-maroon-900 px-2.5 py-1 font-mono text-xs font-bold text-gold-300">
                #{b.bookingNumber}
              </span>
              <div className="mt-1">
                <StatusBadge status={b.status} meta={STATUS_META} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
                <CalendarClock className="h-3.5 w-3.5 text-saffron-600" /> Auspicious Muhurtham Window
              </div>
              <p className="mt-1 font-semibold text-maroon-900">{fmtDate(b.date)}</p>
              <p className="text-xs text-stone-600">
                {b.timeSlot?.label} · <b>{b.timeSlot?.startTime} – {b.timeSlot?.endTime} IST</b>
              </p>
              <p className="mt-1 text-xs text-maroon-800">
                <b>Mantra Language:</b> {b.language} · <b>Package:</b> {b.tierName}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
                <MapPin className="h-3.5 w-3.5 text-saffron-600" /> Devotee &amp; Hyderabad Locality
              </div>
              <p className="mt-1 font-semibold text-maroon-900">{b.customer?.name}</p>
              <p className="text-xs text-stone-600">
                +91 {b.customer?.phone || '9000000001'} · {b.customer?.email}
              </p>
              <p className="mt-1 text-xs font-medium text-maroon-800">
                {LOCATION_LABEL[b.locationType]}: {locality}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Assigned Veda Patasala Scholar
              </div>
              {b.pandit ? (
                <>
                  <p className="mt-1 font-semibold text-maroon-900">{b.pandit.user?.name}</p>
                  <p className="text-xs text-stone-600">
                    Phone: +91 {b.pandit.user?.phone || '9100000001'} · Verified KYC Scholar
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs font-semibold text-red-700">Pending Purohit Assignment</p>
              )}
            </div>

            <div className="rounded-xl bg-white p-3 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
                <PackageCheck className="h-3.5 w-3.5 text-emerald-600" /> Samagri &amp; Dakshina Summary
              </div>
              <p className="mt-1 text-xs font-semibold text-maroon-900">
                Samagri Status:{' '}
                {b.includeSamagri ? (
                  <span className="text-emerald-700">✓ Doorstep Kit Included ({inr(b.pricing?.samagriPrice)})</span>
                ) : (
                  <span className="text-stone-600">Devotee Self-Arranged Checklist</span>
                )}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                Total: <b>{inr(b.pricing?.total)}</b> · Paid: <b>{inr(b.payment?.amountPaid)}</b> ({b.payment?.status?.replace('_', ' ')})
              </p>
            </div>
          </div>

          {b.notes && (
            <div className="mt-3 rounded-xl bg-white p-3 border border-amber-200/80 text-xs">
              <b className="text-maroon-800">Gotram / Sankalpam Notes:</b> {b.notes}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Verified against VedaPujas Panchangam &amp; Dispatch Ledger
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print Muhurtham Slip
            </button>
            <button type="button" onClick={onClose} className="btn-outline !px-4 !py-2 text-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function BookingModal({ id, onClose, onChanged }) {
  const { data: b, loading, error, reload } = useFetch(`/bookings/${id}`);
  const { data: pandits } = useFetch('/admin/pandits', { kyc: 'approved', limit: 100 });
  const [panditId, setPanditId] = useState('');
  const [link, setLink] = useState('');
  const act = useAction();

  const done = () => {
    reload();
    onChanged();
  };
  const changeStatus = async (status) => {
    let reason;
    if (status === 'cancelled') {
      reason = window.prompt('Cancellation reason:');
      if (!reason) return;
    } else if (!window.confirm(`Mark booking as ${STATUS_META[status].label}?`)) return;
    if (await act.run(() => api.patch(`/bookings/${id}/status`, { status, reason }))) done();
  };

  return (
    <Modal title="Booking Operations & Dispatch" onClose={onClose} wide>
      {loading && !b && <Loader />}
      {error && !b && <ErrorState message={error} onRetry={reload} />}
      {b && (
        <div className="space-y-4 text-sm">
          {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
          <div className="flex items-center gap-2">
            <b className="font-serif text-lg text-maroon-900">{b.puja?.name}</b>
            <StatusBadge status={b.status} meta={STATUS_META} />
            <span className="ml-auto rounded bg-maroon-900 px-2 py-0.5 font-mono text-xs font-bold text-gold-300">
              #{b.bookingNumber}
            </span>
          </div>
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            <p>
              <b>Customer:</b> {b.customer?.name}
              <br />
              +91 {b.customer?.phone || '9000000001'} · {b.customer?.email}
            </p>
            <p>
              <b>Muhurtham Slot:</b> {fmtDate(b.date)}
              <br />
              {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})
            </p>
            <p>
              <b>Locality / Address:</b> {LOCATION_LABEL[b.locationType]}
              {b.address?.line1 ? (
                <>
                  <br />
                  {b.address.line1}, {b.address.city} {b.address.pincode}
                </>
              ) : null}
            </p>
            <p>
              <b>Language / Tier:</b> {b.language} / {b.tierName}
              <br />
              <b>Samagri Kit:</b> {b.includeSamagri ? '✓ Doorstep Kit Included' : 'Self-Arranged Checklist'}
            </p>
            <p>
              <b>Payment:</b> {inr(b.payment.amountPaid)} of {inr(b.pricing.total)} ({b.payment.status.replace('_', ' ')})
              <br />
              Commission {inr(b.pricing.commissionAmount)} · Purohit {inr(b.pricing.panditEarning)}
            </p>
            <p>
              <b>Assigned Purohit:</b>{' '}
              {b.pandit ? (
                `${b.pandit.user?.name} (+91 ${b.pandit.user?.phone || '9100000001'})`
              ) : (
                <span className="font-semibold text-red-700">Not assigned</span>
              )}
            </p>
          </div>
          {b.notes && <p><b>Notes:</b> {b.notes}</p>}
          {b.payment.refundStatus === 'failed' || b.payment.refundStatus === 'manual_required' ? (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              Refund needs manual processing in the Razorpay dashboard.
            </p>
          ) : null}

          {['confirmed', 'pandit_assigned'].includes(b.status) && (
            <div className="rounded-xl border border-amber-300/70 bg-amber-50/50 p-4">
              <b>{b.pandit ? 'Re-assign Purohit' : 'Assign Veda Patasala Purohit'}</b>
              <div className="mt-2 flex flex-wrap gap-2">
                <select className="input max-w-xs" value={panditId} onChange={(e) => setPanditId(e.target.value)}>
                  <option value="">Select verified purohit…</option>
                  {(pandits || [])
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.user?.name} — {p.languages.join('/')}
                      </option>
                    ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!panditId || act.busy}
                  onClick={async () => {
                    if (await act.run(() => api.post(`/bookings/${id}/assign`, { panditId }))) done();
                  }}
                >
                  Assign
                </button>
                {b.status === 'confirmed' && (
                  <button
                    className="btn-outline"
                    disabled={act.busy}
                    onClick={async () => {
                      if (await act.run(() => api.post(`/bookings/${id}/auto-assign`))) done();
                    }}
                  >
                    Auto-match
                  </button>
                )}
              </div>
            </div>
          )}

          {b.locationType === 'online' && !['completed', 'cancelled'].includes(b.status) && (
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="https:// video meeting link"
                value={link || b.meetingLink || ''}
                onChange={(e) => setLink(e.target.value)}
              />
              <button
                className="btn-outline"
                disabled={act.busy || !link}
                onClick={async () => {
                  if (await act.run(() => api.patch(`/bookings/${id}/meeting-link`, { meetingLink: link }))) done();
                }}
              >
                Save link
              </button>
            </div>
          )}

          <div>
            <b>Update Lifecycle Status</b>
            <div className="mt-2 flex flex-wrap gap-2">
              {(NEXT_STATUS[b.status] || []).map((s) => (
                <button
                  key={s}
                  disabled={act.busy}
                  onClick={() => changeStatus(s)}
                  className={s === 'cancelled' ? 'btn-outline !border-red-600 !text-red-700' : 'btn-primary'}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
              {(NEXT_STATUS[b.status] || []).length === 0 && (
                <span className="text-stone-500">No further transitions.</span>
              )}
            </div>
          </div>

          <div>
            <b>Audit Trail</b>
            <ul className="mt-1 space-y-1 text-xs text-stone-600">
              {b.statusHistory.map((h, i) => (
                <li key={i}>
                  {fmtDateTime(h.at)} — <b>{STATUS_META[h.status]?.label || h.status}</b>
                  {h.note ? ` (${h.note})` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Bookings() {
  const [sp, setSp] = useSearchParams();
  const outletCtx = useOutletContext() || {};
  const selectedHub = outletCtx.selectedHub || '';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [slipBooking, setSlipBooking] = useState(null);
  const status = sp.get('status') || '';

  const { data, meta, loading, error, reload } = useFetch('/bookings', {
    status: status || undefined,
    search: search || undefined,
    page,
    limit: 12,
  });

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!selectedHub) return data;
    const matched = data.filter((b) => {
      const addr = `${b.address?.line1 || ''} ${b.address?.city || ''}`.toLowerCase();
      return addr.includes(selectedHub.toLowerCase());
    });
    return matched.length > 0 ? matched : data;
  }, [data, selectedHub]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-maroon-900">
            <SlidersHorizontal className="h-3 w-3 text-saffron-600" />
            {selectedHub ? `📍 ${selectedHub} Hub Dispatch` : 'Master Ritual Dispatch Console'}
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">Bookings &amp; Muhurtham Dispatch</h1>
          <p className="text-sm text-stone-600">
            Monitor Hyderabad locality addresses, Samagri kit packing status, Purohit assignments, and 1-click devotee communications.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card flex flex-wrap items-center gap-3 border border-stone-200/90 bg-white p-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search booking # (e.g. VP-2026...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[13rem]"
          value={status}
          onChange={(e) => {
            const n = new URLSearchParams();
            if (e.target.value) n.set('status', e.target.value);
            setSp(n);
            setPage(1);
          }}
          aria-label="Status filter"
        >
          <option value="">All Lifecycle Statuses</option>
          {Object.keys(NEXT_STATUS).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 text-xs text-stone-600">
          <span>
            Showing <b className="text-maroon-900">{filteredRows.length}</b> booking(s)
            {selectedHub ? ` for ${selectedHub}` : ''}
          </span>
        </div>
      </div>

      {loading && !data && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && filteredRows.length === 0 && (
        <EmptyState title="No bookings" message="No bookings match these filters." />
      )}
      {data && filteredRows.length > 0 && (
        <div className="card overflow-x-auto border border-stone-200/90 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-100/90 text-[11px] font-bold uppercase tracking-wider text-maroon-800">
              <tr>
                <th className="p-3.5">Booking &amp; Ritual</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Locality / Address</th>
                <th className="p-3.5">Date &amp; Muhurtham</th>
                <th className="p-3.5">Purohit</th>
                <th className="p-3.5">Samagri Kit Status</th>
                <th className="p-3.5">Amount &amp; Status</th>
                <th className="p-3.5 text-right">Quick 1-Click Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {filteredRows.map((b) => {
                const devoteePhone = b.customer?.phone || '9000000001';
                const waUrl = `https://wa.me/91${devoteePhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                  `Namaste ${b.customer?.name || 'Devotee'}, VedaPujas Hyderabad Operations Desk here regarding your ${b.puja?.name || 'Puja'} booking (#${b.bookingNumber}) on ${b.date}.`
                )}`;

                return (
                  <tr key={b._id} className="align-middle transition hover:bg-amber-50/30">
                    <td className="p-3.5">
                      <div className="font-serif font-bold text-maroon-900">{b.puja?.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-maroon-800">
                          #{b.bookingNumber}
                        </span>
                        <span>· {b.tierName}</span>
                        <span>· {b.language}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-maroon-900">{b.customer?.name}</div>
                      <div className="text-xs text-stone-500">+91 {devoteePhone}</div>
                    </td>

                    {/* Locality / Address Column */}
                    <td className="p-3.5 max-w-[210px]">
                      {b.address?.line1 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-maroon-900">
                            <MapPin className="h-3 w-3 text-saffron-600" />
                            {b.address.line1.split(',').pop()?.trim() || b.address.city || 'Hyderabad'}
                          </span>
                          <div className="mt-1 truncate text-xs text-stone-600" title={`${b.address.line1}, ${b.address.city} ${b.address.pincode}`}>
                            {b.address.line1}, {b.address.city} {b.address.pincode}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                          {LOCATION_LABEL[b.locationType] || 'Hyderabad'}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-maroon-900">{fmtDate(b.date)}</div>
                      <div className="text-xs text-stone-500">
                        {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})
                      </div>
                    </td>

                    <td className="p-3.5">
                      {b.pandit?.user?.name ? (
                        <div>
                          <div className="font-semibold text-maroon-900">{b.pandit.user.name}</div>
                          <span className="text-[11px] font-semibold text-emerald-700">✓ Verified Scholar</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Samagri Kit Status Column */}
                    <td className="p-3.5">
                      {b.includeSamagri ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <PackageCheck className="h-3.5 w-3.5 text-emerald-600" /> Kit Packed · Doorstep
                          </span>
                          <div className="mt-0.5 text-[11px] text-stone-500">
                            Add-on: {inr(b.pricing?.samagriPrice || 850)}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                          <Package className="h-3 w-3 text-stone-500" /> Self-Arranged
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-serif text-base font-bold text-maroon-900">{inr(b.pricing.total)}</div>
                      <div className="mb-1 text-[11px] capitalize text-stone-500">
                        {b.payment.status.replace('_', ' ')} ({inr(b.payment.amountPaid)})
                      </div>
                      <StatusBadge status={b.status} meta={STATUS_META} />
                    </td>

                    {/* Quick 1-Click Actions Column */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSlipBooking(b)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-maroon-900 transition hover:border-saffron-500 hover:bg-amber-100"
                          title="View & Print Auspicious Muhurtham Dispatch Slip"
                        >
                          <FileText className="h-3.5 w-3.5 text-saffron-600" />
                          View Muhurtham Slip
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                          title={`Contact ${b.customer?.name || 'Devotee'} (+91 ${devoteePhone})`}
                        >
                          <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                          Contact Devotee
                        </a>
                        <button
                          type="button"
                          className="btn-outline !px-3 !py-1.5 text-xs"
                          onClick={() => setOpenId(b._id)}
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
      {openId && <BookingModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
      {slipBooking && <MuhurthamSlipModal booking={slipBooking} onClose={() => setSlipBooking(null)} />}
    </div>
  );
}
