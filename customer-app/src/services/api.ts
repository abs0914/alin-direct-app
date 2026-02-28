// ============================================================
// ALiN Direct Customer App - API Service (Mock Mode - Sprint 2)
// ============================================================
// MOCK: All methods return local mock data with simulated delays.
// PRODUCTION: Restore Axios HTTP calls to Laravel API (see git history).

import { MOCK_USER, MOCK_CUSTOMER, calculatePriceEstimate } from '../data/mockData';
import { createJob, getJobById, getJobHistory as getStoreHistory } from '../store/jobStore';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  // ---- Profile ---- (MOCK)
  async getProfile() {
    await delay(300);
    return { user: MOCK_USER, customer: MOCK_CUSTOMER };
  }

  async updateProfile(data: { name: string }) {
    await delay(300);
    return { ...MOCK_USER, ...data };
  }

  // ---- Booking ---- (MOCK)
  async estimatePrice(data: {
    pickup_lat: number; pickup_lng: number;
    dropoff_lat: number; dropoff_lng: number;
    vehicle_type: string;
  }) {
    await delay(500);
    return calculatePriceEstimate(
      data.vehicle_type,
      data.pickup_lat, data.pickup_lng,
      data.dropoff_lat, data.dropoff_lng,
    );
  }

  async createBooking(data: Record<string, unknown>) {
    await delay(800);
    const job = createJob(data as Parameters<typeof createJob>[0]);
    return job;
  }

  async getBookingHistory(_page: number = 1) {
    await delay(400);
    const allJobs = getStoreHistory();
    const pageSize = 15;
    const start = (_page - 1) * pageSize;
    return { data: allJobs.slice(start, start + pageSize) };
  }

  async getBookingDetail(id: number) {
    await delay(300);
    const job = getJobById(id);
    if (!job) throw new Error('Job not found');
    return job;
  }

  async cancelBooking(id: number) {
    await delay(400);
    const job = getJobById(id);
    if (job) {
      job.status = 'cancelled';
      job.payment_status = 'refunded';
    }
    return { success: true };
  }
}

export default new ApiService();

