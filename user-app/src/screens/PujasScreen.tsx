import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { Chip, EmptyState, ErrorState, Loader, PaginationBar } from '../components/ui';
import { COLORS } from '../utils/format';
import type { LocationType, Puja } from '../types';

const VENUE_FILTERS: { label: string; value: LocationType | '' }[] = [
  { label: 'All Venues', value: '' },
  { label: '🏡 At Home', value: 'home' },
  { label: '🛕 At Temple', value: 'temple' },
  { label: '💻 Live e-Puja', value: 'online' },
];

export default function PujasScreen() {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [venue, setVenue] = useState<LocationType | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const pujasQ = useFetch<Puja[]>('/pujas', {
    search: search || undefined,
    category: category || undefined,
    locationType: venue || undefined,
    page,
    limit,
  });
  const opts = useFetch<{ categories: string[] }>('/pujas/options');

  // Show loading animation until all initial APIs load
  if ((pujasQ.loading && !pujasQ.data) || (opts.loading && !opts.data)) {
    return <Loader fullScreen label="Loading Vedic Puja catalog & filters…" />;
  }

  const filtered = useMemo(() => {
    const list = pujasQ.data ?? [];
    if (!venue) return list;
    return list.filter((p) => !p.locationTypes || p.locationTypes.includes(venue));
  }, [pujasQ.data, venue]);

  const hasFilters = Boolean(search || category || venue || text);

  const resetFilters = () => {
    setText('');
    setSearch('');
    setCategory('');
    setVenue('');
    setPage(1);
  };

  return (
    <View className="flex-1">
      {/* Comprehensive Filter Bar */}
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
              placeholder="Search pujas, homams, rituals…"
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
            <Text className="text-xs font-bold text-white">Search</Text>
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

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5 max-h-11">
          <Chip
            label="All Categories"
            selected={!category}
            onPress={() => {
              setCategory('');
              setPage(1);
            }}
          />
          {(opts.data?.categories ?? []).map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onPress={() => {
                setCategory(c);
                setPage(1);
              }}
            />
          ))}
        </ScrollView>

        {/* Venue / Location Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-0.5 max-h-11">
          {VENUE_FILTERS.map((v) => (
            <Chip
              key={v.label}
              label={v.label}
              selected={venue === v.value}
              onPress={() => {
                setVenue(v.value);
                setPage(1);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {pujasQ.error && <ErrorState message={pujasQ.error} onRetry={pujasQ.reload} />}

      {pujasQ.loading && pujasQ.data ? (
        <Loader fullScreen label="Updating filtered rituals…" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => <PujaCard puja={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={pujasQ.loading} onRefresh={pujasQ.reload} />}
          ListEmptyComponent={
            <EmptyState
              title="No pujas match your filters"
              message="Try clearing your search or selecting another category."
            />
          }
          ListFooterComponent={
            filtered.length > 0 || (pujasQ.meta?.total ?? 0) > 0 ? (
              <PaginationBar
                page={page}
                limit={limit}
                total={pujasQ.meta?.total ?? filtered.length}
                pages={pujasQ.meta?.pages}
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
