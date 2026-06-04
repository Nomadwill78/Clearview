import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { getNumerologyProfile, NumerologyProfile } from '../lib/numerology';

export function useNumerology(): NumerologyProfile | null {
  const { profile } = useProfile();
  return useMemo(() => {
    if (!profile?.birthDate || !profile?.name) return null;
    return getNumerologyProfile(profile.birthDate, profile.name);
  }, [profile?.birthDate, profile?.name]);
}
