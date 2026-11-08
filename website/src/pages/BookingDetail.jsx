import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Check, Video, Star, Download, CalendarClock, CalendarPlus } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { getSocket } from '../services/socket';
import { payForBooking } from '../services/payment';
import useFetch from '../hooks/useFetch';
import { ProfileHeaderSkeleton, ErrorState, StatusBadge } from '../components/States';
import { inr, fmtDate, toYMD, STATUS_META, STATUS_FLOW, LOCATION_LABEL } from '../utils/format';

function addToCalendar(b) {
  const datePart = String(b.date || '').replace(/-/g, '');
  const startPart = String(b.timeSlot?.startTime || '08:00').replace(':', '') + '00';
  const endPart = String(b.timeSlot?.endTime || '10:00').replace(':', '') + '00';
  const summary = `VedaPujas: ${b.puja?.name || 'Vedic Puja'} (${b.tierName})`;
  const location =
    b.locationType === 'online'
      ? b.meetingLink || 'Online Live e-Puja'
      : `${b.address?.line1 || ''}, ${b.address?.city || 'Hyderabad'} ${b.address?.pincode || ''}`.trim();
  const description = `Booking #${b.bookingNumber} | Muhurtham: ${b.timeSlot?.label || ''} | Language: ${b.language || ''} | Scholar: ${b.pandit?.user?.name || 'Verified Veda Patasala Acharya'}`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VedaPujas Hyderabad//Vedic Booking//EN',
    'BEGIN:VEVENT',
    `UID:vedapujas-${b._id}@vedapujas.in`,
    `DTSTAMP:${datePart}T${startPart}`,
    `DTSTART:${datePart}T${startPart}`,
    `DTEND:${datePart}T${endPart}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VedaPujas-${b.bookingNumber}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadReceipt(b) {
  const due = Math.max((b.pricing?.total || 0) - (b.payment?.amountPaid || 0), 0);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt - ${b.bookingNumber}</title>
  <style>
    body { font-family: Georgia, serif; color: #360D0D; background: #FFFCF5; padding: 32px; max-width: 680px; margin: 0 auto; }
    .box { border: 2px solid #D4A017; border-radius: 12px; padding: 24px; background: #fff; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F27F0C; padding-bottom: 16px; }
    .om { font-size: 28px; color: #F27F0C; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-family: sans-serif; font-size: 14px; }
    td, th { padding: 8px 4px; border-bottom: 1px solid #f0e6d2; text-align: left; }
    .tot { font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="hdr">
      <div>
        <div class="om">ॐ Puja Platform</div>
        <div>Official Vedic Ritual Booking Receipt</div>
      </div>
      <div style="text-align:right;font-family:sans-serif;font-size:13px">
        <b>Booking #${b.bookingNumber}</b><br/>
        Status: ${b.status.toUpperCase()}<br/>
        Issued: ${new Date().toLocaleDateString('en-IN')}
      </div>
    </div>
    <table>
      <tr><th>Puja / Ritual</th><td>${b.puja?.name || 'Puja'} (${b.tierName})</td></tr>
      <tr><th>Date &amp; Muhurtham</th><td>${fmtDate(b.date)} · ${b.timeSlot.label} (${b.timeSlot.startTime}–${b.timeSlot.endTime})</td></tr>
      <tr><th>Language</th><td>${b.language}</td></tr>
      <tr><th>Location</th><td>${LOCATION_LABEL[b.locationType]}${b.address?.line1 ? ` — ${b.address.line1}, ${b.address.city} ${b.address.pincode || ''}` : ''}</td></tr>
      <tr><th>Assigned Purohit</th><td>${b.pandit?.user?.name || 'Auto-assigning verified Purohit'}</td></tr>
      <tr><th>Samagri Kit</th><td>${b.includeSamagri ? 'Included' : 'Self-arranged'}</td></tr>
      <tr><th>Package Charge</th><td>${inr(b.pricing?.tierPrice)}</td></tr>
      <tr><th>Samagri Charge</th><td>${inr(b.pricing?.samagriPrice)}</td></tr>
      <tr class="tot"><th>Total Amount</th><td>${inr(b.pricing?.total)}</td></tr>
      <tr><th>Amount Paid</th><td>${inr(b.payment?.amountPaid)} (${b.payment?.status})</td></tr>
      <tr><th>Balance Due</th><td>${inr(due)}</td></tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#6B1D1D;text-align:center">
      Thank you for booking with Puja Platform · support@pujaplatform.in
    </p>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Puja-Receipt-${b.bookingNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BookingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { data: b, loading, error, reload } = useFetch(`/bookings/${id}`);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [dispute, setDispute] = useState({ open: false, subject: '', description: '' });
  const [resched, setResched] = useState({ open: false, date: '', slot: null });

  const today = toYMD(new Date());
  const slotsQ = useFetch(resched.open && resched.date ? '/muhurthams/slots' : null, { date: resched.date });

  // Live tracking: join the booking room and refetch whenever the server pushes an update.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const join = () => socket.emit('booking:join', id, (res) => setLive(Boolean(res?.ok)));
    const onUpdate = (p) => { if (p.id === id) reload(); };
    const onDisconnect = () => setLive(false);
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('booking:update', onUpdate);
    if (socket.connected) join();
    return () => {
      socket.emit('booking:leave', id);
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('booking:update', onUpdate);
    };
  }, [id, reload]);

  const run = async (fn, okMsg) => {
    setActionError(''); setBusy(true);
    try { await fn(); if (okMsg) setNotice(okMsg); reload(); } catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  };

  if (loading && !b) return <ProfileHeaderSkeleton />;
  if (error && !b) return <ErrorState message={error} onRetry={reload} />;
  if (!b) return null;

  const cancelled = b.status === 'cancelled';
  const stepIdx = STATUS_FLOW.indexOf(b.status);
  const due = Math.max(b.pricing.total - b.payment.amountPaid, 0);
  const canPay = !cancelled && b.status !== 'completed' && due > 0;
  const canCancelOrReschedule = ['pending', 'confirmed', 'pandit_assigned'].includes(b.status);

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/bookings" className="text-sm font-semibold text-saffron-600 hover:underline">
          ← My bookings
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!cancelled && (
            <button
              type="button"
              onClick={() => addToCalendar(b)}
              className="btn-outline !py-1.5 text-xs"
            >
              <CalendarPlus className="h-4 w-4 text-saffron-600" /> Add to Calendar
            </button>
          )}
          <button type="button" onClick={() => downloadReceipt(b)} className="btn-outline !py-1.5 text-xs">
            <Download className="h-4 w-4" /> Download Receipt
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-bold text-maroon-900">{b.puja?.name}</h1>
        <StatusBadge status={b.status} meta={STATUS_META} />
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          {live || !cancelled ? 'Live status tracker active' : 'Tracker offline'}
        </span>
      </div>
      <p className="text-sm text-maroon-700/80">Booking #{b.bookingNumber}</p>

      {notice && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">{notice}</p>}
      {actionError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}

      {!cancelled && (
        <ol className="card mt-6 grid gap-4 p-5 sm:grid-cols-5">
          {STATUS_FLOW.map((s, i) => (
            <li key={s} className="flex items-center gap-2 sm:flex-col sm:text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i <= stepIdx ? 'bg-saffron-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i <= stepIdx ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-xs font-semibold ${i <= stepIdx ? 'text-maroon-800' : 'text-gray-400'}`}>{STATUS_META[s].label}</span>
            </li>
          ))}
        </ol>
      )}
      {cancelled && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          This booking was cancelled{b.cancellation?.reason ? `: ${b.cancellation.reason}` : ''}.
          {b.payment.refundedAmount > 0 && ` Refund of ${inr(b.payment.refundedAmount)} initiated.`}
          {b.payment.refundStatus === 'failed' && ' Our team will process your refund manually.'}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-5 text-sm lg:col-span-2">
          <h2 className="font-serif text-xl font-bold text-maroon-900">Ritual Schedule &amp; Details</h2>
          <p><b>When:</b> {fmtDate(b.date)}, {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})</p>
          <p><b>Package:</b> {b.tierName} · <b>Language:</b> {b.language}</p>
          <p><b>Location:</b> {LOCATION_LABEL[b.locationType]}{b.address?.line1 ? ` — ${b.address.line1}, ${b.address.city} ${b.address.pincode || ''}` : ''}</p>
          <p><b>Samagri kit:</b> {b.includeSamagri ? b.samagriKit?.name || 'Included' : 'Not included'}</p>
          {b.meetingLink && <a href={b.meetingLink} target="_blank" rel="noreferrer" className="btn-primary w-fit"><Video className="h-4 w-4" />Join live e-Puja video</a>}
          {b.locationType === 'online' && !b.meetingLink && b.status !== 'cancelled' && <p className="text-maroon-700/70">Your purohit will share the live video link here before the ceremony.</p>}

          <h2 className="pt-3 text-xl text-maroon-800">Assigned Purohit</h2>
          {b.pandit ? (
            <div className="rounded-lg bg-cream-100 p-4">
              <b>{b.pandit.user?.name}</b> · {b.pandit.experienceYears} yrs · <Star className="inline h-4 w-4 fill-gold-500 text-gold-500" /> {b.pandit.rating?.avg || 'New'}
              {b.pandit.user?.phone && <p className="mt-1">📞 <a href={`tel:${b.pandit.user.phone}`} className="font-semibold text-saffron-700 hover:underline">{b.pandit.user.phone}</a></p>}
              {b.pandit.templeAffiliation && <p className="text-maroon-700/80">{b.pandit.templeAffiliation}</p>}
            </div>
          ) : (
            <p className="text-maroon-700/80">
              {cancelled ? 'No purohit assigned.' : 'A verified purohit will be assigned once your payment is confirmed. You will see the update here live.'}
            </p>
          )}

          {b.status === 'completed' && !b.reviewed && (
            <div className="mt-4 rounded-lg border border-gold-300 p-4">
              <h3 className="text-lg text-maroon-800">Rate your experience</h3>
              <select className="input mt-2 max-w-[8rem]" value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })} aria-label="Rating">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
              <textarea className="input mt-2" rows={2} maxLength={1000} placeholder="Share your feedback" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button className="btn-primary mt-2" disabled={busy} onClick={() => run(() => api.post('/reviews', { bookingId: b._id, ...review }), 'Thank you for your review!')}>Submit review</button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="text-xl text-maroon-800">Submitted Requirement Details</h2>
            <p className="mt-2 text-xs text-maroon-800">
              <b>Devotee Name:</b> {b.customerName || b.customer?.name}
            </p>
            <p className="mt-1 text-xs text-maroon-800">
              <b>Mobile Number:</b> +91 {b.customerPhone || b.customer?.phone}
            </p>
            {(b.serviceDetails || b.notes) && (
              <div className="mt-2 rounded-xl border border-gold-300/60 bg-cream-100 p-3 text-xs text-maroon-900">
                <b>Service Details:</b>
                <p className="mt-1 whitespace-pre-wrap">{b.serviceDetails || b.notes}</p>
              </div>
            )}
          </div>

          {canCancelOrReschedule && !resched.open && (
            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => setResched({ open: true, date: b.date > today ? b.date : '', slot: null })}
            >
              <CalendarClock className="h-4 w-4" /> Reschedule Muhurtham
            </button>
          )}

          {resched.open && (
            <div className="card space-y-3 p-4 text-sm">
              <h3 className="text-base font-semibold text-maroon-800">Reschedule Booking</h3>
              <div>
                <label className="label">New Date</label>
                <input
                  type="date"
                  min={today}
                  className="input"
                  value={resched.date}
                  onChange={(e) => setResched({ ...resched, date: e.target.value, slot: null })}
                />
              </div>
              {resched.date && (
                <div>
                  <label className="label">New Muhurtham / Slot</label>
                  <select
                    className="input"
                    value={resched.slot ? `${resched.slot.label}|${resched.slot.startTime}|${resched.slot.endTime}` : ''}
                    onChange={(e) => {
                      const [label, startTime, endTime] = e.target.value.split('|');
                      setResched({ ...resched, slot: label ? { label, startTime, endTime } : null });
                    }}
                  >
                    <option value="">Select slot…</option>
                    {(slotsQ.data || []).map((s) => (
                      <option key={`${s.label}-${s.startTime}`} value={`${s.label}|${s.startTime}|${s.endTime}`}>
                        {s.label} ({s.startTime}–{s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" className="btn-outline flex-1 !py-1.5" onClick={() => setResched({ open: false, date: '', slot: null })}>Cancel</button>
                <button
                  type="button"
                  className="btn-primary flex-1 !py-1.5"
                  disabled={busy || !resched.date || !resched.slot}
                  onClick={() => run(async () => {
                    await api.patch(`/bookings/${b._id}/reschedule`, { date: resched.date, timeSlot: resched.slot });
                    setResched({ open: false, date: '', slot: null });
                  }, 'Booking rescheduled!')}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {canCancelOrReschedule && (
            <button
              className="btn-outline w-full !border-red-600 !text-red-700 hover:!bg-red-50"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Cancel this booking? Refunds follow our cancellation policy (100% if 48h+ before, 50% if 24h+).')) {
                  run(() => api.patch(`/bookings/${b._id}/status`, { status: 'cancelled', reason: 'Cancelled by customer' }), 'Booking cancelled.');
                }
              }}
            >
              Cancel booking
            </button>
          )}

          {!dispute.open && b.status !== 'pending' && (
            <button className="btn-outline w-full" onClick={() => setDispute({ ...dispute, open: true })}>Raise an issue</button>
          )}
          {dispute.open && (
            <div className="card space-y-2 p-4">
              <input className="input" placeholder="Subject" value={dispute.subject} onChange={(e) => setDispute({ ...dispute, subject: e.target.value })} />
              <textarea className="input" rows={3} placeholder="Describe the issue (min 10 characters)" value={dispute.description} onChange={(e) => setDispute({ ...dispute, description: e.target.value })} />
              <button
                className="btn-maroon w-full"
                disabled={busy}
                onClick={() => run(async () => {
                  await api.post('/disputes', { bookingId: b._id, subject: dispute.subject, description: dispute.description });
                  setDispute({ open: false, subject: '', description: '' });
                }, 'Your issue has been submitted. Our team will contact you.')}
              >
                Submit
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
