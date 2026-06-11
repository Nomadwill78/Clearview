import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePremiumFeature } from '../hooks/useSubscription';
import { getDailyTarotCard } from '../constants/tarot';
import { getMoonPhase } from '../lib/moonphase';
import StarField from '../components/StarField';
import CosmicCard from '../components/CosmicCard';
import PremiumGate from '../components/PremiumGate';
import GlowButton from '../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const CHAKRAS = [
  { name: 'Root', color: '#EF4444', symbol: '▼', affirmation: 'I am grounded, safe, and secure.' },
  { name: 'Sacral', color: '#F97316', symbol: '◉', affirmation: 'I flow with creativity and joy.' },
  { name: 'Solar Plexus', color: '#F59E0B', symbol: '☀', affirmation: 'I am powerful and confident.' },
  { name: 'Heart', color: '#10B981', symbol: '❤', affirmation: 'I give and receive love freely.' },
  { name: 'Throat', color: '#3B82F6', symbol: '◈', affirmation: 'I speak my truth with clarity.' },
  { name: 'Third Eye', color: '#8B5CF6', symbol: '◉', affirmation: 'I trust my intuition and inner wisdom.' },
  { name: 'Crown', color: '#A78BFA', symbol: '✦', affirmation: 'I am connected to divine consciousness.' },
];

const ORACLE_MESSAGES = [
  { title: 'Trust Your Journey', message: 'The path you walk is exactly the one your soul chose before you were born. Every detour, every challenge, every unexpected door is perfectly placed. Trust the wisdom of your own journey.', symbol: '🌟' },
  { title: 'You Are Held', message: 'Unseen forces of love and light surround you always. In your moments of greatest uncertainty, know that you are cradled by the cosmos itself. You are never alone.', symbol: '💜' },
  { title: 'The Answer Lies Within', message: 'Stop seeking outside what can only be found inside. The oracle you seek is your own deep knowing. Be still. Listen. The wisdom you need is already there.', symbol: '🔮' },
  { title: 'A Threshold Awaits', message: 'You are standing at the edge of something significant. The unknown that stretches before you is not something to fear — it is an invitation. Step through.', symbol: '✨' },
  { title: 'Tend Your Inner Garden', message: 'What you nurture within you grows without. The seeds of your thoughts, your beliefs, your dreams — they are always germinating. What are you growing?', symbol: '🌱' },
];

function CardFlip({ card, flipped, onFlip }: { card: any; flipped: boolean; onFlip: () => void }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: flipped ? 1 : 0, friction: 8, useNativeDriver: true }).start();
  }, [flipped]);
  const frontInterp = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '180deg'] });
  const backInterp = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['180deg', '90deg', '0deg'] });
  return (
    <TouchableOpacity onPress={onFlip} style={styles.cardFlip} activeOpacity={0.9}>
      <Animated.View style={[styles.cardFace, { transform: [{ rotateY: frontInterp }], backfaceVisibility: 'hidden' }]}>
        <LinearGradient colors={['#4C1D95', '#1E1542', '#0A0514']} style={styles.cardBack}>
          <Text style={styles.cardBackSymbol}>✦</Text>
          <Text style={styles.cardBackText}>Tap to reveal</Text>
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.cardFace, styles.cardFaceAbsolute, { transform: [{ rotateY: backInterp }], backfaceVisibility: 'hidden' }]}>
        <LinearGradient colors={['#2E1065', '#4C1D95', '#1E1542']} style={styles.cardFront}>
          <Text style={styles.cardNumber}>{card.number}</Text>
          <Text style={styles.cardSymbol}>{card.symbol}</Text>
          <Text style={styles.cardName}>{card.name}</Text>
          <View style={styles.keywordsRow}>
            {card.keywords.slice(0, 3).map((k: string) => (
              <Text key={k} style={styles.keyword}>{k}</Text>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TarotScreen() {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [oracleIndex] = useState(() => Math.floor(Math.random() * ORACLE_MESSAGES.length));
  const { isLocked } = usePremiumFeature('tarot');
  const router = useRouter();
  const dailyCard = getDailyTarotCard();
  const oracle = ORACLE_MESSAGES[oracleIndex];
  const moonPhase = getMoonPhase();

  const dailyChakra = CHAKRAS[new Date().getDay() % CHAKRAS.length];

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Tarot & Oracle</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Card of the Day */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>✦ Card of the Day</Text>
            <CardFlip card={dailyCard} flipped={cardFlipped} onFlip={() => setCardFlipped(true)} />
            {cardFlipped && (
              <PremiumGate isLocked={isLocked} feature="full tarot readings">
                <CosmicCard style={styles.readingCard} glow>
                  <Text style={styles.readingTitle}>{dailyCard.name}</Text>
                  <Text style={styles.readingSubtitle}>Upright Meaning</Text>
                  <Text style={styles.readingText}>{dailyCard.uprightMeaning}</Text>
                  {dailyCard.planet && <Text style={styles.meta}>Planet: {dailyCard.planet} · Element: {dailyCard.element}</Text>}
                </CosmicCard>
              </PremiumGate>
            )}
          </View>

          {/* Oracle Message */}
          <PremiumGate isLocked={isLocked} feature="oracle messages">
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🔮 Oracle Message</Text>
              <CosmicCard style={styles.oracleCard} goldGlow>
                <Text style={styles.oracleSymbol}>{oracle.symbol}</Text>
                <Text style={styles.oracleTitle}>{oracle.title}</Text>
                <Text style={styles.oracleText}>{oracle.message}</Text>
              </CosmicCard>
            </View>
          </PremiumGate>

          {/* Chakra Reading */}
          <PremiumGate isLocked={isLocked} feature="chakra readings">
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🌈 Chakra Focus</Text>
              <CosmicCard style={styles.chakraCard}>
                <View style={styles.chakraHeader}>
                  <Text style={[styles.chakraSymbol, { color: dailyChakra.color }]}>{dailyChakra.symbol}</Text>
                  <View>
                    <Text style={styles.chakraName}>{dailyChakra.name} Chakra</Text>
                    <Text style={styles.chakraAffirmation}>{dailyChakra.affirmation}</Text>
                  </View>
                </View>
                <View style={styles.chakraBar}>
                  {CHAKRAS.map(c => (
                    <View key={c.name} style={[styles.chakraDot, { backgroundColor: c.color, opacity: c.name === dailyChakra.name ? 1 : 0.3 }]} />
                  ))}
                </View>
              </CosmicCard>
            </View>
          </PremiumGate>

          {/* Moon Message */}
          <CosmicCard style={styles.moonMsgCard}>
            <Text style={styles.moonMsgTitle}>{moonPhase.emoji} Moon Wisdom</Text>
            <Text style={styles.moonMsgText}>{moonPhase.affirmation}</Text>
          </CosmicCard>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  backBtn: { color: Colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: FontSizes.base },
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Medium', letterSpacing: 1, textTransform: 'uppercase' },
  cardFlip: { alignSelf: 'center', width: 200, height: 320 },
  cardFace: { width: 200, height: 320, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  cardFaceAbsolute: { position: 'absolute', top: 0, left: 0 },
  cardBack: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  cardBackSymbol: { fontSize: 48, color: Colors.accent },
  cardBackText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  cardFront: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  cardNumber: { fontSize: FontSizes.base, color: Colors.accent, fontFamily: 'PlayfairDisplay-Regular' },
  cardSymbol: { fontSize: 48 },
  cardName: { fontSize: FontSizes.xl, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center' },
  keywordsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  keyword: { fontSize: FontSizes.xs, color: Colors.primaryGlow, fontFamily: 'Inter-Medium' },
  readingCard: { gap: Spacing.sm },
  readingTitle: { fontSize: FontSizes.xl, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  readingSubtitle: { fontSize: FontSizes.xs, color: Colors.accent, fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 1 },
  readingText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 24, fontFamily: 'Inter-Regular' },
  meta: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', fontStyle: 'italic' },
  oracleCard: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  oracleSymbol: { fontSize: 40 },
  oracleTitle: { fontSize: FontSizes.xl, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center' },
  oracleText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 24, textAlign: 'center', fontFamily: 'Inter-Regular' },
  chakraCard: { gap: Spacing.sm },
  chakraHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chakraSymbol: { fontSize: 32 },
  chakraName: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  chakraAffirmation: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular', fontStyle: 'italic' },
  chakraBar: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  chakraDot: { width: 12, height: 12, borderRadius: 6 },
  moonMsgCard: { gap: Spacing.xs },
  moonMsgTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  moonMsgText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular', fontStyle: 'italic' },
});
