// ============================================================
// ALiN Direct Customer App - Local Job State Manager
// ============================================================
// Manages local in-memory state for the active booking.
// Populated from API calls and Supabase Realtime events.

import { DeliveryJob } from '../types';
import { supabase } from '../lib/supabase';

let activeJob: DeliveryJob | null = null;
let realtimeCleanup: (() => void) | null = null;

// ---- Job Listeners (status changes) ----
type JobListener = (job: DeliveryJob) => void;
const jobListeners: Set<JobListener> = new Set();
export function addJobListener(fn: JobListener) { jobListeners.add(fn); }
export function removeJobListener(fn: JobListener) { jobListeners.delete(fn); }
function notifyJobListeners(job: DeliveryJob) { jobListeners.forEach(fn => fn(job)); }

// ---- GPS Listeners (driver location) ----
type GPSListener = (lat: number, lng: number) => void;
const gpsListeners: Set<GPSListener> = new Set();
export function addGPSListener(fn: GPSListener) { gpsListeners.add(fn); }
export function removeGPSListener(fn: GPSListener) { gpsListeners.delete(fn); }
function notifyGPSListeners(lat: number, lng: number) { gpsListeners.forEach(fn => fn(lat, lng)); }

// ---- Set active job (called after API fetch) ----
export function setActiveJob(job: DeliveryJob | null) {
  activeJob = job;
  if (job) notifyJobListeners(job);
}

// ---- Getters ----
export function getActiveJob(): DeliveryJob | null { return activeJob; }

// ---- Subscribe to Supabase Realtime job updates ----
export function startTrackingJob(jobId: number) {
  stopTrackingJob();

  const channel = supabase
    .channel(`job-updates-${jobId}`)
    .on('broadcast', { event: 'status_change' }, (payload) => {
      const updatedJob = payload.payload as DeliveryJob;
      activeJob = updatedJob;
      notifyJobListeners(updatedJob);
    })
    .on('broadcast', { event: 'driver_location' }, (payload) => {
      const { lat, lng } = payload.payload as { lat: number; lng: number };
      notifyGPSListeners(lat, lng);
    })
    .subscribe();

  realtimeCleanup = () => {
    supabase.removeChannel(channel);
  };
}

export function stopTrackingJob() {
  if (realtimeCleanup) {
    realtimeCleanup();
    realtimeCleanup = null;
  }
}

