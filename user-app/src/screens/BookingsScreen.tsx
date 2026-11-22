import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import useFetch from '../hooks/useFetch';
import { Button, Chip, EmptyState, ErrorState, Loader, PaginationBar, StatusBadge } from '../components/ui';
import { COLORS, LOCATION_LABEL, fmtDate, inr } from '../utils/format';
import type { Booking, BookingStatus } from '../types';

const STATUS_FILTERS: { label: string; value: BookingStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pandit Assigned', value: 'pandit_assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const { data, meta, loading, error, reload } = useFetch<Booking[]>('/bookings', {
    status: status || undefined,
    search: search || undefined,
    page,
    limit,
  });

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Show loading animation until initial bookings API loads
  if (loading && !data) {
    return <Loader fullScreen label="Loading your bookings & live status…" />;
  }

  const hasFilters = Boolean(status || search || text);
  const resetFilters = () => {
    setText('');
    setSearch('');
    setStatus('');
    setPage(1);
  };

  return (
    <View className="flex-1">
      {/* Filter & Search Bar */}
      <View className="border-b border-gold-300/50 bg-cream-50 px-4 pb-2 pt-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-xl border border-gold-300 bg-white px-3">
            <Ionicons name="search-outline" size={16} color={COLORS.maroon} />
            <TextInput
              value={text}
              onChangeText={(v) => {
                setText(v);
                if (!v.trim()) {
                  setSearch('');
                  setPage(1);
                }
              }}
              onSubmitEditing={() => {
                setSearch(text.trim());
                setPage(1);
              }}
              returnKeyType="search"
              placeholder="Search booking # or puja…"
              placeholderTextColor="#9ca3af"
              className="ml-2 flex-1 py-2.5 text-sm text-maroon-900"
            />
          </View>
          <Pressable
            onPress={() => {
              setSearch(text.trim());
              setPage(1);
            }}
            className="rounded-xl bg-saffron-500 px-3.5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">Filter</Text>
          </Pressable>
          {hasFilters ? (
            <Pressable
              onPress={resetFilters}
              className="rounded-xl border border-gold-400 bg-white px-2.5 py-2.5"
            >
              <Text className="text-xs font-bold text-maroon-800">Reset</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5 max-h-11">
          {STATUS_FILTERS.map((sf) => (
            <Chip
              key={sf.label}
              label={sf.label}
              selected={status === sf.value}
              onPress={() => {
                setStatus(sf.value);
                setPage(1);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {error && !data && <ErrorState message={error} onRetry={reload} />}

      {loading && data ? (
        <Loader fullScreen label="Filtering bookings…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
          ListEmptyComponent={
            <EmptyState
              title={hasFilters ? 'No matching bookings' : 'No bookings yet'}
              message={hasFilters ? 'Try resetting your search or status filter.' : 'Your booked pujas will appear here.'}
              action={<Button title="Browse Pujas" onPress={() => router.push('/pujas')} />}
            />
          }
          renderItem={({ item: b, index }) => (
            <Pressable
              onPress={() => router.push(`/booking/${b._id}`)}
              className="mb-3 rounded-2xl border border-gold-300/60 bg-white p-4 shadow-sm active:opacity-90"
            >
              <View className="flex-row items-start justify-between">
                <View className="mr-2 flex-1">
                  <Text className="text-[11px] font-bold text-saffron-600">
                    S.No #{(page - 1) * limit + index + 1} · Booking #{b.bookingNumber}
                  </Text>
                  <Text className="mt-0.5 text-base font-bold text-maroon-800">{b.puja?.name || 'Vedic Puja'}</Text>
                </View>
                <StatusBadge status={b.status} />
              </View>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color={COLORS.maroon} />
                <Text className="ml-1 text-sm text-maroon-700">{fmtDate(b.date)} · {b.timeSlot.label}</Text>
              </View>
              <View className="mt-1 flex-row items-center">
                <Ionicons name="location-outline" size={14} color={COLORS.maroon} />
                <Text className="ml-1 text-sm text-maroon-700">{LOCATION_LABEL[b.locationType]}</Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between border-t border-gold-300/40 pt-2">
                <Text className="text-xs font-semibold text-maroon-700">
                  {b.pandit?.user?.name ? `Acharya: ${b.pandit.user.name}` : 'Tap for Live Tracker →'}
                </Text>
                <Text className="text-base font-bold text-maroon-900">{inr(b.pricing.total)}</Text>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            (data && data.length > 0) || (meta?.total ?? 0) > 0 ? (
              <PaginationBar
                page={page}
                limit={limit}
                total={meta?.total ?? data?.length ?? 0}
                pages={meta?.pages}
                onPageChange={setPage}
                onLimitChange={(nextLimit) => {
                  setLimit(nextLimit);
                  setPage(1);
                }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}
