// ============================================================
// ALiN Move Driver App - Settings Screen
// ============================================================

import React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
};

function SettingRow({ icon, label, value, onPress, toggle, toggleValue, onToggle }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress && !toggle} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} style={{ marginRight: 12, width: 24, textAlign: 'center' as const }} />
      <Text style={styles.rowLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={toggleValue ? Colors.primary : Colors.textLight}
        />
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [earningAlerts, setEarningAlerts] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Availability */}
      <Text style={styles.sectionHeader}>Availability</Text>
      <View style={styles.section}>
        <SettingRow icon="radio-button-on" label="Available for Jobs" toggle toggleValue={isAvailable} onToggle={setIsAvailable} />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionHeader}>Notifications</Text>
      <View style={styles.section}>
        <SettingRow icon="notifications" label="Push Notifications" toggle toggleValue={pushNotifications} onToggle={setPushNotifications} />
        <SettingRow icon="cube" label="New Job Alerts" toggle toggleValue={jobAlerts} onToggle={setJobAlerts} />
        <SettingRow icon="wallet" label="Earning Alerts" toggle toggleValue={earningAlerts} onToggle={setEarningAlerts} />
      </View>

      {/* Navigation */}
      <Text style={styles.sectionHeader}>Navigation</Text>
      <View style={styles.section}>
        <SettingRow icon="map" label="Preferred Nav App" value="Google Maps" onPress={() => Alert.alert('Navigation', 'Choose: Google Maps, Waze, or Apple Maps')} />
        <SettingRow icon="volume-high" label="Voice Navigation" value="Enabled" />
      </View>

      {/* Account */}
      <Text style={styles.sectionHeader}>Account & Support</Text>
      <View style={styles.section}>
        <SettingRow icon="clipboard" label="Documents" onPress={() => Alert.alert('Documents', 'View and manage your KYC documents.')} />
        <SettingRow icon="help-circle" label="Help & Support" onPress={() => Linking.openURL('mailto:driver-support@alinmove.com')} />
        <SettingRow icon="document-text" label="Terms & Conditions" onPress={() => Alert.alert('Terms', 'Terms available at alinmove.com/driver-terms')} />
        <SettingRow icon="lock-closed" label="Privacy Policy" onPress={() => Alert.alert('Privacy', 'Privacy policy at alinmove.com/privacy')} />
        <SettingRow icon="information-circle" label="About" value="v1.0.0" onPress={() => Alert.alert('ALiN Move Driver', 'Version 1.0.0\nPartner Driver Portal')} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },

  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 14, color: Colors.textSecondary },

  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
});

