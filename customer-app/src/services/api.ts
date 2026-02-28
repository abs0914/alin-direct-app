// ============================================================
// ALiN Direct Customer App - API Service
// ============================================================
// Production: Axios HTTP calls to Laravel API with Supabase JWT.
// The Supabase access_token is sent as Bearer token; the Laravel
// SupabaseAuth middleware validates it and resolves the user.

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import Config from '../config';
import { User, Customer, DeliveryJob, PriceEstimate } from '../types';

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
    const res = await this.client.post('/customer/register', data);
    return res.data;
  }

  // ── Profile ───────────────────────────────────────

  async getProfile(): Promise<{ user: User; customer: Customer }> {
    const res = await this.client.get('/customer/profile');
    return res.data;
  }

  async updateProfile(data: Record<string, unknown>): Promise<{ user: User; customer: Customer }> {
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
    const res = await this.client.post('/customer/estimate', data);
    return res.data;
  }

  // ── Bookings ──────────────────────────────────────

  async createBooking(data: Record<string, unknown>): Promise<DeliveryJob> {
    const res = await this.client.post('/customer/bookings', data);
    return res.data;
  }

  async getBookingHistory(page: number = 1): Promise<{ data: DeliveryJob[] }> {
    const res = await this.client.get('/customer/bookings', { params: { page } });
    return res.data;
  }

  async getBookingDetail(id: number): Promise<DeliveryJob> {
    const res = await this.client.get(`/customer/bookings/${id}`);
    return res.data;
  }

  async getActiveBooking(): Promise<DeliveryJob | null> {
    const res = await this.client.get('/customer/bookings/active');
    return res.data.job ?? null;
  }

  async cancelBooking(id: number): Promise<{ success: boolean; job: DeliveryJob }> {
    const res = await this.client.post(`/customer/bookings/${id}/cancel`);
    return res.data;
  }

  // ── Driver Location (for tracking) ────────────────

  async getDriverLocation(jobId: number): Promise<{ lat: number | null; lng: number | null; last_seen_at: string | null }> {
    const res = await this.client.get(`/customer/bookings/${jobId}/driver-location`);
    return res.data;
  }
}

export default new ApiService();

