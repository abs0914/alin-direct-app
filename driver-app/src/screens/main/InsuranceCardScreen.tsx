// ============================================================
// ALiN Move Driver App - Insurance Card Screen
// ============================================================
// Displays a flippable Personal Accident Insurance ID card.
// Front: rider identity details.
// Back:  coverage table + contact info (matches physical card).

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

const CARD_W = 340;
const CARD_H = 200;
const CARD_BRAND = '#F5A010';       // golden amber (physical card colour)
const CARD_BRAND_DARK = '#C97D00';  // darker gold for accents
const CARD_TEXT = '#1A0A00';        // very dark brown on gold

// ── Coverage data (matches physical card) ──────────────────
const COVERAGE_ROWS = [
  { label: 'Accidental Death or\nPermanent Disablement', amount: '100,000' },
  { label: 'Unprovoked Murder and Assault',               amount: '10,000' },
  { label: 'Medical Reimbursement',                       amount: '5,000' },
  { label: 'Burial Benefits',                             amount: '5,000' },
];

export default function InsuranceCardScreen() {
  const { user, rider } = useAuth();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isBack, setIsBack] = useState(false);

  const flip = () => {
    Animated.spring(flipAnim, {
      toValue: isBack ? 0 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start(() => setIsBack(v => !v));
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const riderId = `ALN-${String(rider?.id ?? 0).padStart(6, '0')}`;
  const joinYear = new Date().getFullYear();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>Tap the card to flip it</Text>

      {/* ── Flip Container ── */}
      <View style={[styles.flipWrapper, { width: CARD_W, height: CARD_H }]}>

        {/* FRONT */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] },
          ]}
          pointerEvents={isBack ? 'none' : 'auto'}
        >
          <TouchableOpacity style={styles.cardTouchable} onPress={flip} activeOpacity={0.9}>
            <CardFront user={user} rider={rider} riderId={riderId} joinYear={joinYear} />
          </TouchableOpacity>
        </Animated.View>

        {/* BACK */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ perspective: 1200 }, { rotateY: backRotate }] },
          ]}
          pointerEvents={isBack ? 'auto' : 'none'}
        >
          <TouchableOpacity style={styles.cardTouchable} onPress={flip} activeOpacity={0.9}>
            <CardBack />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Flip hint icon ── */}
      <TouchableOpacity onPress={flip} style={styles.flipBtn}>
        <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
        <Text style={styles.flipBtnText}>{isBack ? 'Show Front' : 'Show Back'}</Text>
      </TouchableOpacity>

      {/* ── Coverage summary below card ── */}
      <CoverageSummary />
    </ScrollView>
  );
}

// ── Front Face ─────────────────────────────────────────────
function CardFront({ user, rider, riderId, joinYear }: any) {
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? 'R';
  return (
    <View style={front.wrapper}>
      {/* Top row: brand name + logo placeholder */}
      <View style={front.topRow}>
        <View>
          <Text style={front.company}>ALiN CARGO EXPRESS</Text>
          <Text style={front.tag}>PERSONAL ACCIDENT INSURANCE</Text>
        </View>
        <View style={front.logo}>
          <Text style={front.logoText}>🛵</Text>
        </View>
      </View>

      {/* Avatar + Identity */}
      <View style={front.midRow}>
        <View style={front.avatar}><Text style={front.avatarText}>{initials}</Text></View>
        <View style={front.identity}>
          <Text style={front.name}>{user?.name ?? 'Rider Name'}</Text>
          <Text style={front.sub}>{riderId}</Text>
          <Text style={front.sub}>Branch #{rider?.branch_id ?? '--'}</Text>
        </View>
      </View>

      {/* Bottom row: vehicle + valid */}
      <View style={front.bottomRow}>
        <Text style={front.detail}>{rider?.vehicle_type?.toUpperCase() ?? 'MOTORCYCLE'} · {rider?.plate_number ?? 'N/A'}</Text>
        <Text style={front.detail}>VALID {joinYear}–{joinYear + 1}</Text>
      </View>
    </View>
  );
}

// ── Back Face ──────────────────────────────────────────────
function CardBack() {
  return (
    <View style={back.wrapper}>
      {/* Coverage table */}
      <View style={back.table}>
        <View style={back.tableHeader}>
          <Text style={[back.th, { flex: 1.6 }]}>COVERAGE</Text>
          <Text style={[back.th, { flex: 1, textAlign: 'right' }]}>LIMIT (Php)</Text>
        </View>
        {COVERAGE_ROWS.map((row, i) => (
          <View key={i} style={[back.tableRow, i === COVERAGE_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[back.td, { flex: 1.6 }]}>{row.label}</Text>
            <Text style={[back.td, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>{row.amount}</Text>
          </View>
        ))}
      </View>

      {/* Footer text */}
      <View style={back.footer}>
        <Text style={back.footerLeft}>
          I have read the coverage and agree to the terms of this{' '}
          <Text style={{ fontWeight: '800' }}>Personal Accident Insurance</Text>.
        </Text>
        <View style={back.footerRight}>
          <Text style={back.contactTitle}>For claims inquiries:</Text>
          <Text style={back.contactLine}>(032) 346 3965</Text>
          <Text style={back.contactLine}>Unit D6-D7, Jamestown,</Text>
          <Text style={back.contactLine}>Mandaue City</Text>
        </View>
      </View>
    </View>
  );
}

// ── Coverage Summary (scrollable, below card) ──────────────
function CoverageSummary() {
  return (
    <View style={sum.section}>
      <Text style={sum.title}>Coverage Summary</Text>
      {COVERAGE_ROWS.map((row, i) => (
        <View key={i} style={sum.row}>
          <Text style={sum.label}>{row.label.replace('\n', ' ')}</Text>
          <Text style={sum.amount}>₱{row.amount}</Text>
        </View>
      ))}
      <View style={sum.note}>
        <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
        <Text style={sum.noteText}>
          For claims, visit any ALiN Cargo Express branch or call{' '}
          <Text style={{ fontWeight: '700' }}>(032) 346 3965</Text>.
        </Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  content:      { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, paddingBottom: 48 },
  hint:         { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  flipWrapper:  { position: 'relative' },
  card:         { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', backfaceVisibility: 'hidden', ...Platform.select({ ios: {}, android: {} }) },
  cardFront:    { zIndex: 2 },
  cardBack:     { zIndex: 1 },
  cardTouchable:{ flex: 1 },
  flipBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: CARD_H + 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  flipBtnText:  { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});

// Card front styles
const front = StyleSheet.create({
  wrapper:    { flex: 1, backgroundColor: CARD_BRAND, padding: 16, justifyContent: 'space-between' },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  company:    { fontSize: 11, fontWeight: '800', color: CARD_TEXT, letterSpacing: 0.8 },
  tag:        { fontSize: 8, color: CARD_BRAND_DARK, fontWeight: '600', marginTop: 1 },
  logo:       { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BRAND_DARK, alignItems: 'center', justifyContent: 'center' },
  logoText:   { fontSize: 18 },
  midRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: CARD_BRAND_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CARD_TEXT },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  identity:   { flex: 1 },
  name:       { fontSize: 15, fontWeight: '800', color: CARD_TEXT },
  sub:        { fontSize: 10, color: CARD_BRAND_DARK, fontWeight: '600', marginTop: 1 },
  bottomRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  detail:     { fontSize: 10, color: CARD_TEXT, fontWeight: '600' },
});

// Card back styles
const back = StyleSheet.create({
  wrapper:      { flex: 1, backgroundColor: CARD_BRAND, padding: 10, justifyContent: 'space-between' },
  table:        { borderWidth: 1.5, borderColor: CARD_TEXT, borderRadius: 6, overflow: 'hidden' },
  tableHeader:  { flexDirection: 'row', backgroundColor: CARD_BRAND_DARK, paddingVertical: 5, paddingHorizontal: 8 },
  th:           { fontSize: 9, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  tableRow:     { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: CARD_TEXT + '60' },
  td:           { fontSize: 9, color: CARD_TEXT },
  footer:       { flexDirection: 'row', gap: 8 },
  footerLeft:   { flex: 1.2, fontSize: 7.5, color: CARD_TEXT, lineHeight: 11 },
  footerRight:  { flex: 1 },
  contactTitle: { fontSize: 8, fontWeight: '800', color: CARD_TEXT, marginBottom: 1 },
  contactLine:  { fontSize: 7.5, color: CARD_TEXT, lineHeight: 11 },
});

// Coverage summary styles
const sum = StyleSheet.create({
  section: { width: '100%', marginTop: 28, backgroundColor: Colors.surface, borderRadius: 16, padding: 18, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  title:   { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label:   { fontSize: 13, color: Colors.textSecondary, flex: 1, marginRight: 8 },
  amount:  { fontSize: 13, fontWeight: '700', color: Colors.text },
  note:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 14 },
  noteText:{ flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});

