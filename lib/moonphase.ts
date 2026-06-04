export type MoonPhaseName =
  | 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
  | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';

export interface MoonPhaseInfo {
  phase: MoonPhaseName;
  illumination: number;
  emoji: string;
  description: string;
  energy: string;
  affirmation: string;
  daysSinceNew: number;
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  // Synodic period of the moon in days
  const SYNODIC = 29.53058867;
  const knownNew = new Date('2000-01-06T18:14:00Z');
  const diff = (date.getTime() - knownNew.getTime()) / 86400000;
  const cycles = diff / SYNODIC;
  const daysSinceNew = (cycles % 1) * SYNODIC;
  const normalized = ((cycles % 1) + 1) % 1;
  const illumination = Math.round(Math.abs(Math.cos(normalized * 2 * Math.PI - Math.PI)) * 100);

  let phase: MoonPhaseName;
  let emoji: string;
  let description: string;
  let energy: string;
  let affirmation: string;

  if (normalized < 0.033 || normalized >= 0.967) {
    phase = 'New Moon'; emoji = '🌑';
    description = 'A portal of new beginnings. The sky is dark with infinite potential.';
    energy = 'Planting seeds, setting intentions, beginning fresh cycles.';
    affirmation = 'I release the old and open my heart to infinite new possibilities.';
  } else if (normalized < 0.25) {
    phase = 'Waxing Crescent'; emoji = '🌒';
    description = 'A sliver of light grows. Your intentions are taking their first tender steps.';
    energy = 'Taking action on new intentions, building momentum, gathering resources.';
    affirmation = 'I take inspired action toward my dreams with faith and courage.';
  } else if (normalized < 0.283) {
    phase = 'First Quarter'; emoji = '🌓';
    description = 'Half the face is illuminated. Challenges arise to test the strength of your vision.';
    energy = 'Overcoming obstacles, making decisions, pushing through resistance.';
    affirmation = 'I move through challenges with strength and unwavering focus.';
  } else if (normalized < 0.5) {
    phase = 'Waxing Gibbous'; emoji = '🌔';
    description = 'Almost full. Your manifestations are near — refine, adjust, and trust.';
    energy = 'Refinement, gratitude, adjusting course, building anticipation.';
    affirmation = 'I trust the timing of my unfolding and refine my path with wisdom.';
  } else if (normalized < 0.533) {
    phase = 'Full Moon'; emoji = '🌕';
    description = 'The moon blazes in her full glory. Emotions are heightened, truths illuminated.';
    energy = 'Culmination, celebration, revelation, release, heightened intuition.';
    affirmation = 'I stand in the full light of my truth and release what no longer serves me.';
  } else if (normalized < 0.75) {
    phase = 'Waning Gibbous'; emoji = '🌖';
    description = 'The light retreats gracefully. Share your wisdom and express gratitude.';
    energy = 'Sharing, gratitude, teaching, distributing your harvest.';
    affirmation = 'I share my gifts generously and offer thanks for all that I have received.';
  } else if (normalized < 0.783) {
    phase = 'Last Quarter'; emoji = '🌗';
    description = 'Half in shadow. Release, forgive, and prepare for rebirth.';
    energy = 'Release, forgiveness, letting go, clearing space for the new.';
    affirmation = 'I release with love all that has served its purpose in my journey.';
  } else {
    phase = 'Waning Crescent'; emoji = '🌘';
    description = 'A quiet surrender. Rest, reflect, and allow the cosmic reset.';
    energy = 'Rest, reflection, surrendering to the unknown, spiritual renewal.';
    affirmation = 'I rest in the wisdom of surrender and trust in the divine cycle.';
  }

  return { phase, illumination, emoji, description, energy, affirmation, daysSinceNew: Math.round(daysSinceNew * 10) / 10 };
}
