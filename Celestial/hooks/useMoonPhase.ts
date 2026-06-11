import { useMemo } from 'react';
import { getMoonPhase } from '../lib/moonphase';

export function useMoonPhase(date: Date = new Date()) {
  return useMemo(() => getMoonPhase(date), [date.toDateString()]);
}
