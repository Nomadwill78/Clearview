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
  reset: () => void;
}

// A paid subscription counts as entitled while active OR trialing.
const ENTITLED_STATUSES = ['active', 'trialing'];

const FREE_STATE = { plan: 'free' as PlanId, status: null, currentPeriodEnd: null, isPremium: false, isCosmic: false };

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  ...FREE_STATE,
  loading: false,
  reset: () => set({ ...FREE_STATE, loading: false }),
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
      if (data && ENTITLED_STATUSES.includes(data.status)) {
        set({
          plan: data.plan as PlanId,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
          isPremium: data.plan === 'starseed' || data.plan === 'cosmic',
          isCosmic: data.plan === 'cosmic',
        });
      } else {
        set({ ...FREE_STATE });
      }
    } catch {
      set({ ...FREE_STATE });
    } finally {
      set({ loading: false });
    }
  },
}));
