// ============================================================
// ALiN Direct Customer App - Realtime Service (Supabase)
// ============================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DriverLocation } from '../types';

// ---- Listen for Driver Location (during active delivery) ----

export function trackDriverLocation(
  jobId: number,
  callback: (location: DriverLocation | null) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`job-tracking-${jobId}`)
    .on('broadcast', { event: 'location' }, (payload) => {
      const data = payload.payload as Record<string, unknown>;
      if (data) {
        callback({
          lat: data.lat as number,
          lng: data.lng as number,
          heading: (data.heading as number) ?? 0,
          speed: (data.speed as number) ?? 0,
          timestamp: data.timestamp as number,
        });
      } else {
        callback(null);
      }
    })
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

