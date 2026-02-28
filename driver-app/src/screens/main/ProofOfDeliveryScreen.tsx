// ============================================================
// ALiN Direct Driver App - Proof of Delivery (POD) Screen
// ============================================================
// MOCK: Simulates photo capture and e-signature.
// PRODUCTION: Use expo-camera and react-native-signature-canvas.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../theme/colors';

type Props = {
  navigation: any;
  route: any;
};

export default function ProofOfDeliveryScreen({ navigation, route }: Props) {
  const [recipientName, setRecipientName] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [signatureDone, setSignatureDone] = useState(false);
  const [notes, setNotes] = useState('');

  const handleTakePhoto = () => {
    Alert.alert(
      'Take Photo',
      'In production, this opens the camera to capture a photo of the delivered package.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Simulate Photo', onPress: () => setPhotoTaken(true) },
      ]
    );
  };

  const handleSignature = () => {
    Alert.alert(
      'E-Signature',
      'In production, this opens a signature pad for the recipient to sign.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Simulate Signature', onPress: () => setSignatureDone(true) },
      ]
    );
  };

  const canSubmit = recipientName.trim().length > 0 && photoTaken;

  const handleSubmit = () => {
    Alert.alert(
      'Delivery Confirmed',
      `POD submitted successfully!\n\nRecipient: ${recipientName}\nPhoto: Captured\nSignature: ${signatureDone ? 'Yes' : 'No'}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}><Ionicons name="clipboard" size={18} color={Colors.text} /> Proof of Delivery</Text>
        <Text style={styles.headerSubtitle}>Complete the following to confirm delivery</Text>
      </View>

      {/* Recipient Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipient Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter recipient's full name"
          placeholderTextColor={Colors.textLight}
          value={recipientName}
          onChangeText={setRecipientName}
        />
      </View>

      {/* Photo Capture */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Photo *</Text>
        <TouchableOpacity
          style={[styles.captureBtn, photoTaken && styles.captureBtnDone]}
          onPress={handleTakePhoto}
        >
          <Ionicons name={photoTaken ? 'checkmark-circle' : 'camera'} size={28} color={photoTaken ? Colors.success : Colors.textSecondary} style={{ marginRight: 14 }} />
          <Text style={[styles.captureBtnText, photoTaken && styles.captureBtnTextDone]}>
            {photoTaken ? 'Photo Captured' : 'Take Photo of Package'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* E-Signature */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>E-Signature (Optional)</Text>
        <TouchableOpacity
          style={[styles.captureBtn, signatureDone && styles.captureBtnDone]}
          onPress={handleSignature}
        >
          <Ionicons name={signatureDone ? 'checkmark-circle' : 'pencil'} size={28} color={signatureDone ? Colors.success : Colors.textSecondary} style={{ marginRight: 14 }} />
          <Text style={[styles.captureBtnText, signatureDone && styles.captureBtnTextDone]}>
            {signatureDone ? 'Signature Collected' : 'Collect Recipient Signature'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any notes about the delivery..."
          placeholderTextColor={Colors.textLight}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.submitBtnText}>Confirm Delivery</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  captureBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderRadius: 12, padding: 20, borderStyle: 'dashed' },
  captureBtnDone: { borderColor: Colors.success, backgroundColor: Colors.successBg, borderStyle: 'solid' },

  captureBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  captureBtnTextDone: { color: Colors.success },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Colors.textOnPrimary, fontSize: 17, fontWeight: '700' },
});

