// ============================================================
// ALiN Move Driver App - OTP Verification Screen
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';
import Config from '../../config';

type AuthStackParamList = {
  Login: undefined;
  VerifyOtp: { phone: string };
  Register: { phone: string };
};

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyOtp'>;
  route: RouteProp<AuthStackParamList, 'VerifyOtp'>;
};

export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(Config.OTP_RESEND_SECONDS);
  const { verifyOtp, requestOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== Config.OTP_LENGTH) {
      Alert.alert('Invalid OTP', `Please enter the ${Config.OTP_LENGTH}-digit code.`);
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(phone, otp);
      // Auth context will handle navigation
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', message);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await requestOtp(phone);
      setCountdown(Config.OTP_RESEND_SECONDS);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          Enter the {Config.OTP_LENGTH}-digit code sent to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={Config.OTP_LENGTH}
          placeholder={'0'.repeat(Config.OTP_LENGTH)}
          placeholderTextColor={Colors.textLight}
          editable={!isLoading}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || otp.length !== Config.OTP_LENGTH}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendText}>Resend code in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Change number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 22 },
  phone: { fontWeight: '600', color: Colors.text },
  otpInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 12,
    color: Colors.text,
    marginBottom: 24,
  },
  button: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textInverse, fontSize: 16, fontWeight: '600' },
  resendRow: { alignItems: 'center', marginTop: 24 },
  resendText: { color: Colors.textSecondary, fontSize: 14 },
  resendLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  backButton: { alignItems: 'center', marginTop: 16 },
  backText: { color: Colors.textSecondary, fontSize: 14 },
});

