import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import useFetch from '../hooks/useFetch';
import { Button, EmptyState, ErrorState, Loader, StatusBadge } from '../components/ui';
import { COLORS, LOCATION_LABEL, fmtDate, inr } from '../utils/format';
import type { Booking } from '../types';

export default function BookingsScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useFetch<Booking[]>('/bookings', { limit: 50 });

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <View className="flex-1">
      {loading && !data && <Loader />}
      {error && !data && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <FlatList
          data={data}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
          ListEmptyComponent={<EmptyState title="No bookings yet" message="Your booked pujas will appear here." action={<Button title="Browse pujas" onPress={() => router.push('/pujas')} />} />}
          renderItem={({ item: b }) => (
            <Pressable onPress={() => router.push(`/booking/${b._id}`)} className="mb-3 rounded-2xl border border-gold-300/50 bg-white p-4 active:opacity-90">
              <View className="flex-row items-start justify-between">
                <Text className="mr-2 flex-1 text-base font-bold text-maroon-800">{b.puja?.name}</Text>
                <StatusBadge status={b.status} />
              </View>
              <View className="mt-2 flex-row items-center"><Ionicons name="calendar-outline" size={14} color={COLORS.maroon} /><Text className="ml-1 text-sm text-maroon-700">{fmtDate(b.date)} · {b.timeSlot.label}</Text></View>
              <View className="mt-1 flex-row items-center"><Ionicons name="location-outline" size={14} color={COLORS.maroon} /><Text className="ml-1 text-sm text-maroon-700">{LOCATION_LABEL[b.locationType]}</Text></View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-maroon-700">#{b.bookingNumber}{b.pandit?.user?.name ? ` · ${b.pandit.user.name}` : ''}</Text>
                <Text className="text-base font-bold text-maroon-800">{inr(b.pricing.total)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

