import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import GlowButton from './GlowButton';

interface Props {
  isLocked: boolean;
  children: React.ReactNode;
  feature?: string;
  style?: ViewStyle;
  requiresCosmic?: boolean;
  /** Always-visible content shown clearly above the locked preview (a free hook). */
  teaser?: React.ReactNode;
  /** Cap how tall the peeking preview is before it fades out. Defaults to 160. */
  previewHeight?: number;
}

export default function PremiumGate({
  isLocked,
  children,
  feature,
  style,
  requiresCosmic,
  teaser,
  previewHeight = 160,
}: Props) {
  const router = useRouter();

  if (!isLocked) return <>{children}</>;

  return (
    <View style={[styles.container, style]}>
      {teaser != null && <View style={styles.teaser}>{teaser}</View>}

      <View style={[styles.lockedWrap, { maxHeight: previewHeight }]}>
        {/* A genuine glimpse: the top of the real content peeks through, then fades */}
        <View style={styles.preview} pointerEvents="none">
          {children}
        </View>
        <LinearGradient
          colors={['transparent', 'rgba(10,5,20,0.55)', 'rgba(10,5,20,0.97)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.overlay}>
          <Text style={styles.hint}>✦ A glimpse of premium</Text>
          <Text style={styles.title}>
            {requiresCosmic ? 'Unlock with Cosmic' : 'Unlock with Starseed'}
          </Text>
          <Text style={styles.subtitle}>
            {feature
              ? `Upgrade to reveal ${feature}`
              : 'Upgrade to reveal the full reading'}
          </Text>
          <GlowButton
            title={requiresCosmic ? 'Get Cosmic' : 'Upgrade Now'}
            onPress={() => router.push('/pricing')}
            variant="gold"
            size="sm"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: BorderRadius.lg },
  teaser: { marginBottom: Spacing.sm },
  lockedWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
  },
  preview: { opacity: 0.55 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: Spacing.base,
    gap: 4,
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.accentGlow,
    fontFamily: 'Inter-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  button: { marginTop: Spacing.xs },
});
