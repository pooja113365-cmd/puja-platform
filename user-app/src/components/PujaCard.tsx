import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, LOCATION_LABEL, duration, getPujaImageUrl, inr } from '../utils/format';
import type { Puja } from '../types';

export default function PujaCard({ puja }: { puja: Puja }) {
  const router = useRouter();
  const from = Math.min(...puja.priceTiers.map((t) => t.price));
  return (
    <Pressable
      onPress={() => router.push(`/puja/${puja._id}`)}
      className="mb-4 overflow-hidden rounded-2xl border border-gold-300/60 bg-white shadow-sm active:opacity-90"
    >
      <View className="relative h-36 w-full bg-maroon-900">
        <Image source={{ uri: getPujaImageUrl(puja) }} className="h-36 w-full" resizeMode="cover" />
        <View className="absolute left-3 top-3 rounded-full bg-maroon-900/90 px-2.5 py-1">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gold-300">{puja.category}</Text>
        </View>
        {puja.samagriKit ? (
          <View className="absolute right-3 top-3 rounded-full bg-green-700/95 px-2.5 py-1">
            <Text className="text-[10px] font-bold text-white">✓ Samagri Kit</Text>
          </View>
        ) : null}
      </View>
      <View className="p-4">
        <Text className="text-lg font-bold text-maroon-800">{puja.name}</Text>
        <Text numberOfLines={2} className="mt-1 text-sm text-maroon-700">{puja.description}</Text>
        <View className="mt-3 flex-row flex-wrap items-center">
          <Ionicons name="time-outline" size={14} color={COLORS.maroon} />
          <Text className="ml-1 mr-4 text-xs text-maroon-700">{duration(puja.durationMinutes)}</Text>
          <Ionicons name="location-outline" size={14} color={COLORS.maroon} />
          <Text className="ml-1 text-xs text-maroon-700">{puja.locationTypes.map((l) => LOCATION_LABEL[l]).join(' · ')}</Text>
        </View>
        <View className="mt-3 flex-row items-center justify-between border-t border-gold-300/40 pt-2.5">
          <Text className="text-sm text-maroon-700">
            From <Text className="text-lg font-bold text-maroon-800">{inr(from)}</Text>
          </Text>
          <Text className="text-xs font-bold text-saffron-600">View Ritual →</Text>
        </View>
      </View>
    </Pressable>
  );
}

