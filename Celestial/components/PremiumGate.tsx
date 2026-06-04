import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import GlowButton from './GlowButton';

interface Props {
  isLocked: boolean;
  children: React.ReactNode;
  feature?: string;
  style?: ViewStyle;
  requiresCosmic?: boolean;
}

export default function PremiumGate({ isLocked, children, feature, style, requiresCosmic }: Props) {
  const router = useRouter();

  if (!isLocked) return <>{children}</>;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.preview} pointerEvents="none">
        {children}
      </View>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Text style={styles.icon}>✦</Text>
          <Text style={styles.title}>
            {requiresCosmic ? 'Cosmic Plan Required' : 'Unlock with Starseed'}
          </Text>
          <Text style={styles.subtitle}>
            {feature
              ? `Upgrade to access ${feature} and all premium cosmic insights`
              : 'Get full access to all cosmic insights and AI-powered readings'}
          </Text>
          <GlowButton
            title={requiresCosmic ? 'Get Cosmic Plan' : 'Upgrade Now'}
            onPress={() => router.push('/pricing')}
            variant="gold"
            size="sm"
            style={styles.button}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', borderRadius: BorderRadius.lg },
  preview: { opacity: 0.4 },
  overlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.sm,
  },
  icon: { fontSize: 32, color: Colors.accent, marginBottom: 4 },
  title: {
    fontSize: FontSizes.lg, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 20, fontFamily: 'Inter-Regular',
  },
  button: { marginTop: Spacing.sm },
});
