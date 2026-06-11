import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSizes, BorderRadius, Fonts } from '../constants/theme';
import { PLANETS } from '../constants/planets';

interface Props {
  planetName: string;
  sign?: string;
  degree?: number;
  retrograde?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function PlanetBadge({ planetName, sign, degree, retrograde, size = 'md', style }: Props) {
  const planet = PLANETS.find(p => p.name === planetName);
  const symbol = planet?.symbol ?? '●';
  const color = planet?.color ?? Colors.primaryGlow;

  if (size === 'sm') {
    return (
      <View style={[styles.smContainer, { borderColor: color + '60' }, style]}>
        <Text style={[styles.smSymbol, { color }]}>{symbol}</Text>
        {sign && <Text style={styles.smSign}>{sign.slice(0, 3)}</Text>}
        {retrograde && <Text style={styles.retroSm}>R</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: color + '40' }, style]}>
      <View style={[styles.symbolCircle, { backgroundColor: color + '20' }]}>
        <Text style={[styles.symbol, { color }]}>{symbol}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{planetName}</Text>
          {retrograde && <Text style={styles.retro}>Rx</Text>}
        </View>
        {sign && (
          <Text style={styles.position}>
            {degree !== undefined ? `${degree.toFixed(1)}° ` : ''}{sign}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    padding: 8,
  },
  symbolCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: FontSizes.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  retro: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontStyle: 'italic',
  },
  position: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  // Small variant
  smContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  smSymbol: {
    fontSize: FontSizes.sm,
  },
  smSign: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  retroSm: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontStyle: 'italic',
  },
});
