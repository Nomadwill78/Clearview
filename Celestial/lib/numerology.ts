export interface NumerologyProfile {
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthdayNumber: number;
}

function reduceNumber(n: number, allowMaster = true): number {
  if (allowMaster && (n === 11 || n === 22 || n === 33)) return n;
  if (n < 10) return n;
  const sum = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  return reduceNumber(sum, allowMaster);
}

function letterValue(c: string): number {
  const val = c.toLowerCase().charCodeAt(0) - 96;
  return val > 0 && val <= 26 ? val : 0;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export function calculateLifePath(birthDateStr: string): number {
  const digits = birthDateStr.replace(/\D/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceNumber(sum);
}

export function calculateDestiny(fullName: string): number {
  const sum = fullName.toLowerCase().split('').reduce((a, c) => a + letterValue(c), 0);
  return reduceNumber(sum);
}

export function calculateSoulUrge(fullName: string): number {
  const sum = fullName.toLowerCase().split('').reduce((a, c) => VOWELS.has(c) ? a + letterValue(c) : a, 0);
  return reduceNumber(sum);
}

export function calculatePersonality(fullName: string): number {
  const sum = fullName.toLowerCase().split('').reduce((a, c) => !VOWELS.has(c) && letterValue(c) > 0 ? a + letterValue(c) : a, 0);
  return reduceNumber(sum);
}

export function calculateBirthday(birthDateStr: string): number {
  const date = new Date(birthDateStr);
  return reduceNumber(date.getDate());
}

export function getNumerologyProfile(birthDateStr: string, fullName: string): NumerologyProfile {
  return {
    lifePathNumber: calculateLifePath(birthDateStr),
    destinyNumber: calculateDestiny(fullName),
    soulUrgeNumber: calculateSoulUrge(fullName),
    personalityNumber: calculatePersonality(fullName),
    birthdayNumber: calculateBirthday(birthDateStr),
  };
}

export const LIFE_PATH_MEANINGS: Record<number, { title: string; description: string; strengths: string[]; challenges: string[] }> = {
  1: { title: 'The Leader', description: 'You are a born pioneer, blazing trails where others fear to tread. Your independence and determination are your greatest gifts.', strengths: ['Leadership', 'Innovation', 'Independence', 'Drive'], challenges: ['Stubbornness', 'Ego', 'Impatience'] },
  2: { title: 'The Peacemaker', description: 'Your gift is harmony. You sense the feelings of others deeply and create bridges where walls once stood. Cooperation is your superpower.', strengths: ['Diplomacy', 'Empathy', 'Cooperation', 'Patience'], challenges: ['Indecision', 'Oversensitivity', 'People-pleasing'] },
  3: { title: 'The Creator', description: 'Joy, self-expression, and creativity flow through you like starlight. You inspire and uplift everyone around you with your vibrant energy.', strengths: ['Creativity', 'Communication', 'Optimism', 'Charisma'], challenges: ['Scattered energy', 'Superficiality', 'Over-sensitivity'] },
  4: { title: 'The Builder', description: 'You are the architect of enduring structures. Patient, practical, and deeply reliable, you build the foundations upon which others stand.', strengths: ['Discipline', 'Reliability', 'Practicality', 'Dedication'], challenges: ['Rigidity', 'Stubbornness', 'Resistance to change'] },
  5: { title: 'The Free Spirit', description: 'Freedom is your lifeblood. You thrive on adventure, change, and the rich tapestry of human experience. Your adaptability is legendary.', strengths: ['Adaptability', 'Curiosity', 'Freedom', 'Versatility'], challenges: ['Restlessness', 'Impulsiveness', 'Commitment issues'] },
  6: { title: 'The Nurturer', description: 'Love and responsibility are your highest calling. You pour yourself into caring for others and creating beautiful, harmonious environments.', strengths: ['Nurturing', 'Responsibility', 'Compassion', 'Harmony'], challenges: ['Perfectionism', 'Self-sacrifice', 'Controlling tendencies'] },
  7: { title: 'The Seeker', description: 'You are drawn to the mysteries of existence. Your analytical mind and profound intuition make you a natural philosopher and truth-seeker.', strengths: ['Analysis', 'Intuition', 'Wisdom', 'Introspection'], challenges: ['Isolation', 'Skepticism', 'Perfectionism'] },
  8: { title: 'The Powerhouse', description: 'Abundance, authority, and material mastery are your domain. You are destined to achieve great things through determination and strategic thinking.', strengths: ['Ambition', 'Leadership', 'Practicality', 'Determination'], challenges: ['Materialism', 'Workaholism', 'Control issues'] },
  9: { title: 'The Humanitarian', description: 'Your soul is ancient and wise. You feel the suffering of the world and are called to serve, heal, and inspire on a grand scale.', strengths: ['Compassion', 'Generosity', 'Wisdom', 'Creativity'], challenges: ['Martyrdom', 'Moodiness', 'Difficulty receiving'] },
  11: { title: 'The Visionary', description: 'You carry a master vibration — a heightened intuition and spiritual awareness that bridges the earthly and divine realms. Your insights can illuminate the world.', strengths: ['Spiritual insight', 'Inspiration', 'Empathy', 'Vision'], challenges: ['Anxiety', 'Self-doubt', 'Overwhelming sensitivity'] },
  22: { title: 'The Master Builder', description: 'The most powerful number. You have the vision of 11 and the practical mastery of 4 — the ability to turn grand spiritual visions into lasting physical reality.', strengths: ['Visionary', 'Practical mastery', 'Leadership', 'Manifestation'], challenges: ['Overwhelm', 'Perfectionism', 'High pressure self-expectations'] },
  33: { title: 'The Master Teacher', description: 'The rarest vibration. You are a channel of pure unconditional love and healing. Your life\'s work is to uplift humanity through compassion and wisdom.', strengths: ['Universal love', 'Healing', 'Teaching', 'Inspiration'], challenges: ['Self-sacrifice', 'Unrealistic idealism', 'Taking on too much'] },
};
