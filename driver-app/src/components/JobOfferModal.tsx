// ============================================================
// ALiN Move Driver App - Job Offer Modal
// ============================================================
// MOCK: Displays offer from in-memory jobStore.
// PRODUCTION: Replace with Supabase Realtime offer notifications.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { JobOffer } from '../types';

type Props = {
  offer: JobOffer;
  onAccept: () => void;
  onReject: () => void;
};

export default function JobOfferModal({ offer, onAccept, onReject }: Props) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResponding, setIsResponding] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    const expiresAt = new Date(offer.expires_at).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(interval); onReject(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [offer.expires_at]);

  // Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const job = offer.job;
  if (!job) return null;

  const handleAccept = () => { setIsResponding(true); onAccept(); };
  const handleReject = () => { setIsResponding(true); onReject(); };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}><Ionicons name="flash" size={18} color={Colors.primary} /> New Job Offer</Text>
            <View style={styles.timer}>
              <Text style={[styles.timerText, timeLeft <= 10 && styles.timerUrgent]}>{timeLeft}s</Text>
            </View>
          </View>

          {/* Earnings */}
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>You Earn</Text>
            <Text style={styles.earningsAmount}>₱{job.rider_earnings?.toFixed(2) ?? '0.00'}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeSection}>
            <View style={styles.routeRow}>
              <Ionicons name="location-sharp" size={16} color="#3B82F6" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddr} numberOfLines={2}>{job.pickup_address}</Text>
                <Text style={styles.routeContact}>{job.pickup_contact_name}</Text>
              </View>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color={Colors.danger} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Dropoff</Text>
                <Text style={styles.routeAddr} numberOfLines={2}>{job.dropoff_address}</Text>
                <Text style={styles.routeContact}>{job.dropoff_contact_name}</Text>
              </View>
            </View>
          </View>

          {/* Job Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{job.distance_km ?? '~8'} km</Text>
              <Text style={styles.detailLabel}>Distance</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{job.vehicle_type}</Text>
              <Text style={styles.detailLabel}>Vehicle</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{job.package_size}</Text>
              <Text style={styles.detailLabel}>Package</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{job.payment_method === 'cod' ? 'COD' : 'Online'}</Text>
              <Text style={styles.detailLabel}>Payment</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={isResponding}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={isResponding}>
              {isResponding ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={styles.acceptText}>Accept Job</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  timer: { backgroundColor: Colors.warningBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  timerText: { fontSize: 16, fontWeight: '700', color: '#92400E' },
  timerUrgent: { color: Colors.danger },
  earningsRow: { backgroundColor: Colors.primaryBg, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  earningsLabel: { fontSize: 14, fontWeight: '600', color: Colors.primaryDark },
  earningsAmount: { fontSize: 24, fontWeight: '700', color: Colors.primaryDark },
  routeSection: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  routeContent: { flex: 1 },
  routeLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeAddr: { fontSize: 14, color: Colors.text, marginTop: 2 },
  routeContact: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  routeDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 10, marginLeft: 30 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  detailItem: { alignItems: 'center' },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  detailLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, borderWidth: 2, borderColor: Colors.danger, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  rejectText: { color: Colors.danger, fontSize: 16, fontWeight: '700' },
  acceptBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  acceptText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
});
