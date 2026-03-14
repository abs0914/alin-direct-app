// ============================================================
// ALiN Move Customer App - Local Job State Manager
// ============================================================
// DEMO_MODE  → in-memory simulation with timer-driven status flow.
// LIVE MODE  → Supabase Realtime channels for status & GPS updates.

import { DeliveryJob, JobStatus } from '../types';
import { supabase } from '../lib/supabase';
import Config from '../config';
import { MOCK_JOB_HISTORY, MOCK_DRIVER, SIMULATED_ROUTE } from '../data/mockData';

// ── Shared state ─────────────────────────────────────────────
let activeJob: DeliveryJob | null = null;
let realtimeCleanup: (() => void) | null = null;

// ── Job Listeners (status changes) ───────────────────────────
type JobListener = (job: DeliveryJob) => void;
const jobListeners: Set<JobListener> = new Set();
export function addJobListener(fn: JobListener) { jobListeners.add(fn); }
export function removeJobListener(fn: JobListener) { jobListeners.delete(fn); }
function notifyJobListeners(job: DeliveryJob) { jobListeners.forEach(fn => fn(job)); }

// ── GPS Listeners (driver location) ──────────────────────────
type GPSListener = (lat: number, lng: number) => void;
const gpsListeners: Set<GPSListener> = new Set();
export function addGPSListener(fn: GPSListener) { gpsListeners.add(fn); }
export function removeGPSListener(fn: GPSListener) { gpsListeners.delete(fn); }
function notifyGPSListeners(lat: number, lng: number) { gpsListeners.forEach(fn => fn(lat, lng)); }

// ── Generic setters / getters ─────────────────────────────────
export function setActiveJob(job: DeliveryJob | null) {
  activeJob = job;
  if (job) notifyJobListeners(job);
}
export function getActiveJob(): DeliveryJob | null { return activeJob; }

// ══════════════════════════════════════════════════════════════
//  DEMO MODE helpers
// ══════════════════════════════════════════════════════════════

let demoJobCounter = 200;
let demoJobHistory: DeliveryJob[] = [...MOCK_JOB_HISTORY];
let demoTimers: ReturnType<typeof setTimeout>[] = [];
let demoGPSInterval: ReturnType<typeof setInterval> | null = null;

/** Simple deterministic UUID for demo jobs. */
function generateDemoUUID(): string {
  const hex = (n: number) => n.toString(16).padStart(4, '0');
  return `demo-${hex(Date.now() & 0xffff)}-${hex(++demoJobCounter)}-${hex(Math.random() * 0xffff | 0)}-xxxx`;
}

/** Create a local in-memory job from booking data and store it as active. */
export function createDemoJob(booking: Record<string, unknown>): DeliveryJob {
  const totalPrice = (booking.total_price as number) ?? 160;
  const job: DeliveryJob = {
    id: ++demoJobCounter,
    tracking_uuid: generateDemoUUID(),
    sender_id: 1,
    rider_id: null,
    branch_id: 1,
    status: 'pending',
    vehicle_type: (booking.vehicle_type as DeliveryJob['vehicle_type']) ?? 'motorcycle',
    pickup_contact_name: (booking.pickup_contact_name as string) ?? 'Customer',
    pickup_contact_phone: (booking.pickup_contact_phone as string) ?? '',
    pickup_address: (booking.pickup_address as string) ?? '',
    pickup_lat: (booking.pickup_lat as number) ?? 14.6000,
    pickup_lng: (booking.pickup_lng as number) ?? 120.9833,
    pickup_notes: null,
    dropoff_contact_name: (booking.dropoff_contact_name as string) ?? 'Recipient',
    dropoff_contact_phone: (booking.dropoff_contact_phone as string) ?? '',
    dropoff_address: (booking.dropoff_address as string) ?? '',
    dropoff_lat: (booking.dropoff_lat as number) ?? 14.5547,
    dropoff_lng: (booking.dropoff_lng as number) ?? 121.0244,
    dropoff_notes: null,
    package_description: (booking.package_description as string) ?? 'Package',
    package_size: 'small',
    package_weight_kg: 1,
    distance_km: 8,
    total_price: totalPrice,
    payment_method: (booking.payment_method as DeliveryJob['payment_method']) ?? 'cod',
    payment_status: 'pending',
    accepted_at: null,
    picked_up_at: null,
    delivered_at: null,
    created_at: new Date().toISOString(),
  };
  activeJob = job;
  return job;
}

/** Find a demo job by ID (active or in history). */
export function getDemoJobById(id: number): DeliveryJob | null {
  if (activeJob?.id === id) return activeJob;
  return demoJobHistory.find(j => j.id === id) ?? null;
}

/** Return the demo delivery history. */
export function getDemoJobHistory(): DeliveryJob[] {
  return demoJobHistory;
}

/** Cancel the active demo job by ID. */
export function cancelDemoJob(jobId: number): boolean {
  if (!activeJob || activeJob.id !== jobId) return false;
  clearDemoTimers();
  _applyDemoStatus('cancelled');
  return true;
}

/** Reset all demo state (call on logout). */
export function resetDemoState() {
  clearDemoTimers();
  activeJob = null;
  demoJobHistory = [...MOCK_JOB_HISTORY];
}

// ── Demo internal helpers ─────────────────────────────────────

function _applyDemoStatus(status: JobStatus, extras: Partial<DeliveryJob> = {}) {
  if (!activeJob) return;
  activeJob = { ...activeJob, status, ...extras };
  notifyJobListeners(activeJob);
  if (status === 'delivered') {
    demoJobHistory = [{ ...activeJob }, ...demoJobHistory];
    setTimeout(() => { activeJob = null; }, 4000);
  }
}

function clearDemoTimers() {
  demoTimers.forEach(t => clearTimeout(t));
  demoTimers = [];
  if (demoGPSInterval) { clearInterval(demoGPSInterval); demoGPSInterval = null; }
}

function startDemoGPS() {
  let idx = 0;
  demoGPSInterval = setInterval(() => {
    if (idx < SIMULATED_ROUTE.length) {
      notifyGPSListeners(SIMULATED_ROUTE[idx].lat, SIMULATED_ROUTE[idx].lng);
      idx++;
    } else {
      if (demoGPSInterval) { clearInterval(demoGPSInterval); demoGPSInterval = null; }
    }
  }, 3000);
}

// Status flow: [status, delayMs, attachRider?, startGPS?]
const DEMO_FLOW: Array<[JobStatus, number, boolean, boolean]> = [
  ['broadcasting',    3_000, false, false],
  ['accepted',        8_000, true,  false],
  ['en_route_pickup', 14_000, false, false],
  ['picked_up',       26_000, false, true],
  ['in_transit',      36_000, false, false],
  ['delivered',       54_000, false, false],
];

function startDemoSimulation(jobId: number) {
  clearDemoTimers();
  DEMO_FLOW.forEach(([status, delay, withRider, startGPS]) => {
    const t = setTimeout(() => {
      if (!activeJob || activeJob.id !== jobId) return;
      const extras: Partial<DeliveryJob> = {};
      if (withRider) {
        extras.rider_id = MOCK_DRIVER.id;
        extras.rider = MOCK_DRIVER as DeliveryJob['rider'];
        extras.accepted_at = new Date().toISOString();
      }
      if (status === 'picked_up') extras.picked_up_at = new Date().toISOString();
      if (status === 'delivered') {
        extras.delivered_at = new Date().toISOString();
        extras.payment_status = 'paid';
        if (demoGPSInterval) { clearInterval(demoGPSInterval); demoGPSInterval = null; }
      }
      _applyDemoStatus(status, extras);
      if (startGPS) startDemoGPS();
    }, delay);
    demoTimers.push(t);
  });
}

// ══════════════════════════════════════════════════════════════
//  Realtime tracking (unified entry point)
// ══════════════════════════════════════════════════════════════

export function startTrackingJob(jobId: number) {
  stopTrackingJob();

  if (Config.DEMO_MODE) {
    startDemoSimulation(jobId);
    return;
  }

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

  realtimeCleanup = () => { supabase.removeChannel(channel); };
}

export function stopTrackingJob() {
  if (Config.DEMO_MODE) {
    clearDemoTimers();
    return;
  }
  if (realtimeCleanup) {
    realtimeCleanup();
    realtimeCleanup = null;
  }
}

