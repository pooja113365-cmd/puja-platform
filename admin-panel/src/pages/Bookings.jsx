import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PhoneCall,
  Printer,
  Search,
  Eye,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { fmtDate, fmtDateTime, STATUS_META, NEXT_STATUS, LOCATION_LABEL } from '../utils/format';

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

  const custName = b?.customerName || b?.customer?.name || 'Customer';
  const custPhone = b?.customerPhone || b?.customer?.phone || '9000000001';
  const custEmail = b?.customerEmail || b?.customer?.email || '';
  const serviceName = b?.serviceTitle || b?.puja?.name || 'Puja Service';
  const detailsText = b?.serviceDetails || b?.notes || '';
  const waUrl = b
    ? `https://wa.me/91${custPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
        `Namaste ${custName}, GetPuja regarding your ${serviceName} booking (#${b.bookingNumber}) on ${fmtDate(b.date)}.`
      )}`
    : '#';

  return (
    <Modal title={b ? `Booking #${b.bookingNumber}` : 'Booking Details'} onClose={onClose} wide>
      {loading && !b && <Loader />}
      {error && !b && <ErrorState message={error} onRetry={reload} />}
      {b && (
        <div className="space-y-4 text-sm">
          {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}

          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-maroon-900">{serviceName}</h3>
              <p className="text-xs text-stone-500">
                #{b.bookingNumber} · {b.tierName || 'Standard'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={b.status} meta={STATUS_META} />
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-outline !px-3 !py-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Customer & Service Grid */}
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Customer</span>
              <p className="mt-0.5 font-semibold text-maroon-900">{custName}</p>
              <p className="text-xs text-saffron-700 font-medium">+91 {custPhone}</p>
              {custEmail && <p className="text-xs text-stone-500">{custEmail}</p>}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Date &amp; Time</span>
              <p className="mt-0.5 font-semibold text-maroon-900">{fmtDate(b.date)}</p>
              <p className="text-xs text-stone-600">
                {b.timeSlot?.label} ({b.timeSlot?.startTime}–{b.timeSlot?.endTime})
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Venue &amp; Address</span>
              <p className="mt-0.5 font-semibold text-maroon-900">
                {LOCATION_LABEL[b.locationType] || b.locationType}
              </p>
              {b.address?.line1 && (
                <p className="text-xs text-stone-600">
                  {b.address.line1}, {b.address.city} {b.address.pincode}
                </p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Language &amp; Samagri</span>
              <p className="mt-0.5 font-semibold text-maroon-900">{b.language}</p>
              <p className="text-xs text-stone-600">
                Samagri Kit: <b>{b.includeSamagri ? 'Included' : 'Self-Arranged'}</b>
              </p>
            </div>

            <div className="sm:col-span-2 border-t border-stone-200/80 pt-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Assigned Pandit</span>
              <p className="mt-0.5 font-semibold text-maroon-900">
                {b.pandit ? (
                  `${b.pandit.user?.name} (+91 ${b.pandit.user?.phone || '9100000001'})`
                ) : (
                  <span className="text-red-700">Unassigned</span>
                )}
              </p>
            </div>
          </div>

          {/* Customer's Detailed Explanation */}
          {detailsText && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-maroon-800">
                Service Details / Customer Notes
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-maroon-900">{detailsText}</p>
            </div>
          )}

          {/* Pandit Assignment */}
          {['pending', 'confirmed', 'pandit_assigned'].includes(b.status) && (
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-maroon-800">
                {b.pandit ? 'Re-assign Pandit' : 'Assign Pandit'}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <select className="input max-w-xs" value={panditId} onChange={(e) => setPanditId(e.target.value)}>
                  <option value="">Select pandit…</option>
                  {(pandits || [])
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.user?.name} — {p.languages.join('/')}
                      </option>
                    ))}
                </select>
                <button
                  className="btn-primary !py-2 text-xs"
                  disabled={!panditId || act.busy}
                  onClick={async () => {
                    if (await act.run(() => api.post(`/bookings/${id}/assign`, { panditId }))) done();
                  }}
                >
                  Assign
                </button>
                {b.status === 'confirmed' && (
                  <button
                    className="btn-outline !py-2 text-xs"
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

          {/* Online Meeting Link */}
          {b.locationType === 'online' && !['completed', 'cancelled'].includes(b.status) && (
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="https:// video meeting link"
                value={link || b.meetingLink || ''}
                onChange={(e) => setLink(e.target.value)}
              />
              <button
                className="btn-outline !py-2 text-xs"
                disabled={act.busy || !link}
                onClick={async () => {
                  if (await act.run(() => api.patch(`/bookings/${id}/meeting-link`, { meetingLink: link }))) done();
                }}
              >
                Save link
              </button>
            </div>
          )}

          {/* Status Update */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-maroon-800">Update Status</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(NEXT_STATUS[b.status] || []).map((s) => (
                <button
                  key={s}
                  disabled={act.busy}
                  onClick={() => changeStatus(s)}
                  className={
                    s === 'cancelled'
                      ? 'btn-outline !border-red-600 !py-1.5 text-xs !text-red-700'
                      : 'btn-primary !py-1.5 text-xs'
                  }
                >
                  {STATUS_META[s].label}
                </button>
              ))}
              {(NEXT_STATUS[b.status] || []).length === 0 && (
                <span className="text-xs text-stone-500">No further status transitions.</span>
              )}
            </div>
          </div>

          {/* Audit History */}
          {b.statusHistory?.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Activity History</span>
              <ul className="mt-1.5 space-y-1 text-xs text-stone-600">
                {b.statusHistory.map((h, i) => (
                  <li key={i}>
                    {fmtDateTime(h.at)} — <b>{STATUS_META[h.status]?.label || h.status}</b>
                    {h.note ? ` (${h.note})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Bookings() {
  const [sp, setSp] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const status = sp.get('status') || '';

  const { data, meta, loading, error, reload } = useFetch('/bookings', {
    status: status || undefined,
    search: search || undefined,
    page,
    limit,
  });

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.filter((b) => {
      if (venueFilter && b.locationType !== venueFilter) return false;
      if (dateFilter && b.date?.slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [data, venueFilter, dateFilter]);

  const hasFilters = Boolean(search || status || venueFilter || dateFilter);

  const clearFilters = () => {
    setSearch('');
    setVenueFilter('');
    setDateFilter('');
    setSp(new URLSearchParams());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Clean Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Bookings</h1>
          <p className="mt-0.5 text-sm text-stone-500">Manage customer bookings, inquiries, and pandit assignments</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search name, mobile, booking #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[11rem]"
          value={status}
          onChange={(e) => {
            const n = new URLSearchParams();
            if (e.target.value) n.set('status', e.target.value);
            setSp(n);
            setPage(1);
          }}
          aria-label="Status filter"
        >
          <option value="">All Statuses</option>
          {Object.keys(NEXT_STATUS).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        <select
          className="input max-w-[10rem]"
          value={venueFilter}
          onChange={(e) => {
            setVenueFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Venue filter"
        >
          <option value="">All Venues</option>
          {Object.entries(LOCATION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="input max-w-[10.5rem]"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Date filter"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-maroon-800 hover:bg-stone-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      {loading && !data && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && filteredRows.length === 0 && (
        <EmptyState title="No bookings found" message="Try adjusting or clearing your filters." />
      )}

      {data && filteredRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Booking &amp; Service</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Date &amp; Venue</th>
                <th className="px-4 py-3.5">Pandit</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRows.map((b, idx) => {
                const custName = b.customerName || b.customer?.name || 'Customer';
                const devoteePhone = b.customerPhone || b.customer?.phone || '9000000001';
                const serviceName = b.serviceTitle || b.puja?.name || 'Puja Service';
                const sno = (page - 1) * limit + idx + 1;

                return (
                  <tr key={b._id} className="align-middle transition hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                      {sno}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-maroon-900">{serviceName}</div>
                      <span className="mt-0.5 inline-block rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-600">
                        #{b.bookingNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-stone-900">{custName}</div>
                      <div className="text-xs text-stone-500">+91 {devoteePhone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-stone-800">{fmtDate(b.date)}</div>
                      <div className="text-xs text-stone-500">
                        {LOCATION_LABEL[b.locationType] || b.locationType} · {b.language}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {b.pandit?.user?.name ? (
                        <span className="font-medium text-stone-800">{b.pandit.user.name}</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={b.status} meta={STATUS_META} />
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm transition hover:border-saffron-500 hover:bg-amber-50/50"
                        onClick={() => setOpenId(b._id)}
                      >
                        <Eye className="h-3.5 w-3.5 text-saffron-600" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        meta={meta}
        total={meta?.total ?? filteredRows.length}
        page={page}
        limit={limit}
        onPage={setPage}
        onLimit={setLimit}
      />

      {openId && <BookingModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </div>
  );
}
