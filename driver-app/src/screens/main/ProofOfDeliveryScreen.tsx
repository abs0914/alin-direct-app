// ============================================================
// ALiN Move Driver App - Proof of Delivery (POD) Screen
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { setActiveJob } from '../../store/jobStore';
import Config from '../../config';
import Colors from '../../theme/colors';

type Props = {
  navigation: any;
  route: any;
};

export default function ProofOfDeliveryScreen({ navigation, route }: Props) {
  const jobId = route.params?.jobId as number;
  const [recipientName, setRecipientName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [signatureDone, setSignatureDone] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    if (Config.DEMO_MODE) {
      // Simulate photo capture without camera access
      setPhotoUri('demo://mock-delivery-photo.jpg');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSignature = () => {
    // TODO: Integrate react-native-signature-canvas
    Alert.alert(
      'E-Signature',
      'Signature pad coming soon. Tap OK to mark as collected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => setSignatureDone(true) },
      ]
    );
  };

  const canSubmit = Config.DEMO_MODE
    ? recipientName.trim().length > 0
    : recipientName.trim().length > 0 && !!photoUri;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (Config.DEMO_MODE) {
        // Simulate upload delay then mark job delivered
        await new Promise(r => setTimeout(r, 1500));
        setActiveJob(null);
        Alert.alert('Delivery Confirmed', 'Proof of delivery submitted successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      if (!photoUri) return;
      const formData = new FormData();
      formData.append('recipient_name', recipientName);
      formData.append('notes', notes);
      const fileName = photoUri.split('/').pop() ?? 'photo.jpg';
      formData.append('photo', { uri: photoUri, name: fileName, type: 'image/jpeg' } as unknown as Blob);
      await api.submitPod(jobId, formData);
      try { await api.updateJobStatus(jobId, 'delivered'); setActiveJob(null); } catch { /* ignore */ }
      Alert.alert('Delivery Confirmed', 'Proof of delivery submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit proof of delivery. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          style={[styles.captureBtn, !!photoUri && styles.captureBtnDone]}
          onPress={handleTakePhoto}
        >
          <Ionicons name={photoUri ? 'checkmark-circle' : 'camera'} size={28} color={photoUri ? Colors.success : Colors.textSecondary} style={{ marginRight: 14 }} />
          <Text style={[styles.captureBtnText, !!photoUri && styles.captureBtnTextDone]}>
            {photoUri ? 'Photo Captured' : 'Take Photo of Package'}
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
        style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
        disabled={!canSubmit || submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.submitBtnText}>Confirm Delivery</Text>
        )}
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

