import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const { session, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
