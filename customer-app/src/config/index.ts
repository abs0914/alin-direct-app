// ============================================================
// ALiN Move Customer App - Configuration
// ============================================================

import { Platform } from 'react-native';

// ── Dev host resolution ────────────────────────────────────────
// • Physical device (Android/iOS) on the same WiFi → use your machine's LAN IP.
// • Expo Web (browser on same machine)             → localhost
//
// ⚠️  When your network changes (e.g. different WiFi), update DEV_LAN_IP below.
// ⚠️ Update this if your machine's IP changes (run `ipconfig` to check)
const DEV_LAN_IP = '26.213.230.75';

const DEV_HOST = (() => {
  if (!__DEV__) return '';
  if (Platform.OS === 'web') return 'localhost';
  return DEV_LAN_IP; // works for physical Android/iOS on the same network
})();

const Config = {
  // Demo Mode — false = use real API & Supabase
  DEMO_MODE: false,

  // API Configuration — points to the local Fastify API
  API_BASE_URL: __DEV__ ? `http://${DEV_HOST}:3001/api` : 'https://api.alinmove.com/api',

  // Supabase Configuration
  SUPABASE_URL: 'https://imewvxrqjgjkdtpyaijf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZXd2eHJxamdqa2R0cHlhaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODg5NDAsImV4cCI6MjA4MzM2NDk0MH0.cV7AK1tQKvCRmmOyxbBdL6jA6Px-bes0tWT6sOnUnuE',

  // OTP Configuration
  OTP_LENGTH: 6,
  OTP_RESEND_SECONDS: 60,

  // Tracking
  TRACKING_REFRESH_INTERVAL_MS: 3000, // 3 seconds for live tracking

  // App Info
  APP_NAME: 'ALiN Move',
  APP_VERSION: '1.0.0',
};

export default Config;

