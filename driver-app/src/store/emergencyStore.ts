// ============================================================
// ALiN Move Driver App - Emergency State Manager
// ============================================================
// Manages the SOS lifecycle for:
//   1. The DISTRESSED rider  — tracks their own active alert.
//   2. NEARBY online riders  — receives alerts from their branch.

import { EmergencyAlert } from '../types';
import { listenForBranchEmergencies, broadcastEmergencyResolved } from '../services/firebase';

// ── State ───────────────────────────────────────────────────

/** The current rider's own active SOS alert (if they triggered one). */
let myActiveAlert: EmergencyAlert | null = null;

/**
 * Map of nearby emergency alerts (from branch channel) keyed by alert ID.
 * Includes live location pings from distressed riders.
 */
const nearbyAlerts: Map<number, NearbyAlertState> = new Map();

/** Current realtime cleanup function (branch channel subscription). */
let branchChannelCleanup: (() => void) | null = null;

export interface NearbyAlertState {
  alert_id: number;
  rider_id: number;
  lat: number;
  lng: number;
  status: EmergencyAlert['status'];
  timestamp: number;
  /** Full alert data when fetched from API */
  alertData?: Partial<EmergencyAlert>;
}

// ── Listeners ────────────────────────────────────────────────

type MyAlertListener = (alert: EmergencyAlert | null) => void;
type NearbyAlertListener = (alerts: NearbyAlertState[]) => void;

const myAlertListeners: Set<MyAlertListener> = new Set();
const nearbyAlertListeners: Set<NearbyAlertListener> = new Set();

export function addMyAlertListener(fn: MyAlertListener) { myAlertListeners.add(fn); }
export function removeMyAlertListener(fn: MyAlertListener) { myAlertListeners.delete(fn); }
function notifyMyAlertListeners() { myAlertListeners.forEach(fn => fn(myActiveAlert)); }

export function addNearbyAlertListener(fn: NearbyAlertListener) { nearbyAlertListeners.add(fn); }
export function removeNearbyAlertListener(fn: NearbyAlertListener) { nearbyAlertListeners.delete(fn); }
function notifyNearbyAlertListeners() {
  const list = Array.from(nearbyAlerts.values())
    .filter(a => a.status === 'active' || a.status === 'responding');
  nearbyAlertListeners.forEach(fn => fn(list));
}

// ── Setters (called from screens / API responses) ─────────────

/** Called after a successful POST /rider/emergency response. */
export function setMyActiveAlert(alert: EmergencyAlert | null) {
  myActiveAlert = alert;
  notifyMyAlertListeners();
}

/** Getters */
export function getMyActiveAlert(): EmergencyAlert | null { return myActiveAlert; }
export function getNearbyAlerts(): NearbyAlertState[] {
  return Array.from(nearbyAlerts.values())
    .filter(a => a.status === 'active' || a.status === 'responding');
}

// ── Branch Realtime Subscription ──────────────────────────────

/**
 * Subscribe to branch emergency channel.
 * Online riders call this when they go online or the app loads.
 */
export function startListeningForEmergencies(branchId: number) {
  stopListeningForEmergencies();

  branchChannelCleanup = listenForBranchEmergencies(
    branchId,
    // onAlert: new or updated location from distressed rider
    (data) => {
      const existing = nearbyAlerts.get(data.alert_id);
      nearbyAlerts.set(data.alert_id, {
        alert_id: data.alert_id,
        rider_id: data.rider_id,
        lat: data.lat,
        lng: data.lng,
        status: existing?.status ?? 'active',
        timestamp: data.timestamp ?? Date.now(),
        alertData: existing?.alertData,
      });
      notifyNearbyAlertListeners();
    },
    // onResolved: alert was resolved or cancelled
    ({ alert_id, status }) => {
      const existing = nearbyAlerts.get(alert_id);
      if (existing) {
        nearbyAlerts.set(alert_id, {
          ...existing,
          status: status as EmergencyAlert['status'],
        });
      }
      notifyNearbyAlertListeners();
    }
  );
}

export function stopListeningForEmergencies() {
  if (branchChannelCleanup) {
    branchChannelCleanup();
    branchChannelCleanup = null;
  }
  nearbyAlerts.clear();
  notifyNearbyAlertListeners();
}

/**
 * Called after the distressed rider resolves or cancels their alert.
 * Broadcasts to the branch channel so nearby riders are notified.
 */
export function notifyAlertResolved(
  branchId: number,
  alertId: number,
  status: 'resolved' | 'cancelled'
) {
  broadcastEmergencyResolved(branchId, alertId, status);
  setMyActiveAlert(null);
}

