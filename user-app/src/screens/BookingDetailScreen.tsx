import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { errorMessage } from '../services/api';
import { getSocket } from '../services/socket';
import useFetch from '../hooks/useFetch';
import { Button, Card, Chip, ErrorState, ErrorText, Field, Loader, StatusBadge } from '../components/ui';
import { COLORS, LOCATION_LABEL, STATUS_FLOW, STATUS_META, fmtDate, getPanditPhotoUrl, inr } from '../utils/format';
import type { Booking } from '../types';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: b, loading, error, reload } = useFetch<Booking>(id ? `/bookings/${id}` : null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Live tracking of status / pandit assignment via Socket.io
  useEffect(() => {
    if (!id) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;
    const join = () => socket.emit('booking:join', id, (res: { ok: boolean }) => setLive(Boolean(res?.ok)));
    const onUpdate = (p: { id: string }) => { if (p.id === id) reload(); };
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

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setActionError(null);
    try { await fn(); if (ok) setNotice(ok); reload(); } catch (e) { setActionError(errorMessage(e)); } finally { setBusy(false); }
  };

  if (loading && !b) return <Loader />;
  if (error && !b) return <ErrorState message={error} onRetry={reload} />;
  if (!b) return null;

  const cancelled = b.status === 'cancelled';
  const stepIdx = STATUS_FLOW.indexOf(b.status);
  const due = Math.max(b.pricing.total - b.payment.amountPaid, 0);
  const canPay = !cancelled && b.status !== 'completed' && due > 0;
  const canCancel = ['pending', 'confirmed', 'pandit_assigned'].includes(b.status);

  const rawPanditPhone =
    b.pandit?.user?.phone ||
    (b.pandit as { phone?: string } | undefined)?.phone ||
    '9100000001';
  const cleanDigits = String(rawPanditPhone).replace(/^\+?91\s*/, '').trim() || '9100000001';
  const displayPanditPhone = `+91 ${cleanDigits}`;

  const shareOnWhatsApp = () => {
    const text = `🪔 *VedaPujas Hyderabad Booking* (#${b.bookingNumber})\nPuja: ${b.puja?.name} (${b.tierName})\nMuhurtham: ${fmtDate(b.date)} · ${b.timeSlot.label} (${b.timeSlot.startTime}–${b.timeSlot.endTime})\nAcharya: ${b.pandit?.user?.name || 'Verified Veda Patasala Scholar'}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const confirmCancel = () =>
    Alert.alert('Cancel booking?', 'Refunds: 100% if 48h+ before the puja, 50% if 24h+, otherwise none.', [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => run(() => api.patch(`/bookings/${b._id}/status`, { status: 'cancelled', reason: 'Cancelled by customer' }), 'Booking cancelled.') },
    ]);

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row items-center justify-between">
        <Text className="mr-2 flex-1 text-2xl font-bold text-maroon-800">{b.puja?.name}</Text>
        <StatusBadge status={b.status} />
      </View>
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-xs text-maroon-700">Booking #{b.bookingNumber} · {b.tierName} Tier</Text>
        <View className="flex-row items-center rounded-full bg-green-100 px-2.5 py-0.5">
          <Ionicons name="radio-button-on" size={11} color="#15803d" />
          <Text className="ml-1 text-[10px] font-bold text-green-800">
            {live || !cancelled ? 'LIVE TRACKER' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {notice ? <Text className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</Text> : null}
      <View className="mt-3"><ErrorText>{actionError}</ErrorText></View>

      {cancelled ? (
        <Text className="mb-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">This booking was cancelled.{(b.payment.refundedAmount ?? 0) > 0 ? ` Refund of ${inr(b.payment.refundedAmount)} initiated.` : ''}</Text>
      ) : (
        <Card className="mb-4">
          <Text className="mb-2 text-sm font-bold text-maroon-800">Booking Progress Timeline</Text>
          {STATUS_FLOW.map((s, i) => {
            const done = i <= stepIdx;
            return (
              <View key={s} className="flex-row items-center py-1.5">
                <View className={`h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-saffron-500' : 'bg-gray-200'}`}>
                  {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text className="text-xs text-gray-500">{i + 1}</Text>}
                </View>
                <Text className={`ml-3 text-sm ${done ? 'font-semibold text-maroon-800' : 'text-gray-400'}`}>{STATUS_META[s].label}</Text>
              </View>
            );
          })}
        </Card>
      )}

      <Card className="mb-4">
        <Text className="mb-2 text-base font-bold text-maroon-800">Ritual Schedule &amp; Venue</Text>
        <Text className="text-sm text-maroon-900">📅 {fmtDate(b.date)}, {b.timeSlot.label} ({b.timeSlot.startTime}–{b.timeSlot.endTime})</Text>
        <Text className="mt-1 text-sm text-maroon-900">🗣 {b.language} · {b.tierName} Package</Text>
        <Text className="mt-1 text-sm text-maroon-900">📍 {LOCATION_LABEL[b.locationType]}{b.address?.line1 ? ` — ${b.address.line1}, ${b.address.city ?? ''}` : ''}</Text>
        <Text className="mt-1 text-sm text-maroon-900">🧺 Samagri kit: {b.includeSamagri ? '✓ Included (Doorstep Delivery)' : 'Self-arranged'}</Text>
        {b.meetingLink ? <View className="mt-3"><Button title="Join Live e-Puja Video" onPress={() => Linking.openURL(b.meetingLink!)} /></View> : null}
        {b.locationType === 'online' && !b.meetingLink && !cancelled ? <Text className="mt-2 text-xs text-maroon-700">Your purohit will add the video link here before the ceremony.</Text> : null}
        <View className="mt-3">
          <Button title="💬 Share on WhatsApp" variant="outline" onPress={shareOnWhatsApp} />
        </View>
      </Card>

      <Card className="mb-4 border-gold-400 bg-cream-100">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-saffron-600">Assigned Vedic Purohit</Text>
        {b.pandit ? (
          <>
            <View className="flex-row items-center">
              <Image
                source={{ uri: getPanditPhotoUrl(b.pandit) }}
                className="h-14 w-14 rounded-2xl border-2 border-gold-400"
                resizeMode="cover"
              />
              <View className="ml-3 flex-1">
                <View className="self-start rounded-full border border-gold-400 bg-white px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-maroon-800">✓ Verified Veda Patasala Scholar</Text>
                </View>
                <Text className="mt-1 text-base font-bold text-maroon-900">{b.pandit.user?.name}</Text>
                <Text className="text-xs font-semibold text-maroon-700">
                  {b.pandit.experienceYears} yrs exp · ⭐ {b.pandit.rating?.avg || '4.9'}
                  {b.pandit.templeAffiliation ? ` · ${b.pandit.templeAffiliation}` : ''}
                </Text>
              </View>
            </View>
            <View className="mt-3">
              <Button
                title={`📞 Call Pandit (${displayPanditPhone})`}
                onPress={() => Linking.openURL(`tel:+91${cleanDigits}`)}
              />
            </View>
          </>
        ) : (
          <Text className="text-sm text-maroon-700">{cancelled ? 'No purohit assigned.' : 'A verified Veda Patasala scholar will be assigned once your payment is confirmed. This screen updates live.'}</Text>
        )}
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-lg font-bold text-maroon-800">Payment</Text>
        <View className="flex-row justify-between"><Text className="text-sm text-maroon-800">Total</Text><Text className="text-sm font-bold text-maroon-800">{inr(b.pricing.total)}</Text></View>
        <View className="flex-row justify-between"><Text className="text-sm text-maroon-800">Paid</Text><Text className="text-sm text-maroon-800">{inr(b.payment.amountPaid)}</Text></View>
        <View className="mt-1 flex-row justify-between border-t border-gold-300/50 pt-1"><Text className="text-sm text-maroon-800">Balance</Text><Text className="text-sm font-bold text-maroon-800">{inr(due)}</Text></View>
        {canPay ? <View className="mt-3"><Button title={`Pay ${inr(b.payment.status === 'unpaid' && b.paymentOption === 'advance' ? b.pricing.advanceAmount : due)}`} onPress={() => router.push(`/payment?bookingId=${b._id}`)} /></View> : null}
      </Card>

      {b.status === 'completed' && !b.reviewed ? (
        <Card className="mb-4">
          <Text className="mb-2 text-lg font-bold text-maroon-800">Rate your experience</Text>
          <View className="flex-row flex-wrap">{[5, 4, 3, 2, 1].map((n) => <Chip key={n} label={`${n} ★`} selected={rating === n} onPress={() => setRating(n)} />)}</View>
          <Field label="Feedback" value={comment} onChangeText={setComment} multiline maxLength={1000} />
          <Button title="Submit review" loading={busy} onPress={() => run(() => api.post('/reviews', { bookingId: b._id, rating, comment }), 'Thank you for your review!')} />
        </Card>
      ) : null}

      {canCancel ? <Button title="Cancel booking" variant="danger" disabled={busy} onPress={confirmCancel} /> : null}
      <Text className="mt-6 text-center text-xs text-maroon-700">
        <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.maroon} /> Need help? support@pujaplatform.in
      </Text>
    </ScrollView>
  );
}

