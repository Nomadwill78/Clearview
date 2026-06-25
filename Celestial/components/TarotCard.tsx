import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontSizes, BorderRadius, Fonts, Shadows } from '../constants/theme';
import { TarotCard as TarotCardType } from '../constants/tarot';

interface Props {
  card: TarotCardType;
  isRevealed?: boolean;
  onFlip?: () => void;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export default function TarotCard({
  card,
  isRevealed = false,
  onFlip,
  width = 160,
  height = 260,
  style,
}: Props) {
  const flipAnim = useSharedValue(isRevealed ? 1 : 0);

  useEffect(() => {
    flipAnim.value = withTiming(isRevealed ? 1 : 0, { duration: 600 });
  }, [isRevealed]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value > 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value < 0.5 ? 1 : 0,
    };
  });

  const handlePress = () => {
    if (onFlip) {
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      }
      onFlip();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={onFlip ? 0.9 : 1}
      style={[{ width, height }, style]}
    >
      {/* Back of card */}
      <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
        <LinearGradient
          colors={['#2D1F5E', '#1E1542', '#130D2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardFace, { width, height, borderRadius: BorderRadius.lg }]}
        >
          <View style={styles.backPattern}>
            <Text style={styles.backStar}>✦</Text>
            <Text style={styles.backCircle}>◯</Text>
            <Text style={styles.backStar}>✦</Text>
          </View>
          <Text style={styles.backTitle}>Celestial</Text>
          <Text style={styles.backSubtitle}>Tap to reveal</Text>
        </LinearGradient>
      </Animated.View>

      {/* Front of card */}
      <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
        <LinearGradient
          colors={['#1E1542', '#130D2B', '#0A0514']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.cardFace, { width, height, borderRadius: BorderRadius.lg }]}
        >
          {/* Card header border */}
          <View style={styles.cardBorder} />

          {/* Arcana number */}
          <Text style={styles.arcanaNumber}>{card.symbol}</Text>

          {/* Card symbol/art */}
          <View style={styles.artContainer}>
            <LinearGradient
              colors={['rgba(139,92,246,0.3)', 'rgba(245,158,11,0.2)']}
              style={styles.artCircle}
            >
              <Text style={styles.artSymbol}>{card.symbol}</Text>
            </LinearGradient>
          </View>

          {/* Card name */}
          <View style={styles.nameContainer}>
            <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
          </View>

          {/* Keywords */}
          <View style={styles.keywords}>
            {card.keywords.slice(0, 2).map(kw => (
              <Text key={kw} style={styles.keyword}>{kw}</Text>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardFace: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    padding: 12,
    ...Shadows.glow,
  },
  // Back
  backPattern: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backStar: {
    fontSize: 24,
    color: Colors.accentGlow,
    opacity: 0.6,
  },
  backCircle: {
    fontSize: 40,
    color: Colors.primaryGlow,
    opacity: 0.4,
  },
  backTitle: {
    fontFamily: Fonts.headingItalic,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 4,
  },
  backSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  // Front
  cardBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.base,
  },
  arcanaNumber: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.sm,
    color: Colors.accent,
    letterSpacing: 2,
    alignSelf: 'flex-start',
  },
  artContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  artSymbol: {
    fontSize: FontSizes['3xl'],
    color: Colors.accentGlow,
  },
  nameContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.glassBorder,
  },
  cardName: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.sm,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  keywords: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  keyword: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
