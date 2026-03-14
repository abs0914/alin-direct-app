// ============================================================
// ALiN Move Driver App - Local Job State Manager
// ============================================================
// Manages local in-memory state for active job and incoming
// offers. In demo mode this simulates offers locally; otherwise
// it subscribes to Supabase Realtime events.

import { DeliveryJob, JobStatus, JobOffer } from '../types';
import Config from '../config';
import { MOCK_JOB_HISTORY, MOCK_RIDER, createMockJobOffer } from '../data/mockData';
import { supabase } from '../lib/supabase';

let activeJob: DeliveryJob | null = null;
let activeOffer: JobOffer | null = null;
let realtimeCleanup: (() => void) | null = null;
let offerTimer: ReturnType<typeof setTimeout> | null = null;
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

// ---- Set active job (called after API fetch) ----
export function setActiveJob(job: DeliveryJob | null) {
  activeJob = job;
  notifyJobListeners(job);
}

// ---- Set current offer (called from realtime) ----
export function setCurrentOffer(offer: JobOffer | null) {
  activeOffer = offer;
  notifyOfferListeners(offer);
}

function scheduleDemoOffer(riderId: number, delayMs: number) {
  offerTimer = setTimeout(() => {
    const { offer } = createMockJobOffer();
    offer.rider_id = riderId;
    activeOffer = offer;
    notifyOfferListeners(offer);

    offerTimer = setTimeout(() => {
      if (activeOffer && activeOffer.status === 'pending') {
        activeOffer.status = 'expired';
        activeOffer = null;
        notifyOfferListeners(null);
      }
    }, Config.JOB_OFFER_TIMEOUT_SECONDS * 1000);
  }, delayMs);
}

export function startListeningForOffers(riderId: number) {
  stopListeningForOffers();

  if (Config.DEMO_MODE) {
    scheduleDemoOffer(riderId, 5000);
    return;
  }

  const channel = supabase
    .channel(`job-offers-${riderId}`)
    .on('broadcast', { event: 'new_offer' }, (payload) => {
      const offer = payload.payload as JobOffer;
      activeOffer = offer;
      notifyOfferListeners(offer);
    })
    .subscribe();

  realtimeCleanup = () => {
    supabase.removeChannel(channel);
  };
}

export function stopListeningForOffers() {
  if (offerTimer) {
    clearTimeout(offerTimer);
    offerTimer = null;
  }
  if (realtimeCleanup) {
    realtimeCleanup();
    realtimeCleanup = null;
  }
  activeOffer = null;
  notifyOfferListeners(null);
}

// ---- Getters ----
export function getActiveJob(): DeliveryJob | null { return activeJob; }
export function getActiveOffer(): JobOffer | null { return activeOffer; }
export function getJobHistory(): DeliveryJob[] { return jobHistory; }

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
    MOCK_RIDER.availability = 'on_job';
    jobHistory.unshift(job);
    activeOffer = null;
    notifyOfferListeners(null);
    notifyJobListeners({ ...job });
    return job;
  }

  activeOffer = null;
  notifyOfferListeners(null);

  if (Config.DEMO_MODE) {
    scheduleDemoOffer(MOCK_RIDER.id, 8000);
  }

  return null;
}

export function advanceJobStatus(): DeliveryJob | null {
  if (!activeJob) return null;

  const idx = DRIVER_STATUS_FLOW.indexOf(activeJob.status);
  if (idx < 0 || idx >= DRIVER_STATUS_FLOW.length - 1) return null;

  const nextStatus = DRIVER_STATUS_FLOW[idx + 1];
  activeJob.status = nextStatus;

  if (nextStatus === 'picked_up') {
    activeJob.picked_up_at = new Date().toISOString();
  }

  if (nextStatus === 'delivered') {
    activeJob.delivered_at = new Date().toISOString();
    activeJob.payment_status = 'paid';
    if (activeJob.payment_method === 'cod') {
      activeJob.cod_collected = true;
    }
    MOCK_RIDER.availability = 'online';
  }

  const updatedJob = { ...activeJob };

  if (nextStatus === 'delivered') {
    activeJob = null;
    notifyJobListeners(null);
    return updatedJob;
  }

  notifyJobListeners(updatedJob);
  return updatedJob;
}

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

// ---- Next status in driver workflow ----
const DRIVER_STATUS_FLOW: JobStatus[] = [
  'accepted', 'en_route_pickup', 'at_pickup', 'picked_up',
  'in_transit', 'at_dropoff', 'delivered',
];

export function getNextStatus(currentStatus: JobStatus): JobStatus | null {
  const idx = DRIVER_STATUS_FLOW.indexOf(currentStatus);
  if (idx < 0 || idx >= DRIVER_STATUS_FLOW.length - 1) return null;
  return DRIVER_STATUS_FLOW[idx + 1];
}

