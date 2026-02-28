// ============================================================
// ALiN Direct Customer App - Mock Data (Sprint 2: Demo Mode)
// ============================================================
// MOCK: This entire file is mock data for demo purposes.
// PRODUCTION: Remove this file; real data comes from Supabase/Laravel API.

import { User, Customer, DeliveryJob, PriceEstimate } from '../types';

// ---- Mock User & Customer ----
export const MOCK_USER: User = {
  id: 1,
  name: 'Maria Santos',
  email: 'maria.santos@email.com',
  phone: '+639171234567',
  user_type: 'customer',
  is_active: true,
  avatar_url: null,
};

export const MOCK_CUSTOMER: Customer = {
  id: 1,
  user_id: 1,
  default_address: '123 Rizal Avenue, Sta. Cruz, Manila 1003',
  default_lat: 14.6000,
  default_lng: 120.9833,
  total_bookings: 12,
};

// ---- Pricing Tables (per vehicle type) ----
export const PRICING: Record<string, { base_fare: number; per_km: number }> = {
  motorcycle: { base_fare: 60, per_km: 15 },
  mpv: { base_fare: 100, per_km: 20 },
  van: { base_fare: 200, per_km: 25 },
  truck: { base_fare: 500, per_km: 30 },
};

// ---- Mock Driver (assigned to active deliveries) ----
export const MOCK_DRIVER = {
  id: 1,
  vehicle_type: 'motorcycle',
  plate_number: 'ABC 1234',
  rating: 4.8,
  user: { name: 'Juan Dela Cruz', phone: '+639181234567' },
};

// ---- Sample Addresses for Manila Area ----
export const SAMPLE_ADDRESSES = [
  { address: '123 Rizal Avenue, Sta. Cruz, Manila 1003', lat: 14.6000, lng: 120.9833 },
  { address: '456 Ayala Avenue, Makati City 1226', lat: 14.5547, lng: 121.0244 },
  { address: '789 Bonifacio High Street, BGC, Taguig 1634', lat: 14.5515, lng: 121.0502 },
  { address: '321 Ortigas Ave, Pasig City 1605', lat: 14.5876, lng: 121.0614 },
  { address: '55 España Blvd, Sampaloc, Manila 1015', lat: 14.6099, lng: 120.9903 },
  { address: '88 Katipunan Ave, Quezon City 1108', lat: 14.6319, lng: 121.0748 },
  { address: 'SM Mall of Asia, Pasay City 1300', lat: 14.5351, lng: 120.9830 },
  { address: 'Robinsons Galleria, Ortigas, Quezon City 1100', lat: 14.5870, lng: 121.0568 },
];

// ---- Mock Delivery History ----
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
    distance_km: 8.5, total_price: 187.50, payment_method: 'cod',
    payment_status: 'paid', accepted_at: '2026-02-15T10:05:00Z',
    picked_up_at: '2026-02-15T10:20:00Z', delivered_at: '2026-02-15T10:55:00Z',
    created_at: '2026-02-15T10:00:00Z',
    rider: MOCK_DRIVER,
  },
  {
    id: 99, tracking_uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    sender_id: 1, rider_id: 1, branch_id: 1, status: 'delivered',
    vehicle_type: 'mpv',
    pickup_contact_name: 'Maria Santos', pickup_contact_phone: '+639171234567',
    pickup_address: '55 España Blvd, Sampaloc, Manila 1015',
    pickup_lat: 14.6099, pickup_lng: 120.9903, pickup_notes: null,
    dropoff_contact_name: 'Carlos Garcia', dropoff_contact_phone: '+639203456789',
    dropoff_address: '789 Bonifacio High Street, BGC, Taguig 1634',
    dropoff_lat: 14.5515, dropoff_lng: 121.0502, dropoff_notes: 'Call upon arrival',
    package_description: 'Gift box', package_size: 'medium', package_weight_kg: 3.0,
    distance_km: 12.3, total_price: 346.00, payment_method: 'online',
    payment_status: 'paid', accepted_at: '2026-02-14T14:10:00Z',
    picked_up_at: '2026-02-14T14:30:00Z', delivered_at: '2026-02-14T15:15:00Z',
    created_at: '2026-02-14T14:00:00Z',
    rider: MOCK_DRIVER,
  },
  {
    id: 98, tracking_uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    sender_id: 1, rider_id: null, branch_id: 1, status: 'cancelled',
    vehicle_type: 'van',
    pickup_contact_name: 'Maria Santos', pickup_contact_phone: '+639171234567',
    pickup_address: '321 Ortigas Ave, Pasig City 1605',
    pickup_lat: 14.5876, pickup_lng: 121.0614, pickup_notes: null,
    dropoff_contact_name: 'Liza Mendoza', dropoff_contact_phone: '+639214567890',
    dropoff_address: 'SM Mall of Asia, Pasay City 1300',
    dropoff_lat: 14.5351, dropoff_lng: 120.9830, dropoff_notes: null,
    package_description: 'Furniture', package_size: 'large', package_weight_kg: 25.0,
    distance_km: 15.0, total_price: 575.00, payment_method: 'cod',
    payment_status: 'pending', accepted_at: null,
    picked_up_at: null, delivered_at: null,
    created_at: '2026-02-13T09:00:00Z',
  },
];

// ---- Utility: Calculate Price Estimate ----
export function calculatePriceEstimate(
  vehicleType: string,
  pickupLat: number, pickupLng: number,
  dropoffLat: number, dropoffLng: number,
): PriceEstimate {
  // Haversine approximation for demo
  const R = 6371;
  const dLat = (dropoffLat - pickupLat) * Math.PI / 180;
  const dLon = (dropoffLng - pickupLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(pickupLat * Math.PI / 180) * Math.cos(dropoffLat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const pricing = PRICING[vehicleType] ?? PRICING.motorcycle;
  const surge = 1.0; // No surge for demo
  const distanceFare = distance * pricing.per_km;
  const total = (pricing.base_fare + distanceFare) * surge;

  return {
    base_fare: pricing.base_fare,
    distance_fare: Math.round(distanceFare * 100) / 100,
    surge_multiplier: surge,
    total_price: Math.round(total * 100) / 100,
    estimated_distance_km: Math.round(distance * 10) / 10,
  };
}

// ---- GPS Route Simulation Points (Manila → Makati) ----
export const SIMULATED_ROUTE = [
  { lat: 14.6000, lng: 120.9833 }, // Sta. Cruz start
  { lat: 14.5950, lng: 120.9850 },
  { lat: 14.5900, lng: 120.9880 },
  { lat: 14.5850, lng: 120.9920 },
  { lat: 14.5800, lng: 120.9960 },
  { lat: 14.5750, lng: 121.0000 },
  { lat: 14.5700, lng: 121.0050 },
  { lat: 14.5660, lng: 121.0100 },
  { lat: 14.5620, lng: 121.0150 },
  { lat: 14.5580, lng: 121.0200 },
  { lat: 14.5547, lng: 121.0244 }, // Makati end
];

