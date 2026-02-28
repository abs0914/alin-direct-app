// ============================================================
// ALiN Direct Driver App - Local Job State Manager
// ============================================================
// Manages local in-memory state for active job and incoming
// offers. Populated from API calls and Supabase Realtime events.

import { DeliveryJob, JobStatus, JobOffer } from '../types';
import { supabase } from '../lib/supabase';

let activeJob: DeliveryJob | null = null;
let activeOffer: JobOffer | null = null;
let realtimeCleanup: (() => void) | null = null;

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

// ---- Subscribe to Supabase Realtime job offers ----
export function startListeningForOffers(riderId: number) {
  stopListeningForOffers();

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

