import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Colors, BorderRadius } from '../constants/theme';

interface Props { style?: ViewStyle; rows?: number; }

function ShimmerRow({ style }: { style?: ViewStyle }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })), -1, false);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.shimmer, animStyle, style]} />;
}

export default function ShimmerLoader({ style, rows = 3 }: Props) {
  return (
    <View style={style}>
      {Array.from({ length: rows }, (_, i) => (
        <ShimmerRow key={i} style={{ width: i === rows - 1 ? '60%' : '100%', marginBottom: 10 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: { height: 14, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceLight },
});
