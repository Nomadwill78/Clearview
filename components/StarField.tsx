import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, withDelay, Easing, cancelAnimation,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface Star { id: number; x: number; y: number; size: number; opacity: number; delay: number; }

function ShootingStar({ delay }: { delay: number }) {
  const x = useSharedValue(-100);
  const y = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startX = Math.random() * W * 0.5;
    const startY = Math.random() * H * 0.3;
    x.value = startX;
    y.value = startY;

    const run = () => {
      opacity.value = withSequence(
        withDelay(delay, withTiming(1, { duration: 200 })),
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 300 }),
      );
      x.value = withDelay(delay, withTiming(startX + 200, { duration: 1100, easing: Easing.linear }));
      y.value = withDelay(delay, withTiming(startY + 100, { duration: 1100, easing: Easing.linear }));
    };
    run();
    const interval = setInterval(() => {
      const newX = Math.random() * W * 0.5;
      const newY = Math.random() * H * 0.3;
      x.value = newX;
      y.value = newY;
      run();
    }, 10000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    width: 80,
    height: 1.5,
    backgroundColor: '#F8F4FF',
    opacity: opacity.value,
    transform: [{ rotate: '25deg' }],
    borderRadius: 1,
  }));

  return <Animated.View style={style} />;
}

function TwinklingStar({ star }: { star: Star }) {
  const opacity = useSharedValue(star.opacity * 0.3);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(star.opacity, { duration: 1500 + Math.random() * 2000 }),
          withTiming(star.opacity * 0.2, { duration: 1500 + Math.random() * 2000 }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[style, {
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: star.size > 2 ? '#E8E0FF' : '#F8F4FF',
      }]}
    />
  );
}

export default function StarField() {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() < 0.1 ? 3 : Math.random() < 0.3 ? 2 : 1,
      opacity: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 4000,
    })), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => <TwinklingStar key={s.id} star={s} />)}
      <ShootingStar delay={0} />
      <ShootingStar delay={5000} />
      <ShootingStar delay={12000} />
    </View>
  );
}
