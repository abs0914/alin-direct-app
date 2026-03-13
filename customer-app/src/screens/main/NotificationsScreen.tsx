// ============================================================
// ALiN Move Customer App - Notifications Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import Colors from '../../theme/colors';

type Notification = {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', icon: '📦', title: 'Delivery Picked Up', body: 'Your package has been picked up by the rider and is on the way.', time: '2 min ago', read: false },
  { id: '2', icon: '🚗', title: 'Rider En Route', body: 'Your rider is heading to the pickup location now.', time: '15 min ago', read: false },
  { id: '3', icon: '✅', title: 'Delivery Completed', body: 'Your delivery #ALN-8821 has been delivered successfully.', time: '1 hr ago', read: true },
  { id: '4', icon: '🎉', title: 'Welcome to ALiN Move!', body: 'Thanks for joining! Book your first delivery today.', time: '1 day ago', read: true },
  { id: '5', icon: '💰', title: 'Special Offer', body: 'Get 20% off on your next Door-to-Door delivery. Code: ALIN20', time: '2 days ago', read: true },
  { id: '6', icon: '⭐', title: 'Rate Your Delivery', body: 'How was your experience with rider Juan? Leave a rating.', time: '3 days ago', read: true },
];

function NotificationItem({ item }: { item: Notification }) {
  return (
    <View style={[styles.item, !item.read && styles.itemUnread]}>
      <Text style={styles.itemIcon}>{item.icon}</Text>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>{item.title}</Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );
}

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 12, padding: 14 },
  itemUnread: { backgroundColor: Colors.primaryBg },
  itemIcon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: '500', color: Colors.text, flex: 1 },
  itemTitleUnread: { fontWeight: '700' },
  itemTime: { fontSize: 12, color: Colors.textLight, marginLeft: 8 },
  itemBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6, marginLeft: 4 },
  separator: { height: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

