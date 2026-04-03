// ============================================================
// ALiN Move Customer App - Configuration
// ============================================================

import { Platform } from 'react-native';

// ── Dev host resolution ────────────────────────────────────────
// • Physical device (Android/iOS) on the same WiFi → use your machine's LAN IP.
// • Expo Web (browser on same machine)             → localhost
//
// ⚠️  When your network changes (e.g. different WiFi), update DEV_LAN_IP below.
const DEV_LAN_IP = '192.168.0.141';

const DEV_HOST = (() => {
  if (!__DEV__) return '';
  if (Platform.OS === 'web') return 'localhost';
  return DEV_LAN_IP; // works for both physical Android and physical iOS
})();

const Config = {
  // Demo Mode — set to false when Supabase + Laravel are running live
  DEMO_MODE: true,

  // API Configuration
  API_BASE_URL: __DEV__ ? `http://${DEV_HOST}:8000/api` : 'https://api.alinmove.com/api',

  // Supabase Configuration
  SUPABASE_URL: __DEV__ ? `http://${DEV_HOST}:6321` : 'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',

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

