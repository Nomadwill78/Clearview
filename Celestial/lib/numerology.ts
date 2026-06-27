export interface NumerologyProfile {
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthdayNumber: number;
  personalYearNumber: number;
}

export interface NumberMeaning {
  title: string;
  essence: string;
  meaning: string;
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

// Personal Year — the energetic theme of a given calendar year for this person.
// Reduces to 1–9 (no master numbers), cycling through a nine-year journey.
export function calculatePersonalYear(birthDateStr: string, year: number): number {
  const date = new Date(birthDateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const digitSum = (n: number) => String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  const sum = digitSum(month) + digitSum(day) + digitSum(year);
  return reduceNumber(sum, false);
}

export function getNumerologyProfile(
  birthDateStr: string,
  fullName: string,
  year: number = new Date().getFullYear(),
): NumerologyProfile {
  return {
    lifePathNumber: calculateLifePath(birthDateStr),
    destinyNumber: calculateDestiny(fullName),
    soulUrgeNumber: calculateSoulUrge(fullName),
    personalityNumber: calculatePersonality(fullName),
    birthdayNumber: calculateBirthday(birthDateStr),
    personalYearNumber: calculatePersonalYear(birthDateStr, year),
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

// Destiny / Expression Number — derived from your full name. It describes the
// talents you are here to develop and the contribution your life is building toward.
export const DESTINY_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: 'The Trailblazer', essence: 'Born to lead, originate, and stand alone at the front.', meaning: 'Your destiny is to pioneer. You are meant to develop courage, originality, and self-reliance — to start what others only dream of and to lead by walking first. Mastery comes when you trust your own authority without trampling those beside you.' },
  2: { title: 'The Diplomat', essence: 'Here to unite, mediate, and bring quiet harmony.', meaning: 'Your destiny is built on connection. You are meant to refine the arts of cooperation, patience, and emotional intelligence — becoming the bridge between opposing forces. Your influence is gentle but profound, working through partnership rather than dominance.' },
  3: { title: 'The Communicator', essence: 'Here to express, create, and lift the world\'s spirits.', meaning: 'Your destiny flows through self-expression. Words, art, and joy are your tools, and you are meant to inspire others by giving voice to beauty and feeling. The challenge is to focus your abundant creative energy rather than scatter it.' },
  4: { title: 'The Architect', essence: 'Here to build lasting, dependable foundations.', meaning: 'Your destiny is to create order and structure that endures. Through discipline, honesty, and steady effort you turn ideas into solid reality. The world relies on the systems you build — your gift is patience made tangible.' },
  5: { title: 'The Adventurer', essence: 'Here to explore freedom, change, and experience.', meaning: 'Your destiny is movement. You are meant to embrace change, taste life widely, and teach others to adapt and let go. Your magnetism opens doors — mastery is using your freedom with purpose rather than restlessness.' },
  6: { title: 'The Caretaker', essence: 'Here to nurture, heal, and create harmony at home.', meaning: 'Your destiny centers on love and responsibility. You are meant to care for family, community, and the vulnerable, creating beauty and balance wherever you go. Your challenge is to give from fullness, not from a need to be needed.' },
  7: { title: 'The Mystic', essence: 'Here to seek truth beneath the surface of things.', meaning: 'Your destiny is the pursuit of wisdom. Through study, contemplation, and inner work you uncover truths hidden to most. You are meant to bridge the analytical and the spiritual — and to trust solitude as your teacher.' },
  8: { title: 'The Achiever', essence: 'Here to master the material world and wield power well.', meaning: 'Your destiny is achievement and abundance. You are meant to lead in the realm of business, resources, and influence — and to learn that true power serves more than the self. Balance ambition with integrity and your reach becomes vast.' },
  9: { title: 'The Humanitarian', essence: 'Here to serve, heal, and give on a grand scale.', meaning: 'Your destiny is compassion in action. With an old soul\'s perspective, you are meant to uplift humanity through generosity, art, and selfless service. The lesson is to release attachment and love without condition.' },
  11: { title: 'The Illuminator', essence: 'Here to inspire through heightened intuition.', meaning: 'A master vibration. Your destiny is to channel insight and inspiration that awakens others — to be a beacon. Sensitivity is your gift and your burden; grounding your visions into the everyday is the work of a lifetime.' },
  22: { title: 'The Master Builder', essence: 'Here to turn vast visions into lasting reality.', meaning: 'The most powerful destiny number. You unite the dreamer of 11 with the builder of 4, able to manifest large-scale visions that benefit many. Your potential is immense — fulfilled only when you dare to think and act at scale.' },
  33: { title: 'The Master Teacher', essence: 'Here to uplift the world through love and wisdom.', meaning: 'The rarest destiny. You are meant to be a channel of healing and unconditional love, teaching through example and compassion. This path asks great selflessness — and offers the chance to leave a profound spiritual legacy.' },
};

// Soul Urge / Heart's Desire Number — derived from the vowels of your name.
// It reveals the inner motivation that drives you beneath everything you do.
export const SOUL_URGE_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: 'The Independent Heart', essence: 'Deep down, you long to stand on your own and lead.', meaning: 'At your core you crave independence, achievement, and the freedom to forge your own path. You are happiest when self-directed and recognized for your originality. Your soul resists being controlled — autonomy is oxygen to you.' },
  2: { title: 'The Loving Heart', essence: 'Deep down, you long for peace, love, and belonging.', meaning: 'Your heart yearns for harmony, intimacy, and deep emotional connection. You feel most alive when loved and when bringing people together. Beneath your calm exterior is a profound sensitivity to the moods of those around you.' },
  3: { title: 'The Joyful Heart', essence: 'Deep down, you long to express, create, and delight.', meaning: 'Your soul desires self-expression and joy. You are driven to create, to be seen and heard, and to spread lightness wherever you go. Creative outlets and an appreciative audience feed something essential in you.' },
  4: { title: 'The Steady Heart', essence: 'Deep down, you long for security and order.', meaning: 'Your heart craves stability, structure, and the satisfaction of work well done. You feel safest when life is dependable and your efforts build something lasting. Loyalty and honesty are non-negotiable to your soul.' },
  5: { title: 'The Free Heart', essence: 'Deep down, you long for freedom and adventure.', meaning: 'Your soul desires variety, sensory experience, and the liberty to roam. Routine feels like a cage; novelty thrills you. You are driven to taste all that life offers and to never feel boxed in.' },
  6: { title: 'The Devoted Heart', essence: 'Deep down, you long to love and be needed.', meaning: 'Your heart yearns to nurture, protect, and create a beautiful, harmonious home. You feel most fulfilled in service to those you love. The soul\'s lesson is to care for yourself as devotedly as you care for others.' },
  7: { title: 'The Seeking Heart', essence: 'Deep down, you long for truth and understanding.', meaning: 'Your soul craves wisdom, solitude, and the quiet to think deeply. You are drawn to mystery and meaning rather than surface noise. Time alone is not loneliness for you — it is where you reconnect with yourself.' },
  8: { title: 'The Ambitious Heart', essence: 'Deep down, you long for mastery and abundance.', meaning: 'Your heart desires accomplishment, influence, and material success earned through your own power. You are motivated by big goals and lasting impact. The deeper hunger is to prove your strength to yourself.' },
  9: { title: 'The Compassionate Heart', essence: 'Deep down, you long to make the world kinder.', meaning: 'Your soul yearns to give, heal, and serve something larger than yourself. You feel the suffering of others and are moved to help. Fulfillment comes through generosity and a sense of universal belonging.' },
  11: { title: 'The Inspired Heart', essence: 'Deep down, you long to enlighten and inspire.', meaning: 'Your soul carries a luminous, idealistic longing to uplift others and connect to the divine. You are deeply intuitive and emotionally attuned. Peace comes when you honor your sensitivity rather than fight it.' },
  22: { title: 'The Visionary Heart', essence: 'Deep down, you long to build something monumental.', meaning: 'Your heart desires to leave a lasting mark — to manifest a vision that serves many. You are driven by both idealism and a practical hunger to make it real. Your soul is restless until it builds at the scale it dreams.' },
  33: { title: 'The Healing Heart', essence: 'Deep down, you long to love unconditionally.', meaning: 'Your soul yearns to heal and nurture humanity through pure, selfless love. You are moved by deep compassion and a desire to ease suffering. The lesson is boundaries — loving the world without losing yourself.' },
};

// Personality Number — derived from the consonants of your name. It is the
// outer self: the impression you make and how the world first reads you.
export const PERSONALITY_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: 'The Bold Presence', essence: 'Others see a confident, capable leader.', meaning: 'You project strength, independence, and drive. People sense you can take charge and they often look to you to lead. The mask can read as intimidating — softening it invites others closer.' },
  2: { title: 'The Gentle Presence', essence: 'Others see a warm, approachable peacemaker.', meaning: 'You come across as kind, tactful, and easy to be around. People feel safe opening up to you. Your quiet grace is disarming, though it can cause others to underestimate your inner strength.' },
  3: { title: 'The Radiant Presence', essence: 'Others see a charming, expressive spirit.', meaning: 'You appear vibrant, witty, and stylish — a natural at lighting up a room. People are drawn to your warmth and humor. The challenge is letting others see the depth beneath the sparkle.' },
  4: { title: 'The Grounded Presence', essence: 'Others see a dependable, steady pillar.', meaning: 'You project reliability, honesty, and competence. People trust you instinctively and lean on your stability. The mask can seem reserved — letting your warmth show makes you magnetic.' },
  5: { title: 'The Magnetic Presence', essence: 'Others see an exciting, free-spirited force.', meaning: 'You radiate energy, curiosity, and adventure. People find you fun, dynamic, and a little unpredictable. Your challenge is showing consistency so others know they can count on you.' },
  6: { title: 'The Warm Presence', essence: 'Others see a caring, responsible heart.', meaning: 'You appear nurturing, trustworthy, and generous. People naturally bring you their troubles and lean on your support. Take care that your giving nature is met with equal care in return.' },
  7: { title: 'The Enigmatic Presence', essence: 'Others see a thoughtful, mysterious depth.', meaning: 'You come across as composed, intelligent, and a touch unreadable. People sense hidden depths and are intrigued. Opening up — a little — turns your mystery into genuine connection.' },
  8: { title: 'The Commanding Presence', essence: 'Others see authority and quiet power.', meaning: 'You project success, competence, and control. People assume you are capable and influential, and treat you accordingly. The lesson is wearing your power with warmth rather than distance.' },
  9: { title: 'The Noble Presence', essence: 'Others see a refined, compassionate soul.', meaning: 'You appear dignified, worldly, and warmly idealistic. People sense your generosity and breadth of perspective. Your aura of the "old soul" draws others who seek meaning.' },
  11: { title: 'The Luminous Presence', essence: 'Others sense an inspiring, almost magnetic aura.', meaning: 'You carry a subtle radiance that others feel before they can name it — intuitive, sensitive, and uplifting. People are drawn to your energy. Grounding that intensity keeps it inviting rather than overwhelming.' },
  22: { title: 'The Formidable Presence', essence: 'Others sense capability on a grand scale.', meaning: 'You project both vision and substance — people instinctively believe you can build big things. Your presence inspires confidence. The mask carries weight; ease and approachability multiply your influence.' },
  33: { title: 'The Compassionate Presence', essence: 'Others feel held by your warmth and wisdom.', meaning: 'You radiate care, patience, and a healing calm. People feel understood and uplifted in your company. Your gentle authority makes you a natural guide and confidant.' },
};

// Birthday Number — the day of the month you were born. A specific gift or
// talent you carry naturally into this life.
export const BIRTHDAY_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: 'The Gift of Initiative', essence: 'A natural drive to begin and to lead.', meaning: 'You carry an innate spark for starting things and standing on your own. Independence and ambition come easily — your gift is the courage to go first.' },
  2: { title: 'The Gift of Sensitivity', essence: 'A natural talent for harmony and tact.', meaning: 'You are blessed with intuition and a gift for understanding people. Diplomacy and partnership flow naturally — you sense what others need before they say it.' },
  3: { title: 'The Gift of Expression', essence: 'A natural flair for creativity and words.', meaning: 'You carry an effortless gift for self-expression, humor, and lifting spirits. Whether through art, speech, or simple charm, you bring joy wherever you go.' },
  4: { title: 'The Gift of Discipline', essence: 'A natural talent for building and organizing.', meaning: 'You possess a grounded gift for structure, focus, and follow-through. Where others start, you finish — your reliability is a quiet superpower.' },
  5: { title: 'The Gift of Versatility', essence: 'A natural adaptability and zest for life.', meaning: 'You carry a gift for change, communication, and embracing the new. Quick-witted and adaptable, you thrive where variety and freedom abound.' },
  6: { title: 'The Gift of Devotion', essence: 'A natural talent for caring and creating beauty.', meaning: 'You are gifted with warmth, responsibility, and an eye for harmony. People feel cared for around you — nurturing comes as naturally as breathing.' },
  7: { title: 'The Gift of Insight', essence: 'A natural depth of mind and intuition.', meaning: 'You carry a gift for analysis, reflection, and sensing hidden truths. Your thoughtful nature uncovers what others overlook.' },
  8: { title: 'The Gift of Ambition', essence: 'A natural talent for achievement and leadership.', meaning: 'You possess a powerful gift for organization, vision, and material mastery. Goals that daunt others energize you — you are built to achieve.' },
  9: { title: 'The Gift of Compassion', essence: 'A natural generosity and broad vision.', meaning: 'You carry a gift for empathy, artistry, and selfless service. You see the bigger picture and are moved to make life better for others.' },
  11: { title: 'The Gift of Intuition', essence: 'A heightened, inspired sensitivity.', meaning: 'You carry a master gift of intuition and inspiration. Your insight can illuminate the path for others — trust the impressions that arrive without explanation.' },
  22: { title: 'The Gift of Manifestation', essence: 'A rare ability to make big dreams real.', meaning: 'You carry a master gift for turning vision into reality at scale. Practical and far-seeing at once, you are equipped to build something that lasts.' },
  33: { title: 'The Gift of Healing', essence: 'A rare capacity for compassionate guidance.', meaning: 'You carry a master gift of nurturing wisdom and unconditional care. Your presence itself can be a balm — you are here to uplift.' },
};

// Personal Year Number — the theme of the current calendar year for you,
// cycling through a nine-year journey of growth.
export const PERSONAL_YEAR_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: 'Year of New Beginnings', essence: 'A fresh nine-year cycle opens — plant seeds.', meaning: 'This is a year of fresh starts, bold action, and independence. Doors open for new ventures and self-reinvention. Plant the seeds now that you want to harvest over the coming cycle — initiative is richly rewarded.' },
  2: { title: 'Year of Patience & Partnership', essence: 'A year to nurture, cooperate, and let things ripen.', meaning: 'The pace slows so relationships and quiet progress can deepen. This is a year for cooperation, patience, and tending what you began last year. Trust that gentle, behind-the-scenes effort is building something real.' },
  3: { title: 'Year of Expression & Joy', essence: 'A year to create, socialize, and shine.', meaning: 'Creativity and social life blossom. This is a year to express yourself, enjoy connection, and let optimism lead. Opportunities arrive through communication — share your gifts and let yourself be seen.' },
  4: { title: 'Year of Foundation & Work', essence: 'A year to build structure and do the work.', meaning: 'A grounded, productive year that rewards discipline and organization. Lay solid foundations, attend to details, and build steadily. The effort feels heavier now but secures lasting stability ahead.' },
  5: { title: 'Year of Change & Freedom', essence: 'A year of movement, surprise, and expansion.', meaning: 'Expect change, adventure, and unexpected opportunity. This is a year to stay flexible, embrace the new, and break free of what confines you. Say yes to experiences that stretch your horizons.' },
  6: { title: 'Year of Love & Responsibility', essence: 'A year centered on home, family, and the heart.', meaning: 'Matters of love, family, and home take center stage. This is a year for commitment, caretaking, and creating harmony in your closest relationships. Give generously, but guard against carrying more than your share.' },
  7: { title: 'Year of Reflection & Growth', essence: 'A year to turn inward and seek wisdom.', meaning: 'A contemplative year for study, solitude, and inner work. Slow down and listen — answers come through reflection rather than action. Trust the quiet; you are deepening before the next surge forward.' },
  8: { title: 'Year of Power & Reward', essence: 'A year of achievement, recognition, and abundance.', meaning: 'The harvest year for ambition. Career, finances, and personal power come into focus, and past effort can pay off substantially. Step into your authority and make decisive, confident moves.' },
  9: { title: 'Year of Completion & Release', essence: 'A year to finish, forgive, and let go.', meaning: 'The cycle closes. This is a year for completion, release, and making space — letting go of what no longer serves you. Generosity and closure now clear the way for a powerful new beginning ahead.' },
};
