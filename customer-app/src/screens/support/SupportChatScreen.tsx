// ============================================================
// ALiN Move Customer App - Support Chat Screen
// ============================================================
// Chat interface: customer messages on the right (amber),
// bot/agent messages on the left (white).
// Handles: new conversations, continuing existing ones,
// escalation banners, "agent typing" indicator.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SupportStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import Colors from '../../theme/colors';
import { SupportMessage, SupportConversation, ConversationStatus } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SupportStackParamList, 'SupportChat'>;
  route: RouteProp<SupportStackParamList, 'SupportChat'>;
};

type UiMessage = SupportMessage & { _typing?: boolean };

const STATUS_BANNERS: Partial<Record<ConversationStatus, { text: string; color: string; icon: string }>> = {
  pending_agent: {
    text: 'Connecting you to a live agent…',
    color: '#FFF7ED',
    icon: 'time-outline',
  },
  agent_active: {
    text: 'You are now chatting with a support agent.',
    color: '#F0FDF4',
    icon: 'checkmark-circle-outline',
  },
  resolved: {
    text: 'This conversation has been resolved.',
    color: '#F1F5F9',
    icon: 'checkmark-done-circle-outline',
  },
};

export default function SupportChatScreen({ navigation, route }: Props) {
  const { conversationId: initialConvId, initialMessage } = route.params;

  const [conversationId, setConversationId] = useState<number | null>(initialConvId ?? null);
  const [status, setStatus] = useState<ConversationStatus>('open');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputText, setInputText] = useState(initialMessage ?? '');
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!initialConvId);

  const listRef = useRef<FlatList>(null);

  // ── Load existing conversation ─────────────────────

  useEffect(() => {
    if (!initialConvId) return;

    (async () => {
      try {
        const conv: SupportConversation = await api.getSupportConversation(initialConvId);
        setStatus(conv.status);
        setMessages((conv.messages ?? []).filter((m) => m.message_type !== 'internal_note'));
      } catch {
        Alert.alert('Error', 'Could not load conversation.');
      } finally {
        setIsLoadingHistory(false);
      }
    })();
  }, [initialConvId]);

  // Auto-send initialMessage if opening fresh with a prefilled message
  useEffect(() => {
    if (!initialConvId && initialMessage) {
      sendMessage(initialMessage);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll to bottom ───────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send message ───────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setInputText('');
    setIsSending(true);

    // Optimistic customer bubble
    const optimisticMsg: UiMessage = {
      id: Date.now(),
      conversation_id: conversationId ?? -1,
      sender_type: 'customer',
      body: trimmed,
      message_type: 'text',
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Show bot typing indicator
    setIsBotTyping(true);

    try {
      const result = conversationId
        ? await api.sendSupportMessage(conversationId, trimmed)
        : await api.startSupportChat(trimmed);

      const newConvId = result.conversation_id;
      setConversationId(newConvId);
      setStatus(result.status);

      // Remove optimistic, add confirmed customer msg + bot reply
      setMessages((prev) => {
        const confirmed = prev
          .filter((m) => !m._pending)
          .concat({
            ...optimisticMsg,
            conversation_id: newConvId,
            _pending: false,
          });

        if (result.bot_reply) {
          confirmed.push({
            id: Date.now() + 1,
            conversation_id: newConvId,
            sender_type: 'bot',
            body: result.bot_reply,
            message_type: 'text',
            created_at: new Date().toISOString(),
          });
        }

        return confirmed;
      });
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => !m._pending));
      Alert.alert('Error', 'Could not send message. Please try again.');
    } finally {
      setIsSending(false);
      setIsBotTyping(false);
    }
  }, [conversationId, isSending]);

  // ── Close conversation ─────────────────────────────

  const closeConversation = () => {
    Alert.alert(
      'Close Conversation',
      'Mark this support conversation as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            if (conversationId) {
              try {
                await api.closeSupportConversation(conversationId);
                setStatus('closed');
              } catch {
                Alert.alert('Error', 'Could not close conversation.');
              }
            }
          },
        },
      ],
    );
  };

  // ── Header close button ────────────────────────────

  useEffect(() => {
    const canClose = conversationId && !['resolved', 'closed'].includes(status);
    navigation.setOptions({
      headerRight: canClose
        ? () => (
            <TouchableOpacity onPress={closeConversation} style={{ marginRight: 4 }}>
              <Text style={{ fontSize: 14, color: Colors.danger, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [conversationId, status, navigation]);

  // ── Render ─────────────────────────────────────────

  const isClosed = ['resolved', 'closed'].includes(status);
  const banner = STATUS_BANNERS[status];

  if (isLoadingHistory) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Status banner */}
      {banner && (
        <View style={[styles.banner, { backgroundColor: banner.color }]}>
          <Ionicons name={banner.icon as any} size={16} color={Colors.textSecondary} />
          <Text style={styles.bannerText}>{banner.text}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={styles.emptyChatIcon}>
              <Ionicons name="chatbubbles-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyChatTitle}>Hi! How can we help?</Text>
            <Text style={styles.emptyChatSub}>
              Type your message below or tap a quick topic on the Support screen.
            </Text>
          </View>
        }
        ListFooterComponent={
          isBotTyping ? (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <TypingDots />
              </View>
            </View>
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input bar */}
      {isClosed ? (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>This conversation is closed.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SupportMain')}
            style={styles.newChatBtn}
          >
            <Text style={styles.newChatBtnText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
            disabled={!inputText.trim() || isSending}
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Message bubble ────────────────────────────────────────

function MessageBubble({ message }: { message: UiMessage }) {
  const isCustomer = message.sender_type === 'customer';
  const isPending  = message._pending;

  const senderLabel = message.sender_type === 'agent' ? 'Support Agent' : 'ALiN Bot';

  return (
    <View style={[styles.bubbleWrap, isCustomer ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isCustomer && (
        <View style={styles.avatarDot}>
          <Ionicons name="headset" size={12} color={Colors.primary} />
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        {!isCustomer && (
          <Text style={styles.senderLabel}>{senderLabel}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isCustomer ? styles.bubbleCustomer : styles.bubbleBot,
            isPending && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.bubbleText, isCustomer && styles.bubbleTextCustomer]}>
            {message.body}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, isCustomer && { textAlign: 'right' }]}>
          {formatTime(message.created_at)}
          {isPending ? '  •  Sending…' : ''}
        </Text>
      </View>
    </View>
  );
}

// ── Typing dots animation ─────────────────────────────────

function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: Colors.textLight,
            opacity: 0.6 + i * 0.2,
          }}
        />
      ))}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  bannerText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },

  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  emptyChat: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, paddingHorizontal: 32,
  },
  emptyChatIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyChatTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptyChatSub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  bubbleWrap:     { marginBottom: 12 },
  bubbleLeft:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRight:    { alignItems: 'flex-end' },

  avatarDot: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },

  senderLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 4, marginLeft: 4,
  },

  bubble:         { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot:      {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleCustomer: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText:        { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextCustomer:{ color: '#fff' },
  bubbleTime:        { fontSize: 11, color: Colors.textLight, marginTop: 4, marginHorizontal: 4 },

  typingRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  typingBubble: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  closedBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 16, alignItems: 'center', gap: 10,
  },
  closedText:    { fontSize: 13, color: Colors.textSecondary },
  newChatBtn:    {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  newChatBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});
