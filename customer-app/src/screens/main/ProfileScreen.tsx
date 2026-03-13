// ============================================================
// ALiN Move Customer App - Profile Screen
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

export default function ProfileScreen() {
  const { user, customer, logout } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const profileItems: { iconName: string; iconFamily: 'ionicons' | 'material'; label: string; value: string }[] = [
    { iconName: 'person-outline', iconFamily: 'ionicons', label: 'Full Name', value: user?.name ?? '—' },
    { iconName: 'call-outline', iconFamily: 'ionicons', label: 'Phone', value: user?.phone ?? '—' },
    { iconName: 'mail-outline', iconFamily: 'ionicons', label: 'Email', value: user?.email ?? 'Not set' },
    { iconName: 'location-outline', iconFamily: 'ionicons', label: 'Default Address', value: customer?.default_address ?? 'Not set' },
    { iconName: 'cube-outline', iconFamily: 'ionicons', label: 'Total Bookings', value: customer?.total_bookings?.toString() ?? '0' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar Card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'Customer'}</Text>
        <Text style={styles.userPhone}>{user?.phone ?? ''}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        {profileItems.map((item, index) => (
          <View key={index} style={[styles.infoRow, index < profileItems.length - 1 && styles.infoRowBorder]}>
            <View style={styles.infoIconBox}>
              {item.iconFamily === 'ionicons' ? (
                <Ionicons name={item.iconName as any} size={20} color={Colors.textSecondary} />
              ) : (
                <MaterialCommunityIcons name={item.iconName as any} size={20} color={Colors.textSecondary} />
              )}
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {[
          { iconName: 'notifications-outline' as const, label: 'Notifications', action: () => navigation.navigate('Notifications') },
          { iconName: 'settings-outline' as const, label: 'Settings', action: () => navigation.navigate('Settings') },
          { iconName: 'information-circle-outline' as const, label: 'About ALiN Move', action: () => Alert.alert('ALiN Move', 'Version 1.0.0\nFast & Reliable Delivery') },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.settingRow} onPress={item.action}>
            <View style={styles.settingIconBox}>
              <Ionicons name={item.iconName} size={20} color={Colors.primary} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  avatarCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(69,26,3,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.textOnPrimary },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textOnPrimary },
  userPhone: { fontSize: 14, color: 'rgba(69,26,3,0.7)', marginTop: 4 },
  section: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoIconBox: { width: 28, marginRight: 12, alignItems: 'center' as const },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  settingIconBox: { width: 28, marginRight: 12, alignItems: 'center' as const },
  settingLabel: { flex: 1, fontSize: 15, color: Colors.text },
  logoutButton: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
});

