// ============================================================
// ALiN Move Driver App - API Service
// ============================================================
// Production: Axios HTTP calls to Laravel API with Supabase JWT.
// The Supabase access_token is sent as Bearer token; the Laravel
// SupabaseAuth middleware validates it and resolves the user.

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import Config from '../config';
import { User, Rider, DeliveryJob, EarningsSummary, EmergencyAlert } from '../types';
import { MOCK_EARNINGS, MOCK_RIDER, MOCK_USER } from '../data/mockData';
import {
  advanceJobStatus,
  getActiveJob as getStoreActiveJob,
  getJobHistory as getStoreJobHistory,
  respondToOffer as storeRespondToOffer,
} from '../store/jobStore';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: 15000,
      headers: { 'Accept': 'application/json' },
    });

    // Attach Supabase JWT to every request
    this.client.interceptors.request.use(async (config) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ── Registration ──────────────────────────────────

  async registerRider(data: {
    name: string;
    vehicle_type: string;
    branch_id?: number;
    plate_number?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_color?: string;
    maya_phone?: string;
  }): Promise<{ user: User; rider: Rider }> {
    if (Config.DEMO_MODE) {
      await delay(500);
      return { user: MOCK_USER, rider: MOCK_RIDER };
    }
    const res = await this.client.post('/rider/register', data);
    return res.data;
  }

  // ── Profile ───────────────────────────────────────

  async getProfile(): Promise<{ user: User; rider: Rider }> {
    if (Config.DEMO_MODE) {
      await delay(300);
      return { user: MOCK_USER, rider: MOCK_RIDER };
    }
    const res = await this.client.get('/rider/profile');
    return res.data;
  }

  async updateProfile(data: Record<string, unknown>): Promise<{ user: User; rider: Rider }> {
    const res = await this.client.put('/rider/profile', data);
    return res.data;
  }

  // ── Availability ──────────────────────────────────

  async updateAvailability(availability: 'online' | 'offline'): Promise<{ availability: string }> {
    if (Config.DEMO_MODE) {
      await delay(300);
      MOCK_RIDER.availability = availability;
      return { availability };
    }
    const res = await this.client.put('/rider/availability', { availability });
    return res.data;
  }

  // ── Location ──────────────────────────────────────

  async updateLocation(lat: number, lng: number, heading?: number, speed?: number): Promise<{ success: boolean }> {
    if (Config.DEMO_MODE) {
      await delay(100);
      return { success: true };
    }
    const res = await this.client.put('/rider/location', { lat, lng, heading, speed });
    return res.data;
  }

  // ── Jobs ──────────────────────────────────────────

  async getActiveJob(): Promise<DeliveryJob | null> {
    if (Config.DEMO_MODE) {
      await delay(300);
      return getStoreActiveJob();
    }
    const res = await this.client.get('/rider/jobs/active');
    return res.data.job ?? null;
  }

  async getJobHistory(page: number = 1): Promise<{ data: DeliveryJob[] }> {
    if (Config.DEMO_MODE) {
      await delay(400);
      const allJobs = getStoreJobHistory();
      const pageSize = 15;
      const start = (page - 1) * pageSize;
      return { data: allJobs.slice(start, start + pageSize) };
    }
    const res = await this.client.get('/rider/jobs/history', { params: { page } });
    return res.data;
  }

  async respondToOffer(offerId: number, action: 'accept' | 'reject'): Promise<{ success: boolean; job: DeliveryJob | null; offer_id: number }> {
    if (Config.DEMO_MODE) {
      await delay(500);
      const job = storeRespondToOffer(action);
      return { success: true, job, offer_id: offerId };
    }
    const res = await this.client.post(`/rider/offers/${offerId}/respond`, { action });
    return res.data;
  }

  async updateJobStatus(jobId: number, status: string, data?: Record<string, unknown>): Promise<{ success: boolean; job: DeliveryJob }> {
    if (Config.DEMO_MODE) {
      await delay(400);
      const job = advanceJobStatus();
      if (!job) {
        throw new Error('No active job to update.');
      }
      return { success: true, job };
    }
    const res = await this.client.put(`/rider/jobs/${jobId}/status`, { status, ...data });
    return res.data;
  }

  // ── Proof of Delivery ─────────────────────────────

  async submitPod(jobId: number, formData: FormData): Promise<{ success: boolean }> {
    const res = await this.client.post(`/rider/jobs/${jobId}/pod`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ── Earnings ──────────────────────────────────────

  async getEarnings(): Promise<EarningsSummary> {
    if (Config.DEMO_MODE) {
      await delay(400);
      return { ...MOCK_EARNINGS };
    }
    const res = await this.client.get('/rider/earnings');
    return res.data;
  }

  // ── Payouts ───────────────────────────────────────

  async requestPayout(amount: number): Promise<{ success: boolean; message: string }> {
    if (Config.DEMO_MODE) {
      await delay(800);
      MOCK_EARNINGS.pending_payout = Math.max(0, MOCK_EARNINGS.pending_payout - amount);
      return { success: true, message: 'Payout request submitted.' };
    }
    const res = await this.client.post('/rider/payouts', { amount });
    return res.data;
  }

  // ── Emergency SOS ─────────────────────────────────

  async triggerEmergency(lat: number, lng: number, notes?: string): Promise<{ success: boolean; alert: EmergencyAlert }> {
    const res = await this.client.post('/rider/emergency', { lat, lng, notes });
    return res.data;
  }

  async getMyActiveEmergency(): Promise<{ alert: EmergencyAlert | null }> {
    const res = await this.client.get('/rider/emergency/active');
    return res.data;
  }

  async getNearbyEmergencies(): Promise<{ alerts: EmergencyAlert[] }> {
    const res = await this.client.get('/rider/emergency/nearby');
    return res.data;
  }

  async respondToEmergency(alertId: number): Promise<{ success: boolean; alert: EmergencyAlert; job: DeliveryJob | null }> {
    const res = await this.client.post(`/rider/emergency/${alertId}/respond`);
    return res.data;
  }

  async resolveEmergency(alertId: number): Promise<{ success: boolean; alert: EmergencyAlert }> {
    const res = await this.client.post(`/rider/emergency/${alertId}/resolve`);
    return res.data;
  }

  async cancelEmergency(alertId: number): Promise<{ success: boolean }> {
    const res = await this.client.post(`/rider/emergency/${alertId}/cancel`);
    return res.data;
  }

  // ── Documents (KYC) ───────────────────────────────

  async uploadDocument(type: string, file: { uri: string; name: string; type: string }): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file as unknown as Blob);
    const res = await this.client.post('/rider/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
}

export default new ApiService();

