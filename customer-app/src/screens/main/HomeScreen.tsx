// ============================================================
// ALiN Direct Customer App - Home Screen
// ============================================================
// Choose Delivery Service screen per PDF spec.
// MOCK: Uses jobStore for active job tracking.
// PRODUCTION: Replace jobStore calls with Supabase queries.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { getActiveJob, addJobListener, removeJobListener } from '../../store/jobStore';
import Colors from '../../theme/colors';
import { DeliveryJob } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
};

type ServiceOption = {
  key: string;
  iconName: string;
  iconFamily: 'ionicons' | 'material';
  title: string;
  description: string;
};

const SERVICES: ServiceOption[] = [
  {
    key: 'pickup_to_branch',
    iconName: 'business',
    iconFamily: 'ionicons',
    title: 'Pickup to ALiN Branch',
    description: 'Rider collects item and delivers to nearest branch for shipping.',
  },
  {
    key: 'door_to_door',
    iconName: 'truck-delivery',
    iconFamily: 'material',
    title: 'Door-to-Door Delivery',
    description: 'Pickup and deliver directly to recipient.',
  },
  {
    key: 'track_shipment',
    iconName: 'cube-outline',
    iconFamily: 'material',
    title: 'Track Existing Shipment',
    description: 'Check status of a parcel.',
  },
];

const STATUS_ICONS: Record<string, { name: string; family: 'ionicons' | 'material' }> = {
  pending: { name: 'time-outline', family: 'ionicons' },
  broadcasting: { name: 'radio-outline', family: 'ionicons' },
  accepted: { name: 'checkmark-circle-outline', family: 'ionicons' },
  en_route_pickup: { name: 'car-outline', family: 'ionicons' },
  at_pickup: { name: 'location-outline', family: 'ionicons' },
  picked_up: { name: 'cube-outline', family: 'material' },
  in_transit: { name: 'swap-horizontal-outline', family: 'ionicons' },
  at_dropoff: { name: 'pin-outline', family: 'ionicons' },
  delivered: { name: 'checkmark-done-circle-outline', family: 'ionicons' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Finding Driver...',
  broadcasting: 'Broadcasting to Drivers',
  accepted: 'Driver Assigned',
  en_route_pickup: 'Driver En Route',
  at_pickup: 'At Pickup',
  picked_up: 'Package Picked Up',
  in_transit: 'In Transit',
  at_dropoff: 'At Dropoff',
  delivered: 'Delivered',
};

export default function HomeScreen({ navigation }: Props) {
  const [selectedService, setSelectedService] = useState<string>('pickup_to_branch');
  const [activeJob, setActiveJob] = useState<DeliveryJob | null>(getActiveJob());

  useFocusEffect(
    useCallback(() => {
      setActiveJob(getActiveJob());
    }, [])
  );

  useEffect(() => {
    const listener = (updatedJob: DeliveryJob) => {
      setActiveJob(updatedJob.status === 'delivered' ? null : updatedJob);
    };
    addJobListener(listener);
    return () => removeJobListener(listener);
  }, []);

  const handleContinue = () => {
    if (selectedService === 'track_shipment') {
      // Navigate to the History tab for tracking
      const parent = navigation.getParent();
      if (parent) parent.navigate('History');
    } else {
      // Navigate to booking with delivery type pre-selected
      navigation.navigate('NewDelivery', { deliveryType: selectedService });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Active Job Banner */}
        {activeJob && (
          <TouchableOpacity
            style={styles.activeCard}
            onPress={() => navigation.navigate('Tracking', { jobId: activeJob.id })}
            activeOpacity={0.8}
          >
            <View style={styles.activeDot} />
            <View style={styles.activeContent}>
              <Text style={styles.activeLabel}>Active Delivery</Text>
              <View style={styles.activeStatusRow}>
                {STATUS_ICONS[activeJob.status]?.family === 'ionicons' ? (
                  <Ionicons name={STATUS_ICONS[activeJob.status].name as any} size={14} color={Colors.text} />
                ) : STATUS_ICONS[activeJob.status]?.family === 'material' ? (
                  <MaterialCommunityIcons name={STATUS_ICONS[activeJob.status].name as any} size={14} color={Colors.text} />
                ) : null}
                <Text style={styles.activeStatus}>
                  {STATUS_LABELS[activeJob.status] ?? activeJob.status}
                </Text>
              </View>
              <Text style={styles.activeAddress} numberOfLines={1}>
                To: {activeJob.dropoff_address}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text style={styles.title}>Choose Delivery Service</Text>

        {/* Service Cards */}
        {SERVICES.map((service) => {
          const isSelected = selectedService === service.key;
          return (
            <TouchableOpacity
              key={service.key}
              style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
              onPress={() => setSelectedService(service.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIconBox, isSelected && styles.serviceIconBoxSelected]}>
                {service.iconFamily === 'ionicons' ? (
                  <Ionicons name={service.iconName as any} size={28} color={isSelected ? Colors.primary : Colors.textSecondary} />
                ) : (
                  <MaterialCommunityIcons name={service.iconName as any} size={28} color={isSelected ? Colors.primary : Colors.textSecondary} />
                )}
              </View>
              <View style={styles.serviceTextBox}>
                <Text style={[styles.serviceTitle, isSelected && styles.serviceTitleSelected]}>
                  {service.title}
                </Text>
                <Text style={styles.serviceDesc}>{service.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue Button - pinned to bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },

  // Active job banner
  activeCard: {
    backgroundColor: Colors.primaryBg, borderWidth: 2, borderColor: Colors.primary,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20,
  },
  activeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, marginRight: 12 },
  activeContent: { flex: 1 },
  activeLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  activeStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  activeStatus: { fontSize: 15, fontWeight: '600', color: Colors.text },
  activeAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Title
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 20, textAlign: 'center' },

  // Service cards
  serviceCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  serviceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceIconBoxSelected: { backgroundColor: Colors.primaryBg },
  serviceTextBox: { flex: 1 },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  serviceTitleSelected: { color: Colors.primaryDark },
  serviceDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
});

