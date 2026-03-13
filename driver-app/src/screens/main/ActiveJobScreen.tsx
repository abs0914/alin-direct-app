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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import api from '../../services/api';
import {
  addJobListener,
  removeJobListener,
  getActiveJob,
  setActiveJob,
  getNextStatusLabel,
  getNextStatus,
} from '../../store/jobStore';
import Colors from '../../theme/colors';
import { DeliveryJob } from '../../types';

export type ActiveJobParamList = {
  ActiveJob: { jobId: number };
};

type Props = {
  navigation: NativeStackNavigationProp<ActiveJobParamList, 'ActiveJob'>;
  route: RouteProp<ActiveJobParamList, 'ActiveJob'>;
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
  const [job, setJob] = useState<DeliveryJob | null>(getActiveJob());
  const [isAdvancing, setIsAdvancing] = useState(false);

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

  const handleAdvanceStatus = async () => {
    if (!job) return;
    const nextStatus = getNextStatus(job.status);
    if (!nextStatus) return;

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

      {/* POD placeholder for delivered status */}
      {job.status === 'at_dropoff' && (
        <View style={styles.podHint}>
          <Text style={styles.podHintText}><Ionicons name="camera" size={14} color={Colors.primary} /> Tap "Complete Delivery" to confirm POD (photo capture coming in Sprint 3)</Text>
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
});
