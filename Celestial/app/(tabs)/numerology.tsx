import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { usePremiumFeature } from '../../hooks/useSubscription';
import { getNumerologyProfile, LIFE_PATH_MEANINGS } from '../../lib/numerology';
import StarField from '../../components/StarField';
import CosmicCard from '../../components/CosmicCard';
import PremiumGate from '../../components/PremiumGate';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

function NumberCard({ number, title, subtitle, description, isLocked }: {
  number: number; title: string; subtitle: string; description: string; isLocked?: boolean;
}) {
  const card = (
    <CosmicCard style={styles.numCard} glow>
      <View style={styles.numHeader}>
        <View style={styles.numBadge}>
          <Text style={styles.numDigit}>{number}</Text>
        </View>
        <View>
          <Text style={styles.numTitle}>{title}</Text>
          <Text style={styles.numSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.numDesc}>{description}</Text>
    </CosmicCard>
  );

  if (isLocked) return (
    <PremiumGate isLocked={true} feature={title}>
      {card}
    </PremiumGate>
  );
  return card;
}

export default function NumerologyScreen() {
  const { profile } = useProfile();
  const { isLocked } = usePremiumFeature('numerology');

  const nums = useMemo(() => {
    if (!profile?.birthDate || !profile?.name) return null;
    return getNumerologyProfile(profile.birthDate, profile.name);
  }, [profile?.birthDate, profile?.name]);

  const lifePathMeaning = nums ? LIFE_PATH_MEANINGS[nums.lifePathNumber] : null;

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
              {/* Life Path - always visible */}
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

              {/* Destiny - premium */}
              <NumberCard
                number={nums.destinyNumber}
                title="Destiny Number"
                subtitle="Your life's mission"
                description={`Your Destiny Number ${nums.destinyNumber} reveals the path your soul has chosen for this lifetime — the gifts you are meant to develop and the contribution you are here to make.`}
                isLocked={isLocked}
              />

              {/* Soul Urge - premium */}
              <NumberCard
                number={nums.soulUrgeNumber}
                title="Soul Urge Number"
                subtitle="Your heart's deepest desire"
                description={`Soul Urge ${nums.soulUrgeNumber} speaks to the secret longings of your heart — what you truly want at the deepest level of your being, beyond what you show the world.`}
                isLocked={isLocked}
              />

              {/* Personality */}
              <NumberCard
                number={nums.personalityNumber}
                title="Personality Number"
                subtitle="How others see you"
                description={`Your Personality Number ${nums.personalityNumber} reveals the outer mask you wear — the qualities you project to the world and how others experience your energy in daily interactions.`}
                isLocked={isLocked}
              />

              {/* Birthday */}
              <CosmicCard style={styles.birthdayCard}>
                <Text style={styles.numTitle}>Birthday Number {nums.birthdayNumber}</Text>
                <Text style={styles.numDesc}>A special gift you carry into this life — a natural talent that, when developed, becomes one of your most powerful contributions to the world.</Text>
              </CosmicCard>
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
  numCard: { gap: Spacing.sm },
  numHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  numBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + '30', borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  numDigit: { fontSize: FontSizes['2xl'], color: Colors.primaryGlow, fontFamily: 'PlayfairDisplay-Bold' },
  numTitle: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  numSubtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  numDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },
  birthdayCard: { gap: Spacing.xs },
});
