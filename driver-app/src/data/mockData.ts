// ============================================================
// ALiN Direct Driver App - Mock Data (Sprint 2: Demo Mode)
// ============================================================
// MOCK: This entire file is mock data for demo purposes.
// PRODUCTION: Remove this file; real data comes from Supabase/Laravel API.

import { User, Rider, DeliveryJob, JobOffer, EarningsSummary } from '../types';

// ---- Mock User & Rider ----
export const MOCK_USER: User = {
  id: 2,
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@email.com',
  phone: '+639181234567',
  user_type: 'rider',
  is_active: true,
  avatar_url: null,
};

export const MOCK_RIDER: Rider = {
  id: 1,
  user_id: 2,
  branch_id: 1,
  status: 'approved',
  availability: 'offline',
  vehicle_type: 'motorcycle',
  plate_number: 'ABC 1234',
  vehicle_brand: 'Honda',
  vehicle_model: 'Click 160',
  vehicle_color: 'White',
  license_url: null,
  or_cr_url: null,
  nbi_clearance_url: null,
  selfie_url: null,
  maya_wallet_id: null,
  maya_phone: '+639181234567',
  rating: 4.8,
  total_deliveries: 156,
  user: MOCK_USER,
};

// ---- Mock Earnings ----
export const MOCK_EARNINGS: EarningsSummary = {
  today: 450.00,
  this_week: 3250.00,
  this_month: 12800.00,
  total: 78500.00,
  pending_payout: 3250.00,
};

// ---- Mock Incoming Job Offer ----
export function createMockJobOffer(): { offer: JobOffer; job: DeliveryJob } {
  const job: DeliveryJob = {
    id: 201,
    tracking_uuid: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
    sender_id: 1,
    rider_id: null,
    branch_id: 1,
    status: 'broadcasting',
    vehicle_type: 'motorcycle',
    pickup_contact_name: 'Maria Santos',
    pickup_contact_phone: '+639171234567',
    pickup_address: '123 Rizal Avenue, Sta. Cruz, Manila 1003',
    pickup_lat: 14.6000,
    pickup_lng: 120.9833,
    pickup_notes: 'Ground floor, near the entrance',
    dropoff_contact_name: 'Ana Reyes',
    dropoff_contact_phone: '+639192345678',
    dropoff_address: '456 Ayala Avenue, Makati City 1226',
    dropoff_lat: 14.5547,
    dropoff_lng: 121.0244,
    dropoff_notes: 'Leave at lobby guard',
    package_description: 'Documents and small box',
    package_size: 'small',
    package_weight_kg: 1.5,
    distance_km: 8.5,
    base_fare: 60,
    distance_fare: 127.50,
    surge_multiplier: 1.0,
    total_price: 187.50,
    rider_earnings: 150.00,
    platform_commission: 37.50,
    payment_method: 'cod',
    payment_status: 'pending',
    cod_collected: false,
    cod_settled: false,
    accepted_at: null,
    picked_up_at: null,
    delivered_at: null,
    failed_at: null,
    cancelled_at: null,
    created_at: new Date().toISOString(),
  };

  const offer: JobOffer = {
    id: 1,
    job_id: job.id,
    rider_id: MOCK_RIDER.id,
    status: 'pending',
    offered_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30000).toISOString(),
    responded_at: null,
    job,
  };

  return { offer, job };
}

// ---- Mock Job History (past completed deliveries) ----
export const MOCK_JOB_HISTORY: DeliveryJob[] = [
  {
    id: 100, tracking_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    sender_id: 1, rider_id: 1, branch_id: 1, status: 'delivered',
    vehicle_type: 'motorcycle',
    pickup_contact_name: 'Maria Santos', pickup_contact_phone: '+639171234567',
    pickup_address: '123 Rizal Avenue, Sta. Cruz, Manila 1003',
    pickup_lat: 14.6000, pickup_lng: 120.9833, pickup_notes: null,
    dropoff_contact_name: 'Ana Reyes', dropoff_contact_phone: '+639192345678',
    dropoff_address: '456 Ayala Avenue, Makati City 1226',
    dropoff_lat: 14.5547, dropoff_lng: 121.0244, dropoff_notes: 'Leave at lobby',
    package_description: 'Documents', package_size: 'small', package_weight_kg: 0.5,
    distance_km: 8.5, base_fare: 60, distance_fare: 127.50, surge_multiplier: 1.0,
    total_price: 187.50, rider_earnings: 150.00, platform_commission: 37.50,
    payment_method: 'cod', payment_status: 'paid',
    cod_collected: true, cod_settled: true,
    accepted_at: '2026-02-15T10:05:00Z', picked_up_at: '2026-02-15T10:20:00Z',
    delivered_at: '2026-02-15T10:55:00Z', failed_at: null, cancelled_at: null,
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 99, tracking_uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    sender_id: 3, rider_id: 1, branch_id: 1, status: 'delivered',
    vehicle_type: 'motorcycle',
    pickup_contact_name: 'Carlos Garcia', pickup_contact_phone: '+639203456789',
    pickup_address: '55 España Blvd, Sampaloc, Manila 1015',
    pickup_lat: 14.6099, pickup_lng: 120.9903, pickup_notes: null,
    dropoff_contact_name: 'Liza Mendoza', dropoff_contact_phone: '+639214567890',
    dropoff_address: '88 Katipunan Ave, Quezon City 1108',
    dropoff_lat: 14.6319, dropoff_lng: 121.0748, dropoff_notes: null,
    package_description: 'Food delivery', package_size: 'small', package_weight_kg: 2.0,
    distance_km: 10.2, base_fare: 60, distance_fare: 153.00, surge_multiplier: 1.0,
    total_price: 213.00, rider_earnings: 170.40, platform_commission: 42.60,
    payment_method: 'online', payment_status: 'paid',
    cod_collected: false, cod_settled: false,
    accepted_at: '2026-02-14T14:10:00Z', picked_up_at: '2026-02-14T14:30:00Z',
    delivered_at: '2026-02-14T15:15:00Z', failed_at: null, cancelled_at: null,
    created_at: '2026-02-14T14:00:00Z',
  },
];

