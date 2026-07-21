import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useProfileStore } from './profileStore';
import { useSubscriptionStore } from './subscriptionStore';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
    // Clear per-user state so the next account never sees the previous user's
    // profile or premium entitlements.
    useProfileStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
}));
