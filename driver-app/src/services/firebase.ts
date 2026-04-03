// ============================================================
// ALiN Move Driver App - Realtime Service (Supabase)
// ============================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Location, EmergencyAlert } from '../types';

// ---- Driver Location Updates (Broadcast) ----

export function updateDriverLocation(riderId: number, location: Location): void {
  const channel = supabase.channel(`driver-location-${riderId}`);
  channel.send({
    type: 'broadcast',
    event: 'location',
    payload: {
      rider_id: riderId,
      lat: location.latitude,
      lng: location.longitude,
      heading: location.heading ?? 0,
      speed: location.speed ?? 0,
      timestamp: location.timestamp,
      updated_at: Date.now(),
    },
  });
}

export function setDriverOnline(riderId: number, isOnline: boolean): void {
  const channel = supabase.channel(`driver-status-${riderId}`);
  channel.send({
    type: 'broadcast',
    event: 'status',
    payload: {
      rider_id: riderId,
      online: isOnline,
      updated_at: Date.now(),
    },
  });
}

// ---- Job Tracking (for active deliveries) ----

export function updateJobLocation(
  jobId: number,
  riderId: number,
  location: Location
): void {
  const channel = supabase.channel(`job-tracking-${jobId}`);
  channel.send({
    type: 'broadcast',
    event: 'location',
    payload: {
      rider_id: riderId,
      lat: location.latitude,
      lng: location.longitude,
      heading: location.heading ?? 0,
      speed: location.speed ?? 0,
      timestamp: location.timestamp,
      updated_at: Date.now(),
    },
  });
}

// ---- Listen for Job Offers (realtime) ----

export function listenForJobOffers(
  riderId: number,
  callback: (offer: Record<string, unknown> | null) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`job-offers-${riderId}`)
    .on('broadcast', { event: 'new_offer' }, (payload) => {
      callback(payload.payload as Record<string, unknown>);
    })
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---- Emergency SOS Broadcast ----------------------------------------

/**
 * Broadcast SOS location update from the distressed rider's device.
 * Other riders subscribing to `emergency-branch-{branchId}` will receive
 * the live location pings while the alert is active.
 */
export function broadcastEmergencyLocation(
  branchId: number,
  alertId: number,
  riderId: number,
  location: Location
): void {
  const channel = supabase.channel(`emergency-branch-${branchId}`);
  channel.send({
    type: 'broadcast',
    event: 'emergency_location',
    payload: {
      alert_id: alertId,
      rider_id: riderId,
      lat: location.latitude,
      lng: location.longitude,
      heading: location.heading ?? 0,
      timestamp: location.timestamp,
    },
  });
}

/**
 * Subscribe to emergency events in the rider's branch.
 * Online riders call this to show nearby SOS alerts on their map.
 * Returns a cleanup function to unsubscribe.
 */
export function listenForBranchEmergencies(
  branchId: number,
  onAlert: (alert: Partial<EmergencyAlert> & { alert_id: number; rider_id: number; lat: number; lng: number }) => void,
  onResolved: (data: { alert_id: number; status: string }) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`emergency-branch-${branchId}`)
    .on('broadcast', { event: 'emergency_location' }, (payload) => {
      onAlert(payload.payload as any);
    })
    .on('broadcast', { event: 'emergency_resolved' }, (payload) => {
      onResolved(payload.payload as { alert_id: number; status: string });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcast to branch that an emergency has been resolved/cancelled.
 * Called by the distressed rider's device after confirm from API.
 */
export function broadcastEmergencyResolved(
  branchId: number,
  alertId: number,
  status: 'resolved' | 'cancelled'
): void {
  const channel = supabase.channel(`emergency-branch-${branchId}`);
  channel.send({
    type: 'broadcast',
    event: 'emergency_resolved',
    payload: { alert_id: alertId, status },
  });
}

