import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { Chip, EmptyState, ErrorState, Loader } from '../components/ui';
import type { Puja } from '../types';

export default function PujasScreen() {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useFetch<Puja[]>('/pujas', { search: search || undefined, category: category || undefined, limit: 50 });
  const opts = useFetch<{ categories: string[] }>('/pujas/options');

  return (
    <View className="flex-1">
      <View className="px-4 pt-4">
        <TextInput
          value={text} onChangeText={setText} onSubmitEditing={() => setSearch(text.trim())} returnKeyType="search"
          placeholder="Search pujas…" placeholderTextColor="#9ca3af"
          className="rounded-xl border border-gold-300 bg-white px-3 py-3 text-base text-maroon-900"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 max-h-12">
          <Chip label="All" selected={!category} onPress={() => setCategory('')} />
          {(opts.data?.categories ?? []).map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>
      </View>
      {loading && !data && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <FlatList
          data={data}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => <PujaCard puja={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
          ListEmptyComponent={<EmptyState title="No pujas found" message="Try a different search or category." />}
        />
      )}
    </View>
  );
}

