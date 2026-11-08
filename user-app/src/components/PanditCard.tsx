import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getPanditPhotoUrl, inr } from '../utils/format';
import type { Pandit } from '../types';

export default function PanditCard({ pandit, selected, onSelect }: { pandit: Pandit; selected?: boolean; onSelect?: () => void }) {
  const name = pandit.user?.name ?? 'Purohit';
  const photo = getPanditPhotoUrl(pandit);
  return (
    <Pressable
      onPress={onSelect}
      className={`mb-3 rounded-2xl border bg-white p-4 shadow-sm ${
        selected ? 'border-2 border-saffron-500 bg-saffron-50' : 'border-gold-300/60'
      }`}
    >
      <View className="flex-row items-center">
        <View className="relative">
          <Image
            source={{ uri: photo }}
            className="h-14 w-14 rounded-2xl border-2 border-gold-400"
            resizeMode="cover"
          />
          <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border border-gold-300 bg-maroon-800">
            <Ionicons name="checkmark" size={11} color={COLORS.gold} />
          </View>
        </View>
        <View className="ml-3 flex-1">
          <View className="self-start rounded-full border border-gold-400 bg-cream-100 px-2 py-0.5">
            <Text className="text-[9px] font-bold text-maroon-800">✓ Verified Veda Patasala Scholar</Text>
          </View>
          <Text className="mt-1 text-base font-bold text-maroon-800">{name}</Text>
          <View className="mt-0.5 flex-row items-center">
            <Ionicons name="star" size={13} color={COLORS.gold} />
            <Text className="ml-1 text-xs font-semibold text-maroon-700">
              {pandit.rating?.avg ? pandit.rating.avg.toFixed(1) : '4.9'}
              {pandit.rating?.count ? ` (${pandit.rating.count})` : ''} · {pandit.experienceYears} yrs Vedic exp
            </Text>
          </View>
        </View>
        {selected && <Ionicons name="checkmark-circle" size={24} color={COLORS.saffron} />}
      </View>
      {pandit.templeAffiliation ? <Text className="mt-2.5 text-xs text-maroon-700">🛕 {pandit.templeAffiliation}</Text> : null}
      <Text className="mt-1 text-xs text-maroon-700">🗣 {pandit.languages.join(', ')}</Text>
      <View className="mt-2.5 flex-row items-center justify-between border-t border-gold-300/40 pt-2">
        <Text className="text-xs font-semibold text-maroon-700">
          Dakshina from <Text className="text-sm font-bold text-maroon-900">{inr(pandit.pujaCharge)}</Text>
        </Text>
        <Text className="text-xs font-bold text-saffron-600">{selected ? '✓ Selected' : 'Book Scholar →'}</Text>
      </View>
    </Pressable>
  );
}

