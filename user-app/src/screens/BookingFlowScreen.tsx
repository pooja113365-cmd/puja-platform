import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PanditCard from '../components/PanditCard';
import { Button, Card, Chip, EmptyState, ErrorState, ErrorText, Field, Loader } from '../components/ui';
import { LOCATION_LABEL, fmtDate, inr, toYMD } from '../utils/format';
import type { LocationType, Pandit, Puja, Slot } from '../types';

const STEPS = ['Package', 'Date & Muhurtham', 'Location', 'Purohit', 'Review & Pay'];
const ADVANCE_PERCENT = 30;

const nextDays = (n: number) => Array.from({ length: n }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

export default function BookingFlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: puja, loading, error, reload } = useFetch<Puja>(id ? `/pujas/${id}` : null);
  const opts = useFetch<{ languages: string[] }>('/pandits/options');

  const [step, setStep] = useState(0);
  const [tierName, setTierName] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [language, setLanguage] = useState('');
  const [locationType, setLocationType] = useState<LocationType | ''>('');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
  const [includeSamagri, setIncludeSamagri] = useState(false);
  const [panditMode, setPanditMode] = useState<'auto' | 'choose'>('auto');
  const [panditId, setPanditId] = useState('');
  const [paymentOption, setPaymentOption] = useState<'advance' | 'full'>('advance');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (puja) {
      setTierName((t) => t || puja.priceTiers[0].name);
      setLocationType((l) => l || puja.locationTypes[0]);
    }
  }, [puja]);

  const days = useMemo(() => nextDays(14), []);
  const today = toYMD(new Date());
  const slotsQ = useFetch<Slot[]>(date ? '/muhurthams/slots' : null, { date });
  const slots = useMemo(() => {
    const list = slotsQ.data ?? [];
    if (date !== today) return list;
    const c = new Date(Date.now() + 2 * 3600 * 1000);
    const hhmm = `${String(c.getHours()).padStart(2, '0')}:${String(c.getMinutes()).padStart(2, '0')}`;
    return list.filter((s) => s.startTime > hhmm);
  }, [slotsQ.data, date, today]);

  const panditsQ = useFetch<Pandit[]>(
    step === 3 && panditMode === 'choose' && puja && slot ? '/pandits' : null,
    puja && slot ? { specialization: puja.category, language, date, startTime: slot.startTime, endTime: slot.endTime, limit: 50 } : {}
  );

  if (user && user.role !== 'customer') return <EmptyState title="Customer account required" />;
  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!puja) return null;

  const tier = puja.priceTiers.find((t) => t.name === tierName);
  const online = locationType === 'online';
  const kitOn = includeSamagri && !online && !!puja.samagriKit;
  const total = (tier?.price ?? 0) + (kitOn ? puja.samagriKit!.price : 0);
  const payNow = paymentOption === 'full' ? total : Math.round(total * ADVANCE_PERCENT) / 100;
  const needsAddress = locationType === 'home';
  const addrOk = !needsAddress || (address.line1.trim() && address.city.trim() && /^\d{6}$/.test(address.pincode));
  const canNext = [!!tierName, !!(date && slot && language), !!(locationType && addrOk), panditMode === 'auto' || !!panditId][step];

  const submit = async () => {
    if (!slot || !locationType) return;
    setBusy(true); setSubmitError(null);
    try {
      const res = await api.post('/bookings', {
        pujaId: puja._id, tierName, date,
        timeSlot: { label: slot.label, startTime: slot.startTime, endTime: slot.endTime },
        language, locationType,
        address: online ? undefined : address,
        includeSamagri: kitOn, paymentOption,
        panditId: panditMode === 'choose' ? panditId : undefined,
        notes: notes || undefined,
      });
      router.replace(`/payment?bookingId=${res.data.data._id}`);
    } catch (e) {
      setSubmitError(errorMessage(e));
      setBusy(false);
    }
  };

  const setAddr = (k: keyof typeof address) => (v: string) => setAddress((a) => ({ ...a, [k]: k === 'pincode' ? v.replace(/\D/g, '') : v }));

  return (
    <View className="flex-1">
      <View className="border-b border-gold-300/50 bg-white px-4 py-3">
        <Text className="text-xs font-semibold text-saffron-600">STEP {step + 1} OF {STEPS.length}</Text>
        <Text className="text-lg font-bold text-maroon-800">{STEPS[step]}</Text>
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200"><View className="h-full bg-saffron-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {step === 0 && puja.priceTiers.map((t) => (
          <Pressable key={t.name} onPress={() => setTierName(t.name)} className={`mb-3 rounded-xl border-2 bg-white p-4 ${tierName === t.name ? 'border-saffron-500' : 'border-gold-300/50'}`}>
            <View className="flex-row justify-between"><Text className="text-base font-bold text-maroon-800">{t.name}</Text><Text className="text-base font-bold text-maroon-800">{inr(t.price)}</Text></View>
            {t.description ? <Text className="mt-1 text-xs text-maroon-700">{t.description}</Text> : null}
          </Pressable>
        ))}

        {step === 1 && (
          <>
            <Text className="mb-2 text-xs font-semibold uppercase text-maroon-700">Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {days.map((d) => {
                const ymd = toYMD(d);
                return (
                  <Pressable key={ymd} onPress={() => { setDate(ymd); setSlot(null); }} className={`mr-2 w-16 items-center rounded-xl border py-3 ${date === ymd ? 'border-saffron-500 bg-saffron-500' : 'border-gold-300 bg-white'}`}>
                    <Text className={`text-xs ${date === ymd ? 'text-white' : 'text-maroon-700'}`}>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</Text>
                    <Text className={`text-xl font-bold ${date === ymd ? 'text-white' : 'text-maroon-800'}`}>{d.getDate()}</Text>
                    <Text className={`text-xs ${date === ymd ? 'text-white' : 'text-maroon-700'}`}>{d.toLocaleDateString('en-IN', { month: 'short' })}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {date ? (
              <>
                <Text className="mb-2 text-xs font-semibold uppercase text-maroon-700">Time slot / muhurtham</Text>
                {slotsQ.loading && <Loader label="Loading slots…" />}
                {slotsQ.error && <ErrorState message={slotsQ.error} onRetry={slotsQ.reload} />}
                {!slotsQ.loading && !slotsQ.error && slots.length === 0 && <Text className="mb-3 text-sm text-maroon-700">No slots left for this date. Pick another day.</Text>}
                {slots.map((s) => {
                  const sel = slot?.label === s.label && slot?.startTime === s.startTime;
                  return (
                    <Pressable key={`${s.label}-${s.startTime}`} onPress={() => setSlot(s)} className={`mb-2 rounded-xl border-2 bg-white p-3 ${sel ? 'border-saffron-500' : 'border-gold-300/50'}`}>
                      <Text className="text-sm font-bold text-maroon-800">{s.auspicious ? '✨ ' : ''}{s.label}</Text>
                      <Text className="text-xs text-maroon-700">{s.startTime} – {s.endTime}{s.notes ? ` · ${s.notes}` : ''}</Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}
            <Text className="mb-2 mt-4 text-xs font-semibold uppercase text-maroon-700">Preferred language</Text>
            {opts.loading && <Loader label="Loading languages…" />}
            {opts.error && <ErrorState message={opts.error} onRetry={opts.reload} />}
            <View className="flex-row flex-wrap">
              {(opts.data?.languages ?? []).map((l) => <Chip key={l} label={l} selected={language === l} onPress={() => { setLanguage(l); setPanditId(''); }} />)}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <View className="mb-3 flex-row flex-wrap">
              {puja.locationTypes.map((l) => <Chip key={l} label={LOCATION_LABEL[l]} selected={locationType === l} onPress={() => setLocationType(l)} />)}
            </View>
            {online ? (
              <Text className="rounded-xl bg-cream-100 p-3 text-sm text-maroon-800">Your purohit will share a video-call link on the booking screen before the ceremony.</Text>
            ) : (
              <>
                {user?.addresses && user.addresses.length > 0 ? (
                  <View className="mb-3">
                    <Text className="mb-1.5 text-xs font-semibold uppercase text-maroon-700">Saved Addresses</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {user.addresses.map((a, idx) => (
                        <Chip
                          key={`${a.label || 'Home'}-${idx}`}
                          label={`${a.label || 'Home'}: ${a.city} (${a.pincode})`}
                          selected={address.line1 === a.line1 && address.pincode === a.pincode}
                          onPress={() => setAddress({
                            line1: a.line1,
                            line2: a.line2 || '',
                            city: a.city,
                            state: a.state || '',
                            pincode: a.pincode,
                          })}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
                <Field label={`Address line 1${needsAddress ? ' *' : ''}`} value={address.line1} onChangeText={setAddr('line1')} />
                <Field label="Address line 2" value={address.line2} onChangeText={setAddr('line2')} />
                <Field label={`City${needsAddress ? ' *' : ''}`} value={address.city} onChangeText={setAddr('city')} />
                <Field label="State" value={address.state} onChangeText={setAddr('state')} />
                <Field label={`Pincode${needsAddress ? ' *' : ''}`} value={address.pincode} onChangeText={setAddr('pincode')} keyboardType="number-pad" maxLength={6} />
                {puja.samagriKit ? (
                  <Card className="flex-row items-center">
                    <View className="mr-3 flex-1">
                      <Text className="text-base font-bold text-maroon-800">Include {puja.samagriKit.name}</Text>
                      <Text className="text-xs text-maroon-700">{inr(puja.samagriKit.price)} — all puja materials delivered. Turn off if you will arrange samagri yourself.</Text>
                    </View>
                    <Switch value={includeSamagri} onValueChange={setIncludeSamagri} trackColor={{ true: '#F27F0C' }} />
                  </Card>
                ) : null}
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Pressable onPress={() => { setPanditMode('auto'); setPanditId(''); }} className={`mb-3 rounded-xl border-2 bg-white p-4 ${panditMode === 'auto' ? 'border-saffron-500' : 'border-gold-300/50'}`}>
              <Text className="text-base font-bold text-maroon-800">Auto-match (recommended)</Text>
              <Text className="text-xs text-maroon-700">We assign the best-rated available purohit after payment.</Text>
            </Pressable>
            <Pressable onPress={() => setPanditMode('choose')} className={`mb-3 rounded-xl border-2 bg-white p-4 ${panditMode === 'choose' ? 'border-saffron-500' : 'border-gold-300/50'}`}>
              <Text className="text-base font-bold text-maroon-800">I'll choose</Text>
              <Text className="text-xs text-maroon-700">Pick from purohits free at your slot.</Text>
            </Pressable>
            {panditMode === 'choose' && (
              <>
                {panditsQ.loading && <Loader />}
                {panditsQ.error && <ErrorState message={panditsQ.error} onRetry={panditsQ.reload} />}
                {panditsQ.data && panditsQ.data.length === 0 && <EmptyState title="No purohits available" message="Try auto-match or another slot." />}
                {panditsQ.data?.map((p) => <PanditCard key={p._id} pandit={p} selected={panditId === p._id} onSelect={() => setPanditId(p._id)} />)}
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Card className="mb-4">
              <Text className="text-base font-bold text-maroon-800">{puja.name} — {tierName}</Text>
              <Text className="mt-1 text-sm text-maroon-700">{fmtDate(date)}</Text>
              <Text className="text-sm text-maroon-700">{slot?.label} ({slot?.startTime}–{slot?.endTime}) · {language}</Text>
              <Text className="text-sm text-maroon-700">{locationType ? LOCATION_LABEL[locationType] : ''}{!online && address.city ? ` — ${address.line1}, ${address.city}` : ''}</Text>
              <Text className="text-sm text-maroon-700">Samagri kit: {kitOn ? 'Included' : 'Not included'}</Text>
              <Text className="text-sm text-maroon-700">Purohit: {panditMode === 'auto' ? 'Auto-matched after payment' : (panditsQ.data?.find((p) => p._id === panditId)?.user?.name ?? 'Selected')}</Text>
            </Card>
            <Field label="Notes for the purohit (optional)" value={notes} onChangeText={setNotes} multiline maxLength={500} />
            <Text className="mb-2 text-xs font-semibold uppercase text-maroon-700">Payment option</Text>
            <View className="mb-3 flex-row flex-wrap">
              <Chip label={`${ADVANCE_PERCENT}% advance now`} selected={paymentOption === 'advance'} onPress={() => setPaymentOption('advance')} />
              <Chip label="Pay in full" selected={paymentOption === 'full'} onPress={() => setPaymentOption('full')} />
            </View>
            <Card>
              <View className="flex-row justify-between"><Text className="text-sm text-maroon-800">{tierName}</Text><Text className="text-sm text-maroon-800">{inr(tier?.price)}</Text></View>
              {kitOn ? <View className="flex-row justify-between"><Text className="text-sm text-maroon-800">Samagri kit</Text><Text className="text-sm text-maroon-800">{inr(puja.samagriKit!.price)}</Text></View> : null}
              <View className="mt-2 flex-row justify-between border-t border-gold-300/50 pt-2"><Text className="text-base font-bold text-maroon-800">Total</Text><Text className="text-base font-bold text-maroon-800">{inr(total)}</Text></View>
              <View className="flex-row justify-between"><Text className="text-sm text-maroon-700">Payable now</Text><Text className="text-sm text-maroon-700">{inr(payNow)}</Text></View>
            </Card>
            <View className="mt-4"><ErrorText>{submitError}</ErrorText></View>
          </>
        )}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-gold-300/50 bg-white p-4">
        <View className="flex-1"><Button title="Back" variant="outline" disabled={busy} onPress={() => (step === 0 ? router.back() : setStep(step - 1))} /></View>
        <View className="flex-1">
          {step < 4 ? <Button title="Next" disabled={!canNext} onPress={() => setStep(step + 1)} /> : <Button title={`Pay ${inr(payNow)}`} loading={busy} onPress={submit} />}
        </View>
      </View>
    </View>
  );
}

