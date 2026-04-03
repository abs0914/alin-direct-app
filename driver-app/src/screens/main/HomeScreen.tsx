// ============================================================
// ALiN Move Driver App - Home Screen (Dashboard)
// ============================================================
// MOCK: Subscribes to in-memory jobStore for offers & active job.
// PRODUCTION: Replace with Supabase Realtime for job broadcasts.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  addOfferListener,
  removeOfferListener,
  addJobListener,
  removeJobListener,
  startListeningForOffers,
  stopListeningForOffers,
  getActiveJob,
  setActiveJob as storeSetActiveJob,
  setCurrentOffer,
} from '../../store/jobStore';
import {
  addMyAlertListener,
  removeMyAlertListener,
  addNearbyAlertListener,
  removeNearbyAlertListener,
  startListeningForEmergencies,
  stopListeningForEmergencies,
  setMyActiveAlert,
  notifyAlertResolved,
  getMyActiveAlert,
  NearbyAlertState,
} from '../../store/emergencyStore';
import { broadcastEmergencyLocation } from '../../services/firebase';
import JobOfferModal from '../../components/JobOfferModal';
import EmergencyAlertModal from '../../components/EmergencyAlertModal';
import Colors from '../../theme/colors';
import { DeliveryJob, EarningsSummary, JobOffer, EmergencyAlert } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
};

const STATUS_LABELS: Record<string, { label: string; icon: string; iconFamily?: string }> = {
  accepted: { label: 'Job Accepted - Start Route', icon: 'checkmark-circle', iconFamily: 'ionicons' },
  en_route_pickup: { label: 'En Route to Pickup', icon: 'car', iconFamily: 'ionicons' },
  at_pickup: { label: 'At Pickup Location', icon: 'location-sharp', iconFamily: 'ionicons' },
  picked_up: { label: 'Package Picked Up', icon: 'cube', iconFamily: 'ionicons' },
  in_transit: { label: 'In Transit', icon: 'highway', iconFamily: 'mci' },
  at_dropoff: { label: 'At Dropoff - Complete Delivery', icon: 'flag', iconFamily: 'ionicons' },
};

export default function HomeScreen({ navigation }: Props) {
  const { user, rider } = useAuth();
  const [isOnline, setIsOnline] = useState(rider?.availability === 'online' || rider?.availability === 'on_job');
  const [isToggling, setIsToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentOffer, setCurrentOfferState] = useState<JobOffer | null>(null);
  const [activeJob, setActiveJobState] = useState<DeliveryJob | null>(getActiveJob());
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);

  // ── Emergency state ────────────────────────────────────────
  const [myAlert, setMyAlertState] = useState<EmergencyAlert | null>(getMyActiveAlert());
  const [nearbyAlerts, setNearbyAlertsState] = useState<NearbyAlertState[]>([]);
  const [visibleNearbyAlert, setVisibleNearbyAlert] = useState<NearbyAlertState | null>(null);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState(false);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Load earnings from API
  const loadEarnings = useCallback(async () => {
    try {
      const data = await api.getEarnings();
      setEarnings(data);
    } catch {
      // Silently fail
    }
  }, []);

  // Load active job from API
  const loadActiveJob = useCallback(async () => {
    try {
      const job = await api.getActiveJob();
      storeSetActiveJob(job);
      setActiveJobState(job);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadEarnings();
    loadActiveJob();
  }, [loadEarnings, loadActiveJob]);

  // Subscribe to offers
  useEffect(() => {
    const offerListener = (offer: JobOffer | null) => setCurrentOfferState(offer);
    addOfferListener(offerListener);
    return () => removeOfferListener(offerListener);
  }, []);

  // Subscribe to active job changes
  useEffect(() => {
    const jobListener = (job: DeliveryJob | null) => setActiveJobState(job ? { ...job } : null);
    addJobListener(jobListener);
    return () => removeJobListener(jobListener);
  }, []);

  // Subscribe to my own emergency alert changes
  useEffect(() => {
    const listener = (alert: EmergencyAlert | null) => setMyAlertState(alert);
    addMyAlertListener(listener);
    return () => removeMyAlertListener(listener);
  }, []);

  // Subscribe to nearby emergency alerts + start branch channel when online
  useEffect(() => {
    const listener = (alerts: NearbyAlertState[]) => {
      setNearbyAlertsState(alerts);
      // Show modal for the first active nearby alert (not already dismissed)
      const firstActive = alerts.find(a => a.status === 'active' || a.status === 'responding');
      if (firstActive && !myAlert) {
        setVisibleNearbyAlert(prev => prev?.alert_id === firstActive.alert_id ? prev : firstActive);
        Vibration.vibrate([0, 500, 200, 500]);
      }
    };
    addNearbyAlertListener(listener);
    return () => removeNearbyAlertListener(listener);
  }, [myAlert]);

  // Start/stop branch emergency channel with online status
  useEffect(() => {
    if (isOnline && rider?.branch_id) {
      startListeningForEmergencies(rider.branch_id);
    } else {
      stopListeningForEmergencies();
    }
    return () => stopListeningForEmergencies();
  }, [isOnline, rider?.branch_id]);

  // ── SOS Handlers ──────────────────────────────────────────

  const handleSOSTrigger = async () => {
    if (!rider || rider.status !== 'approved') return;

    Alert.alert(
      '🆘 Trigger Emergency SOS?',
      'This will alert your branch office and broadcast an emergency assistance job to nearby riders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: async () => {
            setIsTriggeringSOS(true);
            try {
              const loc = locationRef.current;
              const res = await api.triggerEmergency(
                loc?.lat ?? 0,
                loc?.lng ?? 0,
                'SOS triggered from driver app.'
              );
              setMyActiveAlert(res.alert);
              Vibration.vibrate([0, 300, 100, 300, 100, 300]);

              // Broadcast to nearby riders via Supabase realtime channel
              // so they receive the SOS without waiting for a poll.
              if (rider?.branch_id) {
                broadcastEmergencyLocation(
                  rider.branch_id,
                  res.alert.id,
                  rider.id,
                  {
                    latitude: loc?.lat ?? 0,
                    longitude: loc?.lng ?? 0,
                    heading: 0,
                    speed: 0,
                    timestamp: Date.now(),
                  }
                );
              }
            } catch {
              Alert.alert('Error', 'Could not send SOS. Please try again.');
            } finally {
              setIsTriggeringSOS(false);
            }
          },
        },
      ]
    );
  };

  const handleSOSCancel = async () => {
    if (!myAlert) return;
    Alert.alert(
      'Cancel Emergency?',
      'Mark this as a false alarm and cancel the emergency alert.',
      [
        { text: 'No' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              await api.cancelEmergency(myAlert.id);
              if (rider?.branch_id) {
                notifyAlertResolved(rider.branch_id, myAlert.id, 'cancelled');
              } else {
                setMyActiveAlert(null);
              }
            } catch {
              Alert.alert('Error', 'Could not cancel the emergency.');
            }
          },
        },
      ]
    );
  };

  const handleRespondToNearby = async () => {
    if (!visibleNearbyAlert) return;
    try {
      const res = await api.respondToEmergency(visibleNearbyAlert.alert_id);
      setVisibleNearbyAlert(null);
      if (res.job) {
        storeSetActiveJob(res.job);
        navigation.navigate('ActiveJob', { jobId: res.job.id });
      }
    } catch {
      Alert.alert('Error', 'Could not respond to the emergency.');
      setVisibleNearbyAlert(null);
    }
  };

  const toggleOnline = async (value: boolean) => {
    setIsToggling(true);
    try {
      await api.updateAvailability(value ? 'online' : 'offline');
      setIsOnline(value);
      if (value && rider) {
        startListeningForOffers(rider.id);
      } else {
        stopListeningForOffers();
      }
    } catch {
      setIsOnline(!value);
    } finally {
      setIsToggling(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!currentOffer) return;
    try {
      const result = await api.respondToOffer(currentOffer.id, 'accept');
      setCurrentOffer(null);
      if (result.job) {
        storeSetActiveJob(result.job);
        navigation.navigate('ActiveJob', { jobId: result.job.id });
      }
    } catch {
      // Handle error
    }
  };

  const handleRejectOffer = async () => {
    if (!currentOffer) return;
    try {
      await api.respondToOffer(currentOffer.id, 'reject');
      setCurrentOffer(null);
    } catch {
      // Handle error
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadActiveJob(), loadEarnings()]);
    setRefreshing(false);
  }, [loadActiveJob, loadEarnings]);

  const statusColor = isOnline ? Colors.primary : Colors.statusOffline;
  const statusText = activeJob ? 'On Job' : isOnline ? 'Online' : 'Offline';

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Header */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name ?? 'Driver'}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: activeJob ? Colors.statusOnJob : statusColor }]} />
                <Text style={[styles.statusText, { color: activeJob ? Colors.statusOnJob : statusColor }]}>{statusText}</Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              disabled={isToggling || !!activeJob}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={isOnline ? Colors.primary : Colors.textLight}
              ios_backgroundColor={Colors.border}
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
            />
          </View>
          {rider?.status === 'pending' && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}><Ionicons name="time-outline" size={14} color="#92400E" /> Your account is pending approval. You cannot go online yet.</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₱{(earnings?.today ?? 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rider?.total_deliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}><Ionicons name="star" size={18} color={Colors.primary} /> {rider?.rating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rider?.vehicle_type ?? '-'}</Text>
            <Text style={styles.statLabel}>Vehicle</Text>
          </View>
        </View>

        {/* Active Job Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Job</Text>
          {activeJob ? (
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() => navigation.navigate('ActiveJob', { jobId: activeJob.id })}
              activeOpacity={0.8}
            >
              <View style={styles.activeDot} />
              <View style={styles.activeContent}>
                <Text style={styles.activeStatus}>
                  {STATUS_LABELS[activeJob.status] ? (
                    <>
                      {STATUS_LABELS[activeJob.status].iconFamily === 'mci' ? (
                        <MaterialCommunityIcons name={STATUS_LABELS[activeJob.status].icon as any} size={14} color={Colors.primary} />
                      ) : (
                        <Ionicons name={STATUS_LABELS[activeJob.status].icon as any} size={14} color={Colors.primary} />
                      )}
                      {' '}{STATUS_LABELS[activeJob.status].label}
                    </>
                  ) : activeJob.status}
                </Text>
                <Text style={styles.activeAddr} numberOfLines={1}><Ionicons name="location-sharp" size={12} color="#3B82F6" /> {activeJob.pickup_address}</Text>
                <Text style={styles.activeAddr} numberOfLines={1}><Ionicons name="flag" size={12} color={Colors.danger} /> {activeJob.dropoff_address}</Text>
              </View>
              <View style={styles.activeRight}>
                <Text style={styles.activeEarnings}>₱{activeJob.rider_earnings?.toFixed(0)}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={40} color={Colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No active delivery</Text>
              <Text style={styles.emptySubtext}>
                {isOnline ? 'Waiting for job offers...' : 'Go online to start receiving job offers'}
              </Text>
            </View>
          )}
        </View>

        {/* ── SOS Emergency Section ──────────────────────────── */}
        {rider?.status === 'approved' && isOnline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency</Text>

            {myAlert ? (
              /* Rider has an active SOS — show status */
              <View style={styles.sosActiveCard}>
                <View style={styles.sosActiveHeader}>
                  <Text style={styles.sosActiveIcon}>🆘</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sosActiveTitle}>SOS Active</Text>
                    <Text style={styles.sosActiveStatus}>
                      {myAlert.status === 'responding' ? '✅ A rider is on the way!' : '⏳ Waiting for a responder...'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.sosCancelBtn} onPress={handleSOSCancel}>
                  <Text style={styles.sosCancelText}>Cancel (False Alarm)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Normal state — show SOS button */
              <TouchableOpacity
                style={[styles.sosBtn, isTriggeringSOS && styles.sosBtnDisabled]}
                onPress={handleSOSTrigger}
                disabled={isTriggeringSOS}
                activeOpacity={0.8}
              >
                <Text style={styles.sosBtnIcon}>🆘</Text>
                <View>
                  <Text style={styles.sosBtnText}>EMERGENCY SOS</Text>
                  <Text style={styles.sosBtnSubtext}>
                    {activeJob ? 'Active job — SOS still available' : 'Tap to alert branch & nearby riders'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>

      {/* Job Offer Modal */}
      {currentOffer && (
        <JobOfferModal
          offer={currentOffer}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
        />
      )}

      {/* Nearby Emergency Alert Modal */}
      {visibleNearbyAlert && !myAlert && (
        <EmergencyAlertModal
          alert={visibleNearbyAlert}
          alertData={visibleNearbyAlert.alertData}
          onRespond={handleRespondToNearby}
          onDismiss={() => setVisibleNearbyAlert(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  statusCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  pendingBanner: { backgroundColor: Colors.warningBg, borderRadius: 8, padding: 12, marginTop: 12 },
  pendingText: { color: '#92400E', fontSize: 13, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  activeCard: { backgroundColor: Colors.primaryBg, borderWidth: 2, borderColor: Colors.primary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  activeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, marginRight: 12 },
  activeContent: { flex: 1, marginRight: 8 },
  activeStatus: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  activeAddr: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activeRight: { alignItems: 'center' },
  activeEarnings: { fontSize: 16, fontWeight: '700', color: Colors.success },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySubtext: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  // SOS
  sosBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    elevation: 4,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosBtnDisabled: { opacity: 0.6 },
  sosBtnIcon: { fontSize: 36 },
  sosBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  sosBtnSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sosActiveCard: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  sosActiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sosActiveIcon: { fontSize: 32 },
  sosActiveTitle: { fontSize: 16, fontWeight: '800', color: Colors.danger },
  sosActiveStatus: { fontSize: 13, color: Colors.text, marginTop: 2 },
  sosCancelBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sosCancelText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
});

