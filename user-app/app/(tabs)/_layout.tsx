import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HyderabadLocationBadge, VedaPujasHeaderTitle } from '../../src/components/ui';

const icon = (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#4F1414' },
        headerTintColor: '#FFF8E7',
        headerTitle: () => <VedaPujasHeaderTitle />,
        headerRight: () => <HyderabadLocationBadge />,
        tabBarActiveTintColor: '#F27F0C',
        tabBarInactiveTintColor: '#8A2A2A',
        tabBarStyle: { backgroundColor: '#FFF8E7' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="pujas" options={{ title: 'Pujas', tabBarIcon: icon('flame-outline') }} />
      <Tabs.Screen name="bookings" options={{ title: 'My Bookings', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}

