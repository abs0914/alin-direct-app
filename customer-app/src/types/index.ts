// ============================================================
// ALiN Move Customer App - Core Type Definitions
// ============================================================

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  user_type: 'customer';
  is_active: boolean;
  avatar_url: string | null;
}

export interface Customer {
  id: number;
  user_id: number;
  default_address: string | null;
  default_lat: number | null;
  default_lng: number | null;
  total_bookings: number;
}

export interface DeliveryJob {
  id: number;
  tracking_uuid: string;
  sender_id: number | null;
  rider_id: number | null;
  branch_id: number;
  status: JobStatus;
  vehicle_type: 'motorcycle' | 'mpv' | 'van' | 'truck';
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_notes: string | null;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_notes: string | null;
  package_description: string | null;
  package_size: 'small' | 'medium' | 'large' | 'extra_large';
  package_weight_kg: number | null;
  distance_km: number | null;
  total_price: number;
  payment_method: 'online' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  rider?: {
    id: number;
    vehicle_type: string;
    plate_number: string | null;
    rating: number;
    user?: { name: string; phone: string };
  };
}

export type JobStatus =
  | 'pending'
  | 'broadcasting'
  | 'accepted'
  | 'en_route_pickup'
  | 'at_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'at_dropoff'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'returned';

export interface PriceEstimate {
  base_fare: number;
  distance_fare: number;
  surge_multiplier: number;
  total_price: number;
  estimated_distance_km: number;
}

export interface BookingRequest {
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_notes?: string;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_notes?: string;
  package_description?: string;
  package_size: string;
  vehicle_type: string;
  payment_method: 'online' | 'cod';
}

export interface AuthResponse {
  token: string;
  user: User;
  customer: Customer;
}

export interface OtpRequestResponse {
  message: string;
  expires_in: number;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

