import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Circle, Text as SvgText, Line, Path } from 'react-native-svg';
import { BirthChart } from '../lib/astrology';
import { Colors } from '../constants/theme';

const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const ZODIAC_COLORS = ['#EF4444','#10B981','#F59E0B','#60A5FA','#F59E0B','#10B981','#EC4899','#7C3AED','#F97316','#6B7280','#3B82F6','#8B5CF6'];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface Props { chart: BirthChart; size?: number; }

export default function ZodiacWheel({ chart, size = 300 }: Props) {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 8;
  const zodiacR = outerR - 16;
  const houseR = zodiacR - 36;
  const innerR = houseR - 8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Outer ring */}
        <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={Colors.border} strokeWidth={2} />
        <Circle cx={cx} cy={cy} r={zodiacR} fill="none" stroke={Colors.border} strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={houseR} fill="none" stroke={Colors.glassBorder} strokeWidth={1} strokeDasharray="4 4" />
        <Circle cx={cx} cy={cy} r={innerR} fill={Colors.surface} />

        {/* Zodiac segments */}
        {ZODIAC_SYMBOLS.map((symbol, i) => {
          const angle = i * 30;
          const mid = angle + 15;
          const pos = polarToXY(cx, cy, (zodiacR + outerR) / 2, mid);
          const lineStart = polarToXY(cx, cy, zodiacR, angle);
          const lineEnd = polarToXY(cx, cy, outerR, angle);
          return (
            <G key={i}>
              <Line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y}
                stroke={Colors.border} strokeWidth={1} />
              <SvgText x={pos.x} y={pos.y} textAnchor="middle" dy="0.35em"
                fontSize={11} fill={ZODIAC_COLORS[i]} fontWeight="600">
                {symbol}
              </SvgText>
            </G>
          );
        })}

        {/* House numbers */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * 30 + 15;
          const pos = polarToXY(cx, cy, (houseR + zodiacR) / 2 - 2, angle);
          return (
            <SvgText key={i} x={pos.x} y={pos.y} textAnchor="middle" dy="0.35em"
              fontSize={9} fill={Colors.textMuted}>
              {i + 1}
            </SvgText>
          );
        })}

        {/* Planets */}
        {chart.planets.slice(0, 7).map((planet, i) => {
          const signIndex = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(planet.sign);
          const angle = signIndex * 30 + planet.degree * (30 / 30) + (i % 3) * 5;
          const r = innerR - 14 - (i % 2) * 16;
          const pos = polarToXY(cx, cy, r, angle);
          return (
            <G key={planet.planet}>
              <Circle cx={pos.x} cy={pos.y} r={10} fill={Colors.surface} stroke={Colors.primary} strokeWidth={1} />
              <SvgText x={pos.x} y={pos.y} textAnchor="middle" dy="0.35em"
                fontSize={9} fill={Colors.primaryGlow}>
                {planet.symbol}
              </SvgText>
            </G>
          );
        })}

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={4} fill={Colors.primary} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
});
