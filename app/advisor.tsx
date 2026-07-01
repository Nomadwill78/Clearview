import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { usePremiumFeature } from '../hooks/useSubscription';
import { chatWithCeleste, fetchAdvisorUsage, Message } from '../lib/claude';
import { storage, STORAGE_KEYS, CELESTE_FREE_LIMIT } from '../lib/storage';
import StarField from '../components/StarField';
import GlowButton from '../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';


const SUGGESTIONS = [
  'What does my birth chart say about love?',
  'What is my life purpose?',
  'Am I on the right path with my career?',
  'What energy is surrounding me right now?',
];

export default function AdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Greetings, dear soul. I am Celeste, your cosmic guide. The stars have whispered your name, and I am here to illuminate the path that is uniquely yours. What weighs upon your heart today? ✨" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeUsed, setFreeUsed] = useState(0);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useProfile();
  const { isCosmic } = usePremiumFeature('advisor');
  const router = useRouter();

  // Cosmic members get unlimited chat; everyone else gets a few free questions.
  const freeRemaining = Math.max(0, CELESTE_FREE_LIMIT - freeUsed);
  const limitReached = !isCosmic && freeRemaining === 0;

  useEffect(() => {
    (async () => {
      // Server-side per-account count is the source of truth; fall back to the
      // local count when offline or before the backend migration is deployed.
      const serverUsed = await fetchAdvisorUsage();
      if (serverUsed !== null) {
        setFreeUsed(serverUsed);
        storage.set(STORAGE_KEYS.CELESTE_FREE_USED, serverUsed);
      } else {
        const local = await storage.get<number>(STORAGE_KEYS.CELESTE_FREE_USED);
        if (typeof local === 'number') setFreeUsed(local);
      }
      setQuotaLoaded(true);
    })();
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content) return;
    if (limitReached) return;

    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithCeleste(newMessages, {
        sunSign: profile?.sunSign, moonSign: profile?.moonSign,
        risingSign: profile?.risingSign, name: profile?.name,
      });

      if (reply.limitReached) {
        // Server declined — free questions are spent. Show a warm hand-off.
        setFreeUsed(CELESTE_FREE_LIMIT);
        storage.set(STORAGE_KEYS.CELESTE_FREE_USED, CELESTE_FREE_LIMIT);
        setMessages(prev => [...prev, { role: 'assistant', content: "We've reached the end of your free questions, dear soul ✨ Upgrade to Cosmic and we can keep exploring the stars together, as often as your heart desires. 🌙" }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply.text }]);

      // Sync the counter to the server's truth (or increment locally as fallback).
      if (!isCosmic) {
        const nextUsed = reply.used !== null ? reply.used : freeUsed + 1;
        setFreeUsed(nextUsed);
        storage.set(STORAGE_KEYS.CELESTE_FREE_USED, nextUsed);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'The cosmic signal is disrupted for a moment. Please try again. 🌙' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B']} style={styles.container}>
      <StarField />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Ask Celeste</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesScroll} showsVerticalScrollIndicator={false}>
            {/* Celeste header */}
            <View style={styles.celesteHeader}>
              <View style={styles.celesteAvatar}>
                <Text style={styles.celesteAvatarText}>🔮</Text>
              </View>
              <Text style={styles.celesteName}>Celeste</Text>
              <Text style={styles.celesteSubtitle}>Your AI Psychic Advisor</Text>
            </View>

            {/* Suggestions */}
            {messages.length <= 1 && !limitReached && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsLabel}>Ask me anything...</Text>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.suggestionChip}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <View key={i} style={[styles.messageRow, msg.role === 'user' ? styles.userRow : styles.assistantRow]}>
                {msg.role === 'assistant' && (
                  <View style={styles.celesteMsgAvatar}><Text>🔮</Text></View>
                )}
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.assistantText]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageRow, styles.assistantRow]}>
                <View style={styles.celesteMsgAvatar}><Text>🔮</Text></View>
                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantText}>Consulting the stars ✨</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input area — or upgrade prompt once free questions are spent */}
          {quotaLoaded && limitReached ? (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeTitle}>You've used your {CELESTE_FREE_LIMIT} free questions ✨</Text>
              <Text style={styles.upgradeSubtitle}>
                Upgrade to Cosmic for unlimited guidance from Celeste, whenever the stars call.
              </Text>
              <GlowButton title="Unlock Unlimited Celeste" onPress={() => router.push('/pricing')} variant="gold" size="sm" style={styles.upgradeBtn} />
            </View>
          ) : (
            <View>
              {quotaLoaded && !isCosmic && (
                <View style={styles.quotaBanner}>
                  <Text style={styles.quotaText}>
                    ✦ {freeRemaining} free {freeRemaining === 1 ? 'question' : 'questions'} remaining
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/pricing')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.quotaLink}>Go unlimited</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Celeste..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={500}
                  onSubmitEditing={() => sendMessage()}
                  returnKeyType="send"
                />
                <TouchableOpacity onPress={() => sendMessage()} disabled={loading || !input.trim()} style={styles.sendBtn}>
                  <Text style={styles.sendText}>✦</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  backBtn: { color: Colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: FontSizes.base },
  kav: { flex: 1 },
  messagesScroll: { padding: Spacing.base, paddingBottom: 20, gap: Spacing.sm },
  celesteHeader: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  celesteAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceLight, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  celesteAvatarText: { fontSize: 36 },
  celesteName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  celesteSubtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  suggestions: { gap: Spacing.sm, marginBottom: Spacing.md },
  suggestionsLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 1 },
  suggestionChip: { padding: Spacing.sm, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  suggestionText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  celesteMsgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubble: { maxWidth: '80%', padding: Spacing.sm, borderRadius: BorderRadius.lg },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: Colors.surfaceLight, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSizes.sm, lineHeight: 22, fontFamily: 'Inter-Regular' },
  userText: { color: Colors.text },
  assistantText: { color: Colors.textSecondary },
  quotaBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  quotaText: { fontSize: FontSizes.xs, color: Colors.accentGlow, fontFamily: 'Inter-Medium' },
  quotaLink: { fontSize: FontSizes.xs, color: Colors.primaryGlow, fontFamily: 'Inter-SemiBold' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: Spacing.sm, paddingHorizontal: Spacing.base, color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.sm, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: FontSizes.lg, color: Colors.text },
  upgradePrompt: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  upgradeTitle: { fontSize: FontSizes.md, color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center' },
  upgradeSubtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 20 },
  upgradeBtn: { marginTop: Spacing.xs },
});
