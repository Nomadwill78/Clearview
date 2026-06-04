export interface Planet {
  name: string;
  symbol: string;
  glyph: string;
  color: string;
  rulesSign: string[];
  exaltedIn: string;
  detrimentIn: string[];
  fallIn: string;
  orbitalPeriod: number; // days
  meaning: string;
  keywords: string[];
}

export const PLANETS: Planet[] = [
  {
    name: 'Sun',
    symbol: '☉',
    glyph: '☉',
    color: '#F59E0B',
    rulesSign: ['Leo'],
    exaltedIn: 'Aries',
    detrimentIn: ['Aquarius'],
    fallIn: 'Libra',
    orbitalPeriod: 365.25,
    meaning: 'Core identity, ego, vitality, and conscious self-expression',
    keywords: ['Identity', 'Ego', 'Vitality', 'Purpose', 'Consciousness'],
  },
  {
    name: 'Moon',
    symbol: '☽',
    glyph: '☽',
    color: '#F0E6FF',
    rulesSign: ['Cancer'],
    exaltedIn: 'Taurus',
    detrimentIn: ['Capricorn'],
    fallIn: 'Scorpio',
    orbitalPeriod: 27.3,
    meaning: 'Emotions, instincts, subconscious, and the inner world',
    keywords: ['Emotions', 'Instinct', 'Subconscious', 'Mother', 'Habit'],
  },
  {
    name: 'Mercury',
    symbol: '☿',
    glyph: '☿',
    color: '#9CA3AF',
    rulesSign: ['Gemini', 'Virgo'],
    exaltedIn: 'Virgo',
    detrimentIn: ['Sagittarius', 'Pisces'],
    fallIn: 'Pisces',
    orbitalPeriod: 88,
    meaning: 'Communication, intellect, travel, and the analytical mind',
    keywords: ['Communication', 'Intellect', 'Travel', 'Adaptability', 'Logic'],
  },
  {
    name: 'Venus',
    symbol: '♀',
    glyph: '♀',
    color: '#EC4899',
    rulesSign: ['Taurus', 'Libra'],
    exaltedIn: 'Pisces',
    detrimentIn: ['Aries', 'Scorpio'],
    fallIn: 'Virgo',
    orbitalPeriod: 224.7,
    meaning: 'Love, beauty, relationships, pleasure, and aesthetic values',
    keywords: ['Love', 'Beauty', 'Harmony', 'Pleasure', 'Values'],
  },
  {
    name: 'Mars',
    symbol: '♂',
    glyph: '♂',
    color: '#EF4444',
    rulesSign: ['Aries', 'Scorpio'],
    exaltedIn: 'Capricorn',
    detrimentIn: ['Libra', 'Taurus'],
    fallIn: 'Cancer',
    orbitalPeriod: 686.9,
    meaning: 'Drive, ambition, passion, aggression, and physical energy',
    keywords: ['Drive', 'Ambition', 'Passion', 'Action', 'Desire'],
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    glyph: '♃',
    color: '#F59E0B',
    rulesSign: ['Sagittarius', 'Pisces'],
    exaltedIn: 'Cancer',
    detrimentIn: ['Gemini', 'Virgo'],
    fallIn: 'Capricorn',
    orbitalPeriod: 4332.6,
    meaning: 'Expansion, abundance, wisdom, philosophy, and good fortune',
    keywords: ['Expansion', 'Abundance', 'Wisdom', 'Luck', 'Philosophy'],
  },
  {
    name: 'Saturn',
    symbol: '♄',
    glyph: '♄',
    color: '#8B5CF6',
    rulesSign: ['Capricorn', 'Aquarius'],
    exaltedIn: 'Libra',
    detrimentIn: ['Cancer', 'Leo'],
    fallIn: 'Aries',
    orbitalPeriod: 10759.2,
    meaning: 'Discipline, responsibility, karma, limits, and life lessons',
    keywords: ['Discipline', 'Responsibility', 'Karma', 'Structure', 'Time'],
  },
  {
    name: 'Uranus',
    symbol: '♅',
    glyph: '♅',
    color: '#60A5FA',
    rulesSign: ['Aquarius'],
    exaltedIn: 'Scorpio',
    detrimentIn: ['Leo'],
    fallIn: 'Taurus',
    orbitalPeriod: 30688.5,
    meaning: 'Revolution, innovation, sudden change, and liberation',
    keywords: ['Revolution', 'Innovation', 'Change', 'Freedom', 'Rebellion'],
  },
  {
    name: 'Neptune',
    symbol: '♆',
    glyph: '♆',
    color: '#3B82F6',
    rulesSign: ['Pisces'],
    exaltedIn: 'Leo',
    detrimentIn: ['Virgo'],
    fallIn: 'Aquarius',
    orbitalPeriod: 60182,
    meaning: 'Dreams, illusions, spirituality, mysticism, and transcendence',
    keywords: ['Dreams', 'Illusion', 'Spirituality', 'Mysticism', 'Compassion'],
  },
  {
    name: 'Pluto',
    symbol: '♇',
    glyph: '♇',
    color: '#7C3AED',
    rulesSign: ['Scorpio'],
    exaltedIn: 'Aries',
    detrimentIn: ['Taurus'],
    fallIn: 'Libra',
    orbitalPeriod: 90560,
    meaning: 'Transformation, power, death and rebirth, and the shadow self',
    keywords: ['Transformation', 'Power', 'Rebirth', 'Shadow', 'Intensity'],
  },
];

export interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
}

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

export function getPlanetByName(name: string): Planet | undefined {
  return PLANETS.find(p => p.name.toLowerCase() === name.toLowerCase());
}
