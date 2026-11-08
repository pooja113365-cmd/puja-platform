import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_META } from '../utils/format';
import type { BookingStatus } from '../types';

export function Button({ title, onPress, variant = 'primary', disabled, loading }: {
  title: string; onPress: () => void; variant?: 'primary' | 'outline' | 'danger'; disabled?: boolean; loading?: boolean;
}) {
  const base = 'min-h-[48px] flex-row items-center justify-center rounded-xl px-5';
  const styles = {
    primary: 'bg-saffron-500',
    outline: 'border border-maroon-700 bg-transparent',
    danger: 'border border-red-600 bg-transparent',
  }[variant];
  const text = { primary: 'text-white', outline: 'text-maroon-700', danger: 'text-red-700' }[variant];
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" className={`${base} ${styles} ${off ? 'opacity-50' : 'active:opacity-80'}`}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.maroon} /> : <Text className={`text-base font-semibold ${text}`}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-maroon-700">{label}</Text>
      <TextInput placeholderTextColor="#9ca3af" className="rounded-xl border border-gold-300 bg-white px-3 py-3 text-base text-maroon-900" {...props} />
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`mb-2 mr-2 rounded-full border px-4 py-2 ${selected ? 'border-saffron-500 bg-saffron-500' : 'border-gold-300 bg-white'}`}>
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-maroon-700'}`}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-gold-300/50 bg-white p-4 shadow-sm ${className}`}>{children}</View>;
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const m = STATUS_META[status];
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${m.bg}`}>
      <Text className={`text-xs font-semibold ${m.fg}`}>{m.label}</Text>
    </View>
  );
}

export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="items-center justify-center py-16">
      <ActivityIndicator size="large" color={COLORS.saffron} />
      <Text className="mt-2 text-sm text-maroon-700">{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="m-4 items-center rounded-2xl border border-red-200 bg-red-50 p-6">
      <Ionicons name="warning-outline" size={32} color="#dc2626" />
      <Text className="mt-2 text-center text-sm text-red-800">{message}</Text>
      {onRetry && <View className="mt-4 w-full"><Button title="Try again" variant="outline" onPress={onRetry} /></View>}
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <View className="m-4 items-center rounded-2xl border border-dashed border-gold-500 bg-cream-100 p-8">
      <Ionicons name="flower-outline" size={36} color={COLORS.gold} />
      <Text className="mt-2 text-lg font-semibold text-maroon-800">{title}</Text>
      {message && <Text className="mt-1 text-center text-sm text-maroon-700">{message}</Text>}
      {action && <View className="mt-4 w-full">{action}</View>}
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text accessibilityRole="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{children}</Text>;
}

export function VedaPujasHeaderTitle({ subtitle }: { subtitle?: string }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-2 h-8 w-8 items-center justify-center rounded-full border border-gold-400 bg-maroon-800">
        <Ionicons name="flame" size={16} color={COLORS.gold} />
      </View>
      <View>
        <Text className="text-base font-bold tracking-wide text-cream-100">VedaPujas</Text>
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">
          {subtitle || 'Sacred Vedic Seva'}
        </Text>
      </View>
    </View>
  );
}

export function HyderabadLocationBadge() {
  return (
    <View className="mr-3 flex-row items-center rounded-full border border-gold-400/60 bg-maroon-800 px-2.5 py-1">
      <Text className="text-[11px] font-bold text-gold-300">📍 Hyderabad</Text>
    </View>
  );
}


