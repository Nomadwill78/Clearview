import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import CosmicCard from './CosmicCard';

interface Props {
  sign: string;
  symbol: string;
  color: string;
  reading: string;
  category?: string;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function HoroscopeCard({ sign, symbol, color, reading, category, onSave, isSaved }: Props) {
  return (
    <CosmicCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.symbolBadge, { borderColor: color }]}>
          <Text style={[styles.symbol, { color }]}>{symbol}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.signName}>{sign}</Text>
          {category && <Text style={styles.category}>{category}</Text>}
        </View>
        {onSave && (
          <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
            <Text style={{ fontSize: 20, color: isSaved ? Colors.accent : Colors.textMuted }}>
              {isSaved ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.divider, { backgroundColor: color + '40' }]} />
      <Text style={styles.reading}>{reading}</Text>
    </CosmicCard>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  symbolBadge: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  symbol: { fontSize: FontSizes.lg, fontFamily: 'PlayfairDisplay-Regular' },
  headerText: { flex: 1 },
  signName: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  category: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontFamily: 'Inter-Regular', textTransform: 'uppercase', letterSpacing: 1 },
  saveBtn: { padding: 4 },
  divider: { height: 1, marginBottom: Spacing.sm },
  reading: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 22, fontFamily: 'Inter-Regular' },
});
