import { supabase } from './supabase';

export interface Message { role: 'user' | 'assistant'; content: string; }

async function callEdgeFunction(functionName: string, body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw new Error(error.message);
  return data.text ?? data.content ?? '';
}

export async function generateHoroscope(params: {
  sign: string; period: 'yesterday' | 'today' | 'tomorrow';
  category: 'love' | 'career' | 'wellness' | 'general';
}): Promise<string> {
  try {
    return await callEdgeFunction('horoscope', params);
  } catch {
    return getFallbackHoroscope(params.sign, params.category);
  }
}

export async function generateCompatibility(sign1: string, sign2: string): Promise<{
  percentage: number; love: string; friendship: string; work: string; summary: string;
}> {
  try {
    const result = await callEdgeFunction('compatibility', { sign1, sign2 });
    return JSON.parse(result);
  } catch {
    return {
      percentage: 75,
      love: `The connection between ${sign1} and ${sign2} holds deep potential. Your energies complement each other in ways that create both passion and harmony.`,
      friendship: `As friends, ${sign1} and ${sign2} balance each other beautifully — one brings fire, the other brings depth.`,
      work: `In professional settings, your combined strengths create a powerful team capable of achieving ambitious goals.`,
      summary: `This pairing carries the cosmic signature of growth through contrast — two souls whose differences illuminate each other's shadows.`,
    };
  }
}

export async function generateBirthChartReading(params: {
  sunSign: string; moonSign: string; risingSign: string; planets: Array<{ planet: string; sign: string }>;
}): Promise<string> {
  try {
    return await callEdgeFunction('birth-chart', params);
  } catch {
    return `Your birth chart reveals a soul of remarkable depth. With your Sun in ${params.sunSign}, you carry the essence of ${params.sunSign}'s most luminous qualities — your core identity shines brightest when you honor those traits. Your Moon in ${params.moonSign} speaks to your emotional nature, the private sanctuary of your inner world. And your Rising in ${params.risingSign} is the cosmic costume you wear as you step into the world — the first impression you make on the universe. Together, these three celestial signatures create a unique soul blueprint that is entirely your own.`;
  }
}

export interface CelesteReply {
  text: string;
  /** True when the account has spent all its free questions (non-Cosmic). */
  limitReached: boolean;
  /** Server-side free-question count, or null when unknown (offline/Cosmic). */
  used: number | null;
}

export async function chatWithCeleste(messages: Message[], userContext: {
  sunSign?: string; moonSign?: string; risingSign?: string;
  lifePathNumber?: number; name?: string;
}): Promise<CelesteReply> {
  try {
    const { data, error } = await supabase.functions.invoke('advisor', { body: { messages, userContext } });
    if (error) throw error;
    const used = typeof data?.used === 'number' ? data.used : null;
    if (data?.limitReached) return { text: '', limitReached: true, used };
    return { text: data?.text ?? data?.content ?? '', limitReached: false, used };
  } catch {
    const lastMessage = messages[messages.length - 1]?.content ?? '';
    return { text: getCelesteResponse(lastMessage, userContext), limitReached: false, used: null };
  }
}

/** Reads the account's server-side free-question count. Returns null if unavailable. */
export async function fetchAdvisorUsage(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('advisor_usage')
      .select('free_questions_used')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.free_questions_used ?? 0;
  } catch {
    return null;
  }
}

function getFallbackHoroscope(sign: string, category: string): string {
  const readings: Record<string, string> = {
    love: `The stars are aligning in your favor when it comes to matters of the heart, dear ${sign}. Venus casts her golden light on your love sector today, softening edges and opening channels of authentic connection. If you are in a relationship, small gestures of appreciation will ripple outward into profound warmth. If you are seeking love, know that the universe is conspiring to bring you precisely the connection your soul is ready for.`,
    career: `Mercury's sharp mind and Jupiter's expansive energy converge in your professional sphere today, ${sign}. Your ideas carry unusual power — trust your instincts and speak them clearly. A conversation you've been postponing holds more potential than you realize. The cosmos favors bold moves made with thoughtful intention.`,
    wellness: `Your body is the sacred vessel through which you experience this cosmic journey, ${sign}. Today calls you to listen deeply to its wisdom. Rest when it asks for rest, move when it calls for movement. A gentle practice — whether breathwork, a walk in nature, or quiet meditation — will realign your energy centers and restore your inner radiance.`,
    general: `The cosmic weather today carries currents of transformation and possibility for you, dear ${sign}. The planets are rearranging themselves in patterns that favor your highest growth. Stay open to unexpected encounters and conversations — they often carry the seeds of destiny. Trust that you are exactly where you need to be.`,
  };
  return readings[category] ?? readings.general;
}

function getCelesteResponse(userMessage: string, context: { name?: string; sunSign?: string }): string {
  const name = context.name ?? 'dear soul';
  const sign = context.sunSign ?? 'the stars';
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('love') || lowerMsg.includes('relationship')) {
    return `I sense in your words the deep longing of a heart that both loves fiercely and guards itself wisely, ${name}. The stars in ${sign} speak of a soul with tremendous capacity for love — and also one who has learned through experience how precious that love is. The universe is preparing something beautiful for you in this area. Trust the timing, and remember: the love you seek begins in the quiet chambers of your own heart. ✨`;
  }
  if (lowerMsg.includes('career') || lowerMsg.includes('job') || lowerMsg.includes('work')) {
    return `The cosmic currents around your professional path are in motion, ${name}. As a ${sign}, you carry gifts that the world genuinely needs. I see opportunities aligning in the months ahead — but they will require you to step beyond your comfortable edge. What would you do if you absolutely knew you could not fail? That answer holds your cosmic career compass. 🌟`;
  }
  if (lowerMsg.includes('scared') || lowerMsg.includes('afraid') || lowerMsg.includes('anxious') || lowerMsg.includes('worried')) {
    return `I hear you, ${name}, and I want you to know — the universe hears you too. Fear is not a sign that you are going the wrong way. Often, it signals that you are standing at the very threshold of your growth. You did not come this far by accident. The stars have been conspiring on your behalf longer than you know. Breathe. You are held. 💜`;
  }
  return `The celestial currents are flowing in interesting ways around your question, ${name}. As a ${sign}, you have a particular gift for navigating complexity with grace — even when it doesn't feel that way from inside the experience. What your soul most needs right now is to trust its own deep knowing. The stars illuminate the path, but you are the one who walks it. What feels most true to you about this? 🌙`;
}
