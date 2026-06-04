import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  goldGlow?: boolean;
  gradient?: boolean;
}

export default function CosmicCard({ children, style, glow, goldGlow, gradient }: Props) {
  const shadowStyle = glow ? Shadows.glow : goldGlow ? Shadows.goldGlow : Shadows.card;

  if (gradient) {
    return (
      <LinearGradient
        colors={['rgba(30, 21, 66, 0.9)', 'rgba(19, 13, 43, 0.95)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.card, shadowStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, shadowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
  },
});
