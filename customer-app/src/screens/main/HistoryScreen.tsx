// ============================================================
// ALiN Direct Customer App - Delivery History Screen
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';
import Colors from '../../theme/colors';
import { DeliveryJob, JobStatus } from '../../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: Colors.warning, bg: Colors.warningBg },
  broadcasting: { label: 'Finding Driver', color: Colors.info, bg: '#E0F2FE' },
  accepted: { label: 'Accepted', color: Colors.info, bg: '#E0F2FE' },
  en_route_pickup: { label: 'Driver En Route', color: Colors.info, bg: '#E0F2FE' },
  at_pickup: { label: 'At Pickup', color: Colors.info, bg: '#E0F2FE' },
  picked_up: { label: 'Picked Up', color: Colors.primary, bg: Colors.primaryBg },
  in_transit: { label: 'In Transit', color: Colors.primary, bg: Colors.primaryBg },
  at_dropoff: { label: 'At Dropoff', color: Colors.primary, bg: Colors.primaryBg },
  delivered: { label: 'Delivered', color: Colors.success, bg: Colors.successBg },
  failed: { label: 'Failed', color: Colors.danger, bg: Colors.dangerBg },
  cancelled: { label: 'Cancelled', color: Colors.textLight, bg: Colors.borderLight },
  returned: { label: 'Returned', color: Colors.danger, bg: Colors.dangerBg },
};

// HistoryScreen needs the parent tab navigator to navigate to Tracking
// in the HomeTab stack. We use useNavigation with `any` since we cross tab boundaries.
import { useNavigation } from '@react-navigation/native';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();

  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      const response = await api.getBookingHistory(pageNum);
      const newJobs = response.data ?? [];
      setJobs(pageNum === 1 ? newJobs : [...jobs, ...newJobs]);
      setHasMore(newJobs.length >= 15);
      setPage(pageNum);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [jobs]);

  useEffect(() => { fetchHistory(1); }, []);

  const handleRefresh = () => fetchHistory(1, true);
  const handleLoadMore = () => { if (hasMore && !isLoading) fetchHistory(page + 1); };

  const getStatusConfig = (status: JobStatus) => STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: DeliveryJob }) => {
    const sc = getStatusConfig(item.status);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}
        onPress={() => navigation.navigate('HomeTab' as never, { screen: 'Tracking', params: { jobId: item.id } } as never)}>
        <View style={styles.cardHeader}>
          <Text style={styles.trackingId}>#{item.tracking_uuid.slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>📍</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.pickup_address}</Text>
        </View>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>📌</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.dropoff_address}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          <Text style={styles.priceText}>₱{item.total_price?.toFixed(2) ?? '0.00'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySubtitle}>Your delivery history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  listContent: { padding: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trackingId: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressLabel: { fontSize: 14, marginRight: 8, width: 20 },
  addressText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  dateText: { fontSize: 12, color: Colors.textLight },
  priceText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

