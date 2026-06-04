import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function GlowButton({ title, onPress, variant = 'primary', size = 'md', style, textStyle, disabled, icon }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: FontSizes.sm },
    md: { paddingVertical: 13, paddingHorizontal: 24, fontSize: FontSizes.base },
    lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: FontSizes.md },
  };

  const sz = sizeStyles[size];

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[styles.base, { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: 'transparent' }, style]}
        activeOpacity={0.75}
      >
        {icon}
        <Text style={[styles.text, { fontSize: sz.fontSize, color: Colors.primaryGlow }, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity onPress={handlePress} disabled={disabled} style={style} activeOpacity={0.7}>
        <Text style={[styles.text, { fontSize: sz.fontSize, color: Colors.textSecondary }, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  const gradientColors = variant === 'gold'
    ? ['#D97706', '#F59E0B', '#FCD34D'] as const
    : ['#6D28D9', '#8B5CF6', '#A78BFA'] as const;

  const glowShadow = variant === 'gold' ? Shadows.goldGlow : Shadows.glow;

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} style={[style, { opacity: disabled ? 0.5 : 1 }]} activeOpacity={0.85}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.base, glowShadow, { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal }]}>
        {icon}
        <Text style={[styles.text, { fontSize: sz.fontSize }, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  text: { color: Colors.text, fontFamily: 'Inter-SemiBold', letterSpacing: 0.3 },
});
