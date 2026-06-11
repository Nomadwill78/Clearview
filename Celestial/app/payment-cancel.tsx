import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import StarField from '../components/StarField';
import GlowButton from '../components/GlowButton';
import { Colors, FontSizes, Spacing } from '../constants/theme';

export default function PaymentCancelScreen() {
  const router = useRouter();
  return (
    <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.emoji}>☾</Text>
          <Text style={styles.title}>The Stars Can Wait</Text>
          <Text style={styles.subtitle}>
            Your checkout was canceled — nothing was charged. Whenever you're ready, your cosmic path will be here.
          </Text>
          <GlowButton title="View Plans" onPress={() => router.replace('/pricing')} size="lg" />
          <GlowButton title="Back to Home" onPress={() => router.replace('/(tabs)')} variant="outline" size="md" />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emoji: { fontSize: 56, color: Colors.primaryGlow },
  title: { fontSize: FontSizes['3xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center' },
  subtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 24, marginBottom: Spacing.md },
});
