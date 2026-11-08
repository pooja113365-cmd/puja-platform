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
  const custName = b.customerName || b.customer?.name || 'Devotee';
  const custPhone = b.customerPhone || b.customer?.phone || '9000000001';
  const custEmail = b.customerEmail || b.customer?.email || '';
  const serviceName = b.serviceTitle || b.puja?.name || 'Vedic Puja Service';
  const detailsText = b.serviceDetails || b.notes || '';
  const locality = b.address?.line1
    ? `${b.address.line1}, ${b.address.city || 'Hyderabad'} ${b.address.pincode || ''}`.trim()
    : b.locationType === 'online'
      ? 'Online Live e-Puja (Video Sankalpam)'
      : 'Hyderabad Temple Venue';

  return (
    <Modal title={`CRM Booking & Dispatch Slip — #${b.bookingNumber}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-saffron-700">
                GetPuja.com Hyderabad · Official CRM Booking Record
              </span>
              <h3 className="font-serif text-xl font-bold text-maroon-900">{serviceName}</h3>
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
                <MapPin className="h-3.5 w-3.5 text-saffron-600" /> Customer Name &amp; Contact
              </div>
              <p className="mt-1 font-semibold text-maroon-900">{custName}</p>
              <p className="text-xs font-semibold text-saffron-700">
                Mobile: +91 {custPhone} {custEmail ? `· ${custEmail}` : ''}
              </p>
              <p className="mt-1 text-xs font-medium text-maroon-800">
                {LOCATION_LABEL[b.locationType]}: {locality}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
                <CalendarClock className="h-3.5 w-3.5 text-saffron-600" /> Common Service Details
              </div>
              <p className="mt-1 font-semibold text-maroon-900">{fmtDate(b.date)}</p>
              <p className="text-xs text-stone-600">
                {b.timeSlot?.label} · <b>{b.timeSlot?.startTime} – {b.timeSlot?.endTime} IST</b>
              </p>
              <p className="mt-1 text-xs text-maroon-800">
                <b>Language:</b> {b.language} · <b>Package:</b> {b.tierName} · <b>Samagri Kit:</b>{' '}
                {b.includeSamagri ? '✓ Yes (Included)' : 'No (Self-Arranged)'}
              </p>
            </div>
          </div>

          {detailsText && (
            <div className="mt-3 rounded-xl bg-white p-3.5 border-2 border-amber-300 text-xs">
              <div className="font-bold uppercase tracking-wider text-maroon-800">
                Customer’s Detailed Service Explanation:
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-maroon-900">{detailsText}</p>
            </div>
          )}

          <div className="mt-3 rounded-xl bg-white p-3 border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-700">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Assigned Veda Patasala Scholar
            </div>
            {b.pandit ? (
              <p className="mt-1 text-xs font-semibold text-maroon-900">
                {b.pandit.user?.name} — Phone: +91 {b.pandit.user?.phone || '9100000001'}
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-red-700">Pending Purohit Assignment</p>
            )}
          </div>
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
    <Modal title="CRM Booking Details & Operations" onClose={onClose} wide>
      {loading && !b && <Loader />}
      {error && !b && <ErrorState message={error} onRetry={reload} />}
      {b && (
        <div className="space-y-4 text-sm">
          {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
          <div className="flex items-center gap-2">
            <b className="font-serif text-lg text-maroon-900">{b.serviceTitle || b.puja?.name || 'Vedic Puja Service'}</b>
            <StatusBadge status={b.status} meta={STATUS_META} />
            <span className="ml-auto rounded bg-maroon-900 px-2 py-0.5 font-mono text-xs font-bold text-gold-300">
              #{b.bookingNumber}
            </span>
          </div>
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            <p>
              <b>Customer Name:</b> {b.customerName || b.customer?.name}
              <br />
              <b>Mobile Number:</b> +91 {b.customerPhone || b.customer?.phone || '9000000001'}
              {(b.customerEmail || b.customer?.email) ? ` · ${b.customerEmail || b.customer?.email}` : ''}
            </p>
            <p>
              <b>Preferred Date &amp; Time:</b> {fmtDate(b.date)}
              <br />
              {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})
            </p>
            <p>
              <b>Venue &amp; Locality:</b> {LOCATION_LABEL[b.locationType]}
              {b.address?.line1 ? (
                <>
                  <br />
                  {b.address.line1}, {b.address.city} {b.address.pincode}
                </>
              ) : null}
            </p>
            <p>
              <b>Language / Package:</b> {b.language} / {b.tierName}
              <br />
              <b>Samagri Kit Needed:</b> {b.includeSamagri ? '✓ Yes — Doorstep Kit Included' : 'Self-Arranged'}
            </p>
            <p className="sm:col-span-2">
              <b>Assigned Purohit:</b>{' '}
              {b.pandit ? (
                `${b.pandit.user?.name} (+91 ${b.pandit.user?.phone || '9100000001'})`
              ) : (
                <span className="font-semibold text-red-700">Not assigned</span>
              )}
            </p>
          </div>
          {(b.serviceDetails || b.notes) && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50/70 p-3.5">
              <b className="text-xs uppercase tracking-wider text-maroon-800">
                Customer’s Detailed Service Explanation:
              </b>
              <p className="mt-1 whitespace-pre-wrap text-sm text-maroon-900">
                {b.serviceDetails || b.notes}
              </p>
            </div>
          )}

          {['pending', 'confirmed', 'pandit_assigned'].includes(b.status) && (
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
            {selectedHub ? `📍 ${selectedHub} Hub CRM` : 'Master CRM Bookings & Inquiries'}
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">CRM Bookings &amp; Service Inquiries</h1>
          <p className="text-sm text-stone-600">
            View collected customer names, mobile numbers, common service details, detailed service explanations, and manage Purohit dispatch.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card flex flex-wrap items-center gap-3 border border-stone-200/90 bg-white p-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search name, mobile, service or booking #..."
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
                <th className="p-3.5">Booking &amp; Service Needed</th>
                <th className="p-3.5">Customer Name &amp; Mobile</th>
                <th className="p-3.5">Common Details (Venue / Date / Lang)</th>
                <th className="p-3.5">Service Explanation / Details</th>
                <th className="p-3.5">Assigned Priest</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">CRM Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {filteredRows.map((b) => {
                const custName = b.customerName || b.customer?.name || 'Devotee';
                const devoteePhone = b.customerPhone || b.customer?.phone || '9000000001';
                const serviceName = b.serviceTitle || b.puja?.name || 'Vedic Puja Service';
                const explanation = b.serviceDetails || b.notes || '—';
                const waUrl = `https://wa.me/91${devoteePhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                  `Namaste ${custName}, GetPuja.com Hyderabad Desk here regarding your ${serviceName} booking (#${b.bookingNumber}) on ${b.date}.`
                )}`;

                return (
                  <tr key={b._id} className="align-middle transition hover:bg-amber-50/30">
                    <td className="p-3.5">
                      <div className="font-serif font-bold text-maroon-900">{serviceName}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-maroon-800">
                          #{b.bookingNumber}
                        </span>
                        <span>· {b.tierName}</span>
                        {b.includeSamagri && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            + Samagri Kit
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-maroon-900">{custName}</div>
                      <a
                        href={`tel:+91${devoteePhone}`}
                        className="text-xs font-semibold text-saffron-700 hover:underline"
                      >
                        +91 {devoteePhone}
                      </a>
                      {(b.customerEmail || b.customer?.email) && (
                        <div className="text-[11px] text-stone-500 truncate max-w-[160px]">
                          {b.customerEmail || b.customer?.email}
                        </div>
                      )}
                    </td>

                    {/* Common Details Column */}
                    <td className="p-3.5 max-w-[220px]">
                      <div className="font-semibold text-maroon-900 text-xs">
                        {fmtDate(b.date)} · {b.timeSlot?.label}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-600">
                        <b>Lang:</b> {b.language} · <b>Venue:</b> {LOCATION_LABEL[b.locationType] || b.locationType}
                      </div>
                      {b.address?.line1 && (
                        <div className="mt-0.5 truncate text-[11px] text-stone-500" title={`${b.address.line1}, ${b.address.city}`}>
                          📍 {b.address.line1}, {b.address.city}
                        </div>
                      )}
                    </td>

                    {/* Detailed Explanation Column */}
                    <td className="p-3.5 max-w-[260px]">
                      <div
                        className="line-clamp-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-2 text-xs text-maroon-900"
                        title={explanation}
                      >
                        {explanation}
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

                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={b.status} meta={STATUS_META} />
                    </td>

                    {/* Quick 1-Click Actions Column */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSlipBooking(b)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-maroon-900 transition hover:border-saffron-500 hover:bg-amber-100"
                          title="View Full CRM Inquiry & Slip"
                        >
                          <FileText className="h-3.5 w-3.5 text-saffron-600" />
                          View Details
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                          title={`Contact ${custName} (+91 ${devoteePhone})`}
                        >
                          <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                          WhatsApp
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
