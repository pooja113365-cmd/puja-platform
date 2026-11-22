import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import api, { errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import { Button, Card, Chip, ErrorText, Field } from '../components/ui';
import { COLORS, fmtDate, inr } from '../utils/format';
import type { Booking, Dispute, ReferralInfo, SavedAddress, TicketCategory, TicketPriority } from '../types';

const LANG_KEY = 'puja_preferred_language';
const LANGUAGES = ['Telugu', 'Tamil', 'Kannada', 'Hindi', 'Marathi', 'Sanskrit', 'English'];

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '9858945678';
const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '919858945678';
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'GetPuja';

const TICKET_CATEGORIES: { label: string; value: TicketCategory }[] = [
  { label: 'General Support', value: 'general_support' },
  { label: 'Booking Issue', value: 'booking_issue' },
  { label: 'Payment & Refund', value: 'payment_refund' },
  { label: 'Pandit / Ritual', value: 'pandit_feedback' },
  { label: 'Referral & Wallet', value: 'referral_wallet' },
];

const TICKET_PRIORITIES: { label: string; value: TicketPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

export default function ProfileScreen() {
  const { user, updateProfile, refreshUser, logout } = useAuth();
  const [prefLang, setPrefLang] = useState('Telugu');
  const [addrForm, setAddrForm] = useState<SavedAddress>({ label: 'Home', line1: '', city: '', state: '', pincode: '' });
  const [addingAddr, setAddingAddr] = useState(false);

  // Referral code redemption state
  const [friendCode, setFriendCode] = useState('');
  const [applyingRef, setApplyingRef] = useState(false);

  // Support ticket / dispute state
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState<{
    bookingId: string;
    category: TicketCategory;
    priority: TicketPriority;
    subject: string;
    description: string;
  }>({
    bookingId: '',
    category: 'general_support',
    priority: 'medium',
    subject: '',
    description: '',
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bookingsQ = useFetch<Booking[]>('/bookings', { limit: 15 });
  const disputesQ = useFetch<Dispute[]>('/disputes', { limit: 20 });
  const referralQ = useFetch<ReferralInfo>('/referrals/me');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v) setPrefLang(v);
    });
  }, []);

  if (!user) return null;
  const addresses = user.addresses ?? [];
  const refCode = referralQ.data?.referralCode || user.referralCode || 'GPJ108';
  const walletBalance = referralQ.data?.walletBalance ?? user.walletBalance ?? 0;
  const referralCount = referralQ.data?.referralCount ?? user.referralCount ?? 0;
  const referralEarnings = referralQ.data?.referralEarnings ?? user.referralEarnings ?? 0;
  const referrerReward = referralQ.data?.referrerReward ?? 100;
  const refereeReward = referralQ.data?.refereeReward ?? 50;
  const alreadyRedeemed = Boolean(referralQ.data?.referredByCode || user.referredByCode);

  const selectLanguage = async (lang: string) => {
    setPrefLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
    setNotice(`Preferred ritual language set to ${lang}`);
  };

  const shareReferral = async () => {
    const msg = `🪔 Join ${APP_NAME} to book verified Vedic Pujas, Homams & doorstep Samagri! Use my referral code *${refCode}* during signup to get ₹${refereeReward} instant wallet bonus: https://getpuja.com`;
    try {
      await Share.share({ message: msg });
    } catch {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    }
  };

  const shareReferralWhatsApp = () => {
    const msg = `🪔 Join ${APP_NAME} to book verified Vedic Pujas, Homams & doorstep Samagri! Use my referral code *${refCode}* during signup to get ₹${refereeReward} instant wallet bonus: https://getpuja.com`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const applyFriendReferral = async () => {
    if (!friendCode.trim()) {
      setErr('Enter a valid referral code');
      return;
    }
    setApplyingRef(true);
    setErr(null);
    try {
      const res = await api.post('/referrals/apply', { referralCode: friendCode.trim().toUpperCase() });
      setFriendCode('');
      setNotice(res.data?.message || `Referral applied! ₹${refereeReward} added to your wallet.`);
      referralQ.reload();
      await refreshUser();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setApplyingRef(false);
    }
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

  const submitSupportTicket = async () => {
    if (disputeForm.subject.trim().length < 3) {
      setErr('Enter a ticket subject (min 3 characters)');
      return;
    }
    if (disputeForm.description.trim().length < 10) {
      setErr('Describe your issue or request (min 10 characters)');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.post('/disputes', {
        bookingId: disputeForm.bookingId || undefined,
        category: disputeForm.category,
        priority: disputeForm.priority,
        source: 'mobile_app',
        subject: disputeForm.subject.trim(),
        description: disputeForm.description.trim(),
      });
      setDisputeForm({
        bookingId: '',
        category: 'general_support',
        priority: 'medium',
        subject: '',
        description: '',
      });
      setDisputeOpen(false);
      disputesQ.reload();
      setNotice('Support ticket submitted to the Admin Panel! Our team will respond shortly.');
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {/* Devotee Profile Card */}
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

      {notice ? <Text className="mb-3 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">{notice}</Text> : null}
      <ErrorText>{err}</ErrorText>

      {/* Refer & Earn + Wallet Reward System */}
      <Card className="mb-4 border-gold-400 bg-cream-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-saffron-600">
              🎁 Refer &amp; Earn Program
            </Text>
            <Text className="mt-0.5 text-lg font-bold text-maroon-900">
              Give {inr(refereeReward)}, Get {inr(referrerReward)}
            </Text>
          </View>
          <View className="items-end rounded-xl border border-gold-400 bg-maroon-800 px-3 py-2">
            <Text className="text-[10px] font-semibold uppercase text-gold-300">Wallet Balance</Text>
            <Text className="text-base font-bold text-white">{inr(walletBalance)}</Text>
          </View>
        </View>

        <Text className="mt-2 text-xs leading-4 text-maroon-700">
          Invite friends &amp; family to {APP_NAME}. They get {inr(refereeReward)} instant wallet bonus on signup, and you earn {inr(referrerReward)} in your Puja Wallet!
        </Text>

        {/* Referral Code Box */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl border-2 border-dashed border-gold-400 bg-white px-4 py-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-maroon-700">Your Referral Code</Text>
            <Text className="mt-0.5 text-xl font-extrabold tracking-widest text-maroon-900">{refCode}</Text>
          </View>
          <Pressable
            onPress={shareReferral}
            className="flex-row items-center rounded-xl bg-saffron-500 px-3.5 py-2"
          >
            <Ionicons name="share-social-outline" size={15} color="#fff" />
            <Text className="ml-1.5 text-xs font-bold text-white">Share Code</Text>
          </Pressable>
        </View>

        {/* Referral Metrics */}
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-white p-2.5 text-center">
            <Text className="text-[10px] font-bold uppercase text-maroon-700">Friends Referred</Text>
            <Text className="mt-0.5 text-base font-bold text-maroon-900">{referralCount}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-2.5 text-center">
            <Text className="text-[10px] font-bold uppercase text-maroon-700">Total Earned</Text>
            <Text className="mt-0.5 text-base font-bold text-green-700">{inr(referralEarnings)}</Text>
          </View>
        </View>

        <View className="mt-3">
          <Button title="💬 Invite Friends on WhatsApp" onPress={shareReferralWhatsApp} />
        </View>

        {/* Redeem Friend's Referral Code (if not redeemed during signup) */}
        {!alreadyRedeemed ? (
          <View className="mt-3 border-t border-gold-300/50 pt-3">
            <Text className="mb-1.5 text-xs font-bold text-maroon-800">
              Have a friend&apos;s referral code? Claim {inr(refereeReward)} bonus:
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Field
                  label="Enter Friend's Code"
                  value={friendCode}
                  onChangeText={(v) => setFriendCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="e.g. GPJ9X4K2"
                />
              </View>
              <View className="mt-1">
                <Button title="Apply" loading={applyingRef} onPress={applyFriendReferral} />
              </View>
            </View>
          </View>
        ) : (
          <Text className="mt-2.5 text-xs font-semibold text-green-800">
            ✓ Referred with code: {referralQ.data?.referredByCode || user.referredByCode}
          </Text>
        )}

        {referralQ.data?.referredUsers && referralQ.data.referredUsers.length > 0 ? (
          <View className="mt-3 border-t border-gold-300/50 pt-2.5">
            <Text className="mb-1 text-[11px] font-bold uppercase text-maroon-700">Recent Referrals</Text>
            {referralQ.data.referredUsers.map((ru) => (
              <View key={ru._id} className="flex-row items-center justify-between py-1">
                <Text className="text-xs font-semibold text-maroon-900">{ru.name}</Text>
                <Text className="text-[11px] text-green-700">+{inr(referrerReward)} Earned · {fmtDate(ru.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Support Tickets & Disputes (Synced with Admin Panel) */}
      <Card className="mb-4 border-gold-400 bg-cream-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-maroon-800">24×7 Support Tickets &amp; Help Desk</Text>
          <View className="rounded-full bg-saffron-500/15 px-2.5 py-0.5">
            <Text className="text-[10px] font-bold text-saffron-700">Admin Synced</Text>
          </View>
        </View>
        <Text className="mb-3 mt-1 text-xs text-maroon-700">
          Raise a support ticket directly to the {APP_NAME} Admin Panel for booking help, payment/refund queries, or general assistance.
        </Text>

        {!disputeOpen ? (
          <View className="mb-2">
            <Button title="🎫 Raise a Support Ticket" onPress={() => setDisputeOpen(true)} />
          </View>
        ) : (
          <View className="mb-3 mt-1 rounded-2xl border border-gold-300 bg-white p-3.5">
            <Text className="mb-2 text-sm font-bold text-maroon-900">New Support Ticket</Text>

            <Text className="mb-1 text-xs font-semibold uppercase text-maroon-700">Category</Text>
            <View className="mb-2 flex-row flex-wrap">
              {TICKET_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  label={c.label}
                  selected={disputeForm.category === c.value}
                  onPress={() => setDisputeForm({ ...disputeForm, category: c.value })}
                />
              ))}
            </View>

            <Text className="mb-1 text-xs font-semibold uppercase text-maroon-700">Priority</Text>
            <View className="mb-2 flex-row flex-wrap">
              {TICKET_PRIORITIES.map((p) => (
                <Chip
                  key={p.value}
                  label={p.label}
                  selected={disputeForm.priority === p.value}
                  onPress={() => setDisputeForm({ ...disputeForm, priority: p.value })}
                />
              ))}
            </View>

            {(bookingsQ.data ?? []).length > 0 ? (
              <>
                <Text className="mb-1 text-xs font-semibold uppercase text-maroon-700">
                  Link Booking (Optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  <Chip
                    label="None (General Ticket)"
                    selected={!disputeForm.bookingId}
                    onPress={() => setDisputeForm({ ...disputeForm, bookingId: '' })}
                  />
                  {(bookingsQ.data ?? []).map((b) => (
                    <Chip
                      key={b._id}
                      label={`#${b.bookingNumber} (${b.puja?.name || 'Puja'})`}
                      selected={disputeForm.bookingId === b._id}
                      onPress={() => setDisputeForm({ ...disputeForm, bookingId: b._id, category: 'booking_issue' })}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Field
              label="Subject *"
              value={disputeForm.subject}
              onChangeText={(v) => setDisputeForm({ ...disputeForm, subject: v })}
              placeholder="Brief summary of your issue or question"
            />
            <Field
              label="Describe your issue (min 10 chars) *"
              value={disputeForm.description}
              onChangeText={(v) => setDisputeForm({ ...disputeForm, description: v })}
              multiline
              placeholder="Provide details so our Admin team can help you quickly..."
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setDisputeOpen(false)} />
              </View>
              <View className="flex-1">
                <Button title="Submit Ticket" loading={busy} onPress={submitSupportTicket} />
              </View>
            </View>
          </View>
        )}

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              title="💬 WhatsApp Desk"
              variant="outline"
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Namaste ${APP_NAME}, I need assistance with my account`)}`
                )
              }
            />
          </View>
          <View className="flex-1">
            <Button
              title={`📞 Call Helpline`}
              variant="outline"
              onPress={() => Linking.openURL(`tel:+91${SUPPORT_PHONE}`)}
            />
          </View>
        </View>

        {disputesQ.data && disputesQ.data.length > 0 ? (
          <View className="mt-3 border-t border-gold-300/40 pt-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase text-maroon-700">
                Your Support Tickets ({disputesQ.data.length})
              </Text>
              <Pressable onPress={disputesQ.reload}>
                <Text className="text-xs font-bold text-saffron-600">↻ Refresh</Text>
              </Pressable>
            </View>
            {disputesQ.data.map((d) => (
              <View key={d._id} className="mb-2 rounded-xl border border-gold-300/60 bg-white p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-saffron-700">
                    {d.ticketNumber || `#${d._id.slice(-6).toUpperCase()}`}
                    {d.booking?.bookingNumber ? ` · Booking #${d.booking.bookingNumber}` : ' · General'}
                  </Text>
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      d.status === 'resolved'
                        ? 'bg-green-100'
                        : d.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-amber-100'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        d.status === 'resolved'
                          ? 'text-green-800'
                          : d.status === 'rejected'
                          ? 'text-red-800'
                          : 'text-amber-800'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text className="mt-1 text-sm font-bold text-maroon-900">{d.subject}</Text>
                <Text className="mt-0.5 text-xs text-maroon-700">{d.description}</Text>
                {d.resolution ? (
                  <View className="mt-2 rounded-lg bg-green-50 p-2">
                    <Text className="text-[10px] font-bold uppercase text-green-800">Admin Response:</Text>
                    <Text className="mt-0.5 text-xs text-green-900">{d.resolution}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Language Preference */}
      <Card className="mb-4">
        <Text className="mb-2 text-base font-bold text-maroon-800">Language Preference</Text>
        <Text className="mb-2 text-xs text-maroon-700">Default Vedic sankalpam &amp; mantra explanation language:</Text>
        <View className="flex-row flex-wrap">
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={prefLang === l} onPress={() => selectLanguage(l)} />
          ))}
        </View>
      </Card>

      {/* Saved Addresses */}
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

      <Button title="Log Out" variant="danger" onPress={logout} />
      <Text className="mt-4 text-center text-xs text-maroon-700">
        <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.maroon} /> {APP_NAME} · Sacred Vedic Seva · Hyderabad
      </Text>
    </ScrollView>
  );
}
