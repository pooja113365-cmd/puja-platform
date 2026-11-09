import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  ShieldAlert,
  MessageSquareWarning,
  Flame,
  UserCheck,
  CheckCircle2,
  ArrowUpRight,
  Phone,
  Calendar,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { Loader, ErrorState, StatusBadge } from '../components/States';
import { fmtDate, STATUS_META } from '../utils/format';

function Stat({ icon: Icon, label, value, to, iconBg = 'bg-amber-50 text-saffron-600 border-amber-200' }) {
  const body = (
    <div className="group flex items-center justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/80 hover:shadow-md">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
        <p className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-maroon-900">{value}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        {to && <ArrowUpRight className="h-4 w-4 text-stone-400 transition group-hover:text-saffron-600" />}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  const { data: recentBookings } = useFetch('/bookings', { limit: 6 });
  const { data: pendingPandits } = useFetch('/admin/pandits', { kyc: 'pending', limit: 5 });

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const by = data.bookings.byStatus || {};
  const displayBookings = recentBookings || [];
  const pendingKycList = pendingPandits || [];

  return (
    <div className="space-y-6">
      {/* Clean Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-stone-500">Overview of bookings, pandits, and active services</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/bookings" className="btn-outline !py-2 text-xs">
            View Bookings
          </Link>
          <Link to="/pandits" className="btn-primary !py-2 text-xs">
            Pandit KYC ({data.pendingKyc})
          </Link>
        </div>
      </div>

      {/* Clean KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          icon={ClipboardList}
          label="Total Bookings"
          value={data.bookings.total}
          to="/bookings"
          iconBg="bg-orange-50 text-saffron-600 border-orange-200"
        />
        <Stat
          icon={UserCheck}
          label="Verified Pandits"
          value={data.pandits}
          to="/pandits"
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-200"
        />
        <Stat
          icon={ShieldAlert}
          label="Pending Approvals"
          value={data.pendingKyc}
          to="/pandits"
          iconBg="bg-amber-50 text-amber-600 border-amber-200"
        />
        <Stat
          icon={Flame}
          label="Active Pujas"
          value={data.pujas}
          to="/pujas"
          iconBg="bg-amber-50 text-saffron-600 border-amber-200"
        />
        <Stat
          icon={Users}
          label="Customers"
          value={data.customers}
          iconBg="bg-blue-50 text-blue-600 border-blue-200"
        />
        <Stat
          icon={MessageSquareWarning}
          label="Open Disputes"
          value={data.openDisputes}
          to="/disputes"
          iconBg="bg-red-50 text-red-600 border-red-200"
        />
      </div>

      {/* Booking Status Breakdown */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-maroon-900">Bookings by Status</h2>
          <Link to="/bookings" className="text-xs font-semibold text-saffron-600 hover:underline">
            All Bookings ({data.bookings.total}) →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(STATUS_META)
            .slice(0, 6)
            .map(([k, m]) => (
              <Link
                key={k}
                to={`/bookings?status=${k}`}
                className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 text-center transition hover:border-amber-400 hover:bg-white hover:shadow-sm"
              >
                <div className="font-serif text-2xl font-bold text-maroon-900">{by[k] || 0}</div>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
                  {m.label}
                </span>
              </Link>
            ))}
        </div>
      </div>

      {/* Recent Bookings & Pending Approvals */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Bookings */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <h2 className="font-serif text-lg font-bold text-maroon-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-xs font-semibold text-saffron-600 hover:underline">
              View All →
            </Link>
          </div>

          {displayBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">No bookings yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-stone-100">
              {displayBookings.map((b) => {
                const name = b.customerName || b.customer?.name || 'Customer';
                const phone = b.customerPhone || b.customer?.phone || '';
                const service = b.serviceTitle || b.puja?.name || 'Puja Service';
                return (
                  <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs font-semibold text-maroon-900">
                          #{b.bookingNumber}
                        </span>
                        <span className="font-semibold text-maroon-900">{service}</span>
                        <StatusBadge status={b.status} meta={STATUS_META} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                        <span className="font-medium text-stone-800">{name}</span>
                        {phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-saffron-600" />
                            {phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          {fmtDate(b.date)}
                        </span>
                      </div>
                      {(b.serviceDetails || b.notes) && (
                        <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                          {b.serviceDetails || b.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Pandit KYC */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <h2 className="font-serif text-lg font-bold text-maroon-900">
              Pending Pandit Approvals ({pendingKycList.length})
            </h2>
            <Link to="/pandits" className="text-xs font-semibold text-saffron-600 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="mt-3">
            {pendingKycList.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                No pending Pandit approvals right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingKycList.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/90 bg-stone-50/60 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-maroon-900">{p.user?.name}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {p.experienceYears} yrs exp · {p.languages?.join(', ')}
                      </p>
                    </div>
                    <Link to="/pandits" className="btn-primary shrink-0 !px-3 !py-1.5 text-xs">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
