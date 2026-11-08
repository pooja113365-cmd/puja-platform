import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import { Button, ErrorText, Field } from '../components/ui';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) { setError('Enter your email and password'); return; }
    setBusy(true); setError(null);
    try { await login(email, password); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-maroon-800">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="mb-8 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-gold-400 bg-saffron-500">
            <Text className="text-4xl text-white">🪔</Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-cream-100">VedaPujas</Text>
          <Text className="text-xs font-semibold uppercase tracking-widest text-gold-300">
            Sacred Vedic Seva · 📍 Hyderabad
          </Text>
        </View>
        <View className="rounded-2xl bg-cream-50 p-5">
          <Text className="mb-4 text-xl font-bold text-maroon-800">Welcome back</Text>
          <ErrorText>{error}</ErrorText>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          <Button title="Login" onPress={submit} loading={busy} />
          <Text className="mt-4 text-center text-sm text-maroon-700">New here? <Link href="/register" className="font-bold text-saffron-600">Create account</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

