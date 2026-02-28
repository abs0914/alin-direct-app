// ============================================================
// ALiN Direct Driver App - Earnings Screen
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import Colors from '../../theme/colors';
import { EarningsSummary } from '../../types';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = useCallback(async () => {
    try {
      const data = await api.getEarnings();
      setEarnings(data);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  const handlePayout = () => {
    if (!earnings || earnings.pending_payout <= 0) {
      Alert.alert('No Funds', 'You have no earnings available for payout.');
      return;
    }
    Alert.alert(
      'Request Payout',
      `Request payout of ₱${earnings.pending_payout.toFixed(2)} to your Maya wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.requestPayout(earnings.pending_payout);
              Alert.alert('Success', 'Payout request submitted. Processing within 24 hours.');
              loadEarnings();
            } catch {
              Alert.alert('Error', 'Failed to request payout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available for Payout</Text>
        <Text style={styles.balanceAmount}>₱{earnings?.pending_payout?.toFixed(2) ?? '0.00'}</Text>
        <TouchableOpacity style={styles.payoutButton} onPress={handlePayout}>
          <Text style={styles.payoutText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings Summary</Text>
        <View style={styles.earningsGrid}>
          {[
            { label: 'Today', value: earnings?.today ?? 0 },
            { label: 'This Week', value: earnings?.this_week ?? 0 },
            { label: 'This Month', value: earnings?.this_month ?? 0 },
            { label: 'All Time', value: earnings?.total ?? 0 },
          ].map((item) => (
            <View key={item.label} style={styles.earningCard}>
              <Text style={styles.earningValue}>₱{item.value.toFixed(2)}</Text>
              <Text style={styles.earningLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(69,26,3,0.7)', fontSize: 14 },
  balanceAmount: { color: Colors.textOnPrimary, fontSize: 36, fontWeight: '700', marginTop: 4 },
  payoutButton: { backgroundColor: 'rgba(69,26,3,0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 16, borderWidth: 1, borderColor: 'rgba(69,26,3,0.25)' },
  payoutText: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  earningsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  earningCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  earningValue: { fontSize: 20, fontWeight: '700', color: Colors.success },
  earningLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});

