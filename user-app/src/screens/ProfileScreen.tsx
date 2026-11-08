import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import api, { errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Button, Card, Chip, ErrorText, Field } from '../components/ui';
import { COLORS } from '../utils/format';
import type { Booking, Dispute, SavedAddress } from '../types';

const LANG_KEY = 'puja_preferred_language';
const LANGUAGES = ['Telugu', 'Tamil', 'Kannada', 'Hindi', 'Marathi', 'Sanskrit', 'English'];

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [prefLang, setPrefLang] = useState('Telugu');
  const [addrForm, setAddrForm] = useState<SavedAddress>({ label: 'Home', line1: '', city: '', state: '', pincode: '' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ bookingId: '', subject: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bookingsQ = useFetch<Booking[]>('/bookings', { limit: 10 });
  const disputesQ = useFetch<Dispute[]>('/disputes', { limit: 10 });

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v) setPrefLang(v);
    });
  }, []);

  if (!user) return null;
  const addresses = user.addresses ?? [];

  const selectLanguage = async (lang: string) => {
    setPrefLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
    setNotice(`Preferred ritual language set to ${lang}`);
  };

  const saveAddress = async () => {
    if (!addrForm.line1.trim() || !addrForm.city.trim() || !/^\d{6}$/.test(addrForm.pincode)) {
      setErr('Enter address line 1, city, and a valid 6-digit pincode');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await updateProfile({ addresses: [...addresses, addrForm] });
      setAddrForm({ label: 'Home', line1: '', city: '', state: '', pincode: '' });
      setAddingAddr(false);
      setNotice('Address saved to your profile.');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (idx: number) => {
    setBusy(true);
    setErr(null);
    try {
      await updateProfile({ addresses: addresses.filter((_, i) => i !== idx) });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeForm.bookingId) {
      setErr('Select a booking to report an issue');
      return;
    }
    if (disputeForm.subject.trim().length < 3 || disputeForm.description.trim().length < 10) {
      setErr('Enter a subject and a description of at least 10 characters');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/disputes', disputeForm);
      setDisputeForm({ bookingId: '', subject: '', description: '' });
      setDisputeOpen(false);
      disputesQ.reload();
      setNotice('Support ticket / dispute submitted. Our Ops desk will respond shortly.');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Card className="mb-4 flex-row items-center border-gold-400 bg-cream-100">
        <View className="relative">
          <View className="h-16 w-16 items-center justify-center rounded-2xl border-2 border-gold-400 bg-maroon-800 shadow-sm">
            <Text className="text-2xl font-bold text-gold-300">{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border border-gold-300 bg-green-700">
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        </View>
        <View className="ml-3.5 flex-1">
          <View className="self-start rounded-full border border-gold-400 bg-white px-2.5 py-0.5">
            <Text className="text-[9px] font-bold uppercase tracking-wider text-maroon-800">
              ✓ Verified Devotee · 📍 Hyderabad
            </Text>
          </View>
          <Text className="mt-1 text-lg font-bold text-maroon-900">{user.name}</Text>
          <Text className="text-xs text-maroon-700">{user.email} · +91 {user.phone || '9000000003'}</Text>
        </View>
      </Card>

      {notice ? <Text className="mb-3 rounded-lg bg-green-50 p-3 text-xs text-green-800">{notice}</Text> : null}
      <ErrorText>{err}</ErrorText>

      <Card className="mb-4">
        <Text className="mb-2 text-base font-bold text-maroon-800">Language Preference</Text>
        <Text className="mb-2 text-xs text-maroon-700">Default Vedic sankalpam &amp; mantra explanation language:</Text>
        <View className="flex-row flex-wrap">
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={prefLang === l} onPress={() => selectLanguage(l)} />
          ))}
        </View>
      </Card>

      <Card className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-maroon-800">Saved Addresses ({addresses.length})</Text>
          {!addingAddr && (
            <Pressable onPress={() => setAddingAddr(true)}>
              <Text className="text-xs font-bold text-saffron-600">+ Add Address</Text>
            </Pressable>
          )}
        </View>
        {addresses.length === 0 && !addingAddr ? (
          <Text className="text-xs text-maroon-700">No saved addresses yet. Add your home address for 1-tap puja checkout.</Text>
        ) : null}
        {addresses.map((a, idx) => (
          <View key={`${a.line1}-${idx}`} className="mb-2 flex-row items-center justify-between rounded-xl bg-cream-100 p-3">
            <View className="mr-2 flex-1">
              <Text className="text-xs font-bold uppercase text-saffron-700">{a.label || 'Home'}</Text>
              <Text className="text-sm text-maroon-900">{a.line1}</Text>
              <Text className="text-xs text-maroon-700">{a.city}{a.state ? `, ${a.state}` : ''} — {a.pincode}</Text>
            </View>
            <Pressable onPress={() => removeAddress(idx)} disabled={busy}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>
          </View>
        ))}

        {addingAddr ? (
          <View className="mt-2 border-t border-gold-300/50 pt-3">
            <Field label="Label (Home / Parents / Office)" value={addrForm.label} onChangeText={(v) => setAddrForm({ ...addrForm, label: v })} />
            <Field label="Address Line 1 *" value={addrForm.line1} onChangeText={(v) => setAddrForm({ ...addrForm, line1: v })} />
            <Field label="City *" value={addrForm.city} onChangeText={(v) => setAddrForm({ ...addrForm, city: v })} />
            <Field label="State" value={addrForm.state} onChangeText={(v) => setAddrForm({ ...addrForm, state: v })} />
            <Field
              label="6-Digit Pincode *"
              value={addrForm.pincode}
              onChangeText={(v) => setAddrForm({ ...addrForm, pincode: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View className="flex-row gap-2">
              <View className="flex-1"><Button title="Cancel" variant="outline" onPress={() => setAddingAddr(false)} /></View>
              <View className="flex-1"><Button title="Save Address" loading={busy} onPress={saveAddress} /></View>
            </View>
          </View>
        ) : null}
      </Card>

      <Card className="mb-4 border-gold-400 bg-cream-100">
        <Text className="mb-1 text-base font-bold text-maroon-800">24×7 VedaPujas Support &amp; Disputes</Text>
        <Text className="mb-3 text-xs text-maroon-700">
          Need urgent Muhurtham assistance, Samagri delivery updates, or help with an assigned Purohit? Reach our Hyderabad Vedic Desk.
        </Text>
        <View className="mb-2">
          <Button
            title="💬 WhatsApp Support (+91 90000 00001)"
            onPress={() =>
              Linking.openURL(
                'https://wa.me/919000000001?text=Namaste%20VedaPujas%20Hyderabad%2C%20I%20need%20assistance%20with%20my%20Puja%20booking'
              )
            }
          />
        </View>
        <View className="mb-2">
          <Button
            title="📞 Call Emergency Ops Helpline (+91 800-108-7852)"
            variant="outline"
            onPress={() => Linking.openURL('tel:+918001087852')}
          />
        </View>
        {!disputeOpen ? (
          <Button title="⚠ Raise a Booking Dispute / Issue" variant="outline" onPress={() => setDisputeOpen(true)} />
        ) : (
          <View className="mt-3 border-t border-gold-300/50 pt-3">
            <Text className="mb-1 text-xs font-semibold uppercase text-maroon-700">Select Booking</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
              {(bookingsQ.data ?? []).map((b) => (
                <Chip
                  key={b._id}
                  label={`#${b.bookingNumber} (${b.puja?.name || 'Puja'})`}
                  selected={disputeForm.bookingId === b._id}
                  onPress={() => setDisputeForm({ ...disputeForm, bookingId: b._id })}
                />
              ))}
            </ScrollView>
            <Field label="Subject *" value={disputeForm.subject} onChangeText={(v) => setDisputeForm({ ...disputeForm, subject: v })} />
            <Field
              label="Describe the issue (min 10 chars) *"
              value={disputeForm.description}
              onChangeText={(v) => setDisputeForm({ ...disputeForm, description: v })}
              multiline
            />
            <View className="flex-row gap-2">
              <View className="flex-1"><Button title="Cancel" variant="outline" onPress={() => setDisputeOpen(false)} /></View>
              <View className="flex-1"><Button title="Submit Ticket" loading={busy} onPress={submitDispute} /></View>
            </View>
          </View>
        )}

        {disputesQ.data && disputesQ.data.length > 0 ? (
          <View className="mt-3 border-t border-gold-300/40 pt-3">
            <Text className="mb-1.5 text-xs font-bold uppercase text-maroon-700">Your Support Tickets</Text>
            {disputesQ.data.map((d) => (
              <View key={d._id} className="mb-2 rounded-lg bg-white p-2.5">
                <Text className="text-xs font-bold text-maroon-800">{d.subject} · {d.status.toUpperCase()}</Text>
                {d.resolution ? <Text className="mt-0.5 text-xs text-green-800">Resolution: {d.resolution}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Button title="Log Out" variant="danger" onPress={logout} />
      <Text className="mt-4 text-center text-xs text-maroon-700">
        <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.maroon} /> VedaPujas v2.0 · Sacred Vedic Seva · Hyderabad
      </Text>
    </ScrollView>
  );
}
