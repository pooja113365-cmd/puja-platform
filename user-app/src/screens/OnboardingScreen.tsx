import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui';
import { COLORS } from '../utils/format';

export const ONBOARDING_STORAGE_KEY = 'puja_onboarded_v1';
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'GetPuja';

const SLIDES: {
  badge: string;
  emoji: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  highlights: string[];
}[] = [
  {
    badge: 'STEP 1 OF 3 · VERIFIED VEDIC SCHOLARS',
    emoji: '🪔',
    icon: 'sparkles',
    title: 'Book Certified Veda Patasala Purohits',
    subtitle:
      'Perform authentic Griha Pravesh, Satyanarayan Vrat, Rudrabhishek & Navagraha Homams with verified Acharyas in your mother tongue.',
    highlights: [
      '✓ Fluent in Telugu, Tamil, Kannada, Hindi, Marathi & Sanskrit',
      '✓ Transparent Dakshina packages with zero hidden charges',
      '✓ Instant Auto-Match or choose your preferred Acharya',
    ],
  },
  {
    badge: 'STEP 2 OF 3 · SAMAGRI & LIVE MUHURTHAM TRACKER',
    emoji: '🧺',
    icon: 'calendar',
    title: 'Doorstep Samagri Kits & Live Ritual Tracking',
    subtitle:
      'Pick auspicious Panchangam Muhurtham slots and receive complete sealed copper Kalash, Navadhanya & Havan Samagri kits at home.',
    highlights: [
      '✓ 100% pure organic Puja Samagri delivered before the ceremony',
      '✓ Real-time Socket.io live booking & Pandit assignment tracker',
      '✓ Attend at Home, at Temple, or via Live Video e-Puja',
    ],
  },
  {
    badge: 'STEP 3 OF 3 · RAZORPAY, REFERRALS & 24×7 SUPPORT',
    emoji: '🎁',
    icon: 'shield-checkmark',
    title: 'Secure Razorpay Checkout & Refer-a-Friend Rewards',
    subtitle:
      'Pay 30% advance or full amount securely via Razorpay. Invite friends with your referral code to earn ₹100 wallet credit on every signup!',
    highlights: [
      '✓ Get ₹50 welcome bonus when signing up with a referral code',
      '✓ Earn ₹100 in your Puja Wallet for every friend you refer',
      '✓ 24×7 Support Tickets synced directly with the Admin Panel',
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const finishOnboarding = async (target: '/login' | '/register' = '/login') => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    router.replace(target);
  };

  return (
    <SafeAreaView className="flex-1 bg-maroon-800">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: 24 }}>
        {/* Top Bar with Brand & Skip */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-2 h-9 w-9 items-center justify-center rounded-full border border-gold-400 bg-maroon-900">
              <Text className="text-lg">🪔</Text>
            </View>
            <View>
              <Text className="text-lg font-extrabold text-cream-100">{APP_NAME}</Text>
              <Text className="text-[10px] font-semibold uppercase tracking-widest text-gold-300">
                Sacred Vedic Seva
              </Text>
            </View>
          </View>
          {!isLast ? (
            <Pressable
              onPress={() => finishOnboarding('/login')}
              className="rounded-full border border-gold-400/50 bg-maroon-900/70 px-3.5 py-1.5"
            >
              <Text className="text-xs font-bold text-gold-300">Skip →</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Center Slide Card */}
        <View className="my-6 rounded-3xl border-2 border-gold-400 bg-cream-50 p-6 shadow-xl">
          <View className="self-start rounded-full border border-gold-400 bg-cream-100 px-3 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-saffron-700">
              {slide.badge}
            </Text>
          </View>

          <View className="my-5 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-gold-400 bg-maroon-800 shadow-md">
              <Text className="text-5xl">{slide.emoji}</Text>
            </View>
          </View>

          <Text className="text-center text-2xl font-extrabold leading-8 text-maroon-900">
            {slide.title}
          </Text>
          <Text className="mt-2.5 text-center text-xs leading-5 text-maroon-700">
            {slide.subtitle}
          </Text>

          <View className="mt-5 rounded-2xl border border-gold-300/60 bg-cream-100 p-3.5">
            {slide.highlights.map((h) => (
              <Text key={h} className="py-1 text-xs font-semibold text-maroon-900">
                {h}
              </Text>
            ))}
          </View>

          {/* Progress Dots */}
          <View className="mt-5 flex-row items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <Pressable
                key={`dot-${i}`}
                onPress={() => setIdx(i)}
                className={`h-2.5 rounded-full ${
                  i === idx ? 'w-8 bg-saffron-500' : 'w-2.5 bg-gold-300'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Bottom Navigation Actions */}
        <View>
          {!isLast ? (
            <View className="flex-row gap-3">
              {idx > 0 ? (
                <View className="flex-1">
                  <Button title="← Back" variant="outline" onPress={() => setIdx(idx - 1)} />
                </View>
              ) : null}
              <View className="flex-1">
                <Button title="Next →" onPress={() => setIdx(idx + 1)} />
              </View>
            </View>
          ) : (
            <View className="space-y-2.5">
              <Button title="Get Started — Login" onPress={() => finishOnboarding('/login')} />
              <View className="mt-2.5">
                <Pressable
                  onPress={() => finishOnboarding('/register')}
                  className="min-h-[48px] items-center justify-center rounded-xl border border-gold-400 bg-maroon-900 px-5"
                >
                  <Text className="text-sm font-bold text-gold-300">
                    New User? Create Account &amp; Claim ₹50 Referral Bonus →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
