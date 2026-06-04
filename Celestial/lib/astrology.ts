import { ZodiacSign, getZodiacSign } from '../constants/zodiac';

export interface BirthChart {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  planets: PlanetPosition[];
  houses: HousePosition[];
}

export interface PlanetPosition {
  planet: string;
  symbol: string;
  sign: ZodiacSign;
  degree: number;
  house: number;
  isRetrograde: boolean;
}

export interface HousePosition {
  house: number;
  sign: ZodiacSign;
  degree: number;
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

const ZODIAC_SIGNS_LIST: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function daysSinceJ2000(date: Date): number {
  const j2000 = new Date('2000-01-01T12:00:00Z');
  return (date.getTime() - j2000.getTime()) / 86400000;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function angleToSign(angle: number): { sign: ZodiacSign; degree: number } {
  const normalized = normalizeAngle(angle);
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized % 30;
  return { sign: ZODIAC_SIGNS_LIST[signIndex], degree };
}

function simplePlanetLongitude(planet: string, d: number): number {
  const orbitalElements: Record<string, { L: number; rate: number }> = {
    Sun:     { L: 280.460,  rate: 0.9856474 },
    Moon:    { L: 218.316,  rate: 13.176396 },
    Mercury: { L: 252.251,  rate: 4.092335 },
    Venus:   { L: 181.979,  rate: 1.602136 },
    Mars:    { L: 355.433,  rate: 0.524071 },
    Jupiter: { L: 34.396,   rate: 0.083056 },
    Saturn:  { L: 50.077,   rate: 0.033459 },
    Uranus:  { L: 314.055,  rate: 0.011722 },
    Neptune: { L: 304.348,  rate: 0.006010 },
    Pluto:   { L: 238.929,  rate: 0.003964 },
  };
  const el = orbitalElements[planet];
  if (!el) return 0;
  return normalizeAngle(el.L + el.rate * d);
}

export function calculateBirthChart(birthDate: Date, birthTime?: string, lat?: number): BirthChart {
  const d = daysSinceJ2000(birthDate);

  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  const planets: PlanetPosition[] = planetNames.map((planet, i) => {
    const longitude = simplePlanetLongitude(planet, d);
    const { sign, degree } = angleToSign(longitude);
    const house = ((Math.floor(longitude / 30) + (lat ? Math.floor(lat / 30) : 0)) % 12) + 1;
    return {
      planet,
      symbol: PLANET_SYMBOLS[planet] ?? '●',
      sign,
      degree: Math.round(degree * 10) / 10,
      house,
      isRetrograde: planet !== 'Sun' && planet !== 'Moon' && (Math.sin(d * 0.1 + i) > 0.7),
    };
  });

  const sunLong = simplePlanetLongitude('Sun', d);
  const moonLong = simplePlanetLongitude('Moon', d);
  const risingLong = normalizeAngle(sunLong + (lat ?? 0) * 0.5 + 90);

  const houses: HousePosition[] = Array.from({ length: 12 }, (_, i) => {
    const houseLong = normalizeAngle(risingLong + i * 30);
    const { sign, degree } = angleToSign(houseLong);
    return { house: i + 1, sign, degree: Math.round(degree) };
  });

  return {
    sunSign: angleToSign(sunLong).sign,
    moonSign: angleToSign(moonLong).sign,
    risingSign: angleToSign(risingLong).sign,
    planets,
    houses,
  };
}

export function getZodiacSignFromDate(dateStr: string): ZodiacSign {
  const date = new Date(dateStr);
  return getZodiacSign(date.getMonth() + 1, date.getDate());
}

export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    Fire: '#EF4444', Earth: '#10B981', Air: '#60A5FA', Water: '#8B5CF6',
  };
  return colors[element] ?? '#9D8EC7';
}
