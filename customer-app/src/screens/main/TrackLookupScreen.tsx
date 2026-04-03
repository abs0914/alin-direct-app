// ============================================================
// ALiN Move Customer App - Track Existing Shipment Screen
// ============================================================
// DEMO: Simulates shipment lookup by tracking ID or barcode.
// PRODUCTION: Replace lookupTracking with real API call.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import Colors from '../../theme/colors';

type Props = {
  route: RouteProp<HomeStackParamList, 'TrackLookup'>;
};

// --- Demo shipment records ---
const DEMO_SHIPMENTS: Record<string, DemoShipment> = {
  'ALN-2025-001': {
    trackingId: 'ALN-2025-001', sender: 'Juan dela Cruz', recipient: 'Maria Santos',
    origin: 'Makati Branch', destination: 'Cebu City, Cebu',
    status: 'in_transit', statusLabel: 'In Transit',
    estimatedDelivery: 'Today, 4:00 PM', weight: '0.5 kg',
    history: [
      { time: '8:02 AM', event: 'Parcel received at Makati Branch', done: true },
      { time: '9:15 AM', event: 'Sorted and dispatched to Cebu hub', done: true },
      { time: '11:30 AM', event: 'In transit — inter-city transfer', done: true },
      { time: '4:00 PM', event: 'Out for delivery', done: false },
    ],
  },
  'ALN-2025-002': {
    trackingId: 'ALN-2025-002', sender: 'Pedro Reyes', recipient: 'Ana Gomez',
    origin: 'Cebu Branch', destination: 'Quezon City, Metro Manila',
    status: 'delivered', statusLabel: 'Delivered',
    estimatedDelivery: 'Delivered yesterday 2:45 PM', weight: '1.2 kg',
    history: [
      { time: 'Yesterday 9:00 AM', event: 'Parcel received at Cebu Branch', done: true },
      { time: 'Yesterday 10:30 AM', event: 'Dispatched via air cargo', done: true },
      { time: 'Yesterday 1:00 PM', event: 'Arrived at Manila hub', done: true },
      { time: 'Yesterday 2:45 PM', event: 'Delivered to recipient', done: true },
    ],
  },
  'ALN-2025-003': {
    trackingId: 'ALN-2025-003', sender: 'Rosa Lim', recipient: 'Jose Santos',
    origin: 'Makati Branch', destination: 'Davao City, Davao del Sur',
    status: 'pending', statusLabel: 'Processing',
    estimatedDelivery: 'Tomorrow', weight: '3.0 kg',
    history: [
      { time: 'Today 7:50 AM', event: 'Parcel received at Makati Branch', done: true },
      { time: 'Pending', event: 'Awaiting dispatch', done: false },
    ],
  },
};

type DemoShipment = {
  trackingId: string; sender: string; recipient: string;
  origin: string; destination: string;
  status: string; statusLabel: string; estimatedDelivery: string; weight: string;
  history: { time: string; event: string; done: boolean }[];
};

const STATUS_COLOR: Record<string, string> = {
  in_transit: '#2563EB', delivered: '#16A34A', pending: '#D97706',
};

export default function TrackLookupScreen({ route }: Props) {
  const [query, setQuery] = useState(route?.params?.initialQuery ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoShipment | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Auto-search if arriving with a pre-filled query
  useEffect(() => {
    if (route?.params?.initialQuery) {
      handleTrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = async () => {
    const id = query.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    await new Promise(r => setTimeout(r, 900));
    const found = DEMO_SHIPMENTS[id] ?? null;
    setResult(found);
    setNotFound(!found);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Track a Shipment</Text>
      <Text style={styles.subtitle}>Enter your tracking number or scan barcode</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. ALN-2025-001"
          placeholderTextColor={Colors.textLight}
          value={query}
          onChangeText={t => { setQuery(t); setNotFound(false); }}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleTrack}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleTrack} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" size="small" />
            : <Ionicons name="search" size={20} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* Demo hint chips */}
      <Text style={styles.hintLabel}>Try a demo ID:</Text>
      <View style={styles.chips}>
        {Object.keys(DEMO_SHIPMENTS).map(id => (
          <TouchableOpacity key={id} style={styles.chip} onPress={() => setQuery(id)}>
            <Text style={styles.chipText}>{id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {notFound && (
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textLight} />
          <Text style={styles.notFoundText}>No shipment found for "{query}"</Text>
          <Text style={styles.notFoundSub}>Check the tracking number and try again.</Text>
        </View>
      )}

      {result && <ShipmentCard shipment={result} />}
    </ScrollView>
  );
}

function ShipmentCard({ shipment }: { shipment: DemoShipment }) {
  const statusColor = STATUS_COLOR[shipment.status] ?? Colors.textSecondary;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.trackingId}>{shipment.trackingId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{shipment.statusLabel}</Text>
        </View>
      </View>
      <View style={styles.row}><Text style={styles.label}>From</Text><Text style={styles.value}>{shipment.sender} · {shipment.origin}</Text></View>
      <View style={styles.row}><Text style={styles.label}>To</Text><Text style={styles.value}>{shipment.recipient} · {shipment.destination}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Weight</Text><Text style={styles.value}>{shipment.weight}</Text></View>
      <View style={styles.row}><Text style={styles.label}>ETA</Text><Text style={[styles.value, { color: Colors.primary, fontWeight: '600' }]}>{shipment.estimatedDelivery}</Text></View>
      <View style={styles.divider} />
      <Text style={styles.historyTitle}>Shipment History</Text>
      {shipment.history.map((h, i) => (
        <View key={i} style={styles.histRow}>
          <View style={[styles.histDot, h.done && styles.histDotDone]} />
          <View style={styles.histContent}>
            <Text style={[styles.histEvent, !h.done && styles.histEventPending]}>{h.event}</Text>
            <Text style={styles.histTime}>{h.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  hintLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  chip: { backgroundColor: Colors.primaryBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  notFound: { alignItems: 'center', paddingVertical: 40 },
  notFoundText: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 12 },
  notFoundSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  trackingId: { fontSize: 15, fontWeight: '700', color: Colors.text, fontVariant: ['tabular-nums'] },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 13, color: Colors.text, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 },
  historyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  histRow: { flexDirection: 'row', marginBottom: 12 },
  histDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, marginRight: 12, marginTop: 3 },
  histDotDone: { backgroundColor: Colors.success },
  histContent: { flex: 1 },
  histEvent: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  histEventPending: { color: Colors.textSecondary },
  histTime: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
});

