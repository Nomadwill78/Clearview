# Celestial — Deployment Guide

## Overview
Celestial is a React Native + Expo app deployed via EAS Build to Google Play and Apple App Store.
Backend: Supabase (auth + database + edge functions)
Payments: Stripe
AI: Anthropic Claude API

---

## 1. Supabase Setup

### Create project
1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Copy service role key (for edge functions)

### Run migration
```bash
cd Celestial
npx supabase db push  # or paste supabase/migrations/001_initial.sql into SQL editor
```

### Deploy Edge Functions
```bash
npx supabase functions deploy horoscope
npx supabase functions deploy advisor
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook
```

### Set Edge Function secrets
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set STRIPE_STARSEED_MONTHLY_PRICE_ID=price_...
npx supabase secrets set STRIPE_COSMIC_YEARLY_PRICE_ID=price_...
npx supabase secrets set APP_URL=celestial://
```

---

## 2. Stripe Setup

### Create account & products
1. Go to https://stripe.com → Dashboard
2. Create Products:
   - **Starseed Monthly**: $9.99/month recurring → copy Price ID
   - **Cosmic Annual**: $79.99/year recurring → copy Price ID

### Configure webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://[YOUR_PROJECT].supabase.co/functions/v1/stripe-webhook`
3. Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

---

## 3. Anthropic (Claude) API

1. Go to https://console.anthropic.com → API Keys
2. Create new key → set as `ANTHROPIC_API_KEY` in Supabase secrets
3. The app uses `claude-haiku-4-5-20251001` for cost efficiency

---

## 4. Local Development

```bash
cd Celestial

# Copy env file
cp .env.example .env.local

# Fill in your keys:
# EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Install dependencies
npm install

# Start dev server
npx expo start
```

---

## 5. Font Setup

Download fonts and place in `assets/fonts/`:
- **Playfair Display**: https://fonts.google.com/specimen/Playfair+Display
  - PlayfairDisplay-Regular.ttf, PlayfairDisplay-Bold.ttf, PlayfairDisplay-Italic.ttf
- **Inter**: https://fonts.google.com/specimen/Inter
  - Inter-Regular.ttf, Inter-Medium.ttf, Inter-SemiBold.ttf, Inter-Bold.ttf

---

## 6. EAS Build Setup

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Initialize EAS project
```bash
cd Celestial
eas build:configure
```

This will:
- Create your project on expo.dev
- Update `app.json` with your project ID

### Build for testing (Preview)
```bash
# Android APK (no Play Store account needed)
eas build --platform android --profile preview

# iOS Simulator build
eas build --platform ios --profile preview
```

### Build for App Stores (Production)
```bash
eas build --platform all --profile production
```

---

## 7. Google Play Store Submission

### Prerequisites
1. Google Play Developer account ($25 one-time): https://play.google.com/console
2. Create app in Play Console
3. Complete store listing (screenshots, description, icon)

### Build & Submit
```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

Required assets:
- App icon: 512×512 PNG
- Feature graphic: 1024×500 PNG
- Screenshots: Minimum 2, phone screenshots

---

## 8. Apple App Store Submission

### Prerequisites
1. Apple Developer account ($99/year): https://developer.apple.com
2. Create app in App Store Connect
3. App Review Info

### Build & Submit
```bash
# Build production IPA
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

Required assets:
- App icon: 1024×1024 PNG (no transparency)
- Screenshots: 6.7" iPhone, 12.9" iPad Pro

---

## 9. Automated CI/CD

The `.github/workflows/eas-build.yml` workflow automatically builds on push to `main`.

Add secrets to GitHub:
- `EXPO_TOKEN`: Your Expo access token (expo.dev → Account → Access Tokens)

---

## 10. Production Checklist

- [ ] Supabase project created and migration run
- [ ] All edge functions deployed with secrets set
- [ ] Stripe products and webhook configured
- [ ] Fonts downloaded and placed in assets/fonts/
- [ ] .env.local filled with production keys
- [ ] EAS project initialized (`eas.json` updated with real project ID)
- [ ] App icon and splash screen created
- [ ] Google Play Console app created
- [ ] Apple App Store Connect app created
- [ ] Production builds tested on real devices
- [ ] App store listings completed with screenshots

---

## Support
Questions: hello@celestial.app
