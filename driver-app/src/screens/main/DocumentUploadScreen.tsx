// ============================================================
// ALiN Direct Driver App - KYC Document Upload Screen
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import Colors from '../../theme/colors';

type DocumentItem = {
  key: string;
  apiType: string; // maps to backend document type
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  required: boolean;
};

const DOCUMENTS: DocumentItem[] = [
  { key: 'drivers_license', apiType: 'license', label: "Driver's License", icon: 'card', description: 'Valid Philippine driver license (front & back)', required: true },
  { key: 'or_cr', apiType: 'or_cr', label: 'OR/CR', icon: 'document-text', description: 'Vehicle Official Receipt & Certificate of Registration', required: true },
  { key: 'nbi_clearance', apiType: 'nbi_clearance', label: 'NBI Clearance', icon: 'clipboard', description: 'Valid NBI Clearance (not older than 6 months)', required: true },
  { key: 'selfie', apiType: 'selfie', label: 'Selfie with ID', icon: 'person-circle', description: 'Clear selfie holding your driver license', required: true },
];

export default function DocumentUploadScreen() {
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (key: string, apiType: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() ?? `${key}.jpg`;
    const fileType = asset.mimeType ?? 'image/jpeg';

    setUploading(key);
    try {
      await api.uploadDocument(apiType, {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      });
      setUploaded(prev => ({ ...prev, [key]: true }));
    } catch {
      Alert.alert('Upload Failed', 'Could not upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const allRequiredUploaded = DOCUMENTS.filter(d => d.required).every(d => uploaded[d.key]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}><Ionicons name="folder-open" size={18} color={Colors.text} /> Document Verification</Text>
        <Text style={styles.headerSubtitle}>
          Upload the required documents to complete your KYC verification.
        </Text>
      </View>

      {DOCUMENTS.map((doc) => (
        <View key={doc.key} style={[styles.card, uploaded[doc.key] && styles.cardUploaded]}>
          <View style={styles.cardHeader}>
            <Ionicons name={doc.icon} size={28} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>{doc.label}</Text>
                {doc.required && <Text style={styles.requiredBadge}>Required</Text>}
              </View>
              <Text style={styles.cardDesc}>{doc.description}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.uploadBtn, uploaded[doc.key] && styles.uploadedBtn]}
            onPress={() => handleUpload(doc.key, doc.apiType)}
            disabled={uploading === doc.key}
          >
            {uploading === doc.key ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={uploaded[doc.key] ? 'checkmark-circle' : 'cloud-upload'}
                  size={16}
                  color={uploaded[doc.key] ? Colors.success : Colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.uploadBtnText, uploaded[doc.key] && styles.uploadedBtnText]}>
                  {uploaded[doc.key] ? 'Uploaded' : 'Upload'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, !allRequiredUploaded && styles.submitBtnDisabled]}
        disabled={!allRequiredUploaded}
        onPress={() => Alert.alert('Submitted', 'Your documents have been submitted for review. You will be notified once verified.')}
      >
        <Text style={styles.submitBtnText}>Submit for Verification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardUploaded: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },

  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  requiredBadge: { fontSize: 10, fontWeight: '700', color: Colors.danger, backgroundColor: Colors.dangerBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, overflow: 'hidden' },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  uploadBtn: { backgroundColor: Colors.primaryBg, borderWidth: 1, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  uploadedBtn: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  uploadBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  uploadedBtnText: { color: Colors.success },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Colors.textOnPrimary, fontSize: 17, fontWeight: '700' },
});

