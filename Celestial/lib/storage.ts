import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'celestial_onboarding_complete',
  CACHED_HOROSCOPE: 'celestial_horoscope_cache',
  LAST_TAROT_DATE: 'celestial_last_tarot_date',
} as const;
