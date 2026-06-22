import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { getZodiacSign, getZodiacInfo } from '../../constants/zodiac';
import { calculateBirthChart } from '../../lib/astrology';
import StarField from '../../components/StarField';
import GlowButton from '../../components/GlowButton';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

// Major cities for location search
const CITIES = [
  'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA',
  'Phoenix, USA', 'Philadelphia, USA', 'San Antonio, USA', 'San Diego, USA',
  'Dallas, USA', 'San Jose, USA', 'Austin, USA', 'Jacksonville, USA',
  'Miami, USA', 'Seattle, USA', 'Denver, USA', 'Boston, USA',
  'Las Vegas, USA', 'Portland, USA', 'Atlanta, USA', 'Nashville, USA',
  'Minneapolis, USA', 'New Orleans, USA', 'Detroit, USA', 'Memphis, USA',
  'Baltimore, USA', 'Washington DC, USA', 'Charlotte, USA', 'Indianapolis, USA',
  'Columbus, USA', 'San Francisco, USA', 'Milwaukee, USA', 'Albuquerque, USA',
  'Tucson, USA', 'Fresno, USA', 'Sacramento, USA', 'Kansas City, USA',
  'Omaha, USA', 'Raleigh, USA', 'Colorado Springs, USA', 'Tampa, USA',
  'Orlando, USA', 'Pittsburgh, USA', 'Cincinnati, USA', 'Cleveland, USA',
  'Honolulu, USA', 'Anchorage, USA', 'Salt Lake City, USA',
  'London, UK', 'Birmingham, UK', 'Glasgow, UK', 'Manchester, UK',
  'Edinburgh, UK', 'Leeds, UK', 'Liverpool, UK', 'Bristol, UK',
  'Sheffield, UK', 'Cardiff, UK', 'Belfast, UK',
  'Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada',
  'Ottawa, Canada', 'Edmonton, Canada', 'Winnipeg, Canada', 'Quebec City, Canada',
  'Hamilton, Canada', 'Halifax, Canada',
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Adelaide, Australia', 'Gold Coast, Australia', 'Canberra, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France',
  'Berlin, Germany', 'Hamburg, Germany', 'Munich, Germany', 'Frankfurt, Germany', 'Cologne, Germany',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Bilbao, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium',
  'Vienna, Austria', 'Graz, Austria',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland',
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden',
  'Oslo, Norway', 'Bergen, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark',
  'Helsinki, Finland', 'Tampere, Finland',
  'Warsaw, Poland', 'Krakow, Poland', 'Wroclaw, Poland',
  'Prague, Czech Republic', 'Brno, Czech Republic',
  'Budapest, Hungary', 'Bucharest, Romania', 'Sofia, Bulgaria',
  'Athens, Greece', 'Thessaloniki, Greece',
  'Istanbul, Turkey', 'Ankara, Turkey', 'Izmir, Turkey',
  'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia',
  'Kyiv, Ukraine', 'Kharkiv, Ukraine',
  'Lisbon, Portugal', 'Porto, Portugal',
  'Dublin, Ireland', 'Cork, Ireland',
  'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Sapporo, Japan', 'Hiroshima, Japan',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea',
  'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China',
  'Chengdu, China', "Xi'an, China", 'Wuhan, China', 'Hangzhou, China',
  'Hong Kong', 'Macau',
  'Taipei, Taiwan', 'Kaohsiung, Taiwan',
  'Singapore', 'Bangkok, Thailand', 'Chiang Mai, Thailand',
  'Kuala Lumpur, Malaysia', 'Penang, Malaysia',
  'Jakarta, Indonesia', 'Bali, Indonesia', 'Surabaya, Indonesia',
  'Manila, Philippines', 'Cebu, Philippines',
  'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Da Nang, Vietnam',
  'Phnom Penh, Cambodia', 'Yangon, Myanmar', 'Vientiane, Laos',
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India',
  'Chennai, India', 'Kolkata, India', 'Pune, India', 'Ahmedabad, India',
  'Jaipur, India', 'Surat, India', 'Lucknow, India', 'Kanpur, India',
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Faisalabad, Pakistan',
  'Dhaka, Bangladesh', 'Chittagong, Bangladesh',
  'Colombo, Sri Lanka', 'Kathmandu, Nepal',
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE',
  'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Mecca, Saudi Arabia',
  'Kuwait City, Kuwait', 'Doha, Qatar', 'Muscat, Oman', 'Manama, Bahrain',
  'Tel Aviv, Israel', 'Jerusalem, Israel', 'Haifa, Israel',
  'Amman, Jordan', 'Beirut, Lebanon', 'Damascus, Syria',
  'Baghdad, Iraq', 'Tehran, Iran', 'Isfahan, Iran',
  'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt',
  'Casablanca, Morocco', 'Marrakech, Morocco', 'Rabat, Morocco',
  'Tunis, Tunisia', 'Algiers, Algeria',
  'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria',
  'Nairobi, Kenya', 'Mombasa, Kenya',
  'Addis Ababa, Ethiopia', 'Dar es Salaam, Tanzania', 'Kampala, Uganda',
  'Cape Town, South Africa', 'Johannesburg, South Africa', 'Durban, South Africa', 'Pretoria, South Africa',
  'Accra, Ghana', 'Dakar, Senegal', 'Kinshasa, DR Congo',
  'Luanda, Angola', 'Harare, Zimbabwe', 'Lusaka, Zambia',
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico',
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil',
  'Salvador, Brazil', 'Fortaleza, Brazil', 'Belo Horizonte, Brazil', 'Manaus, Brazil',
  'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
  'Santiago, Chile', 'Valparaíso, Chile',
  'Lima, Peru', 'Arequipa, Peru',
  'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia',
  'Caracas, Venezuela', 'Maracaibo, Venezuela',
  'Quito, Ecuador', 'Guayaquil, Ecuador',
  'La Paz, Bolivia', 'Asunción, Paraguay', 'Montevideo, Uruguay',
  'Havana, Cuba', 'Santo Domingo, Dominican Republic', 'San Juan, Puerto Rico',
  'Panama City, Panama', 'San José, Costa Rica', 'Guatemala City, Guatemala',
  'Tegucigalpa, Honduras', 'Managua, Nicaragua', 'San Salvador, El Salvador',
  'Reykjavik, Iceland', 'Tallinn, Estonia', 'Riga, Latvia', 'Vilnius, Lithuania',
  'Minsk, Belarus', 'Chisinau, Moldova', 'Tirana, Albania',
  'Skopje, North Macedonia', 'Sarajevo, Bosnia', 'Belgrade, Serbia', 'Zagreb, Croatia',
  'Ljubljana, Slovenia', 'Bratislava, Slovakia',
  'Tbilisi, Georgia', 'Yerevan, Armenia', 'Baku, Azerbaijan',
  'Tashkent, Uzbekistan', 'Almaty, Kazakhstan', 'Astana, Kazakhstan',
];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const zodiacScale = useSharedValue(0);
  const zodiacOpacity = useSharedValue(0);

  const router = useRouter();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();

  const getBirthDate = (): Date | null => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
    if (y < 1900 || y > 2025 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(y, m - 1, d);
    // Verify date didn't roll over (e.g. Feb 30 → Mar 1)
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  };

  const toISO = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const date = getBirthDate();
    if (date) {
      setRevealed(true);
      zodiacScale.value = withSpring(1, { damping: 12 });
      zodiacOpacity.value = withTiming(1, { duration: 600 });
    } else {
      setRevealed(false);
      zodiacScale.value = withTiming(0, { duration: 200 });
      zodiacOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [month, day, year]);

  const zodiacStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zodiacScale.value }],
    opacity: zodiacOpacity.value,
  }));

  const handleMonthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 2);
    setMonth(cleaned);
    if (cleaned.length === 2) dayRef.current?.focus();
  };

  const handleDayChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 2);
    setDay(cleaned);
    if (cleaned.length === 2) yearRef.current?.focus();
  };

  const filteredCities = locationQuery.length >= 2
    ? CITIES.filter(c => c.toLowerCase().includes(locationQuery.toLowerCase())).slice(0, 8)
    : [];

  const signKey = (() => {
    const d = getBirthDate();
    return d ? getZodiacSign(d.getMonth() + 1, d.getDate()) : null;
  })();
  const signInfo = signKey ? getZodiacInfo(signKey) : null;

  const handleFinish = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name so the stars can find you.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const d = getBirthDate();
      const birthDateStr = d ? toISO(d) : null;
      const sunSign = d ? getZodiacSign(d.getMonth() + 1, d.getDate()) : 'Aries';
      const chart = d ? calculateBirthChart(d, birthTime || undefined) : null;

      await supabase.from('profiles').upsert({
        id: user.id,
        name: name.trim(),
        birth_date: birthDateStr,
        birth_time: birthTime || null,
        birth_location: location || null,
        sun_sign: sunSign,
        moon_sign: chart?.moonSign ?? null,
        rising_sign: chart?.risingSign ?? null,
        updated_at: new Date().toISOString(),
      });

      setProfile({
        id: user.id,
        name,
        birthDate: birthDateStr ?? '',
        birthTime: birthTime || undefined,
        birthLocation: location || undefined,
        sunSign,
        moonSign: chart?.moonSign,
        risingSign: chart?.risingSign,
        notificationDaily: true,
        notificationMoon: true,
        notificationHour: 8,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0514', '#130D2B', '#0A0514']} style={styles.container}>
      <StarField />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSymbols}>✦ ☽ ✦</Text>
            <Text style={styles.title}>Your Cosmic Blueprint</Text>
            <Text style={styles.subtitle}>
              Tell the stars about yourself to receive personalized guidance.
            </Text>
          </View>

          {/* ── Name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="What shall the stars call you?"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          {/* ── Birth Date ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Birth Date</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCell}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={month}
                  onChangeText={handleMonthChange}
                  placeholder="MM"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                />
                <Text style={styles.dateUnit}>Month</Text>
              </View>
              <Text style={styles.dateSep}>/</Text>
              <View style={styles.dateCell}>
                <TextInput
                  ref={dayRef}
                  style={[styles.input, styles.dateInput]}
                  value={day}
                  onChangeText={handleDayChange}
                  placeholder="DD"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                />
                <Text style={styles.dateUnit}>Day</Text>
              </View>
              <Text style={styles.dateSep}>/</Text>
              <View style={[styles.dateCell, { flex: 1.6 }]}>
                <TextInput
                  ref={yearRef}
                  style={[styles.input, styles.dateInput]}
                  value={year}
                  onChangeText={t => setYear(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  textAlign="center"
                />
                <Text style={styles.dateUnit}>Year</Text>
              </View>
            </View>

            {/* Zodiac reveal — auto-animates when date is valid */}
            {revealed && signInfo && (
              <Animated.View style={[styles.signReveal, zodiacStyle]}>
                <Text style={[styles.signSymbol, { color: signInfo.color }]}>{signInfo.symbol}</Text>
                <Text style={styles.signName}>{signInfo.name}</Text>
                <Text style={styles.signDesc}>{signInfo.description}</Text>
              </Animated.View>
            )}
          </View>

          {/* ── Birth Time ── */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>Birth Time</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <TextInput
              style={styles.input}
              value={birthTime}
              onChangeText={setBirthTime}
              placeholder="HH:MM  (e.g. 14:30)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.hint}>Reveals your Rising sign — leave blank if unknown</Text>
          </View>

          {/* ── Birth Location ── */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>Birth Location</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>

            {location ? (
              <View style={styles.selectedCity}>
                <Text style={styles.selectedCityText}>📍  {location}</Text>
                <TouchableOpacity
                  onPress={() => { setLocation(''); setLocationQuery(''); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={locationQuery}
                  onChangeText={q => { setLocationQuery(q); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search city or country…"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {showDropdown && filteredCities.length > 0 && (
                  <View style={styles.dropdown}>
                    {filteredCities.map((city, i) => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.dropdownItem, i < filteredCities.length - 1 && styles.dropdownDivider]}
                        onPress={() => {
                          setLocation(city);
                          setLocationQuery(city);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>📍  {city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
            <Text style={styles.hint}>Completes your cosmic coordinates</Text>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={handleFinish}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.7}
          >
            {loading ? (
              <View style={styles.submitBtnInner}>
                <ActivityIndicator color={Colors.text} />
                <Text style={styles.submitBtnText}>Charting your cosmos…</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Enter the Cosmos  ✦</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.skipAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.skipAllText}>Skip — explore the app first</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing['2xl'], paddingTop: 60 },

  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  headerSymbols: { fontSize: FontSizes.xl, color: Colors.accent, letterSpacing: 8, marginBottom: Spacing.sm },
  title: { fontSize: FontSizes['4xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold', textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 22 },

  section: { marginBottom: Spacing['2xl'] },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: 'Inter-SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm },
  optional: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginBottom: Spacing.sm },
  hint: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginTop: Spacing.xs },

  input: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.base,
    color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.base,
    borderWidth: 1, borderColor: Colors.border,
  },

  // Date picker
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  dateCell: { flex: 1, alignItems: 'center' },
  dateInput: { textAlign: 'center', paddingHorizontal: 8 },
  dateUnit: { fontSize: FontSizes.xs, color: Colors.textMuted, fontFamily: 'Inter-Regular', marginTop: 4, textAlign: 'center' },
  dateSep: { fontSize: FontSizes['2xl'], color: Colors.textMuted, marginTop: 10 },

  // Zodiac reveal
  signReveal: {
    alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl,
    backgroundColor: Colors.glassBackground, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.glassBorder, marginTop: Spacing.lg,
  },
  signSymbol: { fontSize: 64, fontFamily: 'PlayfairDisplay-Regular' },
  signName: { fontSize: FontSizes['2xl'], color: Colors.text, fontFamily: 'PlayfairDisplay-Bold' },
  signDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter-Regular' },

  // Location
  selectedCity: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.base,
    borderWidth: 1, borderColor: Colors.primary,
  },
  selectedCityText: { color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.base, flex: 1 },
  clearBtn: { color: Colors.textMuted, fontSize: FontSizes.base, paddingLeft: Spacing.sm },
  dropdown: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginTop: 4,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.base },
  dropdownDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownText: { color: Colors.text, fontFamily: 'Inter-Regular', fontSize: FontSizes.base },

  // Submit
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md, minHeight: 56,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 16, elevation: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  submitBtnText: { color: Colors.text, fontFamily: 'Inter-SemiBold', fontSize: FontSizes.md, letterSpacing: 0.5 },

  skipAll: { alignItems: 'center', paddingVertical: Spacing.base, marginTop: Spacing.sm },
  skipAllText: { color: Colors.textMuted, fontFamily: 'Inter-Regular', fontSize: FontSizes.sm },
});
