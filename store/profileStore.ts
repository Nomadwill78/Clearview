import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ZodiacSign } from '../constants/zodiac';

export interface UserProfile {
  id: string;
  name: string;
  birthDate: string;
  birthTime?: string;
  birthLocation?: string;
  sunSign: ZodiacSign;
  moonSign?: ZodiacSign;
  risingSign?: ZodiacSign;
  avatarUrl?: string;
  notificationDaily: boolean;
  notificationMoon: boolean;
  notificationHour: number;
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  hydrated: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  hydrated: false,
  setProfile: (profile) => set({ profile }),
  reset: () => set({ profile: null, loading: false, hydrated: false }),
  fetchProfile: async (userId: string) => {
    set({ loading: true });
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        set({
          profile: {
            id: data.id,
            name: data.name ?? '',
            birthDate: data.birth_date ?? '',
            birthTime: data.birth_time ?? undefined,
            birthLocation: data.birth_location ?? undefined,
            sunSign: (data.sun_sign ?? 'Aries') as ZodiacSign,
            moonSign: data.moon_sign as ZodiacSign | undefined,
            risingSign: data.rising_sign as ZodiacSign | undefined,
            avatarUrl: data.avatar_url ?? undefined,
            notificationDaily: data.notification_daily ?? true,
            notificationMoon: data.notification_moon ?? true,
            notificationHour: data.notification_hour ?? 8,
          },
        });
      }
    } finally {
      // hydrated marks that the first profile load has settled (success or not),
      // so routing can safely decide onboarding-vs-tabs without flashing.
      set({ loading: false, hydrated: true });
    }
  },
  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
    if (updates.birthTime !== undefined) dbUpdates.birth_time = updates.birthTime;
    if (updates.birthLocation !== undefined) dbUpdates.birth_location = updates.birthLocation;
    if (updates.sunSign !== undefined) dbUpdates.sun_sign = updates.sunSign;
    if (updates.moonSign !== undefined) dbUpdates.moon_sign = updates.moonSign;
    if (updates.risingSign !== undefined) dbUpdates.rising_sign = updates.risingSign;
    if (updates.notificationDaily !== undefined) dbUpdates.notification_daily = updates.notificationDaily;
    if (updates.notificationMoon !== undefined) dbUpdates.notification_moon = updates.notificationMoon;
    if (updates.notificationHour !== undefined) dbUpdates.notification_hour = updates.notificationHour;
    await supabase.from('profiles').update(dbUpdates).eq('id', profile.id);
    set({ profile: { ...profile, ...updates } });
  },
}));
