import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PLANS, createCheckoutSession } from '../lib/stripe';
import { useSubscription } from '../hooks/useSubscription';
import StarField from '../components/StarField';
import CosmicCard from '../components/CosmicCard';
import GlowButton from '../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

function PlanCard({ planId, selected, onSelect, current }: {
  planId: keyof typeof PLANS; selected: boolean; onSelect: () => void; current: boolean;
}) {
  const plan = PLANS[planId];
  const isFree = planId === 'free';
  const isCosmic = planId === 'cosmic';

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.85}>
      <CosmicCard
        style={[styles.planCard, selected ? styles.planCardSelected : undefined, isCosmic ? styles.cosmicCard : undefined]}
        glow={selected && !isCosmic}
        goldGlow={selected && isCosmic}
      >
        {isCosmic && 'badge' in plan && (
          <View style={styles.badge}><Text style={styles.badgeText}>{(plan as any).badge}</Text></View>
        )}
        {current && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current Plan</Text></View>}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {plan.price === 0 ? 'Free' : `$${plan.price}`}
            </Text>
            {plan.period && <Text style={styles.period}>/{plan.period}</Text>}
          </View>
          {isCosmic && <Text style={styles.savingsText}>Save 33% vs monthly</Text>}
        </View>

        <View style={styles.featuresList}>
          {plan.features.map(f => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          {'locked' in plan && (plan as any).locked.map((f: string) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.lockmark}>✕</Text>
              <Text style={styles.lockedText}>{f}</Text>
            </View>
          ))}
        </View>

        {selected && !current && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>Selected ✓</Text>
          </View>
        )}
      </CosmicCard>
    </TouchableOpacity>
  );
}

export default function PricingScreen() {
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>('starseed');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { plan: currentPlan } = useSubscription();
  const router = useRouter();

  const handleSubscribe = async () => {
    if (selectedPlan === 'free' || selectedPlan === currentPlan) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const url = await createCheckoutSession(selectedPlan as 'starseed' | 'cosmic');
      if (url) {
        await Linking.openURL(url);
      } else {
        setErrorMsg('Could not open checkout. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Unlock Celestial</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>✦</Text>
            <Text style={styles.heroTitle}>Choose Your{'\n'}Cosmic Path</Text>
            <Text style={styles.heroSubtitle}>
              Unlock AI-powered readings, psychic guidance, and your complete celestial blueprint.
            </Text>
          </View>

          {(['free', 'starseed', 'cosmic'] as const).map(planId => (
            <PlanCard
              key={planId}
              planId={planId}
              selected={selectedPlan === planId}
              onSelect={() => setSelectedPlan(planId)}
              current={currentPlan === planId}
            />
          ))}

          {!!errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}
          {selectedPlan !== 'free' && selectedPlan !== currentPlan && (
            <GlowButton
              title={loading ? 'Opening Checkout...' : `Subscribe to ${PLANS[selectedPlan].name}`}
              onPress={handleSubscribe}
              disabled={loading}
              variant={selectedPlan === 'cosmic' ? 'gold' : 'primary'}
              size="lg"
              style={styles.subscribeBtn}
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Cancel anytime · Secure checkout via Stripe</Text>
            <Text style={styles.footerText}>Questions? Reach us at hello@celestial.app</Text>
          </View>
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
  scroll: { padding: Spacing.base, paddingBottom: 100, gap: Spacing.base },
  hero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  heroEmoji: { fontSize: 40, color: Colors.accent },
  heroTitle: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center', lineHeight: 44 },
  heroSubtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 22 },
  planCard: { gap: Spacing.md, position: 'relative', overflow: 'visible' },
  planCardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  cosmicCard: { borderColor: Colors.accent + '60' },
  badge: { position: 'absolute', top: -12, right: Spacing.base, backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSizes.xs, color: '#000', fontFamily: 'Inter-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  currentBadge: { position: 'absolute', top: -12, left: Spacing.base, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  currentBadgeText: { fontSize: FontSizes.xs, color: Colors.text, fontFamily: 'Inter-Bold' },
  planHeader: { gap: 4 },
  planName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: FontSizes['4xl'], color: Colors.primaryGlow, fontFamily: 'PlayfairDisplay-Bold' },
  period: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  savingsText: { fontSize: FontSizes.xs, color: Colors.accent, fontFamily: 'Inter-Medium' },
  featuresList: { gap: Spacing.xs },
  featureRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  checkmark: { color: Colors.success, fontSize: FontSizes.sm, fontFamily: 'Inter-Bold', width: 16 },
  lockmark: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: 'Inter-Bold', width: 16 },
  featureText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular', lineHeight: 20 },
  lockedText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textMuted, fontFamily: 'Inter-Regular', lineHeight: 20 },
  selectedIndicator: { alignItems: 'center', marginTop: 4 },
  selectedText: { color: Colors.primaryGlow, fontFamily: 'Inter-SemiBold', fontSize: FontSizes.sm },
  subscribeBtn: { marginTop: Spacing.sm },
  footer: { alignItems: 'center', gap: 4, paddingTop: Spacing.md },
  footerText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  errorMsg: { color: '#F87171', fontFamily: 'Inter-Regular', fontSize: FontSizes.sm, textAlign: 'center' },
});
