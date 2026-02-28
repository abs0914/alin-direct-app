// ============================================================
// ALiN Direct Customer App - In-Memory Job Store (Sprint 2)
// ============================================================
// MOCK: In-memory store for demo. Tracks active/past jobs locally.
// PRODUCTION: Replace with Supabase queries via Laravel API.

import { DeliveryJob, JobStatus } from '../types';
import { MOCK_JOB_HISTORY, MOCK_DRIVER, SIMULATED_ROUTE } from '../data/mockData';

let nextJobId = 200;
let activeJob: DeliveryJob | null = null;
const jobHistory: DeliveryJob[] = [...MOCK_JOB_HISTORY];

// Status change listeners
type JobListener = (job: DeliveryJob) => void;
const listeners: Set<JobListener> = new Set();

export function addJobListener(fn: JobListener) { listeners.add(fn); }
export function removeJobListener(fn: JobListener) { listeners.delete(fn); }
function notifyListeners(job: DeliveryJob) { listeners.forEach(fn => fn(job)); }

// ---- Create a new booking ----
export function createJob(data: {
  vehicle_type: string;
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
  total_price: number;
  payment_method: 'online' | 'cod';
}): DeliveryJob {
  const job: DeliveryJob = {
    id: nextJobId++,
    tracking_uuid: generateUUID(),
    sender_id: 1,
    rider_id: null,
    branch_id: 1,
    status: 'pending',
    vehicle_type: data.vehicle_type as DeliveryJob['vehicle_type'],
    pickup_contact_name: data.pickup_contact_name,
    pickup_contact_phone: data.pickup_contact_phone,
    pickup_address: data.pickup_address,
    pickup_lat: data.pickup_lat,
    pickup_lng: data.pickup_lng,
    pickup_notes: data.pickup_notes ?? null,
    dropoff_contact_name: data.dropoff_contact_name,
    dropoff_contact_phone: data.dropoff_contact_phone,
    dropoff_address: data.dropoff_address,
    dropoff_lat: data.dropoff_lat,
    dropoff_lng: data.dropoff_lng,
    dropoff_notes: data.dropoff_notes ?? null,
    package_description: data.package_description ?? null,
    package_size: data.package_size as DeliveryJob['package_size'],
    package_weight_kg: null,
    distance_km: null,
    total_price: data.total_price,
    payment_method: data.payment_method,
    payment_status: 'pending',
    accepted_at: null,
    picked_up_at: null,
    delivered_at: null,
    created_at: new Date().toISOString(),
  };

  activeJob = job;
  jobHistory.unshift(job);

  // Simulate driver assignment flow
  simulateJobFlow(job);

  return job;
}

// ---- Getters ----
export function getActiveJob(): DeliveryJob | null { return activeJob; }
export function getJobById(id: number): DeliveryJob | null {
  if (activeJob?.id === id) return activeJob;
  return jobHistory.find(j => j.id === id) ?? null;
}
export function getJobHistory(): DeliveryJob[] { return jobHistory; }

// ---- Simulate the full delivery flow ----
const STATUS_FLOW: { status: JobStatus; delayMs: number }[] = [
  { status: 'broadcasting', delayMs: 2000 },
  { status: 'accepted', delayMs: 4000 },
  { status: 'en_route_pickup', delayMs: 3000 },
  { status: 'at_pickup', delayMs: 5000 },
  { status: 'picked_up', delayMs: 3000 },
  { status: 'in_transit', delayMs: 3000 },
  { status: 'at_dropoff', delayMs: 8000 },
  { status: 'delivered', delayMs: 5000 },
];

let simulationTimers: ReturnType<typeof setTimeout>[] = [];
let gpsTimer: ReturnType<typeof setInterval> | null = null;

export function stopSimulation() {
  simulationTimers.forEach(t => clearTimeout(t));
  simulationTimers = [];
  if (gpsTimer) { clearInterval(gpsTimer); gpsTimer = null; }
}

function simulateJobFlow(job: DeliveryJob) {
  stopSimulation();
  let cumulativeDelay = 0;

  STATUS_FLOW.forEach(({ status, delayMs }) => {
    cumulativeDelay += delayMs;
    const timer = setTimeout(() => {
      job.status = status;
      if (status === 'accepted') {
        job.rider_id = 1;
        job.rider = MOCK_DRIVER;
        job.accepted_at = new Date().toISOString();
        startGPSSimulation(job.id);
      }
      if (status === 'picked_up') job.picked_up_at = new Date().toISOString();
      if (status === 'delivered') {
        job.delivered_at = new Date().toISOString();
        job.payment_status = 'paid';
        activeJob = null;
        stopGPSSimulation();
      }
      notifyListeners({ ...job });
    }, cumulativeDelay);
    simulationTimers.push(timer);
  });
}

// ---- GPS Simulation (broadcasts via callback) ----
type GPSListener = (lat: number, lng: number) => void;
const gpsListeners: Set<GPSListener> = new Set();
export function addGPSListener(fn: GPSListener) { gpsListeners.add(fn); }
export function removeGPSListener(fn: GPSListener) { gpsListeners.delete(fn); }

let routeIndex = 0;

function startGPSSimulation(_jobId: number) {
  routeIndex = 0;
  gpsTimer = setInterval(() => {
    if (routeIndex >= SIMULATED_ROUTE.length) { stopGPSSimulation(); return; }
    const pt = SIMULATED_ROUTE[routeIndex];
    gpsListeners.forEach(fn => fn(pt.lat, pt.lng));
    routeIndex++;
  }, 3000);
}

function stopGPSSimulation() {
  if (gpsTimer) { clearInterval(gpsTimer); gpsTimer = null; }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

