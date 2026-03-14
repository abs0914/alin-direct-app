// ============================================================
// ALiN Move Customer App - API Service
// ============================================================
// DEMO_MODE  → returns local mock / in-memory data without HTTP.
// LIVE MODE  → Axios HTTP calls to Laravel API with Supabase JWT.

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import Config from '../config';
import { User, Customer, DeliveryJob, PriceEstimate } from '../types';
import { MOCK_USER, MOCK_CUSTOMER, MOCK_JOB_HISTORY, calculatePriceEstimate } from '../data/mockData';
import {
  createDemoJob,
  getActiveJob,
  getDemoJobById,
  getDemoJobHistory,
  cancelDemoJob,
} from '../store/jobStore';

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

  async registerCustomer(data: {
    name: string;
    email?: string;
    default_address?: string;
    default_lat?: number;
    default_lng?: number;
  }): Promise<{ user: User; customer: Customer }> {
    if (Config.DEMO_MODE) {
      return { user: { ...MOCK_USER, name: data.name, email: data.email ?? null }, customer: MOCK_CUSTOMER };
    }
    const res = await this.client.post('/customer/register', data);
    return res.data;
  }

  // ── Profile ───────────────────────────────────────

  async getProfile(): Promise<{ user: User; customer: Customer }> {
    if (Config.DEMO_MODE) return { user: MOCK_USER, customer: MOCK_CUSTOMER };
    const res = await this.client.get('/customer/profile');
    return res.data;
  }

  async updateProfile(data: Record<string, unknown>): Promise<{ user: User; customer: Customer }> {
    if (Config.DEMO_MODE) return { user: MOCK_USER, customer: MOCK_CUSTOMER };
    const res = await this.client.put('/customer/profile', data);
    return res.data;
  }

  // ── Price Estimation ──────────────────────────────

  async estimatePrice(data: {
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    vehicle_type: string;
    package_size?: string;
  }): Promise<PriceEstimate> {
    if (Config.DEMO_MODE) {
      return calculatePriceEstimate(
        data.vehicle_type,
        data.pickup_lat, data.pickup_lng,
        data.dropoff_lat, data.dropoff_lng,
      );
    }
    const res = await this.client.post('/customer/estimate', data);
    return res.data;
  }

  // ── Bookings ──────────────────────────────────────

  async createBooking(data: Record<string, unknown>): Promise<DeliveryJob> {
    if (Config.DEMO_MODE) return createDemoJob(data);
    const res = await this.client.post('/customer/bookings', data);
    return res.data;
  }

  async getBookingHistory(_page: number = 1): Promise<{ data: DeliveryJob[] }> {
    if (Config.DEMO_MODE) return { data: getDemoJobHistory() };
    const res = await this.client.get('/customer/bookings', { params: { page: _page } });
    return res.data;
  }

  async getBookingDetail(id: number): Promise<DeliveryJob> {
    if (Config.DEMO_MODE) {
      const job = getDemoJobById(id);
      if (!job) throw new Error(`Demo job ${id} not found`);
      return job;
    }
    const res = await this.client.get(`/customer/bookings/${id}`);
    return res.data;
  }

  async getActiveBooking(): Promise<DeliveryJob | null> {
    if (Config.DEMO_MODE) return getActiveJob();
    const res = await this.client.get('/customer/bookings/active');
    return res.data.job ?? null;
  }

  async cancelBooking(id: number): Promise<{ success: boolean; job: DeliveryJob }> {
    if (Config.DEMO_MODE) {
      cancelDemoJob(id);
      const job = getDemoJobById(id) ?? getDemoJobHistory()[0];
      return { success: true, job: job! };
    }
    const res = await this.client.post(`/customer/bookings/${id}/cancel`);
    return res.data;
  }

  // ── Driver Location (for tracking) ────────────────

  async getDriverLocation(jobId: number): Promise<{ lat: number | null; lng: number | null; last_seen_at: string | null }> {
    if (Config.DEMO_MODE) return { lat: null, lng: null, last_seen_at: null };
    const res = await this.client.get(`/customer/bookings/${jobId}/driver-location`);
    return res.data;
  }
}

export default new ApiService();

