import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PlanId } from '../lib/stripe';

interface SubscriptionState {
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  isPremium: boolean;
  isCosmic: boolean;
  fetchSubscription: (userId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'free',
  status: null,
  currentPeriodEnd: null,
  loading: false,
  isPremium: false,
  isCosmic: false,
  fetchSubscription: async (userId: string) => {
    set({ loading: true });
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data && data.status === 'active') {
        set({
          plan: data.plan as PlanId,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
          isPremium: data.plan === 'starseed' || data.plan === 'cosmic',
          isCosmic: data.plan === 'cosmic',
        });
      } else {
        set({ plan: 'free', status: null, isPremium: false, isCosmic: false });
      }
    } catch {
      set({ plan: 'free', status: null, isPremium: false, isCosmic: false });
    } finally {
      set({ loading: false });
    }
  },
}));
