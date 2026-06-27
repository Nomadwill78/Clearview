import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { usePremiumFeature } from '../../hooks/useSubscription';
import {
  getNumerologyProfile,
  LIFE_PATH_MEANINGS,
  DESTINY_MEANINGS,
  SOUL_URGE_MEANINGS,
  PERSONALITY_MEANINGS,
  BIRTHDAY_MEANINGS,
  PERSONAL_YEAR_MEANINGS,
  NumberMeaning,
} from '../../lib/numerology';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import PremiumGate from '../../components/PremiumGate';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

const CURRENT_YEAR = new Date().getFullYear();

/** Always shows the number, archetype, and essence as a free glimpse; gates the full interpretation. */
function PremiumNumberCard({ number, label, subtitle, data, isLocked }: {
  number: number; label: string; subtitle: string; data?: NumberMeaning; isLocked: boolean;
}) {
  if (!data) return null;
  return (
    <CosmicCard style={styles.numCard} glow>
      <View style={styles.numHeader}>
        <View style={styles.numBadge}>
          <Text style={styles.numDigit}>{number}</Text>
        </View>
        <View style={styles.numHeaderText}>
          <Text style={styles.numLabel}>{label}</Text>
          <Text style={styles.numTitle}>{data.title}</Text>
          <Text style={styles.numSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.essence}>{data.essence}</Text>
      <PremiumGate isLocked={isLocked} feature={`your ${label}`}>
        <Text style={styles.numDesc}>{data.meaning}</Text>
      </PremiumGate>
    </CosmicCard>
  );
}

/** A free, fully-revealed number reading (used for the gifts we give away). */
function FreeNumberCard({ number, label, subtitle, data, gold }: {
  number: number; label: string; subtitle: string; data?: NumberMeaning; gold?: boolean;
}) {
  if (!data) return null;
  return (
    <CosmicCard style={styles.numCard} glow={!gold} goldGlow={gold}>
      <View style={styles.numHeader}>
        <View style={[styles.numBadge, gold && styles.numBadgeGold]}>
          <Text style={[styles.numDigit, gold && styles.numDigitGold]}>{number}</Text>
        </View>
        <View style={styles.numHeaderText}>
          <Text style={[styles.numLabel, gold && { color: Colors.accent }]}>{label}</Text>
          <Text style={styles.numTitle}>{data.title}</Text>
          <Text style={styles.numSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.essence}>{data.essence}</Text>
      <Text style={styles.numDesc}>{data.meaning}</Text>
    </CosmicCard>
  );
}

export default function NumerologyScreen() {
  const { profile } = useProfile();
  const { isLocked } = usePremiumFeature('numerology');

  const hasName = !!profile?.name?.trim();

  const nums = useMemo(() => {
    if (!profile?.birthDate) return null;
    return getNumerologyProfile(profile.birthDate, profile.name ?? '', CURRENT_YEAR);
  }, [profile?.birthDate, profile?.name]);

  const lifePathMeaning = nums ? LIFE_PATH_MEANINGS[nums.lifePathNumber] : null;
  const personalYear = nums ? PERSONAL_YEAR_MEANINGS[nums.personalYearNumber] : null;

  if (!profile?.birthDate) {
    return (
      <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyText}>Add your birth date in Profile to unlock your numerology reading.</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Numerology</Text>
          <Text style={styles.subtitle}>The sacred language of numbers reveals your soul's code</Text>

          {nums && (
            <>
              {/* Life Path — always free, the centerpiece */}
              <CosmicCard style={styles.heroCard} goldGlow>
                <Text style={styles.heroLabel}>✦ Your Life Path Number</Text>
                <Text style={styles.heroNumber}>{nums.lifePathNumber}</Text>
                {lifePathMeaning && (
                  <>
                    <Text style={styles.heroTitle}>{lifePathMeaning.title}</Text>
                    <Text style={styles.heroDesc}>{lifePathMeaning.description}</Text>
                    <View style={styles.strengthsRow}>
                      {lifePathMeaning.strengths.map(s => (
                        <View key={s} style={styles.strengthChip}>
                          <Text style={styles.strengthText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.challengesLabel}>Challenges to grow through:</Text>
                    <Text style={styles.challengesText}>{lifePathMeaning.challenges.join(' · ')}</Text>
                  </>
                )}
              </CosmicCard>

              {/* Personal Year — free, timely hook that changes each year */}
              {personalYear && (
                <CosmicCard style={styles.yearCard} glow>
                  <View style={styles.yearHeader}>
                    <Text style={styles.yearLabel}>Your {CURRENT_YEAR} Personal Year</Text>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeNum}>{nums.personalYearNumber}</Text>
                    </View>
                  </View>
                  <Text style={styles.yearTitle}>{personalYear.title}</Text>
                  <Text style={styles.yearEssence}>{personalYear.essence}</Text>
                  <Text style={styles.numDesc}>{personalYear.meaning}</Text>
                </CosmicCard>
              )}

              {hasName ? (
                <>
                  <Text style={styles.sectionLabel}>Your Core Numbers</Text>

                  {/* Destiny — premium, with a free glimpse */}
                  <PremiumNumberCard
                    number={nums.destinyNumber}
                    label="Destiny Number"
                    subtitle="Your life's mission"
                    data={DESTINY_MEANINGS[nums.destinyNumber]}
                    isLocked={isLocked}
                  />

                  {/* Soul Urge — premium, with a free glimpse */}
                  <PremiumNumberCard
                    number={nums.soulUrgeNumber}
                    label="Soul Urge Number"
                    subtitle="Your heart's deepest desire"
                    data={SOUL_URGE_MEANINGS[nums.soulUrgeNumber]}
                    isLocked={isLocked}
                  />

                  {/* Personality — premium, with a free glimpse */}
                  <PremiumNumberCard
                    number={nums.personalityNumber}
                    label="Personality Number"
                    subtitle="How the world sees you"
                    data={PERSONALITY_MEANINGS[nums.personalityNumber]}
                    isLocked={isLocked}
                  />

                  {/* Birthday — a free gift, fully revealed, to show the depth of premium */}
                  <Text style={styles.sectionLabel}>A Gift From The Stars</Text>
                  <FreeNumberCard
                    number={nums.birthdayNumber}
                    label="Birthday Number"
                    subtitle="A talent you were born with"
                    data={BIRTHDAY_MEANINGS[nums.birthdayNumber]}
                  />
                </>
              ) : (
                <CosmicCard style={styles.nameCard}>
                  <Text style={styles.numTitle}>Unlock your name numbers</Text>
                  <Text style={styles.numDesc}>
                    Add your full name in Profile to reveal your Destiny, Soul Urge, and Personality numbers — the
                    heart of your numerology blueprint.
                  </Text>
                </CosmicCard>
              )}
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
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Medium', letterSpacing: 1, textTransform: 'uppercase', marginTop: Spacing.sm },
  heroCard: { alignItems: 'center', gap: Spacing.sm },
  heroLabel: { fontSize: FontSizes.xs, color: Colors.accent, fontFamily: 'Inter-Medium', letterSpacing: 2, textTransform: 'uppercase' },
  heroNumber: { fontSize: 96, color: Colors.accentGlow, fontFamily: 'PlayfairDisplay-Bold', lineHeight: 100 },
  heroTitle: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  heroDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center', fontFamily: 'Inter-Regular' },
  strengthsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  strengthChip: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.primary + '30', borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary + '50' },
  strengthText: { fontSize: FontSizes.xs, color: Colors.primaryGlow, fontFamily: 'Inter-Medium' },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  challengesLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 1 },
  challengesText: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  yearCard: { gap: Spacing.xs },
  yearHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yearLabel: { fontSize: FontSizes.xs, color: Colors.primaryGlow, fontFamily: 'Inter-Medium', letterSpacing: 1.5, textTransform: 'uppercase' },
  yearBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '30', borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  yearBadgeNum: { fontSize: FontSizes.lg, color: Colors.primaryGlow, fontFamily: 'PlayfairDisplay-Bold' },
  yearTitle: { fontSize: FontSizes.xl, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  yearEssence: { fontSize: FontSizes.sm, color: Colors.accentGlow, fontFamily: 'Inter-Medium', fontStyle: 'italic' },
  numCard: { gap: Spacing.sm },
  numHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  numHeaderText: { flex: 1 },
  numBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + '30', borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  numBadgeGold: { backgroundColor: Colors.accent + '25', borderColor: Colors.accent },
  numDigit: { fontSize: FontSizes['2xl'], color: Colors.primaryGlow, fontFamily: 'PlayfairDisplay-Bold' },
  numDigitGold: { color: Colors.accentGlow },
  numLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Medium', letterSpacing: 1, textTransform: 'uppercase' },
  numTitle: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  numSubtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  essence: { fontSize: FontSizes.sm, color: Colors.accentGlow, fontFamily: 'Inter-Medium', fontStyle: 'italic' },
  numDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },
  nameCard: { gap: Spacing.xs },
});
