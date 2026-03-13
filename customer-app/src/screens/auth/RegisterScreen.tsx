// ============================================================
// ALiN Move Customer App - Registration Screen
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

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestOtp } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (phone.replace(/\D/g, '').length < 10) { Alert.alert('Required', 'Please enter a valid number.'); return; }

    const cleaned = phone.replace(/\D/g, '');
    const formattedPhone = cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;

    setIsLoading(true);
    try {
      await requestOtp(formattedPhone);
      navigation.navigate('VerifyOtp', { phone: formattedPhone });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start booking deliveries</Text>

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

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
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
  button: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginBold: { color: Colors.primary, fontWeight: '600' },
});

