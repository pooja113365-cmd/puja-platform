import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, STATUS_META } from '../utils/format';

const FILTERS = [['pending', 'Pending review'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['', 'All']];

function PanditKycModal({ pandit: p, onClose, onReview, busy, error }) {
  const [reason, setReason] = useState(p.kyc?.rejectionReason || '');
  return (
    <Modal title={`Verification Desk — ${p.user?.name || 'Purohit'}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="label">Contact Details</span>
            <p className="font-semibold text-maroon-900">{p.user?.name}</p>
            <p className="text-maroon-700">{p.user?.email} · +91 {p.user?.phone}</p>
          </div>
          <div>
            <span className="label">Temple &amp; Experience</span>
            <p className="text-maroon-900">{p.templeAffiliation || 'Independent Vedic Acharya'}</p>
            <p className="text-maroon-700">{p.experienceYears} yrs experience · Charge: {inr(p.pujaCharge)}</p>
          </div>
          <div>
            <span className="label">Vedic Specializations</span>
            <p className="text-maroon-900">{p.specializations.join(', ')}</p>
          </div>
          <div>
            <span className="label">Spoken Languages &amp; Cities</span>
            <p className="text-maroon-900">{p.languages.join(', ')}</p>
            {p.serviceCities?.length > 0 && <p className="text-xs text-maroon-700">Cities: {p.serviceCities.join(', ')}</p>}
          </div>
        </div>

        <div className="rounded-xl bg-cream-100 p-4">
          <span className="label">Submitted Bio &amp; Lineage</span>
          <p className="mt-1 leading-relaxed text-maroon-900">{p.bio || 'No biography provided.'}</p>
        </div>

        <div>
          <span className="label">Submitted KYC Documents ({p.kyc.documents.length})</span>
          {p.kyc.documents.length === 0 ? (
            <p className="text-xs text-red-700">No KYC documents uploaded yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {p.kyc.documents.map((d, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-gold-300/60 px-3 py-2">
                  <span className="font-medium text-maroon-800">{d.type}</span>
                  <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Open document
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label" htmlFor="kyc-reason">Rejection Reason (required if rejecting)</label>
          <input
            id="kyc-reason"
            className="input"
            placeholder="e.g., Please re-upload a clear Aadhaar scan and Pathashala certificate"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Close</button>
          {p.kyc.status !== 'rejected' && (
            <button
              type="button"
              className="btn-outline !border-red-600 !text-red-700"
              disabled={busy || reason.trim().length < 3}
              onClick={() => onReview(p, 'rejected', reason.trim())}
            >
              Reject KYC
            </button>
          )}
          {p.kyc.status !== 'approved' && (
            <button
              type="button"
              className="btn-primary"
              disabled={busy || p.kyc.documents.length === 0}
              onClick={() => onReview(p, 'approved')}
            >
              Approve &amp; Verify Purohit
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Pandits() {
  const [kyc, setKyc] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { data, meta, loading, error, reload } = useFetch('/admin/pandits', { kyc: kyc || undefined, search: search || undefined, page, limit: 10 });
  const act = useAction();

  const review = async (p, status, providedReason) => {
    let reason = providedReason;
    if (status === 'rejected' && !reason) {
      reason = window.prompt('Reason for rejection (shown to the purohit):');
      if (!reason || reason.trim().length < 3) return;
    } else if (status === 'approved' && !selected && !window.confirm(`Approve ${p.user?.name}? They will become visible to customers.`)) {
      return;
    }
    if (await act.run(() => api.patch(`/admin/pandits/${p._id}/kyc`, { status, reason }))) {
      setSelected(null);
      reload();
    }
  };

  const toggle = async (p) => {
    if (await act.run(() => api.patch(`/admin/pandits/${p._id}`, { isActive: !p.isActive }))) reload();
  };

  return (
    <div>
      <h1 className="text-3xl text-maroon-800">Pandit Verification Desk</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([v, l]) => (
          <button
            key={l}
            onClick={() => { setKyc(v); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${kyc === v ? 'bg-maroon-700 text-cream-100' : 'border border-gold-300 bg-white text-maroon-700'}`}
          >
            {l}
          </button>
        ))}
        <input className="input ml-auto max-w-xs" placeholder="Search by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {act.error && !selected && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}

      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No purohits" message="Nothing matches this filter." />}
      {data && data.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase text-maroon-700">
              <tr>
                <th className="p-3">Purohit</th>
                <th className="p-3">Expertise &amp; Bio</th>
                <th className="p-3">Languages</th>
                <th className="p-3">Exp.</th>
                <th className="p-3">KYC</th>
                <th className="p-3">KYC Documents</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id} className="border-t border-gold-300/30 align-top">
                  <td className="p-3">
                    <b>{p.user?.name}</b>
                    <div className="text-xs text-maroon-700/70">{p.user?.email}<br />{p.user?.phone}</div>
                    {p.templeAffiliation && <div className="mt-1 text-xs text-saffron-700">{p.templeAffiliation}</div>}
                  </td>
                  <td className="max-w-xs p-3">
                    <div className="font-medium text-maroon-800">{p.specializations.join(', ')}</div>
                    {p.bio && <p className="mt-1 line-clamp-2 text-xs text-maroon-700/80">{p.bio}</p>}
                  </td>
                  <td className="p-3">{p.languages.join(', ')}</td>
                  <td className="p-3">{p.experienceYears} yrs</td>
                  <td className="p-3">
                    <StatusBadge status={p.kyc.status} meta={STATUS_META} />
                    {p.kyc.rejectionReason && <div className="mt-1 max-w-[12rem] text-xs text-red-700">{p.kyc.rejectionReason}</div>}
                    {!p.isActive && <div className="mt-1 text-xs text-red-700">Deactivated</div>}
                  </td>
                  <td className="p-3">
                    {p.kyc.documents.length === 0 ? (
                      <span className="text-xs text-maroon-700/60">None submitted</span>
                    ) : (
                      p.kyc.documents.map((d, i) => (
                        <a key={i} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-saffron-600 hover:underline">
                          <ExternalLink className="h-3 w-3" />{d.type}
                        </a>
                      ))
                    )}
                  </td>
                  <td className="space-x-2 p-3 text-right whitespace-nowrap">
                    <button className="btn-outline !px-3 !py-1" onClick={() => setSelected(p)}>
                      <Eye className="h-3.5 w-3.5" /> Inspect
                    </button>
                    {p.kyc.status !== 'approved' && (
                      <button className="btn-primary !px-3 !py-1" disabled={act.busy} onClick={() => review(p, 'approved')}>
                        Approve
                      </button>
                    )}
                    {p.kyc.status !== 'rejected' && (
                      <button className="btn-outline !px-3 !py-1" disabled={act.busy} onClick={() => review(p, 'rejected')}>
                        Reject
                      </button>
                    )}
                    <button className="btn-outline !px-3 !py-1" disabled={act.busy} onClick={() => toggle(p)}>
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
      {selected && (
        <PanditKycModal
          pandit={selected}
          onClose={() => setSelected(null)}
          onReview={review}
          busy={act.busy}
          error={act.error}
        />
      )}
    </div>
  );
}
