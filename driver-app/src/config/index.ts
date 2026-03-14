// ============================================================
// ALiN Move Driver App - Configuration
// ============================================================

import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine; web/iOS use localhost
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const Config = {
  // Demo / local testing mode
  DEMO_MODE: true,

  // API Configuration
  API_BASE_URL: __DEV__ ? `http://${DEV_HOST}:8000/api` : 'https://api.alinmove.com/api',

  // Supabase Configuration
  SUPABASE_URL: __DEV__ ? `http://${DEV_HOST}:54321` : 'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',

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

