import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Redirect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import StarField from '../../components/StarField';
import GlowButton from '../../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const { session, loading: authLoading } = useAuthStore();
  // Still checking localStorage — show nothing rather than a flash of the auth form
  if (authLoading) return null;
  // Already signed in (returning user or fresh sign-in) — go straight to the app
  if (session) return <Redirect href="/(tabs)" />;

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.session) {
          // Signed in immediately (email confirmation disabled). Head into the
          // app; the tabs layout routes a not-yet-set-up profile to onboarding.
          router.replace('/(tabs)');
        } else {
          setSuccessMsg('Account created! Check your email for a confirmation link, then sign in below.');
          setMode('signin');
          setPassword('');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'welcome') {
    return (
      <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
        <StarField />
        <View style={styles.welcomeContent}>
          <View style={styles.zodiacRow}>
            {['♈', '♓', '☽', '✦', '☀', '♐'].map((s, i) => (
              <Text key={i} style={[styles.zodiacSymbol, { color: i % 2 === 0 ? Colors.primary : Colors.accent }]}>{s}</Text>
            ))}
          </View>
          <Text style={styles.logoTitle}>Celestial</Text>
          <Text style={styles.logoSubtitle}>Your advanced psychic advisor</Text>
          <Text style={styles.tagline}>
            Discover your cosmic blueprint through astrology, numerology, and AI-powered psychic guidance.
          </Text>
          <View style={styles.buttonStack}>
            <GlowButton title="Begin My Journey" onPress={() => setMode('signup')} variant="primary" size="lg" style={styles.ctaBtn} />
            <GlowButton title="I already have an account" onPress={() => setMode('signin')} variant="ghost" size="sm" />
          </View>
          <View style={styles.features}>
            {['✦ Personalized birth chart readings', '✦ Daily AI horoscopes', '✦ Psychic advisor chat'].map((f, i) => (
              <Text key={i} style={styles.featureText}>{f}</Text>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setMode('welcome')} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.formSubtitle}>
            {mode === 'signin' ? 'The stars have been waiting for you' : 'Your cosmic journey begins here'}
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {mode === 'signup' && (
              <Text style={styles.hint}>At least 6 characters</Text>
            )}
          </View>

          {!!successMsg && <Text style={styles.successMsg}>{successMsg}</Text>}
          {!!errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setEmail(''); setPassword(''); setErrorMsg(''); setSuccessMsg(''); }}
            style={styles.switchMode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.switchText}>
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchLink}>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  welcomeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  zodiacRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing['2xl'] },
  zodiacSymbol: { fontSize: FontSizes['3xl'], fontFamily: 'PlayfairDisplay-Regular' },
  logoTitle: { fontSize: FontSizes['6xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center', letterSpacing: 2 },
  logoSubtitle: { fontSize: FontSizes.md, color: Colors.accent, fontFamily: 'Inter-Medium', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4, marginBottom: Spacing.xl },
  tagline: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, fontFamily: 'Inter-Regular', marginBottom: Spacing['3xl'] },
  buttonStack: { gap: Spacing.md, alignItems: 'center', marginBottom: Spacing['2xl'] },
  ctaBtn: { width: 280 },
  features: { gap: 8, alignItems: 'flex-start' },
  featureText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  formContainer: { flex: 1 },
  formScroll: { padding: Spacing['2xl'], paddingTop: 80, gap: Spacing.lg },
  backBtn: { marginBottom: Spacing.xl },
  backText: { color: Colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: FontSizes.base },
  formTitle: { fontSize: FontSizes['4xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  formSubtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, fontFamily: 'Inter-Regular', marginBottom: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Medium', letterSpacing: 0.5 },
  hint: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginTop: 2 },
  input: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.base,
    color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md, minHeight: 52,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.text, fontFamily: 'Inter-SemiBold', fontSize: FontSizes.md, letterSpacing: 0.3 },
  switchMode: { alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm },
  switchText: { color: Colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: FontSizes.sm },
  switchLink: { color: Colors.primaryGlow, fontFamily: 'Inter-SemiBold' },
  errorMsg: { color: '#F87171', fontFamily: 'Inter-Regular', fontSize: FontSizes.sm, textAlign: 'center', paddingHorizontal: Spacing.sm },
  successMsg: { color: '#34D399', fontFamily: 'Inter-Regular', fontSize: FontSizes.sm, textAlign: 'center', paddingHorizontal: Spacing.sm },
});
