import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { useAuthStore } from '../store/authStore';
import { useSubscription } from '../hooks/useSubscription';
import { openBillingPortal, PLANS } from '../lib/stripe';
import { getZodiacInfo } from '../constants/zodiac';
import StarField from '../components/StarField';
import CosmicCard from '../components/CosmicCard';
import GlowButton from '../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuthStore();
  const { plan, currentPeriodEnd, isPremium } = useSubscription();
  const router = useRouter();
  const [openingPortal, setOpeningPortal] = useState(false);

  const signInfo = profile?.sunSign ? getZodiacInfo(profile.sunSign) : null;

  const handleBillingPortal = async () => {
    setOpeningPortal(true);
    const url = await openBillingPortal();
    if (url) Linking.openURL(url);
    else Alert.alert('Error', 'Could not open billing portal. Please contact support.');
    setOpeningPortal(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)'); } },
    ]);
  };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Avatar & Name */}
          <View style={styles.profileHero}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarEmoji}>{signInfo?.symbol ?? '✦'}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.name ?? 'Cosmic Soul'}</Text>
            {signInfo && (
              <Text style={[styles.profileSign, { color: signInfo.color }]}>
                {signInfo.name} · {signInfo.element} Sign
              </Text>
            )}
          </View>

          {/* Birth Data */}
          <CosmicCard style={styles.section} glow>
            <Text style={styles.sectionTitle}>Cosmic Blueprint</Text>
            {[
              { label: 'Birth Date', value: profile?.birthDate ?? 'Not set' },
              { label: 'Birth Time', value: profile?.birthTime ?? 'Not set' },
              { label: 'Birth Location', value: profile?.birthLocation ?? 'Not set' },
              { label: 'Sun Sign ☀️', value: profile?.sunSign ?? 'Not calculated' },
              { label: 'Moon Sign 🌙', value: profile?.moonSign ?? 'Not calculated' },
              { label: 'Rising Sign ↑', value: profile?.risingSign ?? 'Not calculated' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{label}</Text>
                <Text style={styles.dataValue}>{value}</Text>
              </View>
            ))}
          </CosmicCard>

          {/* Subscription */}
          <CosmicCard style={styles.section} goldGlow={isPremium}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.planBadgeRow}>
              <View style={[styles.planBadge, { backgroundColor: isPremium ? Colors.accent + '20' : Colors.surface }]}>
                <Text style={[styles.planBadgeText, { color: isPremium ? Colors.accent : Colors.textMuted }]}>
                  {PLANS[plan]?.name ?? 'Free'} Plan
                </Text>
              </View>
              {currentPeriodEnd && (
                <Text style={styles.renewText}>
                  Renews {new Date(currentPeriodEnd).toLocaleDateString()}
                </Text>
              )}
            </View>
            {isPremium ? (
              <GlowButton title={openingPortal ? 'Opening...' : 'Manage Billing'} onPress={handleBillingPortal}
                variant="outline" size="sm" disabled={openingPortal} />
            ) : (
              <GlowButton title="Upgrade to Premium" onPress={() => router.push('/pricing')} variant="gold" size="sm" />
            )}
          </CosmicCard>

          {/* Notifications */}
          <CosmicCard style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {[
              { key: 'notificationDaily' as const, label: 'Daily Horoscope', subtitle: 'Morning cosmic briefing' },
              { key: 'notificationMoon' as const, label: 'Moon Phase Updates', subtitle: 'New & full moon alerts' },
            ].map(({ key, label, subtitle }) => (
              <View key={key} style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>{label}</Text>
                  <Text style={styles.toggleSubtitle}>{subtitle}</Text>
                </View>
                <Switch
                  value={profile?.[key] ?? true}
                  onValueChange={val => updateProfile({ [key]: val })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.text}
                />
              </View>
            ))}
          </CosmicCard>

          {/* Sign Out */}
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

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
  profileHero: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surfaceLight, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 40 },
  profileName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  profileSign: { fontSize: FontSizes.base, fontFamily: 'Inter-Medium' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.base, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', marginBottom: Spacing.xs },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  dataLabel: { fontSize: FontSizes.sm, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  dataValue: { fontSize: FontSizes.sm, color: Colors.text, fontFamily: 'Inter-Medium' },
  planBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  planBadgeText: { fontSize: FontSizes.sm, fontFamily: 'Inter-SemiBold' },
  renewText: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { fontSize: FontSizes.sm, color: Colors.text, fontFamily: 'Inter-Medium' },
  toggleSubtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular' },
  signOutBtn: { alignItems: 'center', paddingVertical: Spacing.base },
  signOutText: { color: Colors.error, fontFamily: 'Inter-Medium', fontSize: FontSizes.base },
});
