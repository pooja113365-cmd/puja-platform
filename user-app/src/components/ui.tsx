import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_META } from '../utils/format';
import type { BookingStatus } from '../types';

const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'GetPuja';

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

/** Animated Devotional Loader with pulsing sacred flame & skeleton shimmer bars */
export function Loader({ label = 'Loading sacred details…', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const shimmerAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    shimmerAnim.start();
    return () => {
      pulseAnim.stop();
      shimmerAnim.stop();
    };
  }, [pulse, shimmer]);

  return (
    <View className={`${fullScreen ? 'flex-1' : 'py-12'} items-center justify-center px-6`}>
      <Animated.View
        style={{ transform: [{ scale: pulse }] }}
        className="h-16 w-16 items-center justify-center rounded-full border-2 border-gold-400 bg-maroon-800 shadow-md"
      >
        <Text className="text-3xl">🪔</Text>
      </Animated.View>
      <View className="mt-3 flex-row items-center">
        <ActivityIndicator size="small" color={COLORS.saffron} />
        <Text className="ml-2 text-sm font-bold text-maroon-800">{label}</Text>
      </View>
      <Text className="mt-1 text-[11px] text-maroon-700">Please wait while we sync with {APP_NAME} servers…</Text>

      {/* Animated Skeleton Preview Cards */}
      <Animated.View style={{ opacity: shimmer }} className="mt-6 w-full max-w-sm space-y-2.5">
        <View className="mb-2.5 h-16 w-full rounded-2xl border border-gold-300/40 bg-cream-100 p-3">
          <View className="h-3.5 w-2/3 rounded bg-gold-300/60" />
          <View className="mt-2 h-2.5 w-1/2 rounded bg-gold-300/40" />
        </View>
        <View className="h-16 w-full rounded-2xl border border-gold-300/40 bg-cream-100 p-3">
          <View className="h-3.5 w-3/4 rounded bg-gold-300/60" />
          <View className="mt-2 h-2.5 w-2/5 rounded bg-gold-300/40" />
        </View>
      </Animated.View>
    </View>
  );
}

/** Reusable Pagination Bar for Mobile App Lists (Showing X-Y of Z, Rows selector, Prev / Page / Next) */
export function PaginationBar({
  page,
  limit,
  total,
  pages,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  onPageChange: (nextPage: number) => void;
  onLimitChange?: (nextLimit: number) => void;
}) {
  const totalPages = Math.max(pages || Math.ceil(total / Math.max(limit, 1)) || 1, 1);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <View className="mt-3 rounded-2xl border border-gold-300/60 bg-white p-3 shadow-sm">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="text-xs font-semibold text-maroon-800">
          Showing <Text className="font-bold text-maroon-900">{start}–{end}</Text> of{' '}
          <Text className="font-bold text-maroon-900">{total}</Text>
        </Text>

        {onLimitChange ? (
          <View className="flex-row items-center">
            <Text className="mr-1.5 text-[11px] font-semibold text-maroon-700">Rows:</Text>
            {[5, 10, 20].map((n) => (
              <Pressable
                key={n}
                onPress={() => onLimitChange(n)}
                className={`ml-1 rounded-lg border px-2 py-1 ${
                  limit === n ? 'border-saffron-500 bg-saffron-500' : 'border-gold-300 bg-cream-50'
                }`}
              >
                <Text className={`text-[11px] font-bold ${limit === n ? 'text-white' : 'text-maroon-800'}`}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View className="mt-2.5 flex-row items-center justify-between border-t border-gold-300/40 pt-2.5">
        <Pressable
          disabled={page <= 1}
          onPress={() => onPageChange(Math.max(1, page - 1))}
          className={`flex-row items-center rounded-xl border border-gold-300 px-3 py-1.5 ${
            page <= 1 ? 'opacity-40' : 'bg-cream-100 active:opacity-80'
          }`}
        >
          <Ionicons name="chevron-back" size={14} color={COLORS.maroon} />
          <Text className="ml-1 text-xs font-bold text-maroon-800">Prev</Text>
        </Pressable>

        <Text className="text-xs font-bold text-maroon-900">
          Page {page} of {totalPages}
        </Text>

        <Pressable
          disabled={page >= totalPages}
          onPress={() => onPageChange(Math.min(totalPages, page + 1))}
          className={`flex-row items-center rounded-xl border border-gold-300 px-3 py-1.5 ${
            page >= totalPages ? 'opacity-40' : 'bg-cream-100 active:opacity-80'
          }`}
        >
          <Text className="mr-1 text-xs font-bold text-maroon-800">Next</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.maroon} />
        </Pressable>
      </View>
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
        <Text className="text-base font-bold tracking-wide text-cream-100">{APP_NAME}</Text>
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
