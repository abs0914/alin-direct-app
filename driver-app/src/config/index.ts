// ============================================================
// ALiN Move Driver App - Configuration
// ============================================================

import { Platform } from 'react-native';

// ── Dev host resolution ────────────────────────────────────────
// • Physical device (Android/iOS) on the same WiFi → use your machine's LAN IP.
// • Android emulator (AVD)                         → 10.0.2.2
// • iOS simulator / Expo Web                       → localhost
//
// ⚠️  When your network changes (e.g. different WiFi), update DEV_LAN_IP below.
// ⚠️ Update this if your machine's IP changes (run `ipconfig` to check)
const DEV_LAN_IP = '26.213.230.75';

const DEV_HOST = (() => {
  if (!__DEV__) return '';
  // Expo Go on a physical device needs the real LAN IP.
  // Expo Web (browser on the same machine) can use localhost.
  if (Platform.OS === 'web') return 'localhost';
  return DEV_LAN_IP; // works for both physical Android and physical iOS
})();

const Config = {
  // Demo / local testing mode — true = bypass Supabase SMS, any 6-digit OTP works
  DEMO_MODE: true,

  // API Configuration — points to the local Fastify API
  API_BASE_URL: __DEV__ ? `http://${DEV_HOST}:3001/api` : 'https://api.alinmove.com/api',

  // Supabase Configuration
  SUPABASE_URL: 'https://imewvxrqjgjkdtpyaijf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZXd2eHJxamdqa2R0cHlhaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODg5NDAsImV4cCI6MjA4MzM2NDk0MH0.cV7AK1tQKvCRmmOyxbBdL6jA6Px-bes0tWT6sOnUnuE',

  // OTP Configuration
  OTP_LENGTH: 6,
  OTP_RESEND_SECONDS: 60,

  // Job Offer Configuration
  JOB_OFFER_TIMEOUT_SECONDS: 30,

  // Location Tracking
  LOCATION_UPDATE_INTERVAL_MS: 5000, // 5 seconds when on job
  LOCATION_IDLE_INTERVAL_MS: 30000,  // 30 seconds when online but idle

  // App Info
  APP_NAME: 'ALiN Move Driver',
  APP_VERSION: '1.0.0',
};

export default Config;

