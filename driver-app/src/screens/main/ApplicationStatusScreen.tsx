// ============================================================
// ALiN Move Driver App - Application Status Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';

type Step = { label: string; icon: keyof typeof Ionicons.glyphMap; status: 'done' | 'current' | 'pending' };

const STEPS: Step[] = [
  { label: 'Account Created', icon: 'checkmark-circle', status: 'done' },
  { label: 'Documents Uploaded', icon: 'checkmark-circle', status: 'done' },
  { label: 'Under Review', icon: 'search', status: 'current' },
  { label: 'Background Check', icon: 'time', status: 'pending' },
  { label: 'Approved & Active', icon: 'trophy', status: 'pending' },
];

export default function ApplicationStatusScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}><Ionicons name="search" size={14} color="#92400E" /> Under Review</Text>
        </View>
        <Text style={styles.headerTitle}>Application Status</Text>
        <Text style={styles.headerSubtitle}>
          Your application is being reviewed. This usually takes 1-3 business days.
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsCard}>
        {STEPS.map((step, index) => {
          const isDone = step.status === 'done';
          const isCurrent = step.status === 'current';
          return (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <View style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isCurrent && styles.stepDotCurrent,
                ]}>
                  <Ionicons name={step.icon} size={16} color={isDone ? Colors.success : isCurrent ? Colors.primary : Colors.textLight} />
                </View>
                {index < STEPS.length - 1 && (
                  <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[
                  styles.stepLabel,
                  isDone && styles.stepLabelDone,
                  isCurrent && styles.stepLabelCurrent,
                ]}>
                  {step.label}
                </Text>
                {isCurrent && (
                  <Text style={styles.stepHint}>Estimated 1-2 more days</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Info Cards */}
      <View style={styles.infoCard}>
        <Ionicons name="call" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Need Help?</Text>
          <Text style={styles.infoText}>Contact support at support@alinmove.com or call (02) 8888-ALIN</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="bulb" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Tip</Text>
          <Text style={styles.infoText}>Make sure all your documents are clear and valid to speed up the review process.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  statusBadge: { backgroundColor: Colors.warningBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  statusBadgeText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  stepsCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 20, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 60 },
  stepIndicator: { alignItems: 'center', marginRight: 14 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  stepDotDone: { backgroundColor: Colors.successBg },
  stepDotCurrent: { backgroundColor: Colors.primaryBg, borderWidth: 2, borderColor: Colors.primary },

  stepLine: { width: 2, height: 24, backgroundColor: Colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: Colors.success },
  stepInfo: { flex: 1, paddingTop: 6 },
  stepLabel: { fontSize: 15, color: Colors.textLight },
  stepLabelDone: { color: Colors.text, fontWeight: '500' },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '700' },
  stepHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  infoCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },

  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});

