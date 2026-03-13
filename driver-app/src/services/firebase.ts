// ============================================================
// ALiN Move Driver App - Realtime Service (Supabase)
// ============================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Location } from '../types';

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

