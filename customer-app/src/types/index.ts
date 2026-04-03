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
  package_size: string; // e.g. box_xlarge, box_large, box_medium, box_small, box_5kg, box_3kg, box_1kg, pouch_large, pouch_medium, pouch_small, pouch_xsmall
  box_type: 'own_box' | 'alin_box';
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

export type ServiceType = 'intra' | 'cross';

export interface PriceEstimate {
  /** Flat rate from the ALiN rate card (new pricing model). */
  flat_rate: number;
  service_type: ServiceType;
  total_price: number;
  // Legacy fields — kept for backward compatibility
  base_fare?: number;
  distance_fare?: number;
  surge_multiplier?: number;
  box_type_surcharge?: number;
  estimated_distance_km?: number;
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
  box_type?: 'own_box' | 'alin_box';
  service_type?: ServiceType;
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

// ── Support / Chat ────────────────────────────────────

export type SupportSenderType = 'customer' | 'bot' | 'agent';

export type ConversationStatus =
  | 'open'
  | 'bot_handling'
  | 'pending_agent'
  | 'agent_active'
  | 'resolved'
  | 'closed';

export type SupportIntent =
  | 'tracking'
  | 'pricing'
  | 'complaint'
  | 'damage'
  | 'payment'
  | 'account'
  | 'escalation'
  | 'other';

export interface SupportMessage {
  id: number;
  conversation_id: number;
  sender_type: SupportSenderType;
  body: string;
  message_type: 'text' | 'status_update' | 'internal_note';
  created_at: string;
  // Optimistic local-only flag (not from API)
  _pending?: boolean;
}

export interface SupportConversation {
  id: number;
  status: ConversationStatus;
  intent: SupportIntent | null;
  escalation_flag: boolean;
  last_message_at: string | null;
  created_at: string;
  messages?: SupportMessage[];
  latest_message?: SupportMessage;
  case?: {
    id: number;
    category: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: string;
  };
}

export interface SendMessageResponse {
  conversation_id: number;
  bot_reply: string | null;
  escalated: boolean;
  status: ConversationStatus;
}

