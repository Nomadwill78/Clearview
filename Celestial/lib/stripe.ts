import { supabase } from './supabase';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: null,
    features: [
      'Daily horoscope preview',
      'Basic birth chart',
      'Life path number',
      'Moon phase tracker',
      'Community readings',
    ],
    locked: [
      'Full AI horoscope readings',
      'Complete birth chart interpretation',
      'Compatibility detailed analysis',
      'Numerology full profile',
      'Tarot & Oracle readings',
      'Ask Celeste AI advisor',
    ],
  },
  starseed: {
    id: 'starseed',
    name: 'Starseed',
    price: 9.99,
    period: 'month',
    stripePriceEnvKey: 'STRIPE_STARSEED_MONTHLY_PRICE_ID',
    features: [
      'Everything in Free',
      'Full AI horoscope readings',
      'Complete birth chart + interpretation',
      'Compatibility deep analysis',
      'Full numerology profile',
      'Daily Tarot & Oracle readings',
      'Chakra readings',
      'Save unlimited readings',
      'Priority support',
    ],
    locked: ['Ask Celeste AI advisor (unlimited)'],
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    price: 79.99,
    period: 'year',
    stripePriceEnvKey: 'STRIPE_COSMIC_YEARLY_PRICE_ID',
    badge: 'Best Value',
    features: [
      'Everything in Starseed',
      'Ask Celeste — unlimited AI psychic chat',
      'Personalized morning cosmic briefings',
      'Advanced birth chart aspects',
      'Partner compatibility deep dives',
      'Annual cosmic forecast',
      'Founding member badge',
      '2 months free vs monthly',
    ],
    locked: [],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function createCheckoutSession(planId: 'starseed' | 'cosmic'): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { planId },
    });
    if (error) throw error;
    return data.url;
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return null;
  }
}

export async function openBillingPortal(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-portal', {});
    if (error) throw error;
    return data.url;
  } catch {
    return null;
  }
}
