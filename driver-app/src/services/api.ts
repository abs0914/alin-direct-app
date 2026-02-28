// ============================================================
// ALiN Direct Driver App - API Service
// ============================================================
// Production: Axios HTTP calls to Laravel API with Supabase JWT.
// The Supabase access_token is sent as Bearer token; the Laravel
// SupabaseAuth middleware validates it and resolves the user.

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import Config from '../config';
import { User, Rider, DeliveryJob, EarningsSummary } from '../types';

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
    const res = await this.client.post('/rider/register', data);
    return res.data;
  }

  // ── Profile ───────────────────────────────────────

  async getProfile(): Promise<{ user: User; rider: Rider }> {
    const res = await this.client.get('/rider/profile');
    return res.data;
  }

  async updateProfile(data: Record<string, unknown>): Promise<{ user: User; rider: Rider }> {
    const res = await this.client.put('/rider/profile', data);
    return res.data;
  }

  // ── Availability ──────────────────────────────────

  async updateAvailability(availability: 'online' | 'offline'): Promise<{ availability: string }> {
    const res = await this.client.put('/rider/availability', { availability });
    return res.data;
  }

  // ── Location ──────────────────────────────────────

  async updateLocation(lat: number, lng: number, heading?: number, speed?: number): Promise<{ success: boolean }> {
    const res = await this.client.put('/rider/location', { lat, lng, heading, speed });
    return res.data;
  }

  // ── Jobs ──────────────────────────────────────────

  async getActiveJob(): Promise<DeliveryJob | null> {
    const res = await this.client.get('/rider/jobs/active');
    return res.data.job ?? null;
  }

  async getJobHistory(page: number = 1): Promise<{ data: DeliveryJob[] }> {
    const res = await this.client.get('/rider/jobs/history', { params: { page } });
    return res.data;
  }

  async respondToOffer(offerId: number, action: 'accept' | 'reject'): Promise<{ success: boolean; job: DeliveryJob | null; offer_id: number }> {
    const res = await this.client.post(`/rider/offers/${offerId}/respond`, { action });
    return res.data;
  }

  async updateJobStatus(jobId: number, status: string, data?: Record<string, unknown>): Promise<{ success: boolean; job: DeliveryJob }> {
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
    const res = await this.client.get('/rider/earnings');
    return res.data;
  }

  // ── Payouts ───────────────────────────────────────

  async requestPayout(amount: number): Promise<{ success: boolean; message: string }> {
    const res = await this.client.post('/rider/payouts', { amount });
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

