// ============================================================
// ALiN Move Driver App - Active Job Screen
// ============================================================
// MOCK: Uses in-memory jobStore for status advancement.
// PRODUCTION: Replace with API calls to Laravel backend.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import {
  addJobListener,
  removeJobListener,
  getActiveJob,
  setActiveJob,
  getNextStatusLabel,
  getNextStatus,
} from '../../store/jobStore';
import {
  addMyAlertListener,
  removeMyAlertListener,
  setMyActiveAlert,
  getMyActiveAlert,
  notifyAlertResolved,
} from '../../store/emergencyStore';
import { broadcastEmergencyLocation } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';
import { DeliveryJob, EmergencyAlert } from '../../types';
import LiveMap from '../../components/LiveMap';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ActiveJob'>;
  route: RouteProp<HomeStackParamList, 'ActiveJob'>;
};

// Simulated GPS route: Manila (Sta. Cruz) → Makati (Ayala Ave)
const SIMULATED_ROUTE = [
  { lat: 14.6000, lng: 120.9833 },
  { lat: 14.5950, lng: 120.9850 },
  { lat: 14.5900, lng: 120.9880 },
  { lat: 14.5850, lng: 120.9920 },
  { lat: 14.5800, lng: 120.9960 },
  { lat: 14.5750, lng: 121.0000 },
  { lat: 14.5700, lng: 121.0050 },
  { lat: 14.5660, lng: 121.0100 },
  { lat: 14.5620, lng: 121.0150 },
  { lat: 14.5580, lng: 121.0200 },
  { lat: 14.5547, lng: 121.0244 },
];

// Map each job status to a position along the route
const STATUS_TO_ROUTE_IDX: Record<string, number> = {
  accepted: 0, en_route_pickup: 1, at_pickup: 2,
  picked_up: 4, in_transit: 6, at_dropoff: 9, delivered: 10,
};

const STATUS_STEPS = [
  { key: 'accepted', label: 'Job Accepted', icon: 'checkmark-circle' as const, family: 'ionicons' as const },
  { key: 'en_route_pickup', label: 'En Route to Pickup', icon: 'car' as const, family: 'ionicons' as const },
  { key: 'at_pickup', label: 'At Pickup Location', icon: 'location-sharp' as const, family: 'ionicons' as const },
  { key: 'picked_up', label: 'Package Picked Up', icon: 'cube' as const, family: 'ionicons' as const },
  { key: 'in_transit', label: 'In Transit', icon: 'highway' as const, family: 'mci' as const },
  { key: 'at_dropoff', label: 'At Dropoff Location', icon: 'flag' as const, family: 'ionicons' as const },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle' as const, family: 'ionicons' as const },
];

export default function ActiveJobScreen({ navigation, route }: Props) {
  const { rider } = useAuth();
  const [job, setJob] = useState<DeliveryJob | null>(getActiveJob());
  const [isAdvancing, setIsAdvancing] = useState(false);

  // ── Emergency state ────────────────────────────────────────
  const [myAlert, setMyAlertState] = useState<EmergencyAlert | null>(getMyActiveAlert());
  const [isTriggeringSOS, setIsTriggeringSOS] = useState(false);

  useEffect(() => {
    const listener = (updatedJob: DeliveryJob | null) => {
      if (!updatedJob) {
        // Job completed (delivered) - show success and go back
        setJob(null);
      } else {
        setJob({ ...updatedJob });
      }
    };
    addJobListener(listener);
    return () => removeJobListener(listener);
  }, []);

  // Subscribe to own emergency alert changes
  useEffect(() => {
    const listener = (alert: EmergencyAlert | null) => setMyAlertState(alert);
    addMyAlertListener(listener);
    return () => removeMyAlertListener(listener);
  }, []);

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
              const res = await api.triggerEmergency(0, 0, 'SOS triggered during active delivery.');
              setMyActiveAlert(res.alert);
              Vibration.vibrate([0, 300, 100, 300, 100, 300]);

              // Broadcast to nearby riders via Supabase realtime channel
              // so they receive the SOS without waiting for a poll.
              if (rider?.branch_id) {
                broadcastEmergencyLocation(
                  rider.branch_id,
                  res.alert.id,
                  rider.id,
                  { latitude: 0, longitude: 0, heading: 0, speed: 0, timestamp: Date.now() }
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

  const handleAdvanceStatus = async () => {
    if (!job) return;
    const nextStatus = getNextStatus(job.status);
    if (!nextStatus) return;

    // At dropoff → navigate to POD screen instead of advancing directly
    if (job.status === 'at_dropoff') {
      navigation.navigate('ProofOfDelivery', { jobId: job.id });
      return;
    }

    setIsAdvancing(true);
    try {
      const result = await api.updateJobStatus(job.id, nextStatus);
      const updatedJob = result.job;
      if (updatedJob.status === 'delivered') {
        setActiveJob(null);
        Alert.alert('Delivery Complete', 'Great job! The package has been delivered.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setActiveJob(updatedJob);
      }
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!job) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} style={{ marginBottom: 16 }} />
        <Text style={styles.doneTitle}>Delivery Complete!</Text>
        <Text style={styles.doneSubtitle}>Returning to dashboard...</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === job.status);
  const nextLabel = getNextStatusLabel(job.status);
  const isDelivered = job.status === 'delivered';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Tracking Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.trackingLabel}>Active Delivery</Text>
          <Text style={styles.trackingId}>#{job.tracking_uuid.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.earningsTag}>
          <Text style={styles.earningsText}>₱{job.rider_earnings?.toFixed(2) ?? '0.00'}</Text>
        </View>
      </View>

      {/* Payment Badge */}
      <View style={styles.paymentBadge}>
        <Text style={styles.paymentText}>
          <Ionicons name={job.payment_method === 'cod' ? 'cash-outline' : 'phone-portrait-outline'} size={14} color="#92400E" />
          {job.payment_method === 'cod' ? ' Collect ₱' + job.total_price.toFixed(2) + ' COD' : ' Paid Online'}
        </Text>
      </View>

      {/* Pickup & Dropoff */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <Ionicons name="location-sharp" size={16} color="#3B82F6" style={{ marginRight: 10, marginTop: 2 }} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>PICKUP</Text>
            <Text style={styles.addressName}>{job.pickup_contact_name}</Text>
            <Text style={styles.addressText}>{job.pickup_address}</Text>
            <Text style={styles.addressPhone}>{job.pickup_contact_phone}</Text>
            {job.pickup_notes && <Text style={styles.addressNotes}>Note: {job.pickup_notes}</Text>}
          </View>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressRow}>
          <Ionicons name="flag" size={16} color={Colors.danger} style={{ marginRight: 10, marginTop: 2 }} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>DROPOFF</Text>
            <Text style={styles.addressName}>{job.dropoff_contact_name}</Text>
            <Text style={styles.addressText}>{job.dropoff_address}</Text>
            <Text style={styles.addressPhone}>{job.dropoff_contact_phone}</Text>
            {job.dropoff_notes && <Text style={styles.addressNotes}>Note: {job.dropoff_notes}</Text>}
          </View>
        </View>
      </View>

      {/* Live Route Map */}
      <LiveMap
        pickupLat={job.pickup_lat ?? 14.6000}
        pickupLng={job.pickup_lng ?? 120.9833}
        dropoffLat={job.dropoff_lat ?? 14.5547}
        dropoffLng={job.dropoff_lng ?? 121.0244}
        riderLat={SIMULATED_ROUTE[STATUS_TO_ROUTE_IDX[job.status] ?? 0].lat}
        riderLng={SIMULATED_ROUTE[STATUS_TO_ROUTE_IDX[job.status] ?? 0].lng}
        height={220}
      />

      {/* Package Info */}
      <View style={styles.packageCard}>
        <Text style={styles.packageTitle}><Ionicons name="cube" size={14} color={Colors.text} /> Package</Text>
        <Text style={styles.packageDesc}>{job.package_description ?? 'No description'}</Text>
        <Text style={styles.packageMeta}>Size: {job.package_size} • {job.distance_km ?? '~8'} km</Text>
      </View>


      {/* Status Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Delivery Progress</Text>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStepIdx;
          const isCurrent = index === currentStepIdx;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepDot, isCompleted && styles.stepDotActive, isCurrent && styles.stepDotCurrent]}>
                {isCompleted && (
                  isCurrent
                    ? (step.family === 'mci'
                      ? <MaterialCommunityIcons name={step.icon as any} size={12} color={Colors.textInverse} />
                      : <Ionicons name={step.icon as any} size={12} color={Colors.textInverse} />)
                    : <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                )}
              </View>
              {index < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />
              )}
              <Text style={[styles.stepLabel, isCompleted && styles.stepLabelActive, isCurrent && styles.stepLabelCurrent]}>{step.label}</Text>
            </View>
          );
        })}
      </View>

      {/* POD call-to-action */}
      {job.status === 'at_dropoff' && (
        <View style={styles.podHint}>
          <Text style={styles.podHintText}>
            <Ionicons name="camera" size={14} color={Colors.primary} /> Tap "Complete Delivery" to capture photo proof and confirm delivery.
          </Text>
        </View>
      )}

      {/* Action Button */}
      {nextLabel && !isDelivered && (
        <TouchableOpacity
          style={[styles.actionBtn, isAdvancing && styles.actionBtnDisabled]}
          onPress={handleAdvanceStatus}
          disabled={isAdvancing}
        >
          {isAdvancing ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.actionBtnText}>{nextLabel}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* ── SOS Emergency Section ──────────────────────────── */}
      {rider?.status === 'approved' && (
        <View style={styles.sosSection}>
          {myAlert ? (
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
            <TouchableOpacity
              style={[styles.sosBtn, isTriggeringSOS && styles.sosBtnDisabled]}
              onPress={handleSOSTrigger}
              disabled={isTriggeringSOS}
              activeOpacity={0.8}
            >
              <Text style={styles.sosBtnIcon}>🆘</Text>
              <View>
                <Text style={styles.sosBtnText}>EMERGENCY SOS</Text>
                <Text style={styles.sosBtnSubtext}>Tap to alert branch & nearby riders</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },

  doneTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  doneSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 24 },
  backBtnText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trackingLabel: { fontSize: 12, color: Colors.textSecondary },
  trackingId: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  earningsTag: { backgroundColor: Colors.successBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  earningsText: { fontSize: 16, fontWeight: '700', color: Colors.success },
  paymentBadge: { backgroundColor: Colors.warningBg, borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
  paymentText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  addressCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressIcon: { fontSize: 16, marginRight: 10, marginTop: 2 },
  addressContent: { flex: 1 },
  addressLabel: { fontSize: 10, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5, marginBottom: 2 },
  addressName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  addressText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addressPhone: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  addressNotes: { fontSize: 12, color: Colors.warning, marginTop: 4, fontStyle: 'italic' },
  addressDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12, marginLeft: 30 },
  packageCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  packageTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  packageDesc: { fontSize: 14, color: Colors.textSecondary },
  packageMeta: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  progressSection: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, position: 'relative' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepDotActive: { backgroundColor: Colors.success },
  stepDotCurrent: { backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.primaryBorder },
  stepCheck: { fontSize: 12, color: Colors.textInverse },
  stepLine: { position: 'absolute', left: 13, top: 30, width: 2, height: 16, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.success },
  stepLabel: { fontSize: 14, color: Colors.textLight },
  stepLabelActive: { color: Colors.text },
  stepLabelCurrent: { fontWeight: '600', color: Colors.primary },
  podHint: { backgroundColor: Colors.primaryBg, borderRadius: 10, padding: 14, marginBottom: 12 },
  podHintText: { fontSize: 13, color: Colors.primary, textAlign: 'center' },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: Colors.textOnPrimary, fontSize: 17, fontWeight: '700' },
  // SOS
  sosSection: { marginTop: 16 },
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
