import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows, Fonts } from '../constants/theme';
import { ZodiacSignData } from '../constants/zodiac';

interface Props {
  sign: ZodiacSignData;
  isHighlighted?: boolean;
  onPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

const ELEMENT_GRADIENTS: Record<string, [string, string]> = {
  fire: ['rgba(239,68,68,0.2)', 'rgba(245,158,11,0.1)'],
  earth: ['rgba(16,185,129,0.2)', 'rgba(30,21,66,0.1)'],
  air: ['rgba(96,165,250,0.2)', 'rgba(139,92,246,0.1)'],
  water: ['rgba(59,130,246,0.2)', 'rgba(139,92,246,0.1)'],
};

export default function ZodiacSignCard({ sign, isHighlighted, onPress, compact, style }: Props) {
  const gradientColors = ELEMENT_GRADIENTS[sign.element] ?? ['rgba(30,21,66,0.3)', 'rgba(10,5,20,0.1)'];

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.compactContainer, isHighlighted && styles.highlighted, style]}
      >
        <Text style={styles.symbol}>{sign.symbol}</Text>
        <Text style={styles.compactName} numberOfLines={1}>{sign.name}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[style, isHighlighted ? Shadows.glow : Shadows.card]}>
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isHighlighted && styles.highlightedCard]}
      >
        <View style={styles.header}>
          <Text style={[styles.symbolLarge, { color: sign.color }]}>{sign.symbol}</Text>
          <View style={styles.headerText}>
            <Text style={styles.name}>{sign.name}</Text>
            <Text style={styles.dates}>
              {sign.rulingPlanet} · {sign.element.charAt(0).toUpperCase() + sign.element.slice(1)}
            </Text>
          </View>
          {isHighlighted && (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>Your Sign</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{sign.description}</Text>
        <View style={styles.traits}>
          {sign.traits.slice(0, 3).map(trait => (
            <View key={trait} style={[styles.traitBadge, { borderColor: sign.color + '60' }]}>
              <Text style={[styles.traitText, { color: sign.color }]}>{trait}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  highlightedCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  highlighted: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  symbolLarge: {
    fontSize: FontSizes['3xl'],
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  dates: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  traitBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(10,5,20,0.3)',
  },
  traitText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
  },
  userBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  userBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  // Compact styles
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 70,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 4,
  },
  symbol: {
    fontSize: FontSizes.xl,
    color: Colors.primaryGlow,
  },
  compactName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
