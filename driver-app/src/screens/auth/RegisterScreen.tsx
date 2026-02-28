// ============================================================
// ALiN Direct Driver App - Registration Screen
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';

type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
  Register: { phone: string };
};

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const VEHICLE_TYPES = [
  { key: 'motorcycle', label: '🏍️ Motorcycle', desc: 'Small packages, fast delivery' },
  { key: 'mpv', label: '🚗 MPV', desc: 'Medium packages, sedan/SUV' },
  { key: 'van', label: '🚐 Van', desc: 'Large packages, bulk items' },
  { key: 'truck', label: '🚚 Truck', desc: 'Extra-large, heavy loads' },
];

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestOtp } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (phone.replace(/\D/g, '').length < 10) { Alert.alert('Required', 'Please enter a valid mobile number.'); return; }
    if (!vehicleType) { Alert.alert('Required', 'Please select your vehicle type.'); return; }

    const cleaned = phone.replace(/\D/g, '');
    const formattedPhone = cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;

    setIsLoading(true);
    try {
      await requestOtp(formattedPhone);
      navigation.navigate('VerifyOtp', { phone: formattedPhone });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Become a Driver</Text>
        <Text style={styles.subtitle}>Join ALiN Direct and start earning today</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Juan Dela Cruz" placeholderTextColor={Colors.textLight}
            value={name} onChangeText={setName} editable={!isLoading} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}><Text style={styles.ccText}>+63</Text></View>
            <TextInput style={styles.phoneInput} placeholder="9XX XXX XXXX" placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad" maxLength={12} value={phone} onChangeText={setPhone} editable={!isLoading} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Vehicle Type</Text>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.vehicleCard, vehicleType === v.key && styles.vehicleSelected]}
              onPress={() => setVehicleType(v.key)}
              disabled={isLoading}
            >
              <Text style={[styles.vehicleLabel, vehicleType === v.key && styles.vehicleLabelSelected]}>{v.label}</Text>
              <Text style={styles.vehicleDesc}>{v.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text },
  phoneRow: { flexDirection: 'row' },
  countryCode: { backgroundColor: Colors.borderLight, paddingHorizontal: 16, justifyContent: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderWidth: 1, borderColor: Colors.border, borderRightWidth: 0 },
  ccText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  phoneInput: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderTopRightRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 8 },
  vehicleSelected: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  vehicleLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginRight: 12 },
  vehicleLabelSelected: { color: Colors.primary },
  vehicleDesc: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  button: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textInverse, fontSize: 16, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginBold: { color: Colors.primary, fontWeight: '600' },
});

