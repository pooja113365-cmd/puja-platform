import { Link, useOutletContext } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  ShieldAlert,
  MessageSquareWarning,
  IndianRupee,
  Flame,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  Wallet,
  BadgeCheck,
  FileCheck2,
  Activity,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorState, StatusBadge } from '../components/States';
import { inr, fmtDate, fmtDateTime, STATUS_META } from '../utils/format';

function Stat({
  icon: Icon,
  label,
  value,
  to,
  delta,
  deltaTone = 'bg-emerald-50 text-emerald-700 border-emerald-200',
  iconBg = 'bg-amber-50 text-saffron-600 border-amber-200',
  subtext,
}) {
  const body = (
    <div className="card group relative flex flex-col justify-between border border-stone-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/80 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${deltaTone}`}>
            <TrendingUp className="h-3 w-3" />
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="font-serif text-2xl font-bold tracking-tight text-maroon-900 sm:text-3xl">{value}</div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600">{label}</span>
          {to && <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 transition group-hover:text-saffron-600" />}
        </div>
        {subtext && <p className="mt-1 text-[11px] text-stone-500">{subtext}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const outletCtx = useOutletContext() || {};
  const selectedHub = outletCtx.selectedHub || '';

  const { data, loading, error, reload } = useFetch('/admin/stats');
  const { data: recentBookings } = useFetch('/bookings', { limit: 6 });
  const { data: pendingPandits } = useFetch('/admin/pandits', { kyc: 'pending', limit: 5 });
  const { data: revenueData } = useFetch(isAdmin ? '/admin/revenue' : null);

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const by = data.bookings.byStatus || {};
  const bookingsList = (recentBookings || []).filter((b) => {
    if (!selectedHub) return true;
    const addrText = `${b.address?.line1 || ''} ${b.address?.city || ''}`.toLowerCase();
    return addrText.includes(selectedHub.toLowerCase());
  });
  const displayBookings = bookingsList.length > 0 ? bookingsList : recentBookings || [];
  const pendingKycList = pendingPandits || [];
  const panditPayouts = revenueData?.byPandit || [];

  return (
    <div className="space-y-8">
      {/* Cockpit Title & Hub Indicator */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-maroon-900">
            <Activity className="h-3.5 w-3.5 text-saffron-600" />
            {selectedHub ? `📍 ${selectedHub} Hub · Live Operations` : 'Hyderabad Master Operations Cockpit'}
          </span>
          <h1 className="mt-1.5 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            Executive Operations &amp; Analytics
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Real-time gross booking velocity, Veda Patasala scholar KYC queue, Samagri dispatch &amp; Dakshina settlements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/bookings" className="btn-outline !py-2 text-xs">
            Open Bookings Console →
          </Link>
          <Link to="/pandits" className="btn-primary !py-2 text-xs">
            Review KYC Queue ({data.pendingKyc})
          </Link>
        </div>
      </div>

      {/* 8 Enhanced KPI Cards with Delta Badges & Subtle Border Styling */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={IndianRupee}
          label="Gross Booking Value"
          value={inr(data.grossBookingValue)}
          to="/bookings"
          delta="+18.4% vs last wk"
          deltaTone="bg-emerald-50 text-emerald-700 border-emerald-200"
          iconBg="bg-amber-50 text-saffron-600 border-amber-200"
          subtext="Total ritual & Samagri GMV across Hyderabad"
        />
        <Stat
          icon={ClipboardList}
          label="Total Bookings"
          value={data.bookings.total}
          to="/bookings"
          delta="+14% volume"
          deltaTone="bg-emerald-50 text-emerald-700 border-emerald-200"
          iconBg="bg-orange-50 text-saffron-600 border-orange-200"
          subtext={`${by.pandit_assigned || 0} assigned · ${by.confirmed || 0} confirmed`}
        />
        <Stat
          icon={UserCheck}
          label="Verified Pandits"
          value={data.pandits}
          to="/pandits"
          delta="100% Veda Patasala"
          deltaTone="bg-emerald-50 text-emerald-700 border-emerald-200"
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-200"
          subtext="Active Smartha & Agamic Acharyas"
        />
        <Stat
          icon={ShieldAlert}
          label="Pending Approvals"
          value={data.pendingKyc}
          to="/pandits"
          delta={data.pendingKyc > 0 ? `${data.pendingKyc} Action Needed` : 'Queue Clear'}
          deltaTone={
            data.pendingKyc > 0
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }
          iconBg="bg-amber-50 text-amber-600 border-amber-200"
          subtext="Aadhaar & Pathashala certificate verification"
        />
        <Stat
          icon={Flame}
          label="Active Pujas"
          value={data.pujas}
          to="/pujas"
          delta="6 Featured"
          deltaTone="bg-amber-50 text-maroon-800 border-amber-200"
          iconBg="bg-amber-50 text-saffron-600 border-amber-200"
          subtext="Home, Temple & Live e-Puja packages"
        />
        <Stat
          icon={MessageSquareWarning}
          label="Open Disputes"
          value={data.openDisputes}
          to="/disputes"
          delta={data.openDisputes === 0 ? '0 SLA Breaches' : `${data.openDisputes} Open`}
          deltaTone={
            data.openDisputes === 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }
          iconBg="bg-red-50 text-red-600 border-red-200"
          subtext="2-hour Hyderabad resolution SLA"
        />
        <Stat
          icon={Users}
          label="Devotee Accounts"
          value={data.customers}
          delta="+22% Hyd households"
          deltaTone="bg-blue-50 text-blue-700 border-blue-200"
          iconBg="bg-blue-50 text-blue-600 border-blue-200"
          subtext="Verified families across GHMC & Cyberabad"
        />
        {isAdmin && (
          <Stat
            icon={IndianRupee}
            label="Collected Revenue"
            value={inr(data.revenueCollected)}
            to="/revenue"
            delta="30% Adv + Full"
            deltaTone="bg-emerald-50 text-emerald-700 border-emerald-200"
            iconBg="bg-emerald-50 text-emerald-600 border-emerald-200"
            subtext="Settled via Razorpay (15% platform fee)"
          />
        )}
      </div>

      {/* Bookings by Status Pipeline Strip */}
      <div className="card border border-stone-200/90 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-bold text-maroon-900">Ritual Fulfillment Pipeline</h2>
            <p className="text-xs text-stone-500">Click any lifecycle stage to filter the Master Bookings Console</p>
          </div>
          <span className="text-xs font-semibold text-maroon-700">
            Total Tracked: <b>{data.bookings.total}</b>
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(STATUS_META)
            .slice(0, 6)
            .map(([k, m]) => (
              <Link
                key={k}
                to={`/bookings?status=${k}`}
                className="group rounded-xl border border-stone-200/90 bg-stone-50/70 p-3.5 text-center transition hover:border-amber-400 hover:bg-white hover:shadow-sm"
              >
                <div className="font-serif text-2xl font-bold text-maroon-900">{by[k] || 0}</div>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
                  {m.label}
                </span>
              </Link>
            ))}
        </div>
      </div>

      {/* Two Side-by-Side Operational Widgets */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Widget 1: Recent Booking Activity Feed */}
        <div className="card flex flex-col justify-between border border-stone-200/90 bg-white p-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="font-serif text-xl font-bold text-maroon-900">Recent Booking Activity Feed</h2>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  Real-time timeline of ritual bookings, Purohit assignments, Samagri kits &amp; Razorpay payments
                </p>
              </div>
              <Link to="/bookings" className="text-xs font-bold text-saffron-600 hover:underline">
                View All Bookings →
              </Link>
            </div>

            {displayBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">No recent booking activity recorded yet.</p>
            ) : (
              <ol className="relative mt-5 ml-3 space-y-5 border-l-2 border-amber-300/70 pl-5">
                {displayBookings.map((b) => {
                  const lastHistory = b.statusHistory?.[b.statusHistory.length - 1];
                  const locality = b.address?.line1
                    ? `${b.address.line1}, ${b.address.city || 'Hyderabad'}`
                    : b.locationType === 'online'
                      ? 'Online Live e-Puja'
                      : 'Hyderabad Temple Venue';

                  return (
                    <li key={b._id} className="relative rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5 transition hover:border-amber-300 hover:bg-white">
                      <span className="absolute -left-[29px] top-4 flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-500 bg-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
                      </span>

                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-maroon-900 px-2 py-0.5 font-mono text-[11px] font-bold text-gold-300">
                              #{b.bookingNumber}
                            </span>
                            <span className="font-serif text-base font-bold text-maroon-900">{b.puja?.name}</span>
                            <StatusBadge status={b.status} meta={STATUS_META} />
                          </div>
                          <p className="mt-1 text-xs text-stone-600">
                            <b>Devotee:</b> {b.customer?.name || 'Devotee'} ·{' '}
                            <span className="inline-flex items-center gap-0.5 text-maroon-800 font-medium">
                              <MapPin className="h-3 w-3 text-saffron-600" /> {locality}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-serif text-base font-bold text-maroon-900">{inr(b.pricing?.total)}</span>
                          <div className="text-[11px] font-semibold text-emerald-700">
                            Paid {inr(b.payment?.amountPaid)} ({b.payment?.status?.replace('_', ' ')})
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/70 pt-2 text-[11px] text-stone-600">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 font-medium text-maroon-800">
                            <BadgeCheck className="h-3.5 w-3.5 text-saffron-600" />
                            {b.pandit?.user?.name ? `Assigned: ${b.pandit.user.name}` : 'Awaiting Purohit Dispatch'}
                          </span>
                          <span>
                            Muhurtham: <b>{fmtDate(b.date)}</b> ({b.timeSlot?.startTime}–{b.timeSlot?.endTime})
                          </span>
                          {b.includeSamagri && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                              ✓ Samagri Kit Included
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-stone-500">
                          <Clock className="h-3 w-3" />
                          {lastHistory?.at ? fmtDateTime(lastHistory.at) : fmtDate(b.date)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-2.5 text-xs text-maroon-800">
            <span>All ritual state changes broadcast live to Devotee &amp; Purohit apps via Socket.IO.</span>
            <Link to="/bookings" className="font-bold text-saffron-700 hover:underline">
              Manage Dispatch →
            </Link>
          </div>
        </div>

        {/* Widget 2: Action Required Desk (Pending KYC Reviews & Pending Pandit Payouts) */}
        <div className="card flex flex-col justify-between border border-stone-200/90 bg-white p-6 lg:col-span-5">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  <AlertCircle className="h-3 w-3 text-saffron-600" /> Priority Operations Queue
                </span>
                <h2 className="mt-1 font-serif text-xl font-bold text-maroon-900">Action Required Desk</h2>
              </div>
              <span className="rounded-xl bg-maroon-900 px-3 py-1 text-xs font-bold text-gold-300">
                {pendingKycList.length + panditPayouts.length} Active Items
              </span>
            </div>

            {/* Section A: Pending KYC Reviews */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-800">
                  <FileCheck2 className="h-4 w-4 text-saffron-600" />
                  Pending Pandit KYC Reviews ({pendingKycList.length})
                </span>
                <Link to="/pandits" className="text-xs font-bold text-saffron-600 hover:underline">
                  Open KYC Desk →
                </Link>
              </div>

              {pendingKycList.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  All Veda Patasala scholar KYC applications have been reviewed.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingKycList.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-xl border border-amber-300/80 bg-amber-50/40 p-3.5 transition hover:border-saffron-500 hover:bg-amber-50/70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-bold text-maroon-900">{p.user?.name}</span>
                            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                              KYC Pending
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-stone-600">
                            {p.experienceYears} yrs exp · {p.languages?.join(', ')} · {p.serviceCities?.join(', ') || 'Hyderabad'}
                          </p>
                          <p className="mt-1 text-[11px] text-maroon-700">
                            <b>Specializations:</b> {p.specializations?.join(', ')} ({p.kyc?.documents?.length || 0} docs uploaded)
                          </p>
                        </div>
                        <Link
                          to="/pandits"
                          className="btn-primary shrink-0 !px-3 !py-1.5 text-xs"
                        >
                          Inspect KYC
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Pending Pandit Payouts & Ledger */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-800">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Pending Pandit Payouts &amp; Settlements
                </span>
                {isAdmin && (
                  <Link to="/revenue" className="text-xs font-bold text-saffron-600 hover:underline">
                    Revenue Ledger →
                  </Link>
                )}
              </div>

              <div className="space-y-2.5">
                {panditPayouts.length > 0 ? (
                  panditPayouts.slice(0, 3).map((row) => (
                    <div
                      key={row._id}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 p-3.5"
                    >
                      <div>
                        <div className="font-semibold text-maroon-900 text-sm">{row.panditName || 'Assigned Acharya'}</div>
                        <div className="text-xs text-stone-600">
                          {row.bookings} ritual(s) · Gross {inr(row.gross)} · Fee {inr(row.commission)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-base font-bold text-emerald-700">{inr(row.panditEarning)}</div>
                        <Link
                          to="/revenue"
                          className="text-[11px] font-bold text-saffron-600 hover:underline"
                        >
                          Settle Payout →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs text-stone-600">
                    Purohit Dakshina share (85% net of 15% platform fee) is queued automatically upon ritual completion.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-stone-200/80 pt-4 text-xs">
            <span className="font-medium text-stone-600">
              Platform Commission Rate: <b className="text-maroon-900">15% Standard</b>
            </span>
            {isAdmin && (
              <Link to="/revenue" className="btn-outline !px-3 !py-1.5 text-xs">
                Export Payout Sheet
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
