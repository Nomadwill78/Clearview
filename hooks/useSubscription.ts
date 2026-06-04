import { useSubscriptionStore } from '../store/subscriptionStore';

export function useSubscription() {
  return useSubscriptionStore();
}

export function usePremiumFeature(feature: 'horoscope' | 'birthchart' | 'compatibility' | 'numerology' | 'tarot' | 'advisor') {
  const { isPremium, isCosmic } = useSubscriptionStore();
  const advisorRequiresCosmic = feature === 'advisor';
  const isLocked = advisorRequiresCosmic ? !isCosmic : !isPremium;
  return { isLocked, isPremium, isCosmic };
}
