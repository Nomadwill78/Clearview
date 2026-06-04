import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label?: string }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <View style={{ fontSize: 22 } as any}>
        {/* emoji rendered as text via tab bar label */}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/(auth)');
  }, [session, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryGlow,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => null, tabBarLabel: '🏠  Home' }} />
      <Tabs.Screen name="horoscope" options={{ title: 'Horoscope', tabBarLabel: '⭐ Horoscope' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', tabBarLabel: '🌙 Chart' }} />
      <Tabs.Screen name="compatibility" options={{ title: 'Love', tabBarLabel: '💕 Love' }} />
      <Tabs.Screen name="numerology" options={{ title: 'Numbers', tabBarLabel: '🔢 Numbers' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    elevation: 0,
    height: 64,
    paddingBottom: 8,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  tabIconActive: { backgroundColor: Colors.glassBackground, borderRadius: BorderRadius.md },
  tabLabel: { fontFamily: 'Inter-Medium', fontSize: 10, marginTop: -4 },
});
