import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { HyderabadLocationBadge, Loader, VedaPujasHeaderTitle } from '../src/components/ui';
import { ONBOARDING_STORAGE_KEY } from '../src/screens/OnboardingScreen';

function Guard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardChecked, setOnboardChecked] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((v) => setHasOnboarded(v === 'true'))
      .catch(() => setHasOnboarded(false))
      .finally(() => setOnboardChecked(true));
  }, [segments]);

  useEffect(() => {
    if (loading || !onboardChecked) return;
    const first = segments[0];
    const inAuth = first === '(auth)';
    const inOnboarding = first === 'onboarding';

    if (!user) {
      if (!hasOnboarded && !inOnboarding) {
        router.replace('/onboarding');
      } else if (hasOnboarded && !inAuth && !inOnboarding) {
        router.replace('/login');
      }
    } else if (user && (inAuth || inOnboarding)) {
      router.replace('/home');
    }
  }, [user, loading, onboardChecked, hasOnboarded, segments, router]);

  return (
    <View className="flex-1 bg-cream-50">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#4F1414' },
          headerTintColor: '#FFF8E7',
          headerTitle: () => <VedaPujasHeaderTitle />,
          headerRight: () => <HyderabadLocationBadge />,
          contentStyle: { backgroundColor: '#FFFCF5' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="puja/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Ritual Details" /> }} />
        <Stack.Screen name="book/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Muhurtham Booking" /> }} />
        <Stack.Screen name="booking/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Live Booking Tracker" /> }} />
        <Stack.Screen name="payment" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Secure Payment" />, gestureEnabled: false }} />
      </Stack>
      {(loading || !onboardChecked) && (
        <View className="absolute inset-0 items-center justify-center bg-cream-50">
          <Loader fullScreen label="Starting GetPuja…" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Guard />
    </AuthProvider>
  );
}
