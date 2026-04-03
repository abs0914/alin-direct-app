// ============================================================
// ALiN Move Driver App - Emergency Alert Modal
// ============================================================
// Displayed to nearby online riders when a branch-mate triggers SOS.
// Allows them to accept the emergency assistance job.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { NearbyAlertState } from '../store/emergencyStore';
import { EmergencyAlert } from '../types';

type Props = {
  alert: NearbyAlertState;
  /** Full alert data fetched from API (rider name, etc.) */
  alertData?: Partial<EmergencyAlert>;
  onRespond: () => Promise<void>;
  onDismiss: () => void;
};

export default function EmergencyAlertModal({ alert, alertData, onRespond, onDismiss }: Props) {
  const [isResponding, setIsResponding] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Urgent pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Shake SOS icon for attention
  useEffect(() => {
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    );
    shake.start();
    return () => shake.stop();
  }, []);

  const handleRespond = async () => {
    setIsResponding(true);
    try {
      await onRespond();
    } finally {
      setIsResponding(false);
    }
  };

  const openMap = () => {
    if (alert.lat && alert.lng) {
      const url = `https://maps.google.com/?q=${alert.lat},${alert.lng}`;
      Linking.openURL(url);
    }
  };

  const riderName = alertData?.rider?.user?.name ?? `Rider #${alert.rider_id}`;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>

          {/* SOS Header */}
          <View style={styles.header}>
            <Animated.Text style={[styles.sosIcon, { transform: [{ translateX: shakeAnim }] }]}>
              🆘
            </Animated.Text>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>EMERGENCY ALERT</Text>
              <Text style={styles.headerSubtitle}>A nearby rider needs help!</Text>
            </View>
          </View>

          {/* Rider Info */}
          <View style={styles.riderCard}>
            <Ionicons name="person-circle" size={36} color={Colors.danger} />
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{riderName}</Text>
              <Text style={styles.riderSub}>Rider in Distress</Text>
            </View>
          </View>

          {/* Location */}
          {alert.lat && alert.lng && (
            <TouchableOpacity style={styles.locationRow} onPress={openMap} activeOpacity={0.7}>
              <Ionicons name="location-sharp" size={18} color="#3B82F6" />
              <Text style={styles.locationText}>
                {alert.lat.toFixed(5)}, {alert.lng.toFixed(5)}
              </Text>
              <Ionicons name="open-outline" size={14} color="#3B82F6" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          {/* Notes */}
          {alertData?.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Rider's Note:</Text>
              <Text style={styles.notesText}>"{alertData.notes}"</Text>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Accepting will assign you this emergency assistance job. Your current availability will be set to On Job.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} disabled={isResponding}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.respondBtn} onPress={handleRespond} disabled={isResponding}>
              {isResponding
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.respondText}>🚀 Respond Now</Text>
              }
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 4,
    borderTopColor: Colors.danger,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  sosIcon: { fontSize: 40 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.danger, letterSpacing: 1 },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  riderSub: { fontSize: 13, color: Colors.danger, marginTop: 2, fontWeight: '600' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  locationText: { flex: 1, fontSize: 13, color: '#1D4ED8', fontFamily: 'monospace' },
  notesBox: {
    backgroundColor: Colors.warningBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#78350F', fontStyle: 'italic' },
  disclaimer: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  dismissBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  respondBtn: {
    flex: 2,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  respondText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

