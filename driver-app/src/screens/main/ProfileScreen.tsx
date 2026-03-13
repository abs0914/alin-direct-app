// ============================================================
// ALiN Move Driver App - Profile Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

export default function ProfileScreen() {
  const { user, rider, logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const statusColors: Record<string, string> = {
    pending: Colors.warning,
    approved: Colors.success,
    rejected: Colors.danger,
    suspended: Colors.danger,
    blacklisted: Colors.text,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? 'D'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Driver'}</Text>
        <Text style={styles.phone}>{user?.phone ?? '-'}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColors[rider?.status ?? 'pending'] ?? Colors.textLight }]}>
          <Text style={styles.statusPillText}>{rider?.status?.toUpperCase() ?? 'PENDING'}</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Type', value: rider?.vehicle_type ?? '-' },
            { label: 'Plate Number', value: rider?.plate_number ?? 'Not set' },
            { label: 'Brand', value: rider?.vehicle_brand ?? 'Not set' },
            { label: 'Model', value: rider?.vehicle_model ?? 'Not set' },
            { label: 'Color', value: rider?.vehicle_color ?? 'Not set' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Maya Payout Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Maya Phone</Text>
            <Text style={styles.infoValue}>{rider?.maya_phone ?? 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.perfGrid}>
          <View style={styles.perfCard}>
            <Text style={styles.perfValue}><Ionicons name="star" size={20} color={Colors.primary} /> {rider?.rating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.perfLabel}>Rating</Text>
          </View>
          <View style={styles.perfCard}>
            <Text style={styles.perfValue}>{rider?.total_deliveries ?? 0}</Text>
            <Text style={styles.perfLabel}>Deliveries</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.infoCard}>
          {[
            { icon: 'folder-open-outline' as const, label: 'Documents (KYC)', action: () => navigation.navigate('DocumentUpload') },
            { icon: 'clipboard-outline' as const, label: 'Application Status', action: () => navigation.navigate('ApplicationStatus') },
            { icon: 'notifications-outline' as const, label: 'Notifications', action: () => navigation.navigate('Notifications') },
            { icon: 'settings-outline' as const, label: 'Settings', action: () => navigation.navigate('Settings') },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.actionRow} onPress={item.action}>
              <Ionicons name={item.icon} size={20} color={Colors.textSecondary} style={{ marginRight: 12, width: 28 }} />
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ALiN Move Driver v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: Colors.textOnPrimary, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusPillText: { color: Colors.textInverse, fontSize: 11, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '500', color: Colors.text },
  perfGrid: { flexDirection: 'row', gap: 12 },
  perfCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  perfValue: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  perfLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  actionLabel: { flex: 1, fontSize: 15, color: Colors.text },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center' },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 16 },
});

