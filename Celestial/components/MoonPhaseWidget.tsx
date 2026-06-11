import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { MoonPhaseInfo } from '../lib/moonphase';

interface Props { moonPhase: MoonPhaseInfo; size?: number; }

function MoonSvg({ phase, illumination, size }: { phase: string; illumination: number; size: number }) {
  const r = size / 2;
  const lit = illumination / 100;

  let moonPath: string;
  if (illumination < 5) {
    moonPath = `M ${r} 0 A ${r} ${r} 0 1 0 ${r} ${size} A ${r} ${r} 0 1 0 ${r} 0 Z`;
    return (
      <Svg width={size} height={size}>
        <Circle cx={r} cy={r} r={r} fill="#1E1542" />
        <Circle cx={r} cy={r} r={r - 1} fill="#0A0514" />
      </Svg>
    );
  }

  const isWaxing = phase.includes('Waxing') || phase === 'Full Moon';
  const isWaning = phase.includes('Waning') || phase === 'Last Quarter';
  const rx = r * Math.abs(1 - 2 * lit);
  const sweep = lit > 0.5 ? 0 : 1;
  const sideSweep = isWaxing ? 0 : 1;

  const d = illumination >= 95
    ? `M ${r} 2 A ${r - 2} ${r - 2} 0 1 1 ${r} ${size - 2} A ${r - 2} ${r - 2} 0 1 1 ${r} 2 Z`
    : `M ${r} 2 A ${r - 2} ${r - 2} 0 0 ${sideSweep} ${r} ${size - 2} A ${rx} ${r - 2} 0 0 ${sweep} ${r} 2 Z`;

  return (
    <Svg width={size} height={size}>
      <Circle cx={r} cy={r} r={r} fill="#0A0514" />
      <Path d={d} fill="#F0E6FF" />
    </Svg>
  );
}

export default function MoonPhaseWidget({ moonPhase, size = 60 }: Props) {
  return (
    <View style={styles.container}>
      <MoonSvg phase={moonPhase.phase} illumination={moonPhase.illumination} size={size} />
      <View style={styles.info}>
        <Text style={styles.phase}>{moonPhase.phase}</Text>
        <Text style={styles.illumination}>{moonPhase.illumination}% illuminated</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  info: { flex: 1 },
  phase: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Regular' },
  illumination: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular', marginTop: 2 },
});
