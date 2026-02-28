// ============================================================
// ALiN Direct Driver App - Notifications Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';

type Notification = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', icon: 'cube', title: 'New Job Available', body: 'Door-to-Door delivery in Makati. ₱185 earnings. 3.2 km.', time: '1 min ago', read: false },
  { id: '2', icon: 'wallet', title: 'Payout Processed', body: 'Your payout request of ₱2,450.00 has been processed to Maya.', time: '30 min ago', read: false },
  { id: '3', icon: 'star', title: 'Great Rating!', body: 'You received a 5-star rating from your last delivery.', time: '2 hr ago', read: true },
  { id: '4', icon: 'checkmark-circle', title: 'Application Approved', body: 'Congratulations! Your driver application has been approved.', time: '1 day ago', read: true },
  { id: '5', icon: 'clipboard', title: 'Document Expiring', body: "Your driver's license expires in 30 days. Please renew.", time: '2 days ago', read: true },
  { id: '6', icon: 'trophy', title: 'Weekly Bonus', body: 'You earned a ₱500 bonus for completing 20 deliveries this week!', time: '3 days ago', read: true },
];

function NotificationItem({ item }: { item: Notification }) {
  return (
    <View style={[styles.item, !item.read && styles.itemUnread]}>
      <Ionicons name={item.icon} size={24} color={Colors.primary} style={{ marginRight: 12, marginTop: 2 }} />
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
            <Ionicons name="notifications-outline" size={48} color={Colors.textLight} style={{ marginBottom: 12 }} />
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

  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: '500', color: Colors.text, flex: 1 },
  itemTitleUnread: { fontWeight: '700' },
  itemTime: { fontSize: 12, color: Colors.textLight, marginLeft: 8 },
  itemBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6, marginLeft: 4 },
  separator: { height: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

