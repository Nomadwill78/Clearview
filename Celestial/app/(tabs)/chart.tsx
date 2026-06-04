import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAstrology } from '../../hooks/useAstrology';
import { usePremiumFeature } from '../../hooks/useSubscription';
import { generateBirthChartReading } from '../../lib/claude';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import ZodiacWheel from '../../components/ZodiacWheel';
import PremiumGate from '../../components/PremiumGate';
import ShimmerLoader from '../../components/ShimmerLoader';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

export default function ChartScreen() {
  const { chart, sunSignInfo, profile } = useAstrology();
  const { isLocked } = usePremiumFeature('birthchart');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chart) loadInterpretation();
  }, [chart]);

  const loadInterpretation = async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const text = await generateBirthChartReading({
        sunSign: chart.sunSign, moonSign: chart.moonSign, risingSign: chart.risingSign,
        planets: chart.planets.map(p => ({ planet: p.planet, sign: p.sign })),
      });
      setInterpretation(text);
    } catch {}
    setLoading(false);
  };

  if (!profile?.birthDate) {
    return (
      <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyText}>Add your birth date in Profile to generate your chart.</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Birth Chart</Text>

          {chart && (
            <>
              {/* Big Three */}
              <CosmicCard style={styles.bigThree} glow>
                <Text style={styles.sectionTitle}>Your Big Three</Text>
                <View style={styles.bigThreeRow}>
                  {[
                    { label: 'Sun ☀️', sign: chart.sunSign },
                    { label: 'Moon 🌙', sign: chart.moonSign },
                    { label: 'Rising ↑', sign: chart.risingSign },
                  ].map(({ label, sign }) => (
                    <View key={label} style={styles.bigThreeItem}>
                      <Text style={styles.bigThreeLabel}>{label}</Text>
                      <Text style={styles.bigThreeSign}>{sign}</Text>
                    </View>
                  ))}
                </View>
              </CosmicCard>

              {/* Natal Wheel */}
              <CosmicCard style={styles.wheelCard}>
                <Text style={styles.sectionTitle}>Natal Chart</Text>
                <ZodiacWheel chart={chart} size={280} />
              </CosmicCard>

              {/* AI Interpretation */}
              <PremiumGate isLocked={isLocked} feature="full birth chart interpretation">
                <CosmicCard style={styles.interpretCard} glow>
                  <Text style={styles.sectionTitle}>✦ Chart Interpretation</Text>
                  {loading ? <ShimmerLoader rows={6} /> : (
                    <Text style={styles.interpretText}>{interpretation}</Text>
                  )}
                </CosmicCard>
              </PremiumGate>

              {/* Planets table */}
              <PremiumGate isLocked={isLocked} feature="planetary positions">
                <CosmicCard style={styles.planetsCard}>
                  <Text style={styles.sectionTitle}>Planetary Positions</Text>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Planet</Text>
                    <Text style={styles.tableHeaderText}>Sign</Text>
                    <Text style={styles.tableHeaderText}>House</Text>
                    <Text style={styles.tableHeaderText}>°</Text>
                  </View>
                  {chart.planets.map(p => (
                    <View key={p.planet} style={styles.tableRow}>
                      <Text style={styles.planetName}>{p.symbol} {p.planet}</Text>
                      <Text style={styles.tableCell}>{p.sign}</Text>
                      <Text style={styles.tableCell}>{p.house}</Text>
                      <Text style={styles.tableCell}>{p.degree.toFixed(1)}{p.isRetrograde ? ' ℞' : ''}</Text>
                    </View>
                  ))}
                </CosmicCard>
              </PremiumGate>

              {/* Houses */}
              <PremiumGate isLocked={isLocked} feature="house positions">
                <CosmicCard style={styles.housesCard}>
                  <Text style={styles.sectionTitle}>House Cusps</Text>
                  <View style={styles.housesGrid}>
                    {chart.houses.map(h => (
                      <View key={h.house} style={styles.houseItem}>
                        <Text style={styles.houseNum}>{h.house}</Text>
                        <Text style={styles.houseSign}>{h.sign}</Text>
                      </View>
                    ))}
                  </View>
                </CosmicCard>
              </PremiumGate>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSizes.base, fontFamily: 'Inter-Regular' },
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.base },
  title: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', paddingTop: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', marginBottom: Spacing.sm },
  bigThree: { gap: Spacing.sm },
  bigThreeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bigThreeItem: { alignItems: 'center', gap: 4 },
  bigThreeLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  bigThreeSign: { fontSize: FontSizes.md, color: Colors.primaryGlow, fontFamily: 'PlayfairDisplay-Bold' },
  wheelCard: { alignItems: 'center', gap: Spacing.sm },
  interpretCard: { gap: Spacing.sm },
  interpretText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 24, fontFamily: 'Inter-Regular' },
  planetsCard: { gap: Spacing.xs },
  tableHeader: { flexDirection: 'row', paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { flex: 1, fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  planetName: { flex: 1.5, fontSize: FontSizes.xs, color: Colors.text, fontFamily: 'Inter-Medium' },
  tableCell: { flex: 1, fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  housesCard: { gap: Spacing.sm },
  housesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  houseItem: { width: '22%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 6 },
  houseNum: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  houseSign: { fontSize: FontSizes.xs, color: Colors.primaryGlow, fontFamily: 'Inter-Medium' },
});
