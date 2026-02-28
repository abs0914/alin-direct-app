// ============================================================
// ALiN Direct Customer App - Live Tracking Screen
// ============================================================
// Subscribes to Supabase Realtime for live status & GPS updates.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import {
  addJobListener, removeJobListener,
  addGPSListener, removeGPSListener,
  startTrackingJob, stopTrackingJob,
  setActiveJob,
} from '../../store/jobStore';
import Colors from '../../theme/colors';
import { DeliveryJob } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Tracking'>;
  route: RouteProp<HomeStackParamList, 'Tracking'>;
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Finding Driver...' },
  { key: 'broadcasting', label: 'Broadcasting to Drivers' },
  { key: 'accepted', label: 'Driver Assigned' },
  { key: 'en_route_pickup', label: 'En Route to Pickup' },
  { key: 'at_pickup', label: 'At Pickup Location' },
  { key: 'picked_up', label: 'Package Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'at_dropoff', label: 'At Dropoff Location' },
  { key: 'delivered', label: 'Delivered' },
];

export default function TrackingScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const [job, setJob] = useState<DeliveryJob | null>(null);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [lastGPSUpdate, setLastGPSUpdate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial job details and start Supabase Realtime tracking
  useEffect(() => {
    (async () => {
      try {
        const response = await api.getBookingDetail(jobId);
        setJob(response);
        setActiveJob(response);
        // Start Supabase Realtime channel for this job
        startTrackingJob(jobId);
      } catch {
        Alert.alert('Error', 'Failed to load delivery details.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    })();

    return () => stopTrackingJob();
  }, [jobId]);

  // Listen for real-time job status changes via jobStore
  useEffect(() => {
    const listener = (updatedJob: DeliveryJob) => {
      if (updatedJob.id === jobId) setJob({ ...updatedJob });
    };
    addJobListener(listener);
    return () => removeJobListener(listener);
  }, [jobId]);

  // Listen for real-time GPS updates via jobStore
  useEffect(() => {
    const gpsListener = (lat: number, lng: number) => {
      setDriverLat(lat);
      setDriverLng(lng);
      setLastGPSUpdate(Date.now());
    };
    addGPSListener(gpsListener);
    return () => removeGPSListener(gpsListener);
  }, []);

  const handleCallDriver = () => {
    const phone = job?.rider?.user?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert('Unavailable', 'Driver phone number is not available yet.');
  };

  const handleCancelBooking = () => {
    Alert.alert('Cancel Delivery', 'Are you sure you want to cancel this delivery?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.cancelBooking(jobId);
            Alert.alert('Cancelled', 'Your delivery has been cancelled.');
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to cancel delivery.');
          }
        },
      },
    ]);
  };

  const getCurrentStepIndex = () => {
    if (!job) return -1;
    return STATUS_STEPS.findIndex((s) => s.key === job.status);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!job) return null;

  const currentStep = getCurrentStepIndex();
  const isTerminal = ['delivered', 'cancelled', 'failed'].includes(job.status);
  const canCancel = ['pending', 'broadcasting'].includes(job.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Tracking ID & Price */}
      <View style={styles.header}>
        <View>
          <Text style={styles.trackingLabel}>Tracking</Text>
          <Text style={styles.trackingId}>#{job.tracking_uuid.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₱{job.total_price?.toFixed(2)}</Text>
          <Text style={styles.paymentLabel}>{job.payment_method === 'cod' ? 'COD' : 'Online'}</Text>
        </View>
      </View>

      {/* Driver Info Card */}
      {job.rider && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}><MaterialCommunityIcons name="motorbike" size={26} color={Colors.textSecondary} /></View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{job.rider.user?.name ?? 'Driver'}</Text>
            <Text style={styles.driverVehicle}>{job.rider.vehicle_type} • <Ionicons name="star" size={12} color="#FBBF24" /> {job.rider.rating.toFixed(1)}</Text>
            {job.rider.plate_number && <Text style={styles.driverPlate}>{job.rider.plate_number}</Text>}
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Live Location Indicator */}
      {driverLat !== null && !isTerminal && (
        <View style={styles.locationCard}>
          <Ionicons name="radio-button-on" size={14} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.locationText}>
            Driver is live at ({driverLat.toFixed(4)}, {driverLng?.toFixed(4)})
            {lastGPSUpdate && ` • ${Math.round((Date.now() - lastGPSUpdate) / 1000)}s ago`}
          </Text>
        </View>
      )}

      {/* Addresses */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <Ionicons name="location-sharp" size={18} color="#3B82F6" style={{ marginRight: 10, marginTop: 2 }} />
          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{job.pickup_contact_name}</Text>
            <Text style={styles.addressText}>{job.pickup_address}</Text>
          </View>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressRow}>
          <Ionicons name="flag" size={18} color={Colors.danger} style={{ marginRight: 10, marginTop: 2 }} />
          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{job.dropoff_contact_name}</Text>
            <Text style={styles.addressText}>{job.dropoff_address}</Text>
          </View>
        </View>
      </View>

      {/* Status Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Delivery Progress</Text>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepDot, isCompleted && styles.stepDotActive, isCurrent && styles.stepDotCurrent]} />
              {index < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />
              )}
              <Text style={[styles.stepLabel, isCompleted && styles.stepLabelActive, isCurrent && styles.stepLabelCurrent]}>{step.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Delivered Banner */}
      {job.status === 'delivered' && (
        <View style={styles.deliveredBanner}>
          <Ionicons name="checkmark-circle" size={44} color={Colors.success} style={{ marginBottom: 8 }} />
          <Text style={styles.deliveredText}>Package Delivered Successfully!</Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.popToTop()}>
            <Text style={styles.doneButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
          <Text style={styles.cancelText}>Cancel Delivery</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trackingLabel: { fontSize: 12, color: Colors.textSecondary },
  trackingId: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  priceTag: { alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  paymentLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  driverCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  driverVehicle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  driverPlate: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },

  locationCard: { backgroundColor: Colors.primaryBg, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

  locationText: { fontSize: 12, color: Colors.primary, fontWeight: '500', flex: 1 },
  addressCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },

  addressContent: { flex: 1 },
  addressName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  addressText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addressDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12, marginLeft: 30 },
  progressSection: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, position: 'relative' },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, marginRight: 12 },
  stepDotActive: { backgroundColor: Colors.success },
  stepDotCurrent: { backgroundColor: Colors.primary, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: Colors.primaryBorder },
  stepLine: { position: 'absolute', left: 5, top: 14, width: 2, height: 20, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.success },
  stepLabel: { fontSize: 14, color: Colors.textLight },
  stepLabelActive: { color: Colors.text },
  stepLabelCurrent: { fontWeight: '600', color: Colors.primary },
  deliveredBanner: { backgroundColor: Colors.successBg, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },

  deliveredText: { fontSize: 16, fontWeight: '600', color: Colors.success },
  doneButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 12 },
  doneButtonText: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: '600' },
  cancelButton: { borderWidth: 1, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
});

