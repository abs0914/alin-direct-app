// ============================================================
// ALiN Move Customer App - Support Screen
// ============================================================
// Shows the user's support conversations.
// Tapping a conversation navigates to the chat.
// "Start a Chat" opens a new conversation.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SupportStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import Colors from '../../theme/colors';
import { SupportConversation, ConversationStatus } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SupportStackParamList, 'SupportMain'>;
};

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open:          'Open',
  bot_handling:  'Bot Handling',
  pending_agent: 'Waiting for Agent',
  agent_active:  'Agent Connected',
  resolved:      'Resolved',
  closed:        'Closed',
};

const STATUS_COLOR: Record<ConversationStatus, string> = {
  open:          Colors.info,
  bot_handling:  Colors.info,
  pending_agent: Colors.warning,
  agent_active:  Colors.success,
  resolved:      Colors.textLight,
  closed:        Colors.textLight,
};

const QUICK_TOPICS = [
  { icon: 'cube-outline',           label: 'Track delivery',   message: 'Saan na ang aking delivery?' },
  { icon: 'cash-outline',           label: 'Pricing',          message: 'Magkano ang delivery fee?' },
  { icon: 'alert-circle-outline',   label: 'Report an issue',  message: 'May issue ako sa aking delivery.' },
  { icon: 'card-outline',           label: 'Payment issue',    message: 'May problema sa aking payment.' },
];

export default function SupportScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.getSupportConversations();
      setConversations(data);
    } catch {
      // Silently fail — empty list shown
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadConversations(); }, [loadConversations]));

  const openOrStartChat = (conversationId?: number) => {
    navigation.navigate('SupportChat', { conversationId: conversationId ?? null });
  };

  const openWithTopic = (message: string) => {
    navigation.navigate('SupportChat', { conversationId: null, initialMessage: message });
  };

  const activeConversations = conversations.filter(
    (c) => !['resolved', 'closed'].includes(c.status),
  );
  const recentClosed = conversations.filter(
    (c) => ['resolved', 'closed'].includes(c.status),
  ).slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => { setIsRefreshing(true); loadConversations(true); }}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <View>
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="headset" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>ALiN Support</Text>
              <Text style={styles.heroSub}>
                Get help with tracking, pricing, and delivery issues.
              </Text>
            </View>
          </View>

          {/* Quick topics */}
          <Text style={styles.sectionLabel}>Quick Topics</Text>
          <View style={styles.quickGrid}>
            {QUICK_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.label}
                style={styles.quickCard}
                activeOpacity={0.7}
                onPress={() => openWithTopic(topic.message)}
              >
                <Ionicons name={topic.icon as any} size={22} color={Colors.primary} />
                <Text style={styles.quickLabel}>{topic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start new chat CTA */}
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.8}
            onPress={() => openOrStartChat()}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={styles.startBtnText}>Start a New Chat</Text>
          </TouchableOpacity>

          {/* Active conversations */}
          {activeConversations.length > 0 && (
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Open Conversations</Text>
          )}
        </View>
      }
      data={activeConversations}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ConversationCard conversation={item} onPress={() => openOrStartChat(item.id)} />
      )}
      ListFooterComponent={
        recentClosed.length > 0 ? (
          <View>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Recent History</Text>
            {recentClosed.map((c) => (
              <ConversationCard
                key={c.id}
                conversation={c}
                onPress={() => openOrStartChat(c.id)}
              />
            ))}
          </View>
        ) : null
      }
      ListEmptyComponent={
        activeConversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No open conversations.</Text>
            <Text style={styles.emptySubText}>Tap a quick topic or start a chat above.</Text>
          </View>
        ) : null
      }
    />
  );
}

// ── Conversation card ─────────────────────────────────────

function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: SupportConversation;
  onPress: () => void;
}) {
  const status = conversation.status as ConversationStatus;
  const isActive = !['resolved', 'closed'].includes(status);
  const preview = conversation.latest_message?.body ?? 'No messages yet.';
  const truncated = preview.length > 75 ? preview.slice(0, 75) + '…' : preview;

  return (
    <TouchableOpacity style={styles.convCard} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.convAvatar, { backgroundColor: isActive ? Colors.primaryBg : '#F1F5F9' }]}>
        <Ionicons
          name={isActive ? 'chatbubble-ellipses' : 'chatbubble-outline'}
          size={20}
          color={isActive ? Colors.primary : Colors.textLight}
        />
      </View>
      <View style={styles.convBody}>
        <View style={styles.convRow}>
          <Text style={styles.convTitle}>
            {conversation.intent
              ? conversation.intent.charAt(0).toUpperCase() + conversation.intent.slice(1) + ' Support'
              : 'Support Chat'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
          </View>
        </View>
        <Text style={styles.convPreview} numberOfLines={2}>{truncated}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={{ marginTop: 4 }} />
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  content:    { padding: 16, paddingBottom: 40 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text },
  heroSub:    { fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  quickGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickCard:  {
    width: '47%', backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14,
    alignItems: 'flex-start', gap: 8,
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  convCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10,
  },
  convAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  convBody:   { flex: 1 },
  convRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convTitle:  { fontSize: 14, fontWeight: '600', color: Colors.text },
  convPreview:{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 11, fontWeight: '600' },

  emptyWrap:    { alignItems: 'center', paddingVertical: 20 },
  emptyText:    { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
});
