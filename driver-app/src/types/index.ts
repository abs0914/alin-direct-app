// ============================================================
// ALiN Move Driver App - Core Type Definitions
// ============================================================

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  user_type: 'rider';
  is_active: boolean;
  avatar_url: string | null;
}

export interface Rider {
  id: number;
  user_id: number;
  branch_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'blacklisted';
  availability: 'offline' | 'online' | 'on_job';
  vehicle_type: 'motorcycle' | 'mpv' | 'van' | 'truck';
  plate_number: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_url: string | null;
  or_cr_url: string | null;
  nbi_clearance_url: string | null;
  selfie_url: string | null;
  maya_wallet_id: string | null;
  maya_phone: string | null;
  rating: number;
  total_deliveries: number;
  user?: User;
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
  base_fare: number;
  distance_fare: number;
  surge_multiplier: number;
  total_price: number;
  rider_earnings: number;
  platform_commission: number;
  payment_method: 'online' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  cod_collected: boolean;
  cod_settled: boolean;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
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

export interface JobOffer {
  id: number;
  job_id: number;
  rider_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  offered_at: string;
  expires_at: string;
  responded_at: string | null;
  job?: DeliveryJob;
}

export interface AuthResponse {
  token: string;
  user: User;
  rider: Rider;
}

export interface OtpRequestResponse {
  message: string;
  expires_in: number;
}

export interface EarningsSummary {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
  pending_payout: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

