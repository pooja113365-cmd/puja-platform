import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import { Button, ErrorText, Field } from '../components/ui';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (f.name.trim().length < 2) return setError('Enter your full name');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Enter a valid email');
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setError('Enter a valid 10-digit mobile number');
    if (f.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true); setError(null);
    try { await register({ ...f, name: f.name.trim(), email: f.email.trim() }); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    return undefined;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-maroon-800">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="rounded-2xl bg-cream-50 p-5">
          <Text className="mb-4 text-xl font-bold text-maroon-800">Create your account</Text>
          <ErrorText>{error}</ErrorText>
          <Field label="Full name" value={f.name} onChangeText={set('name')} autoComplete="name" />
          <Field label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Mobile" value={f.phone} onChangeText={set('phone')} keyboardType="number-pad" maxLength={10} autoComplete="tel" />
          <Field label="Password" value={f.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" />
          <Button title="Sign up" onPress={submit} loading={busy} />
          <Text className="mt-4 text-center text-sm text-maroon-700">Already registered? <Link href="/login" className="font-bold text-saffron-600">Login</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

