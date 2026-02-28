// ============================================================
// ALiN Direct Driver App - API Service (Mock Mode - Sprint 2)
// ============================================================
// MOCK: All methods return local mock data with simulated delays.
// PRODUCTION: Restore Axios HTTP calls to Laravel API (see git history).

import { MOCK_USER, MOCK_RIDER, MOCK_EARNINGS } from '../data/mockData';
import {
  getActiveJob as storeGetActiveJob,
  getJobHistory as storeGetJobHistory,
  respondToOffer as storeRespondToOffer,
  advanceJobStatus,
} from '../store/jobStore';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  // ---- Profile ---- (MOCK)
  async getProfile() {
    await delay(300);
    return { user: MOCK_USER, rider: MOCK_RIDER };
  }

  async registerRider(_data: { name: string; phone: string; vehicle_type: string }) {
    await delay(500);
    return { user: MOCK_USER, rider: MOCK_RIDER };
  }

  // ---- Driver Status ---- (MOCK)
  async updateAvailability(availability: 'online' | 'offline') {
    await delay(300);
    MOCK_RIDER.availability = availability;
    return { availability };
  }

  async updateLocation(_lat: number, _lng: number, _heading?: number, _speed?: number) {
    await delay(100);
    return { success: true };
  }

  // ---- Jobs ---- (MOCK)
  async getActiveJob() {
    await delay(300);
    return storeGetActiveJob();
  }

  async getJobHistory(page: number = 1) {
    await delay(400);
    const allJobs = storeGetJobHistory();
    const pageSize = 15;
    const start = (page - 1) * pageSize;
    return { data: allJobs.slice(start, start + pageSize) };
  }

  async respondToOffer(offerId: number, action: 'accept' | 'reject') {
    await delay(500);
    const job = storeRespondToOffer(action);
    return { success: true, job, offer_id: offerId };
  }

  async updateJobStatus(jobId: number, status: string, _data?: Record<string, unknown>) {
    await delay(400);
    const job = advanceJobStatus();
    return { success: true, job, requested_status: status, job_id: jobId };
  }

  // ---- Earnings ---- (MOCK)
  async getEarnings() {
    await delay(400);
    return MOCK_EARNINGS;
  }

  async requestPayout(amount: number) {
    await delay(800);
    MOCK_EARNINGS.pending_payout -= amount;
    return { success: true, message: 'Payout request submitted' };
  }
}

export default new ApiService();

