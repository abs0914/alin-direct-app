// ============================================================
// ALiN Direct Driver App - Jobs History Screen
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Colors from '../../theme/colors';
import { DeliveryJob } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  delivered: Colors.success,
  failed: Colors.danger,
  cancelled: Colors.danger,
  in_transit: Colors.primary,
  picked_up: Colors.primaryLight,
  pending: Colors.textLight,
};

export default function JobsScreen() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const loadJobs = useCallback(async (pageNum: number = 1) => {
    try {
      const data = await api.getJobHistory(pageNum);
      if (pageNum === 1) {
        setJobs(data.data || []);
      } else {
        setJobs((prev) => [...prev, ...(data.data || [])]);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadJobs(1);
  };

  const renderJob = ({ item }: { item: DeliveryJob }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.trackingId}>{item.tracking_uuid?.substring(0, 12)}...</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? Colors.textLight }]}>
          <Text style={styles.badgeText}>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.jobBody}>
        <View style={styles.routeRow}>
          <Ionicons name="location-sharp" size={14} color="#3B82F6" style={{ marginRight: 8 }} />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address}</Text>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="flag" size={14} color={Colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.routeText} numberOfLines={1}>{item.dropoff_address}</Text>
        </View>
      </View>
      <View style={styles.jobFooter}>
        <Text style={styles.earnings}>₱{item.rider_earnings?.toFixed(2) ?? '0.00'}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJob}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.textLight} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No delivery history</Text>
            <Text style={styles.emptySubtext}>Completed deliveries will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trackingId: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: Colors.textInverse, fontSize: 10, fontWeight: '700' },
  jobBody: { marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  routeText: { flex: 1, fontSize: 13, color: Colors.text },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  earnings: { fontSize: 18, fontWeight: '700', color: Colors.success },
  date: { fontSize: 12, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

