// ============================================================
// ALiN Move Driver App - Login Screen (OTP)
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AlinMoveLogo from '../../components/AlinMoveLogo';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OTP_TEST_MODE, useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';
import Config from '../../config';

type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
  Register: { phone: string };
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { requestOtp } = useAuth();
  const phoneRef = useRef<TextInput>(null);

  const handleRequestOtp = async () => {
    const rawPhone = phone.trim();
    const cleaned = rawPhone.replace(/\D/g, '');
    const hasValidInput = OTP_TEST_MODE ? cleaned.length > 0 : cleaned.length >= 10;

    if (!hasValidInput) {
      const message = OTP_TEST_MODE
        ? 'Enter any number to continue in test mode.'
        : 'Please enter a valid Philippine mobile number.';

      setErrorMessage(message);
      Alert.alert('Invalid Number', message);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const formattedPhone = OTP_TEST_MODE
        ? `+${cleaned}`
        : cleaned.startsWith('63')
          ? `+${cleaned}`
          : `+63${cleaned}`;

      await requestOtp(formattedPhone);
      navigation.navigate('VerifyOtp', { phone: formattedPhone });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP. Please try again.';
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AlinMoveLogo scale={1.1} />
          <Text style={styles.subtitle}>Partner Driver Portal</Text>
        </View>

        {/* Phone Input */}
        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          {OTP_TEST_MODE ? (
            <Text style={styles.helperText}>Test mode: enter any mobile number to continue.</Text>
          ) : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+63</Text>
            </View>
            <TextInput
              ref={phoneRef}
              style={styles.phoneInput}
              placeholder="9XX XXX XXXX"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              maxLength={12}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRequestOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New driver? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register', { phone: '' })}>
            <Text style={styles.footerLink}>Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoImage: { width: 180, height: 80, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  form: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  helperText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  errorText: { fontSize: 12, color: '#DC2626', marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', marginBottom: 16 },
  countryCode: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRightWidth: 0,
  },
  countryCodeText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});

