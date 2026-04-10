// ============================================================
// ALiN Move Customer App - API Service
// ============================================================
// DEMO_MODE  → returns local mock / in-memory data without HTTP.
// LIVE MODE  → Axios HTTP calls to Laravel API with Supabase JWT.

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../lib/supabase';
import Config from '../config';
import {
  User, Customer, DeliveryJob, PriceEstimate, ServiceType,
  SupportConversation, SupportMessage, SendMessageResponse,
} from '../types';
import { MOCK_USER, MOCK_CUSTOMER, MOCK_JOB_HISTORY, calculatePriceEstimate } from '../data/mockData';
import {
  createDemoJob,
  getActiveJob,
  getDemoJobById,
  getDemoJobHistory,
  cancelDemoJob,
} from '../store/jobStore';
import {
  getDemoConversations,
  getDemoConversation,
  sendDemoMessage,
  closeDemoConversation,
} from '../store/supportStore';

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
    box_type?: 'own_box' | 'alin_box';
    service_type?: ServiceType;
  }): Promise<PriceEstimate> {
    if (Config.DEMO_MODE) {
      return calculatePriceEstimate(
        data.package_size ?? 'pouch_small',
        data.box_type ?? 'own_box',
        data.service_type ?? 'intra',
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

  // ── Support / Chat ────────────────────────────────

  async startSupportChat(message: string, deliveryJobId?: number): Promise<SendMessageResponse> {
    if (Config.DEMO_MODE) return sendDemoMessage(null, message);
    const res = await this.client.post('/customer/support/start', {
      message,
      delivery_job_id: deliveryJobId ?? null,
    });
    return res.data;
  }

  async sendSupportMessage(conversationId: number, message: string): Promise<SendMessageResponse> {
    if (Config.DEMO_MODE) return sendDemoMessage(conversationId, message);
    const res = await this.client.post(`/customer/support/conversations/${conversationId}/message`, { message });
    return res.data;
  }

  async getSupportConversations(): Promise<SupportConversation[]> {
    if (Config.DEMO_MODE) return getDemoConversations();
    const res = await this.client.get('/customer/support/conversations');
    return res.data;
  }

  async getSupportConversation(conversationId: number): Promise<SupportConversation> {
    if (Config.DEMO_MODE) return getDemoConversation(conversationId);
    const res = await this.client.get(`/customer/support/conversations/${conversationId}`);
    return res.data;
  }

  async closeSupportConversation(conversationId: number): Promise<void> {
    if (Config.DEMO_MODE) { closeDemoConversation(conversationId); return; }
    await this.client.post(`/customer/support/conversations/${conversationId}/close`);
  }

  async registerPushToken(expoPushToken: string): Promise<void> {
    if (Config.DEMO_MODE) return;
    await this.client.put('/me/push-token', { expo_push_token: expoPushToken });
  }

  // ── Personal Accident Insurance ───────────────────

  async getInsurance(): Promise<{ insurance: PaiPolicy | null }> {
    if (Config.DEMO_MODE) {
      return {
        insurance: {
          id: 1,
          policy_number: 'PAI-DEMO0001',
          member_id: 'ALN-000001',
          full_name: 'Juan dela Cruz',
          nationality: 'Filipino',
          mobile: '+63 912 345 6789',
          email: 'juan@example.com',
          date_of_birth: '1990-01-15',
          address: 'Unit D6-D7 Jamestown, Mandaue City, Cebu',
          beneficiaries: [{ name: 'Maria dela Cruz', relationship: 'Spouse' }],
          valid_from: '2026-01-01',
          valid_until: '2027-01-01',
          validity_years: '2026–2027',
          status: 'active',
          is_active: true,
          branch_name: 'Mandaue Main',
          verify_url: 'http://localhost:8000/verify/pai/PAI-DEMO0001',
          coverage: { death: 100000, murder: 10000, medical: 5000, burial: 5000 },
        },
      };
    }
    const res = await this.client.get('/customer/insurance');
    return res.data;
  }
}

export interface PaiPolicy {
  id: number;
  policy_number: string;
  member_id: string;
  full_name: string;
  nationality: string;
  mobile: string;
  email: string;
  date_of_birth: string;
  address: string;
  beneficiaries: { name: string; relationship: string }[] | null;
  valid_from: string;
  valid_until: string;
  validity_years: string;
  status: 'active' | 'expired' | 'cancelled';
  is_active: boolean;
  branch_name: string | null;
  verify_url: string;
  coverage: { death: number; murder: number; medical: number; burial: number };
}

export default new ApiService();

