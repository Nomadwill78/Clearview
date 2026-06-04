import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { usePremiumFeature } from '../../hooks/useSubscription';
import { ZODIAC_SIGNS, ZodiacSign } from '../../constants/zodiac';
import { generateHoroscope } from '../../lib/claude';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import PremiumGate from '../../components/PremiumGate';
import ShimmerLoader from '../../components/ShimmerLoader';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

type Period = 'yesterday' | 'today' | 'tomorrow';
type Category = 'general' | 'love' | 'career' | 'wellness';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
];

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: 'general', label: 'Overview', emoji: '✦' },
  { key: 'love', label: 'Love', emoji: '💕' },
  { key: 'career', label: 'Career', emoji: '💼' },
  { key: 'wellness', label: 'Wellness', emoji: '🌿' },
];

export default function HoroscopeScreen() {
  const { profile } = useProfile();
  const { isLocked } = usePremiumFeature('horoscope');
  const [period, setPeriod] = useState<Period>('today');
  const [category, setCategory] = useState<Category>('general');
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);

  const activeSign = selectedSign ?? profile?.sunSign ?? 'Aries';

  useEffect(() => {
    loadReading();
  }, [activeSign, period, category]);

  const loadReading = async () => {
    setLoading(true);
    setReading('');
    try {
      const text = await generateHoroscope({ sign: activeSign, period, category });
      setReading(text);
    } catch {
      setReading('The cosmic currents are shifting — please try again in a moment.');
    }
    setLoading(false);
  };

  const activeSignInfo = ZODIAC_SIGNS.find(s => s.name === activeSign)!;

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Horoscope</Text>

          {/* Period tabs */}
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[styles.periodTab, period === p.key && styles.periodTabActive]}>
                <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.signRow}>
            {ZODIAC_SIGNS.map(sign => (
              <TouchableOpacity key={sign.name} onPress={() => setSelectedSign(sign.name as ZodiacSign)}
                style={[styles.signChip, sign.name === activeSign && { borderColor: sign.color, backgroundColor: sign.color + '20' }]}>
                <Text style={[styles.signEmoji, { color: sign.color }]}>{sign.symbol}</Text>
                <Text style={styles.signChipName}>{sign.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active sign header */}
          <CosmicCard style={styles.signHeader} glow>
            <View style={styles.signHeaderRow}>
              <Text style={[styles.activeSymbol, { color: activeSignInfo.color }]}>{activeSignInfo.symbol}</Text>
              <View>
                <Text style={styles.activeName}>{activeSignInfo.name}</Text>
                <Text style={styles.activeDates}>{activeSignInfo.dateRange} · {activeSignInfo.element} · {activeSignInfo.rulingPlanet}</Text>
              </View>
            </View>
          </CosmicCard>

          {/* Category tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)}
                style={[styles.categoryTab, category === c.key && styles.categoryTabActive]}>
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                <Text style={[styles.categoryText, category === c.key && styles.categoryTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reading */}
          {category === 'general' ? (
            <CosmicCard style={styles.readingCard}>
              {loading ? <ShimmerLoader rows={5} /> : (
                <Text style={styles.readingText}>{reading}</Text>
              )}
            </CosmicCard>
          ) : (
            <PremiumGate isLocked={isLocked} feature={`${category} horoscope readings`}>
              <CosmicCard style={styles.readingCard}>
                {loading ? <ShimmerLoader rows={5} /> : (
                  <Text style={styles.readingText}>{reading}</Text>
                )}
              </CosmicCard>
            </PremiumGate>
          )}

          {/* Sign traits */}
          <CosmicCard style={styles.traitsCard}>
            <Text style={styles.traitsTitle}>Key Traits</Text>
            <View style={styles.traitsList}>
              {activeSignInfo.traits.map(t => (
                <View key={t} style={[styles.traitChip, { borderColor: activeSignInfo.color + '60' }]}>
                  <Text style={[styles.traitText, { color: activeSignInfo.color }]}>{t}</Text>
                </View>
              ))}
            </View>
          </CosmicCard>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.base },
  title: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', paddingTop: Spacing.sm },
  periodRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.full, padding: 4, gap: 2 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.full },
  periodTabActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: FontSizes.sm, color: Colors.textMuted, fontFamily: 'Inter-Medium' },
  periodTextActive: { color: Colors.text },
  signRow: { paddingVertical: 4, gap: Spacing.sm },
  signChip: { alignItems: 'center', gap: 2, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  signEmoji: { fontSize: FontSizes.lg },
  signChipName: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  signHeader: { flexDirection: 'row' },
  signHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  activeSymbol: { fontSize: 48, fontFamily: 'PlayfairDisplay-Regular' },
  activeName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  activeDates: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginTop: 2 },
  categoryRow: { gap: Spacing.sm, paddingVertical: 2 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  categoryTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  categoryEmoji: { fontSize: FontSizes.sm },
  categoryText: { fontSize: FontSizes.sm, color: Colors.textMuted, fontFamily: 'Inter-Medium' },
  categoryTextActive: { color: Colors.primaryGlow },
  readingCard: { minHeight: 120 },
  readingText: { fontSize: FontSizes.base, color: Colors.textSecondary, lineHeight: 26, fontFamily: 'Inter-Regular' },
  traitsCard: { gap: Spacing.sm },
  traitsTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  traitsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  traitChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  traitText: { fontSize: FontSizes.xs, fontFamily: 'Inter-Medium' },
});
