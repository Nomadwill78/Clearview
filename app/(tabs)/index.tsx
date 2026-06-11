import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { useMoonPhase } from '../../hooks/useMoonPhase';
import { useSubscription } from '../../hooks/useSubscription';
import { useAstrology } from '../../hooks/useAstrology';
import { generateHoroscope } from '../../lib/claude';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import MoonPhaseWidget from '../../components/MoonPhaseWidget';
import GlowButton from '../../components/GlowButton';
import ShimmerLoader from '../../components/ShimmerLoader';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

const HOUR = new Date().getHours();
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening';

function DailyCard({ emoji, title, subtitle, onPress }: { emoji: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.dailyCard}>
      <CosmicCard style={styles.dailyCardInner} glow>
        <Text style={styles.dailyEmoji}>{emoji}</Text>
        <Text style={styles.dailyTitle}>{title}</Text>
        <Text style={styles.dailySubtitle}>{subtitle}</Text>
      </CosmicCard>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const moonPhase = useMoonPhase();
  const { isPremium } = useSubscription();
  const { sunSignInfo } = useAstrology();
  const router = useRouter();
  const [preview, setPreview] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPreview = async () => {
    if (!profile?.sunSign) return;
    setLoadingPreview(true);
    try {
      const text = await generateHoroscope({ sign: profile.sunSign, period: 'today', category: 'general' });
      setPreview(text.slice(0, 180) + '...');
    } catch {}
    setLoadingPreview(false);
  };

  useEffect(() => { loadPreview(); }, [profile?.sunSign]);

  const onRefresh = async () => { setRefreshing(true); await loadPreview(); setRefreshing(false); };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{GREETING},</Text>
              <Text style={styles.name}>{profile?.name ?? 'Cosmic Soul'} {sunSignInfo?.symbol}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(profile?.name ?? 'C')[0].toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Moon Phase */}
          <CosmicCard style={styles.moonCard} goldGlow>
            <View style={styles.moonHeader}>
              <Text style={styles.sectionTitle}>Moon Phase</Text>
              <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
            </View>
            <MoonPhaseWidget moonPhase={moonPhase} size={52} />
            <Text style={styles.moonEnergy}>{moonPhase.energy}</Text>
          </CosmicCard>

          {/* Daily Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Daily Reading</Text>
            <CosmicCard style={styles.previewCard} glow>
              {sunSignInfo && (
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewSymbol, { color: sunSignInfo.color }]}>{sunSignInfo.symbol}</Text>
                  <View>
                    <Text style={styles.previewSign}>{sunSignInfo.name}</Text>
                    <Text style={styles.previewDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                  </View>
                </View>
              )}
              {loadingPreview ? <ShimmerLoader rows={3} style={{ marginTop: 8 }} /> : (
                <Text style={styles.previewText}>{preview || 'Tap to reveal today\'s cosmic guidance...'}</Text>
              )}
              <GlowButton title="Read Full Horoscope" onPress={() => router.push('/(tabs)/horoscope')} variant="outline" size="sm" style={styles.readMoreBtn} />
            </CosmicCard>
          </View>

          {/* Quick Access */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Explore</Text>
            <View style={styles.quickGrid}>
              <DailyCard emoji="🌙" title="Birth Chart" subtitle="Your natal map" onPress={() => router.push('/(tabs)/chart')} />
              <DailyCard emoji="💕" title="Compatibility" subtitle="Zodiac matching" onPress={() => router.push('/(tabs)/compatibility')} />
              <DailyCard emoji="🔢" title="Numerology" subtitle="Life path numbers" onPress={() => router.push('/(tabs)/numerology')} />
              <DailyCard emoji="🃏" title="Tarot & Oracle" subtitle="Daily guidance" onPress={() => router.push('/tarot')} />
              <DailyCard emoji="🔮" title="Ask Celeste" subtitle="Psychic advisor" onPress={() => router.push('/advisor')} />
              <DailyCard emoji="✨" title="Pricing" subtitle="Go premium" onPress={() => router.push('/pricing')} />
            </View>
          </View>

          {/* Upgrade Banner */}
          {!isPremium && (
            <TouchableOpacity onPress={() => router.push('/pricing')} activeOpacity={0.85}>
              <LinearGradient colors={['#4C1D95', '#7C3AED', '#4C1D95']} style={styles.upgradeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.upgradeEmoji}>✦</Text>
                <View style={styles.upgradeText}>
                  <Text style={styles.upgradeTitle}>Unlock Your Full Cosmic Potential</Text>
                  <Text style={styles.upgradeSubtitle}>AI readings, psychic advisor & more from $9.99/mo</Text>
                </View>
                <Text style={styles.upgradeArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  greeting: { fontSize: FontSizes.base, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  name: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  avatarBtn: {},
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSizes.lg, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  moonCard: { gap: Spacing.sm },
  moonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  moonEmoji: { fontSize: 24 },
  moonEnergy: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', fontStyle: 'italic', marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Medium', letterSpacing: 1, textTransform: 'uppercase' },
  previewCard: { gap: Spacing.sm },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  previewSymbol: { fontSize: FontSizes['2xl'], fontFamily: 'PlayfairDisplay-Regular' },
  previewSign: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  previewDate: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  previewText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },
  readMoreBtn: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dailyCard: { width: '47%' },
  dailyCardInner: { gap: Spacing.xs, padding: Spacing.base },
  dailyEmoji: { fontSize: 28 },
  dailyTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  dailySubtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  upgradeBanner: { borderRadius: BorderRadius.lg, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  upgradeEmoji: { fontSize: 24, color: Colors.accentGlow },
  upgradeText: { flex: 1 },
  upgradeTitle: { fontSize: FontSizes.sm, color: Colors.text, fontFamily: 'Inter-SemiBold' },
  upgradeSubtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  upgradeArrow: { fontSize: FontSizes.lg, color: Colors.accentGlow },
});
