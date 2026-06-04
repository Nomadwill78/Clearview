import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string | null;
          birth_date: string | null;
          birth_time: string | null;
          birth_location: string | null;
          birth_lat: number | null;
          birth_lng: number | null;
          sun_sign: string | null;
          moon_sign: string | null;
          rising_sign: string | null;
          avatar_url: string | null;
          notification_daily: boolean;
          notification_moon: boolean;
          notification_hour: number;
          stripe_customer_id: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          plan: 'free' | 'starseed' | 'cosmic';
          status: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      saved_readings: {
        Row: {
          id: string;
          user_id: string;
          type: 'horoscope' | 'birth_chart' | 'compatibility' | 'numerology' | 'tarot' | 'advisor';
          title: string;
          content: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
  };
};
