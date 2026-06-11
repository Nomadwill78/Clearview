import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { ZODIAC_SIGNS, COMPATIBILITY_MATRIX, ZodiacSign } from '../../constants/zodiac';
import { usePremiumFeature } from '../../hooks/useSubscription';
import { generateCompatibility } from '../../lib/claude';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import PremiumGate from '../../components/PremiumGate';
import GlowButton from '../../components/GlowButton';
import ShimmerLoader from '../../components/ShimmerLoader';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CompatibilityRing({ percentage }: { percentage: number }) {
  const R = 60, CIRC = 2 * Math.PI * R;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(percentage / 100, { duration: 1200 });
  }, [percentage]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  return (
    <View style={styles.ringContainer}>
      <Svg width={160} height={160} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={80} cy={80} r={R} fill="none" stroke={Colors.border} strokeWidth={10} />
        <AnimatedCircle cx={80} cy={80} r={R} fill="none"
          stroke={percentage >= 80 ? Colors.accent : Colors.primary}
          strokeWidth={10} strokeLinecap="round"
          strokeDasharray={CIRC} animatedProps={animProps} />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPercent}>{percentage}%</Text>
        <Text style={styles.ringLabel}>Match</Text>
      </View>
    </View>
  );
}

function SignPicker({ value, onChange, label }: { value: ZodiacSign | null; onChange: (s: ZodiacSign) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const selected = ZODIAC_SIGNS.find(s => s.name === value);

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity onPress={() => setOpen(!open)} style={[styles.pickerBtn, selected && { borderColor: selected.color }]}>
        {selected ? (
          <View style={styles.pickerSelected}>
            <Text style={[styles.pickerSymbol, { color: selected.color }]}>{selected.symbol}</Text>
            <Text style={styles.pickerName}>{selected.name}</Text>
          </View>
        ) : <Text style={styles.pickerPlaceholder}>Select a sign...</Text>}
        <Text style={{ color: Colors.textMuted }}>▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {ZODIAC_SIGNS.map(s => (
              <TouchableOpacity key={s.name} onPress={() => { onChange(s.name as ZodiacSign); setOpen(false); }} style={styles.dropdownItem}>
                <Text style={[styles.dropdownSymbol, { color: s.color }]}>{s.symbol}</Text>
                <Text style={styles.dropdownName}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function CompatibilityScreen() {
  const [sign1, setSign1] = useState<ZodiacSign | null>(null);
  const [sign2, setSign2] = useState<ZodiacSign | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { isLocked } = usePremiumFeature('compatibility');

  const percentage = sign1 && sign2 ? COMPATIBILITY_MATRIX[sign1][sign2] : 0;

  const handleCheck = async () => {
    if (!sign1 || !sign2) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await generateCompatibility(sign1, sign2);
      setResult(data);
    } catch {}
    setLoading(false);
  };

  const s1Info = sign1 ? ZODIAC_SIGNS.find(s => s.name === sign1) : null;
  const s2Info = sign2 ? ZODIAC_SIGNS.find(s => s.name === sign2) : null;

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Compatibility</Text>

          {/* Sign pickers */}
          <CosmicCard style={styles.pickerCard} glow>
            <Text style={styles.sectionTitle}>Choose Two Signs</Text>
            <SignPicker value={sign1} onChange={setSign1} label="First Sign" />
            <View style={styles.vsRow}><Text style={styles.vs}>✦</Text></View>
            <SignPicker value={sign2} onChange={setSign2} label="Second Sign" />
            <GlowButton title="Check Compatibility" onPress={handleCheck} disabled={!sign1 || !sign2 || loading}
              style={styles.checkBtn} variant="gold" />
          </CosmicCard>

          {/* Result */}
          {(result || loading) && (
            <>
              <CosmicCard style={styles.percentCard} goldGlow>
                <View style={styles.signsRow}>
                  {s1Info && <View style={styles.signBadge}>
                    <Text style={[styles.signBadgeSymbol, { color: s1Info.color }]}>{s1Info.symbol}</Text>
                    <Text style={styles.signBadgeName}>{s1Info.name}</Text>
                  </View>}
                  <CompatibilityRing percentage={percentage} />
                  {s2Info && <View style={styles.signBadge}>
                    <Text style={[styles.signBadgeSymbol, { color: s2Info.color }]}>{s2Info.symbol}</Text>
                    <Text style={styles.signBadgeName}>{s2Info.name}</Text>
                  </View>}
                </View>
                {loading ? <ShimmerLoader rows={3} /> : result?.summary && (
                  <Text style={styles.summaryText}>{result.summary}</Text>
                )}
              </CosmicCard>

              {/* Detailed breakdown */}
              <PremiumGate isLocked={isLocked} feature="detailed compatibility analysis">
                {loading ? <ShimmerLoader rows={8} /> : result && (
                  <View style={styles.breakdown}>
                    {[
                      { key: 'love', emoji: '💕', title: 'Love & Romance' },
                      { key: 'friendship', emoji: '🤝', title: 'Friendship' },
                      { key: 'work', emoji: '💼', title: 'Work & Collaboration' },
                    ].map(({ key, emoji, title }) => (
                      <CosmicCard key={key} style={styles.breakdownCard}>
                        <Text style={styles.breakdownTitle}>{emoji} {title}</Text>
                        <Text style={styles.breakdownText}>{result[key]}</Text>
                      </CosmicCard>
                    ))}
                  </View>
                )}
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
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.base },
  title: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', paddingTop: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', marginBottom: Spacing.sm },
  pickerCard: { gap: Spacing.sm },
  pickerContainer: { gap: 4 },
  pickerLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Medium', letterSpacing: 0.5 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pickerSymbol: { fontSize: FontSizes.xl },
  pickerName: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'Inter-Medium' },
  pickerPlaceholder: { color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  dropdown: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginTop: 2, zIndex: 100 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  dropdownSymbol: { fontSize: FontSizes.lg },
  dropdownName: { fontSize: FontSizes.sm, color: Colors.text, fontFamily: 'Inter-Regular' },
  vsRow: { alignItems: 'center' },
  vs: { fontSize: FontSizes.xl, color: Colors.accent },
  checkBtn: { marginTop: Spacing.sm, alignSelf: 'center' },
  percentCard: { alignItems: 'center', gap: Spacing.base },
  signsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  signBadge: { alignItems: 'center', gap: 4, flex: 1 },
  signBadgeSymbol: { fontSize: 40 },
  signBadgeName: { fontSize: FontSizes.sm, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  ringContainer: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPercent: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  ringLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  summaryText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular', textAlign: 'center' },
  breakdown: { gap: Spacing.sm },
  breakdownCard: { gap: Spacing.xs },
  breakdownTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  breakdownText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },
});
