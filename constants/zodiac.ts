export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';
export type ZodiacModality = 'cardinal' | 'fixed' | 'mutable';

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export interface ZodiacSignData {
  name: string;
  symbol: string;
  emoji: string;
  element: ZodiacElement;
  modality: ZodiacModality;
  rulingPlanet: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  compatibleSigns: string[];
  description: string;
  color: string;
  gemstone: string;
  flower: string;
  bodyPart: string;
  luckyNumbers: number[];
  luckyDays: string[];
}

export const ZODIAC_SIGNS: ZodiacSignData[] = [
  {
    name: 'Aries',
    symbol: '♈',
    emoji: '🐏',
    element: 'fire',
    modality: 'cardinal',
    rulingPlanet: 'Mars',
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    traits: ['Bold', 'Ambitious', 'Passionate', 'Courageous', 'Confident'],
    strengths: ['Leadership', 'Determination', 'Confidence', 'Enthusiasm'],
    weaknesses: ['Impatience', 'Aggression', 'Impulsiveness', 'Short temper'],
    compatibleSigns: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    description: 'Aries is the first sign of the zodiac, representing new beginnings, raw energy, and the pioneer spirit. Born leaders with an unstoppable drive.',
    color: '#EF4444',
    gemstone: 'Diamond',
    flower: 'Thistle',
    bodyPart: 'Head',
    luckyNumbers: [1, 8, 17],
    luckyDays: ['Tuesday'],
  },
  {
    name: 'Taurus',
    symbol: '♉',
    emoji: '🐂',
    element: 'earth',
    modality: 'fixed',
    rulingPlanet: 'Venus',
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    traits: ['Reliable', 'Patient', 'Practical', 'Devoted', 'Sensual'],
    strengths: ['Reliability', 'Patience', 'Practicality', 'Stability'],
    weaknesses: ['Stubbornness', 'Possessiveness', 'Materialism', 'Resistance to change'],
    compatibleSigns: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    description: 'Taurus is the most sensual sign of the zodiac, appreciating beauty, comfort, and the finer things in life. A fixed earth sign of remarkable endurance.',
    color: '#10B981',
    gemstone: 'Emerald',
    flower: 'Lily',
    bodyPart: 'Neck and Throat',
    luckyNumbers: [2, 6, 9, 12],
    luckyDays: ['Friday', 'Monday'],
  },
  {
    name: 'Gemini',
    symbol: '♊',
    emoji: '👯',
    element: 'air',
    modality: 'mutable',
    rulingPlanet: 'Mercury',
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
    traits: ['Curious', 'Adaptable', 'Witty', 'Communicative', 'Versatile'],
    strengths: ['Communication', 'Intelligence', 'Adaptability', 'Quick thinking'],
    weaknesses: ['Indecisiveness', 'Inconsistency', 'Superficiality', 'Nervousness'],
    compatibleSigns: ['Libra', 'Aquarius', 'Aries', 'Leo'],
    description: 'Gemini is the celestial twin, representing duality, adaptability, and the gift of communication. Quick minds that can navigate any social situation.',
    color: '#F59E0B',
    gemstone: 'Agate',
    flower: 'Lavender',
    bodyPart: 'Arms and Lungs',
    luckyNumbers: [5, 7, 14, 23],
    luckyDays: ['Wednesday'],
  },
  {
    name: 'Cancer',
    symbol: '♋',
    emoji: '🦀',
    element: 'water',
    modality: 'cardinal',
    rulingPlanet: 'Moon',
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
    traits: ['Nurturing', 'Intuitive', 'Emotional', 'Protective', 'Empathetic'],
    strengths: ['Loyalty', 'Empathy', 'Intuition', 'Tenacity'],
    weaknesses: ['Moodiness', 'Clinginess', 'Pessimism', 'Manipulation'],
    compatibleSigns: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    description: 'Cancer is ruled by the moon, representing home, family, and deep emotional bonds. The most nurturing sign, they create lasting emotional connections.',
    color: '#60A5FA',
    gemstone: 'Pearl',
    flower: 'White Rose',
    bodyPart: 'Chest and Stomach',
    luckyNumbers: [2, 3, 15, 20],
    luckyDays: ['Monday', 'Thursday'],
  },
  {
    name: 'Leo',
    symbol: '♌',
    emoji: '🦁',
    element: 'fire',
    modality: 'fixed',
    rulingPlanet: 'Sun',
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    traits: ['Charismatic', 'Generous', 'Creative', 'Confident', 'Dramatic'],
    strengths: ['Leadership', 'Generosity', 'Creativity', 'Warmth'],
    weaknesses: ['Arrogance', 'Stubbornness', 'Self-centeredness', 'Inflexibility'],
    compatibleSigns: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    description: 'Leo is ruled by the Sun, representing royalty, creativity, and radiant self-expression. Natural born performers who light up every room they enter.',
    color: '#F59E0B',
    gemstone: 'Ruby',
    flower: 'Sunflower',
    bodyPart: 'Heart and Spine',
    luckyNumbers: [1, 3, 10, 19],
    luckyDays: ['Sunday', 'Monday'],
  },
  {
    name: 'Virgo',
    symbol: '♍',
    emoji: '👧',
    element: 'earth',
    modality: 'mutable',
    rulingPlanet: 'Mercury',
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    traits: ['Analytical', 'Practical', 'Meticulous', 'Helpful', 'Reliable'],
    strengths: ['Analysis', 'Practicality', 'Loyalty', 'Attention to detail'],
    weaknesses: ['Perfectionism', 'Critical nature', 'Overthinking', 'Worry'],
    compatibleSigns: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
    description: 'Virgo is the celestial healer, representing precision, service, and the pursuit of perfection. Analytical minds with a deep desire to be of use to others.',
    color: '#10B981',
    gemstone: 'Carnelian',
    flower: 'Chrysanthemum',
    bodyPart: 'Digestive System',
    luckyNumbers: [5, 14, 15, 23],
    luckyDays: ['Wednesday', 'Friday'],
  },
  {
    name: 'Libra',
    symbol: '♎',
    emoji: '⚖️',
    element: 'air',
    modality: 'cardinal',
    rulingPlanet: 'Venus',
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    traits: ['Diplomatic', 'Fair-minded', 'Gracious', 'Social', 'Aesthetic'],
    strengths: ['Diplomacy', 'Balance', 'Social grace', 'Idealism'],
    weaknesses: ['Indecisiveness', 'People-pleasing', 'Avoidance of conflict', 'Superficiality'],
    compatibleSigns: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    description: 'Libra is ruled by Venus, representing beauty, balance, and justice. Masters of diplomacy who seek harmony in all aspects of life.',
    color: '#EC4899',
    gemstone: 'Opal',
    flower: 'Rose',
    bodyPart: 'Kidneys and Lower Back',
    luckyNumbers: [4, 6, 13, 15],
    luckyDays: ['Friday', 'Saturday'],
  },
  {
    name: 'Scorpio',
    symbol: '♏',
    emoji: '🦂',
    element: 'water',
    modality: 'fixed',
    rulingPlanet: 'Pluto',
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    traits: ['Intense', 'Perceptive', 'Passionate', 'Resourceful', 'Mysterious'],
    strengths: ['Determination', 'Perception', 'Passion', 'Resourcefulness'],
    weaknesses: ['Jealousy', 'Possessiveness', 'Vengefulness', 'Secrecy'],
    compatibleSigns: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    description: 'Scorpio is the most intense and transformative sign, ruled by Pluto and Mars. They dive deep into the mysteries of existence and emerge reborn.',
    color: '#8B5CF6',
    gemstone: 'Topaz',
    flower: 'Dark Red Rose',
    bodyPart: 'Reproductive Organs',
    luckyNumbers: [8, 11, 18, 22],
    luckyDays: ['Tuesday', 'Thursday'],
  },
  {
    name: 'Sagittarius',
    symbol: '♐',
    emoji: '🏹',
    element: 'fire',
    modality: 'mutable',
    rulingPlanet: 'Jupiter',
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    traits: ['Adventurous', 'Optimistic', 'Philosophical', 'Honest', 'Freedom-loving'],
    strengths: ['Optimism', 'Honesty', 'Enthusiasm', 'Philosophy'],
    weaknesses: ['Tactlessness', 'Overconfidence', 'Restlessness', 'Carelessness'],
    compatibleSigns: ['Aries', 'Leo', 'Libra', 'Aquarius'],
    description: 'Sagittarius is the eternal seeker, ruled by Jupiter. The archer of the zodiac, always aiming toward the horizon in search of truth and adventure.',
    color: '#F59E0B',
    gemstone: 'Turquoise',
    flower: 'Carnation',
    bodyPart: 'Hips and Thighs',
    luckyNumbers: [3, 7, 9, 21],
    luckyDays: ['Thursday', 'Sunday'],
  },
  {
    name: 'Capricorn',
    symbol: '♑',
    emoji: '🐐',
    element: 'earth',
    modality: 'cardinal',
    rulingPlanet: 'Saturn',
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    traits: ['Ambitious', 'Disciplined', 'Persistent', 'Practical', 'Responsible'],
    strengths: ['Ambition', 'Discipline', 'Resourcefulness', 'Patience'],
    weaknesses: ['Pessimism', 'Rigidity', 'Coldness', 'Condescension'],
    compatibleSigns: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    description: 'Capricorn is ruled by Saturn, the planet of karma and time. The mountain goat that steadily climbs toward its goals, mastering both worldly and spiritual realms.',
    color: '#6B7280',
    gemstone: 'Garnet',
    flower: 'Pansy',
    bodyPart: 'Knees and Skeletal System',
    luckyNumbers: [4, 8, 13, 22],
    luckyDays: ['Saturday', 'Tuesday'],
  },
  {
    name: 'Aquarius',
    symbol: '♒',
    emoji: '🏺',
    element: 'air',
    modality: 'fixed',
    rulingPlanet: 'Uranus',
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    traits: ['Independent', 'Progressive', 'Humanitarian', 'Unconventional', 'Intellectual'],
    strengths: ['Innovation', 'Humanitarianism', 'Intelligence', 'Independence'],
    weaknesses: ['Detachment', 'Unpredictability', 'Extremism', 'Aloofness'],
    compatibleSigns: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    description: 'Aquarius is the visionary of the zodiac, ruled by Uranus. The water-bearer pours wisdom upon humanity, championing freedom, equality, and progress.',
    color: '#3B82F6',
    gemstone: 'Amethyst',
    flower: 'Orchid',
    bodyPart: 'Ankles and Circulatory System',
    luckyNumbers: [4, 7, 11, 22],
    luckyDays: ['Saturday', 'Sunday'],
  },
  {
    name: 'Pisces',
    symbol: '♓',
    emoji: '🐟',
    element: 'water',
    modality: 'mutable',
    rulingPlanet: 'Neptune',
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    traits: ['Compassionate', 'Artistic', 'Intuitive', 'Gentle', 'Spiritual'],
    strengths: ['Empathy', 'Creativity', 'Intuition', 'Wisdom'],
    weaknesses: ['Escapism', 'Idealism', 'Over-sensitivity', 'Lack of boundaries'],
    compatibleSigns: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
    description: 'Pisces is ruled by Neptune, the planet of dreams and illusions. The final sign of the zodiac, Pisces has absorbed all the lessons of the other signs.',
    color: '#8B5CF6',
    gemstone: 'Aquamarine',
    flower: 'Water Lily',
    bodyPart: 'Feet and Immune System',
    luckyNumbers: [3, 9, 12, 15],
    luckyDays: ['Thursday', 'Monday'],
  },
];

export const ZODIAC_SIGN_NAMES = ZODIAC_SIGNS.map(s => s.name);

export function getZodiacByName(name: string): ZodiacSignData | undefined {
  return ZODIAC_SIGNS.find(s => s.name.toLowerCase() === name.toLowerCase());
}

// Used by lib/astrology.ts
export function getZodiacSign(month: number, day: number): ZodiacSign {
  for (const sign of ZODIAC_SIGNS) {
    if (
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    ) {
      return sign.name as ZodiacSign;
    }
  }
  // Capricorn wraps Dec 22 - Jan 19
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  return 'Aries';
}

export function getCompatibilityScore(sign1: string, sign2: string): number {
  const s1 = getZodiacByName(sign1);
  const s2 = getZodiacByName(sign2);
  if (!s1 || !s2) return 50;
  if (s1.compatibleSigns.includes(sign2)) return Math.floor(Math.random() * 20) + 75;
  if (s1.element === s2.element) return Math.floor(Math.random() * 20) + 65;
  if (
    (s1.element === 'fire' && s2.element === 'air') ||
    (s1.element === 'air' && s2.element === 'fire') ||
    (s1.element === 'earth' && s2.element === 'water') ||
    (s1.element === 'water' && s2.element === 'earth')
  ) {
    return Math.floor(Math.random() * 15) + 60;
  }
  return Math.floor(Math.random() * 20) + 45;
}

// Alias used by hooks/useAstrology.ts
export function getZodiacInfo(sign: ZodiacSign): ZodiacSignData | undefined {
  return getZodiacByName(sign);
}

// Compatibility matrix used by compatibility screen
// Values represent compatibility percentage (deterministic, seeded by sign names)
function seedScore(s1: string, s2: string): number {
  const s1Data = getZodiacByName(s1);
  const s2Data = getZodiacByName(s2);
  if (!s1Data || !s2Data) return 55;
  if (s1 === s2) return 72;
  if (s1Data.compatibleSigns.includes(s2)) return 82 + (s1Data.name.length % 10);
  if (s1Data.element === s2Data.element) return 70 + (s2Data.name.length % 8);
  const complementary =
    (s1Data.element === 'fire' && s2Data.element === 'air') ||
    (s1Data.element === 'air' && s2Data.element === 'fire') ||
    (s1Data.element === 'earth' && s2Data.element === 'water') ||
    (s1Data.element === 'water' && s2Data.element === 'earth');
  if (complementary) return 62 + (s1Data.name.length % 12);
  return 44 + ((s1Data.name.length + s2Data.name.length) % 14);
}

type ZodiacMatrix = Record<ZodiacSign, Record<ZodiacSign, number>>;

export const COMPATIBILITY_MATRIX: ZodiacMatrix = (() => {
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  const matrix = {} as ZodiacMatrix;
  for (const s1 of signs) {
    matrix[s1] = {} as Record<ZodiacSign, number>;
    for (const s2 of signs) {
      matrix[s1][s2] = seedScore(s1, s2);
    }
  }
  return matrix;
})();
