import { useMemo } from 'react';
import { useProfileStore } from '../store/profileStore';
import { calculateBirthChart } from '../lib/astrology';
import { getZodiacInfo } from '../constants/zodiac';

export function useAstrology() {
  const { profile } = useProfileStore();

  const chart = useMemo(() => {
    if (!profile?.birthDate) return null;
    return calculateBirthChart(new Date(profile.birthDate), profile.birthTime);
  }, [profile?.birthDate, profile?.birthTime]);

  const sunSignInfo = useMemo(() => {
    if (!profile?.sunSign) return null;
    return getZodiacInfo(profile.sunSign);
  }, [profile?.sunSign]);

  return { chart, sunSignInfo, profile };
}
