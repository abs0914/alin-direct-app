// ============================================================
// ALiN Move Customer App - Insurance Card Screen (PAI)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService, { PaiPolicy } from '../../services/api';

const GOLD = '#F5A010';
const DARK = '#451a03';

// ── Coverage row helper ──────────────────────────────────────
function CoverageRow({ label, amount, last }: { label: string; amount: number; last?: boolean }) {
  return (
    <View style={[styles.coverageRow, !last && styles.coverageRowBorder]}>
      <Text style={styles.coverageLabel}>{label}</Text>
      <Text style={styles.coverageAmount}>₱{amount.toLocaleString()}</Text>
    </View>
  );
}

export default function InsuranceCardScreen() {
  const [policy, setPolicy] = useState<PaiPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ApiService.getInsurance().then(({ insurance }) => {
      setPolicy(insurance);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const flip = () => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, friction: 8 }).start();
    setFlipped(!flipped);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>;
  }

  if (!policy) {
    return (
      <View style={styles.center}>
        <Ionicons name="shield-outline" size={56} color="#ccc" />
        <Text style={styles.noCardTitle}>No Insurance Policy</Text>
        <Text style={styles.noCardSub}>You don't have an active Personal Accident Insurance policy yet. Visit any ALiN branch to enroll.</Text>
      </View>
    );
  }

  const initials = policy.full_name.split(' ').map((w: string) => w[0]?.toUpperCase()).slice(0, 2).join('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status badge */}
      {!policy.is_active && (
        <View style={styles.expiredBadge}>
          <Text style={styles.expiredText}>⚠️ Policy {policy.status.toUpperCase()} — Not Active</Text>
        </View>
      )}

      {/* Card flip area */}
      <View style={styles.cardWrapper}>
        {/* FRONT */}
        <Animated.View style={[styles.card, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={flip} style={styles.cardInner}>
            <Text style={styles.cardBrand}>ALiN Cargo Express</Text>
            <Text style={styles.cardTitle}>Personal Accident Insurance</Text>
            <View style={styles.memberRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              <View>
                <Text style={styles.memberName}>{policy.full_name}</Text>
                <Text style={styles.memberSub}>{policy.nationality}</Text>
              </View>
            </View>
            <View style={styles.cardGrid}>
              <View style={styles.cardGridItem}><Text style={styles.cardGridLabel}>Member ID</Text><Text style={styles.cardGridValue}>{policy.member_id}</Text></View>
              <View style={styles.cardGridItem}><Text style={styles.cardGridLabel}>Policy No.</Text><Text style={styles.cardGridValue}>{policy.policy_number}</Text></View>
              <View style={styles.cardGridItem}><Text style={styles.cardGridLabel}>Valid</Text><Text style={styles.cardGridValue}>{policy.validity_years}</Text></View>
              <View style={styles.cardGridItem}><Text style={styles.cardGridLabel}>Branch</Text><Text style={styles.cardGridValue}>{policy.branch_name ?? '—'}</Text></View>
            </View>
            <Text style={styles.tapHint}>Tap to flip ↩</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* BACK */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={flip} style={styles.cardInner}>
            <Text style={styles.cardTitle}>Coverage Benefits</Text>
            <View style={styles.coverageTable}>
              <CoverageRow label="Accidental Death & Disablement" amount={policy.coverage.death} />
              <CoverageRow label="Murder & Assault" amount={policy.coverage.murder} />
              <CoverageRow label="Medical Reimbursement" amount={policy.coverage.medical} />
              <CoverageRow label="Burial Benefits" amount={policy.coverage.burial} last />
            </View>
            <Text style={styles.cardFooter}>(032) 346 3965 · Unit D6-D7 Jamestown, Mandaue City</Text>
            <Text style={styles.tapHint}>Tap to flip ↩</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Policy details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Policy Details</Text>
        {[
          ['Policy Number', policy.policy_number],
          ['Member ID', policy.member_id],
          ['Valid', `${policy.valid_from} → ${policy.valid_until}`],
          ['Status', policy.status.toUpperCase()],
          ['Mobile', policy.mobile],
          ['Email', policy.email],
          ['Address', policy.address],
        ].map(([label, value], i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Beneficiaries */}
      {!!policy.beneficiaries?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beneficiaries</Text>
          {policy.beneficiaries.map((b, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{b.relationship}</Text>
              <Text style={styles.detailValue}>{b.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Verify link */}
      <TouchableOpacity style={styles.verifyBtn} onPress={() => Linking.openURL(policy.verify_url)}>
        <Ionicons name="open-outline" size={16} color={GOLD} />
        <Text style={styles.verifyBtnText}>Verify Policy Online</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  content:         { padding: 16, paddingBottom: 40 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  noCardTitle:     { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
  noCardSub:       { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  expiredBadge:    { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center' },
  expiredText:     { color: '#991b1b', fontWeight: '700', fontSize: 13 },

  // Card
  cardWrapper:     { height: 230, marginBottom: 20 },
  card:            { position: 'absolute', width: '100%', height: '100%', borderRadius: 20, backfaceVisibility: 'hidden',
                     backgroundColor: GOLD, shadowColor: GOLD, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  cardBack:        { backgroundColor: GOLD },
  cardInner:       { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardBrand:       { fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: DARK, opacity: 0.7 },
  cardTitle:       { fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: DARK },
  memberRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(69,26,3,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: 18, fontWeight: '800', color: DARK },
  memberName:      { fontSize: 16, fontWeight: '800', color: DARK },
  memberSub:       { fontSize: 11, color: DARK, opacity: 0.7 },
  cardGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardGridItem:    { width: '45%' },
  cardGridLabel:   { fontSize: 8, color: DARK, opacity: 0.65, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 1 },
  cardGridValue:   { fontSize: 12, fontWeight: '700', color: DARK },
  tapHint:         { fontSize: 10, color: DARK, opacity: 0.5, textAlign: 'right' },
  coverageTable:   { gap: 0 },
  coverageRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  coverageRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(69,26,3,0.15)' },
  coverageLabel:   { fontSize: 12, color: DARK, flex: 1 },
  coverageAmount:  { fontSize: 12, fontWeight: '700', color: DARK },
  cardFooter:      { fontSize: 9, color: DARK, opacity: 0.65, textAlign: 'center' },

  // Sections
  section:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel:     { fontSize: 12, color: '#888', flex: 1 },
  detailValue:     { fontSize: 12, fontWeight: '600', color: '#1a1a1a', flex: 2, textAlign: 'right' },

  // Verify
  verifyBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: GOLD },
  verifyBtnText:   { fontSize: 14, fontWeight: '700', color: GOLD },
});

