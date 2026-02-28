// ============================================================
// ALiN Direct Driver App - In-Memory Job Store (Sprint 2)
// ============================================================
// MOCK: In-memory store for demo. Tracks active job state locally.
// PRODUCTION: Replace with Supabase queries via Laravel API.

import { DeliveryJob, JobStatus, JobOffer } from '../types';
import { MOCK_JOB_HISTORY, MOCK_RIDER, createMockJobOffer } from '../data/mockData';

let activeJob: DeliveryJob | null = null;
let activeOffer: JobOffer | null = null;
const jobHistory: DeliveryJob[] = [...MOCK_JOB_HISTORY];

// ---- Job Listeners ----
type JobListener = (job: DeliveryJob | null) => void;
const jobListeners: Set<JobListener> = new Set();
export function addJobListener(fn: JobListener) { jobListeners.add(fn); }
export function removeJobListener(fn: JobListener) { jobListeners.delete(fn); }
function notifyJobListeners(job: DeliveryJob | null) { jobListeners.forEach(fn => fn(job)); }

// ---- Offer Listeners ----
type OfferListener = (offer: JobOffer | null) => void;
const offerListeners: Set<OfferListener> = new Set();
export function addOfferListener(fn: OfferListener) { offerListeners.add(fn); }
export function removeOfferListener(fn: OfferListener) { offerListeners.delete(fn); }
function notifyOfferListeners(offer: JobOffer | null) { offerListeners.forEach(fn => fn(offer)); }

let offerTimer: ReturnType<typeof setTimeout> | null = null;

// ---- Simulate incoming job offer (after going online) ----
export function startListeningForOffers() {
  stopListeningForOffers();
  // Simulate an incoming offer after 5 seconds
  offerTimer = setTimeout(() => {
    const { offer } = createMockJobOffer();
    activeOffer = offer;
    notifyOfferListeners(offer);

    // Auto-expire after 30 seconds if not responded
    offerTimer = setTimeout(() => {
      if (activeOffer && activeOffer.status === 'pending') {
        activeOffer.status = 'expired';
        activeOffer = null;
        notifyOfferListeners(null);
      }
    }, 30000);
  }, 5000);
}

export function stopListeningForOffers() {
  if (offerTimer) { clearTimeout(offerTimer); offerTimer = null; }
  activeOffer = null;
}

// ---- Respond to job offer ----
export function respondToOffer(action: 'accept' | 'reject'): DeliveryJob | null {
  if (!activeOffer || !activeOffer.job) return null;

  activeOffer.status = action === 'accept' ? 'accepted' : 'rejected';
  activeOffer.responded_at = new Date().toISOString();

  if (action === 'accept') {
    const job = activeOffer.job;
    job.status = 'accepted';
    job.rider_id = MOCK_RIDER.id;
    job.accepted_at = new Date().toISOString();
    activeJob = job;
    jobHistory.unshift(job);
    activeOffer = null;
    notifyOfferListeners(null);
    notifyJobListeners({ ...job });
    return job;
  }

  activeOffer = null;
  notifyOfferListeners(null);
  // If rejected, simulate another offer after a bit
  offerTimer = setTimeout(() => {
    const { offer } = createMockJobOffer();
    offer.id = 2;
    offer.job!.id = 202;
    activeOffer = offer;
    notifyOfferListeners(offer);
  }, 8000);
  return null;
}

// ---- Advance job status (driver manually advances) ----
const DRIVER_STATUS_FLOW: JobStatus[] = [
  'accepted', 'en_route_pickup', 'at_pickup', 'picked_up',
  'in_transit', 'at_dropoff', 'delivered',
];

export function advanceJobStatus(): DeliveryJob | null {
  if (!activeJob) return null;

  const currentIdx = DRIVER_STATUS_FLOW.indexOf(activeJob.status);
  if (currentIdx < 0 || currentIdx >= DRIVER_STATUS_FLOW.length - 1) return null;

  const nextStatus = DRIVER_STATUS_FLOW[currentIdx + 1];
  activeJob.status = nextStatus;

  if (nextStatus === 'picked_up') activeJob.picked_up_at = new Date().toISOString();
  if (nextStatus === 'delivered') {
    activeJob.delivered_at = new Date().toISOString();
    activeJob.payment_status = 'paid';
    if (activeJob.payment_method === 'cod') activeJob.cod_collected = true;
  }

  const updated = { ...activeJob };
  if (nextStatus === 'delivered') activeJob = null;
  notifyJobListeners(nextStatus === 'delivered' ? null : updated);
  return updated;
}

// ---- Getters ----
export function getActiveJob(): DeliveryJob | null { return activeJob; }
export function getActiveOffer(): JobOffer | null { return activeOffer; }
export function getJobHistory(): DeliveryJob[] { return jobHistory; }

// ---- Status label helper ----
export function getNextStatusLabel(status: JobStatus): string | null {
  const labels: Record<string, string> = {
    accepted: 'Start Route to Pickup',
    en_route_pickup: 'Arrived at Pickup',
    at_pickup: 'Package Picked Up',
    picked_up: 'Start Delivery',
    in_transit: 'Arrived at Dropoff',
    at_dropoff: 'Complete Delivery',
  };
  return labels[status] ?? null;
}

