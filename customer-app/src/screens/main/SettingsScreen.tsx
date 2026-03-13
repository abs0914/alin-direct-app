// ============================================================
// ALiN Move Customer App - Settings Screen
// ============================================================

import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

type SettingRowProps = {
  icon: string;
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
      <Text style={styles.rowIcon}>{icon}</Text>
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
        <Text style={styles.rowArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@alinmove.com');
  };

  const handleTerms = () => {
    Alert.alert('Terms & Conditions', 'Terms and conditions will be available at alinmove.com/terms');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be available at alinmove.com/privacy');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <Text style={styles.sectionHeader}>Notifications</Text>
      <View style={styles.section}>
        <SettingRow icon="🔔" label="Push Notifications" toggle toggleValue={pushNotifications} onToggle={setPushNotifications} />
        <SettingRow icon="💬" label="SMS Notifications" toggle toggleValue={smsNotifications} onToggle={setSmsNotifications} />
        <SettingRow icon="📧" label="Email Notifications" toggle toggleValue={emailNotifications} onToggle={setEmailNotifications} />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionHeader}>Preferences</Text>
      <View style={styles.section}>
        <SettingRow icon="🌍" label="Language" value="English" onPress={() => Alert.alert('Language', 'English is the only supported language at this time.')} />
        <SettingRow icon="💱" label="Currency" value="PHP (₱)" />
      </View>

      {/* Payment */}
      <Text style={styles.sectionHeader}>Payment</Text>
      <View style={styles.section}>
        <SettingRow icon="💳" label="Maya Wallet" value="Connected" onPress={() => Alert.alert('Maya Wallet', 'Maya payment integration settings.')} />
        <SettingRow icon="🏦" label="Payment Methods" onPress={() => Alert.alert('Payment Methods', 'Manage your payment methods here.')} />
      </View>

      {/* Support */}
      <Text style={styles.sectionHeader}>Support & Legal</Text>
      <View style={styles.section}>
        <SettingRow icon="❓" label="Help & Support" onPress={handleSupport} />
        <SettingRow icon="📋" label="Terms & Conditions" onPress={handleTerms} />
        <SettingRow icon="🔒" label="Privacy Policy" onPress={handlePrivacy} />
        <SettingRow icon="ℹ️" label="About" value="v1.0.0" onPress={() => Alert.alert('ALiN Move', 'Version 1.0.0\nFast & Reliable Delivery')} />
      </View>

      {/* Logout */}
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
  rowIcon: { fontSize: 18, marginRight: 12, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  rowArrow: { fontSize: 20, color: Colors.textLight, fontWeight: '300' },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
});

