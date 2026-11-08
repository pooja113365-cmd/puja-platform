import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { HyderabadLocationBadge, Loader, VedaPujasHeaderTitle } from '../src/components/ui';

function Guard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/login');
    else if (user && inAuth) router.replace('/home');
  }, [user, loading, segments, router]);

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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="puja/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Ritual Details" /> }} />
        <Stack.Screen name="book/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Muhurtham Booking" /> }} />
        <Stack.Screen name="booking/[id]" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Live Booking Tracker" /> }} />
        <Stack.Screen name="payment" options={{ headerTitle: () => <VedaPujasHeaderTitle subtitle="Secure Payment" />, gestureEnabled: false }} />
      </Stack>
      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-cream-50"><Loader label="Starting…" /></View>
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

