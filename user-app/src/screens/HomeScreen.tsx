import React, { useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { Button, Card, EmptyState, ErrorState, Loader, StatusBadge } from '../components/ui';
import { COLORS, fmtDate, getPanditPhotoUrl, inr } from '../utils/format';
import type { Booking, Pandit, Puja } from '../types';

const QUICK_CATEGORIES: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All Rituals', value: '', icon: 'sparkles-outline' },
  { label: 'Griha Pravesh', value: 'Griha Pravesh', icon: 'home-outline' },
  { label: 'Satyanarayan', value: 'Satyanarayan', icon: 'sunny-outline' },
  { label: 'Rudrabhishek', value: 'Rudrabhishek', icon: 'water-outline' },
  { label: 'Navagraha', value: 'Navagraha', icon: 'planet-outline' },
  { label: 'Vivah', value: 'Vivah', icon: 'heart-outline' },
  { label: 'Shradh', value: 'Shradh', icon: 'leaf-outline' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('');
  const pujasQ = useFetch<Puja[]>('/pujas', { featured: 'true', limit: 6 });
  const panditsQ = useFetch<Pandit[]>('/pandits', { sort: 'rating', limit: 4 });
  const bookingsQ = useFetch<Booking[]>('/bookings', { status: 'pending,confirmed,pandit_assigned,in_progress', limit: 3 });

  const onRefresh = () => {
    pujasQ.reload();
    panditsQ.reload();
    bookingsQ.reload();
  };

  const upcoming = bookingsQ.data?.[0];
  const filteredPujas = (pujasQ.data || []).filter((p) => !selectedCat || p.category === selectedCat);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={pujasQ.loading && !!pujasQ.data} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Upgraded Hero Banner with Rich Sacred Styling & Clear CTA */}
      <View className="mx-4 mt-4 overflow-hidden rounded-3xl border border-gold-400/60 bg-maroon-800 p-5 shadow-md">
        <View className="self-start rounded-full border border-gold-400/70 bg-maroon-900 px-3 py-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gold-300">
            🪔 VedaPujas · Hyderabad #1 Vedic Platform
          </Text>
        </View>
        <Text className="mt-2.5 text-2xl font-bold leading-7 text-cream-100">
          Namaste {user?.name ? user.name.split(' ')[0] : 'Devotee'}, Book Certified Veda Patasala Scholars
        </Text>
        <Text className="mt-1.5 text-xs leading-5 text-cream-200">
          Griha Pravesh, Sri Satyanarayan Vrat, Rudrabhishek &amp; Navagraha Homam — with doorstep Samagri across Gachibowli, Madhapur &amp; Kukatpally.
        </Text>
        <View className="mt-4">
          <Button title="Explore Puja Catalog →" onPress={() => router.push('/pujas')} />
        </View>
      </View>

      {upcoming ? (
        <View className="px-4 pt-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-saffron-600">
            Upcoming Ritual · #{upcoming.bookingNumber}
          </Text>
          <Pressable onPress={() => router.push(`/booking/${upcoming._id}`)}>
            <Card className="border-gold-400 bg-cream-100">
              <View className="flex-row items-center justify-between">
                <Text className="mr-2 flex-1 text-base font-bold text-maroon-800">{upcoming.puja?.name}</Text>
                <StatusBadge status={upcoming.status} />
              </View>
              <Text className="mt-1 text-xs font-semibold text-maroon-700">
                📅 {fmtDate(upcoming.date)} · {upcoming.timeSlot.label} ({upcoming.timeSlot.startTime}–{upcoming.timeSlot.endTime})
              </Text>
              <Text className="mt-1 text-xs font-bold text-saffron-600">
                {upcoming.pandit?.user?.name
                  ? `✓ Acharya: ${upcoming.pandit.user.name} · Tap for Live Tracker →`
                  : 'Auto-matching Veda Patasala Scholar · Tap to track →'}
              </Text>
            </Card>
          </Pressable>
        </View>
      ) : null}

      {/* Clean Horizontal Scroll Quick-Book Categories */}
      <View className="pt-5">
        <View className="mb-2.5 flex-row items-center justify-between px-4">
          <Text className="text-base font-bold text-maroon-800">Quick-Book Categories</Text>
          <Pressable onPress={() => router.push('/pujas')}>
            <Text className="text-xs font-bold text-saffron-600">See All →</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {QUICK_CATEGORIES.map((c) => {
            const active = selectedCat === c.value;
            return (
              <Pressable
                key={c.label}
                onPress={() => {
                  setSelectedCat(c.value);
                  if (c.value) router.push(`/pujas?category=${encodeURIComponent(c.value)}`);
                }}
                className={`mr-2.5 flex-row items-center rounded-full border px-4 py-2 ${
                  active ? 'border-gold-400 bg-maroon-800' : 'border-gold-300 bg-white'
                }`}
              >
                <Ionicons name={c.icon} size={15} color={active ? COLORS.gold : COLORS.saffron} />
                <Text className={`ml-1.5 text-xs font-bold ${active ? 'text-gold-300' : 'text-maroon-800'}`}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Featured Vedic Pandits with Authentic Portraits & Ratings */}
      <View className="pt-5">
        <View className="mb-2.5 flex-row items-center justify-between px-4">
          <Text className="text-base font-bold text-maroon-800">Featured Vedic Pandits</Text>
          <Text className="text-[11px] font-bold text-saffron-600">✓ Patasala Certified</Text>
        </View>
        {panditsQ.loading && !panditsQ.data && <Loader />}
        {panditsQ.error && <ErrorState message={panditsQ.error} onRetry={panditsQ.reload} />}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {(panditsQ.data || []).map((p, idx) => (
            <Pressable
              key={p._id}
              onPress={() => router.push('/pujas')}
              className="mr-3 w-48 rounded-2xl border border-gold-300/70 bg-white p-3 shadow-sm"
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: getPanditPhotoUrl(p, idx) }}
                  className="h-12 w-12 rounded-xl border-2 border-gold-400"
                  resizeMode="cover"
                />
                <View className="ml-2.5 flex-1">
                  <Text numberOfLines={1} className="text-xs font-bold text-maroon-900">
                    {p.user?.name || 'Acharya'}
                  </Text>
                  <View className="mt-0.5 flex-row items-center">
                    <Ionicons name="star" size={12} color={COLORS.gold} />
                    <Text className="ml-1 text-[11px] font-bold text-maroon-800">
                      {p.rating?.avg ? p.rating.avg.toFixed(1) : '4.9'} · {p.experienceYears}y
                    </Text>
                  </View>
                </View>
              </View>
              <Text numberOfLines={1} className="mt-2 text-[10px] font-semibold text-saffron-600">
                🗣 {p.languages.slice(0, 3).join(', ')}
              </Text>
              <Text className="mt-1 text-[11px] font-bold text-maroon-900">
                From {inr(p.pujaCharge)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="px-4 pt-5">
        <Text className="mb-3 text-base font-bold text-maroon-800">Popular Pujas &amp; Rituals</Text>
        {pujasQ.loading && !pujasQ.data && <Loader />}
        {pujasQ.error && <ErrorState message={pujasQ.error} onRetry={pujasQ.reload} />}
        {filteredPujas.length === 0 && !pujasQ.loading && (
          <EmptyState title="No featured pujas yet" message="Check the full catalog in the Pujas tab." />
        )}
        {filteredPujas.map((p) => (
          <PujaCard key={p._id} puja={p} />
        ))}
      </View>
    </ScrollView>
  );
}
