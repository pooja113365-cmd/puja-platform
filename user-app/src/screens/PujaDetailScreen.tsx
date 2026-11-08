import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useFetch from '../hooks/useFetch';
import { Button, Card, ErrorState, Loader } from '../components/ui';
import { COLORS, LOCATION_LABEL, duration, getPujaImageUrl, inr } from '../utils/format';
import type { Puja } from '../types';

const RITUAL_STEPS = [
  { step: '1. Achamanam & Sankalpam', detail: 'Purification with Vedic mantras and formal vow naming family गोत्र (Gotra) and Nakshatras.' },
  { step: '2. Ganapati & Kalash Sthapana', detail: 'Invocation of Lord Vigneshwara and Varuna Deva in the sacred copper Kalash.' },
  { step: '3. Pradhana Devata Puja & Havan', detail: 'Shodashopachara Archana, Ashtottara chanting, and sacred Agni Homam offerings.' },
  { step: '4. Purnahuti, Maha Aarti & Ashirvada', detail: 'Concluding offerings, Karpoora Aarti, Mantrapushpam, and Vedic blessings.' },
];

const FAQS = [
  {
    q: 'What if I choose the Samagri Kit add-on?',
    a: 'Your assigned Purohit or our operations team brings the complete sealed Vedic Samagri Kit (Kalash, Navadhanya, Samidha, Ghee, Haldi-Kumkum, etc.). You only arrange fresh perishables like milk, fruits, and flowers.',
  },
  {
    q: 'Can I book a Purohit who speaks my mother tongue?',
    a: 'Yes. During booking you select your preferred language (Telugu, Tamil, Kannada, Hindi, Marathi, Sanskrit, or English) and we match a certified Acharya fluent in that language.',
  },
  {
    q: 'What is the cancellation and reschedule policy?',
    a: 'You can reschedule for free up to 2 hours before the ceremony. Cancellations 48+ hours before receive a 100% refund; 24–48 hours receive a 50% refund.',
  },
];

export default function PujaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: puja, loading, error, reload } = useFetch<Puja>(id ? `/pujas/${id}` : null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTierName, setSelectedTierName] = useState<string>('');

  useEffect(() => {
    if (puja?.priceTiers?.length) {
      const def = puja.priceTiers.find((t) => t.name === 'Standard')?.name || puja.priceTiers[1]?.name || puja.priceTiers[0].name;
      setSelectedTierName((prev) => prev || def);
    }
  }, [puja]);

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!puja) return null;

  const activeTierName = selectedTierName || puja.priceTiers[1]?.name || puja.priceTiers[0]?.name;
  const activeTier = puja.priceTiers.find((t) => t.name === activeTierName) || puja.priceTiers[0];

  return (
    <View className="flex-1 bg-cream-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        {/* Hero Image Banner at Top of Ritual Detail View */}
        <View className="relative h-52 w-full overflow-hidden rounded-2xl border border-gold-400/70 bg-maroon-900">
          <Image source={{ uri: getPujaImageUrl(puja) }} className="h-52 w-full" resizeMode="cover" />
          <View className="absolute left-3 top-3 flex-row items-center gap-2">
            <View className="rounded-full border border-gold-300 bg-maroon-900/90 px-3 py-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-gold-300">{puja.category}</Text>
            </View>
            {puja.samagriKit ? (
              <View className="rounded-full bg-green-700/95 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-white">✓ Samagri Kit Available</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text className="mt-4 text-2xl font-bold text-maroon-800">{puja.name}</Text>
        <View className="mt-2 flex-row flex-wrap items-center">
          <Ionicons name="time-outline" size={16} color={COLORS.maroon} />
          <Text className="ml-1 mr-4 text-sm text-maroon-700">{duration(puja.durationMinutes)}</Text>
          <Ionicons name="location-outline" size={16} color={COLORS.maroon} />
          <Text className="ml-1 text-sm text-maroon-700">{puja.locationTypes.map((l) => LOCATION_LABEL[l]).join(' · ')}</Text>
        </View>
        <Text className="mt-3 text-sm leading-5 text-maroon-900">{puja.description}</Text>

        {puja.significance ? (
          <View className="mt-4 rounded-xl border-l-4 border-gold-500 bg-cream-100 p-4">
            <Text className="text-sm font-bold text-maroon-800">Spiritual Significance</Text>
            <Text className="mt-1 text-xs leading-5 text-maroon-900">{puja.significance}</Text>
          </View>
        ) : null}

        <Text className="mb-2 mt-6 text-lg font-bold text-maroon-800">Select Dakshina Package Tier</Text>
        {puja.priceTiers.map((t, idx) => {
          const isSelected = activeTierName === t.name;
          const isStandard = t.name.toLowerCase() === 'standard' || idx === 1;
          return (
            <Pressable
              key={t.name}
              onPress={() => setSelectedTierName(t.name)}
              className={`mb-2.5 rounded-2xl border p-4 ${
                isSelected ? 'border-2 border-saffron-500 bg-saffron-50/70' : 'border-gold-300/60 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row flex-wrap items-center">
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={isSelected ? COLORS.saffron : COLORS.gold}
                  />
                  <Text className="ml-2 text-base font-bold text-maroon-800">{t.name}</Text>
                  {isStandard ? (
                    <View className="ml-2 rounded-full bg-gold-300/40 px-2.5 py-0.5">
                      <Text className="text-[10px] font-bold uppercase text-maroon-900">
                        ★ Recommended in Hyderabad
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-lg font-bold text-saffron-600">{inr(t.price)}</Text>
              </View>
              {t.description ? <Text className="mt-1.5 pl-6 text-xs text-maroon-700">{t.description}</Text> : null}
            </Pressable>
          );
        })}

        <Text className="mb-2 mt-5 text-lg font-bold text-maroon-800">Vedic Ritual Breakdown</Text>
        <Card>
          {RITUAL_STEPS.map((r, idx) => (
            <View key={r.step} className={idx > 0 ? 'mt-3 border-t border-gold-300/40 pt-3' : ''}>
              <Text className="text-sm font-bold text-maroon-800">{r.step}</Text>
              <Text className="mt-0.5 text-xs leading-4 text-maroon-700">{r.detail}</Text>
            </View>
          ))}
        </Card>

        {puja.samagriChecklist.length > 0 && (
          <>
            <Text className="mb-2 mt-6 text-lg font-bold text-maroon-800">Puja Samagri Checklist</Text>
            <Card>
              {puja.samagriChecklist.map((s) => (
                <View key={s.name} className="mb-1.5 flex-row items-start">
                  <Ionicons
                    name={s.providedInKit ? 'checkmark-circle' : 'remove-circle-outline'}
                    size={16}
                    color={s.providedInKit ? '#16a34a' : '#9ca3af'}
                  />
                  <Text className="ml-2 flex-1 text-sm text-maroon-900">
                    {s.name} × {s.quantity}{!s.providedInKit ? ' (arrange yourself)' : ''}
                  </Text>
                </View>
              ))}
              {puja.samagriKit ? (
                <Text className="mt-2 text-xs text-maroon-700">
                  ✓ Items marked green are included in the {puja.samagriKit.name} ({inr(puja.samagriKit.price)}), optional at checkout.
                </Text>
              ) : null}
            </Card>
          </>
        )}

        <Text className="mb-2 mt-6 text-lg font-bold text-maroon-800">Frequently Asked Questions</Text>
        {FAQS.map((f, i) => {
          const open = openFaq === i;
          return (
            <Pressable
              key={f.q}
              onPress={() => setOpenFaq(open ? null : i)}
              className="mb-2 rounded-2xl border border-gold-300/50 bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="mr-2 flex-1 text-sm font-bold text-maroon-800">{f.q}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.maroon} />
              </View>
              {open ? <Text className="mt-2 text-xs leading-5 text-maroon-700">{f.a}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sticky Bottom Safe-Area Container */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute inset-x-0 bottom-0 border-t border-gold-300/60 bg-white px-4 pb-2 pt-3 shadow-lg"
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-maroon-700">
            Selected Package: <Text className="font-bold text-maroon-900">{activeTier?.name}</Text>
          </Text>
          <Text className="text-base font-bold text-maroon-900">{inr(activeTier?.price)}</Text>
        </View>
        <Button
          title={`Proceed to Book · ${inr(activeTier?.price)}`}
          onPress={() => router.push(`/book/${puja._id}?tier=${encodeURIComponent(activeTier?.name || '')}`)}
        />
      </SafeAreaView>
    </View>
  );
}
