import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { getZodiacSign, getZodiacInfo } from '../../constants/zodiac';
import { calculateBirthChart } from '../../lib/astrology';
import StarField from '../../components/StarField';
import GlowButton from '../../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

const { width: W } = Dimensions.get('window');

const STEPS = ['Name', 'Birthday', 'Birth Time', 'Location'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const zodiacScale = useSharedValue(0);
  const zodiacOpacity = useSharedValue(0);
  const router = useRouter();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();

  const getBirthDate = () => {
    const parts = birthDate.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getSign = () => {
    const d = getBirthDate();
    if (!d) return null;
    return getZodiacSign(d.getMonth() + 1, d.getDate());
  };

  const signInfo = getSign() ? getZodiacInfo(getSign()!) : null;

  const revealZodiac = () => {
    setRevealed(true);
    zodiacScale.value = withSpring(1, { damping: 12 });
    zodiacOpacity.value = withTiming(1, { duration: 600 });
  };

  const zodiacStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zodiacScale.value }],
    opacity: zodiacOpacity.value,
  }));

  const handleNext = () => {
    if (step === 0 && !name.trim()) { Alert.alert('Please enter your name'); return; }
    if (step === 1) {
      if (!birthDate) { Alert.alert('Please enter your birth date (YYYY-MM-DD)'); return; }
      if (!revealed) { revealZodiac(); return; }
    }
    if (step < STEPS.length - 1) { setStep(s => s + 1); setRevealed(false); }
    else handleFinish();
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const d = getBirthDate();
      const sunSign = d ? getZodiacSign(d.getMonth() + 1, d.getDate()) : 'Aries';
      const chart = d ? calculateBirthChart(d, birthTime || undefined) : null;

      await supabase.from('profiles').upsert({
        id: user.id,
        name: name.trim(),
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_location: location || null,
        sun_sign: sunSign,
        moon_sign: chart?.moonSign ?? null,
        rising_sign: chart?.risingSign ?? null,
        updated_at: new Date().toISOString(),
      });

      setProfile({
        id: user.id, name, birthDate, birthTime: birthTime || undefined,
        birthLocation: location || undefined, sunSign, moonSign: chart?.moonSign,
        risingSign: chart?.risingSign, notificationDaily: true, notificationMoon: true, notificationHour: 8,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
      <StarField />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View key={i} style={[styles.dot, i <= step ? styles.dotActive : {}]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>

        {/* Step content */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your name,{'\n'}cosmic traveler?</Text>
            <Text style={styles.stepSubtitle}>The stars wish to know you.</Text>
            <TextInput
              style={styles.input} value={name} onChangeText={setName}
              placeholder="Your name..." placeholderTextColor={Colors.textMuted}
              autoFocus autoCapitalize="words"
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>When were you born,{'\n'}{name}?</Text>
            <Text style={styles.stepSubtitle}>Your birthdate unlocks your cosmic blueprint.</Text>
            <TextInput
              style={styles.input} value={birthDate} onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted}
              keyboardType="numeric" autoFocus
            />
            {revealed && signInfo && (
              <Animated.View style={[styles.signReveal, zodiacStyle]}>
                <Text style={[styles.signSymbol, { color: signInfo.color }]}>{signInfo.symbol}</Text>
                <Text style={styles.signName}>{signInfo.name}</Text>
                <Text style={styles.signDesc}>{signInfo.description}</Text>
              </Animated.View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What time were you born?</Text>
            <Text style={styles.stepSubtitle}>Your birth time reveals your Rising sign — skip if unknown.</Text>
            <TextInput
              style={styles.input} value={birthTime} onChangeText={setBirthTime}
              placeholder="HH:MM (e.g. 14:30)" placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity onPress={() => setStep(s => s + 1)}>
              <Text style={styles.skipText}>Skip — I don't know my birth time</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Where were you born?</Text>
            <Text style={styles.stepSubtitle}>Your birthplace completes your cosmic coordinates.</Text>
            <TextInput
              style={styles.input} value={location} onChangeText={setLocation}
              placeholder="City, Country (e.g. New York, USA)" placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
            <TouchableOpacity onPress={handleFinish}>
              <Text style={styles.skipText}>Skip — continue without location</Text>
            </TouchableOpacity>
          </View>
        )}

        <GlowButton
          title={loading ? 'Saving...' : step === 1 && !revealed ? 'Reveal My Sign ✨' : step === STEPS.length - 1 ? 'Enter the Cosmos →' : 'Continue →'}
          onPress={handleNext}
          disabled={loading}
          size="lg"
          style={styles.nextBtn}
          variant={step === 1 && !revealed ? 'gold' : 'primary'}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing['2xl'], paddingTop: 80, minHeight: '100%' },
  progress: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  stepLabel: { fontSize: FontSizes.sm, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginBottom: Spacing['2xl'] },
  stepContent: { flex: 1, gap: Spacing.lg, marginBottom: Spacing['2xl'] },
  stepTitle: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', lineHeight: 44 },
  stepSubtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, fontFamily: 'Inter-Regular', lineHeight: 24 },
  input: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.base,
    color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  skipText: { color: Colors.textMuted, fontFamily: 'Inter-Regular', fontSize: FontSizes.sm, textAlign: 'center', marginTop: -Spacing.xs },
  signReveal: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, backgroundColor: Colors.glassBackground, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.glassBorder, marginTop: Spacing.md },
  signSymbol: { fontSize: 64, fontFamily: 'PlayfairDisplay-Regular' },
  signName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  signDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter-Regular' },
  nextBtn: { marginTop: 'auto' },
});
