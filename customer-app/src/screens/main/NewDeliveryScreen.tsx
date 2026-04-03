// ============================================================
// ALiN Move Customer App - New Delivery Booking Screen
// ============================================================
// Two-step booking: Step 1 = addresses + package, Step 2 = price + payment.
// Uses real API pricing from the Laravel backend.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import { HomeStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../theme/colors';
import { PriceEstimate, ServiceType } from '../../types';
import { RATE_CARD } from '../../data/mockData';
import LiveMap from '../../components/LiveMap';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'NewDelivery'>;
};

type PackageCategory = 'pouch' | 'box';
type BoxType = 'own_box' | 'alin_box';

// Lookup flat rate from the rate card (fallback 0)
function getRateCardPrice(sizeKey: string, boxType: BoxType, serviceType: ServiceType): number {
  return RATE_CARD[sizeKey]?.[boxType]?.[serviceType] ?? 0;
}

const POUCH_PRESETS = [
  { key: 'pouch_xsmall', label: 'XSmall\n(1kg)' },
  { key: 'pouch_small',  label: 'Small\n(2kg)' },
  { key: 'pouch_medium', label: 'Medium\n(3kg)' },
  { key: 'pouch_large',  label: 'Large\n(5kg)' },
];

const BOX_PRESETS = [
  { key: 'box_1kg',    label: '1kg Box' },
  { key: 'box_3kg',    label: '3kg Box' },
  { key: 'box_5kg',    label: '5kg Box' },
  { key: 'box_small',  label: 'Small\n(10kg)' },
  { key: 'box_medium', label: 'Medium\n(20kg)' },
  { key: 'box_large',  label: 'Large\n(30kg)' },
  { key: 'box_xlarge', label: 'XLarge\n(40kg)' },
];

// Payment methods per PDF
type PaymentMethod = 'alin_pay' | 'gcash' | 'cod' | 'card';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; iconFamily: string }[] = [
  { key: 'alin_pay', label: 'ALiN Pay\n(e-wallet)', icon: 'wallet', iconFamily: 'ionicons' },
  { key: 'gcash', label: 'GCash', icon: 'cellphone', iconFamily: 'material' },
  { key: 'cod', label: 'COD', icon: 'cash', iconFamily: 'material' },
  { key: 'card', label: 'Card', icon: 'credit-card', iconFamily: 'fontawesome' },
];

// Helper to render payment icons
function PaymentIcon({ method, color }: { method: typeof PAYMENT_METHODS[number]; color: string }) {
  if (method.iconFamily === 'ionicons')
    return <Ionicons name={method.icon as any} size={18} color={color} />;
  if (method.iconFamily === 'material')
    return <MaterialCommunityIcons name={method.icon as any} size={18} color={color} />;
  return <FontAwesome5 name={method.icon as any} size={16} color={color} />;
}

export default function NewDeliveryScreen({ navigation }: Props) {
  const route = useRoute<RouteProp<HomeStackParamList, 'NewDelivery'>>();
  const _deliveryType = route.params?.deliveryType ?? 'door_to_door';
  const { user, customer } = useAuth();

  // Step 1 state
  const [pickupAddress, setPickupAddress] = useState(customer?.default_address ?? '');
  const [pickupLat, setPickupLat] = useState(customer?.default_lat ?? 14.5995);
  const [pickupLng, setPickupLng] = useState(customer?.default_lng ?? 120.9842);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState(14.5547);
  const [dropoffLng, setDropoffLng] = useState(121.0244);
  const [packageCategory, setPackageCategory] = useState<PackageCategory>('pouch');
  const [sizePreset, setSizePreset] = useState('pouch_small');
  const [boxType, setBoxType] = useState<BoxType>('own_box');
  const [serviceType, setServiceType] = useState<ServiceType>('intra');

  // Step 2 state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alin_pay');
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);

  // Multi-step: 1 = address+package, 2 = price+payment
  const [step, setStep] = useState(1);

  // Derived pricing: use API estimate when available, otherwise look up rate card directly
  const effectiveBoxType = packageCategory === 'pouch' ? 'alin_box' : boxType;
  const totalPrice = priceEstimate?.total_price ?? getRateCardPrice(sizePreset, effectiveBoxType, serviceType);
  const sizeLabel = [...POUCH_PRESETS, ...BOX_PRESETS].find(p => p.key === sizePreset)?.label?.replace('\n', ' ') ?? '';
  const categoryLabel = packageCategory === 'pouch' ? 'Pouch' : 'Box';

  // When switching category, auto-select first preset and reset box type
  const handleCategoryChange = (cat: PackageCategory) => {
    setPackageCategory(cat);
    if (cat === 'pouch') {
      setSizePreset('pouch_small');
      setBoxType('own_box'); // box type selection not shown for pouches
    } else {
      setSizePreset('box_1kg');
    }
  };

  const presets = packageCategory === 'pouch' ? POUCH_PRESETS : BOX_PRESETS;

  const handleNext = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Missing Address', 'Please enter both pickup and dropoff addresses.');
      return;
    }

    // Fetch price estimate from API
    setIsPriceLoading(true);
    try {
      const estimate = await api.estimatePrice({
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        vehicle_type: 'motorcycle',
        package_size: sizePreset,
        box_type: effectiveBoxType,
        service_type: serviceType,
      });
      setPriceEstimate(estimate);
      setStep(2);
    } catch {
      Alert.alert('Error', 'Failed to get price estimate. Please try again.');
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleBook = async () => {
    setIsLoading(true);
    try {
      const job = await api.createBooking({
        vehicle_type: 'motorcycle',
        pickup_contact_name: user?.name ?? 'Customer',
        pickup_contact_phone: user?.phone ?? '',
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_contact_name: 'Recipient',
        dropoff_contact_phone: '',
        dropoff_address: dropoffAddress,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        package_description: `${categoryLabel} - ${sizeLabel}`,
        package_size: sizePreset,
        box_type: packageCategory === 'box' ? boxType : 'own_box',
        total_price: totalPrice,
        payment_method: paymentMethod === 'cod' ? 'cod' : 'online',
      });

      navigation.replace('Tracking', { jobId: job.id });
    } catch {
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ======== STEP 1: Addresses + Package Type ========
  if (step === 1) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Map */}
          <View style={styles.mapContainer}>
            <LiveMap
              pickupLat={pickupLat}
              pickupLng={pickupLng}
              dropoffLat={dropoffLat}
              dropoffLng={dropoffLng}
              height={180}
            />
          </View>

          {/* Pickup Address */}
          <View style={styles.section}>
            <View style={styles.addressHeader}>
              <Ionicons name="locate-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.addressLabel}>Pickup Address Selector</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location..."
              placeholderTextColor={Colors.textLight}
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>

          {/* Dropoff Address */}
          <View style={styles.section}>
            <View style={styles.addressHeader}>
              <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.addressLabel}>Dropoff Address Selector</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter dropoff location..."
              placeholderTextColor={Colors.textLight}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />
          </View>

          {/* Package Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, packageCategory === 'pouch' && styles.toggleBtnActive]}
                onPress={() => handleCategoryChange('pouch')}
              >
                <Text style={[styles.toggleText, packageCategory === 'pouch' && styles.toggleTextActive]}>
                  Pouch
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, packageCategory === 'box' && styles.toggleBtnActive]}
                onPress={() => handleCategoryChange('box')}
              >
                <Text style={[styles.toggleText, packageCategory === 'box' && styles.toggleTextActive]}>
                  Box
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, serviceType === 'intra' && styles.toggleBtnActive]}
                onPress={() => setServiceType('intra')}
              >
                <Text style={[styles.toggleText, serviceType === 'intra' && styles.toggleTextActive]}>
                  🏙️ Intra-region
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, serviceType === 'cross' && styles.toggleBtnActive]}
                onPress={() => setServiceType('cross')}
              >
                <Text style={[styles.toggleText, serviceType === 'cross' && styles.toggleTextActive]}>
                  🚢 Cross-region
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Size Preset */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.chipRow}>
              {presets.map((p) => {
                const price = getRateCardPrice(p.key, effectiveBoxType, serviceType);
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.chip, sizePreset === p.key && styles.chipActive]}
                    onPress={() => setSizePreset(p.key)}
                  >
                    <Text style={[styles.chipText, sizePreset === p.key && styles.chipTextActive]}>
                      {p.label.replace('\n', '\n')}
                    </Text>
                    <Text style={[styles.chipPrice, sizePreset === p.key && styles.chipPriceActive]}>
                      ₱{price.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Box Type — only shown when category is Box */}
          {packageCategory === 'box' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Box Type</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, boxType === 'own_box' && styles.toggleBtnActive]}
                  onPress={() => setBoxType('own_box')}
                >
                  <Text style={[styles.toggleText, boxType === 'own_box' && styles.toggleTextActive]}>
                    🗃️ Own Box
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, boxType === 'alin_box' && styles.toggleBtnActive]}
                  onPress={() => setBoxType('alin_box')}
                >
                  <Text style={[styles.toggleText, boxType === 'alin_box' && styles.toggleTextActive]}>
                    📦 ALiN Box
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.boxTypeHint}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.boxTypeHintText}>
                  {boxType === 'alin_box'
                    ? 'ALiN provides the packaging box. ALiN Box rates apply.'
                    : 'You provide your own packaging box. Own Box rates apply.'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Next button pinned to bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtn, isPriceLoading && styles.btnDisabled]}
            onPress={handleNext}
            disabled={isPriceLoading}
            activeOpacity={0.8}
          >
            {isPriceLoading ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.nextBtnText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ======== STEP 2: Price + Payment + Confirm ========
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Price Header */}
        <View style={styles.priceHeader}>
          <Text style={styles.priceCurrency}>₱</Text>
          <Text style={styles.priceAmount}>{totalPrice}</Text>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <TouchableOpacity
            style={styles.breakdownToggle}
            onPress={() => setShowBreakdown(!showBreakdown)}
          >
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            <Ionicons
              name={showBreakdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>

          {showBreakdown && (
            <View style={styles.breakdownBody}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <MaterialCommunityIcons name="package-variant" size={16} color={Colors.textSecondary} />
                  <Text style={styles.breakdownLabel}>{categoryLabel} — {sizeLabel}</Text>
                </View>
                <Text style={styles.breakdownValue}>₱{totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.breakdownLabel}>Service</Text>
                </View>
                <Text style={styles.breakdownValue}>
                  {(priceEstimate?.service_type ?? serviceType) === 'intra' ? 'Intra-region' : 'Cross-region'}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <MaterialCommunityIcons name="package-variant-closed" size={16} color={Colors.textSecondary} />
                  <Text style={styles.breakdownLabel}>Box Type</Text>
                </View>
                <Text style={styles.breakdownValue}>
                  {effectiveBoxType === 'alin_box' ? 'ALiN Box' : 'Own Box'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((m) => {
              const isActive = paymentMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.paymentCard, isActive && styles.paymentCardActive]}
                  onPress={() => setPaymentMethod(m.key)}
                >
                  <View style={styles.paymentRadio}>
                    {isActive && <View style={styles.paymentRadioDot} />}
                  </View>
                  <PaymentIcon method={m} color={isActive ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.paymentLabel, isActive && styles.paymentLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Confirm Booking button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, isLoading && styles.btnDisabled]}
          onPress={handleBook}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.nextBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },

  // Map
  mapContainer: {
    height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20,
  },
  map: { flex: 1 },

  // Address fields
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  addressLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text,
  },

  // Package type toggle
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  toggleTextActive: { color: Colors.textOnPrimary },

  // Size preset chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', minWidth: 72,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  chipTextActive: { color: Colors.textOnPrimary },
  chipPrice: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, marginTop: 2 },
  chipPriceActive: { color: Colors.textOnPrimary },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background, paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  nextBtnText: { color: Colors.textOnPrimary, fontSize: 17, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  // Step 2 — Price header
  priceHeader: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start',
    marginBottom: 24, paddingTop: 8,
  },
  priceCurrency: { fontSize: 22, fontWeight: '700', color: Colors.primary, marginTop: 6 },
  priceAmount: { fontSize: 48, fontWeight: '800', color: Colors.text, marginLeft: 2 },

  // Step 2 — Breakdown card
  breakdownCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 24, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  breakdownToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  breakdownBody: { marginTop: 14 },
  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: Colors.text },

  // Step 2 — Payment grid
  paymentGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  paymentCard: {
    width: '47%' as any, flexDirection: 'row', alignItems: 'center',
    gap: 8, backgroundColor: Colors.surface, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 12,
  },
  paymentCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  paymentRadio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  paymentRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary,
  },
  paymentLabel: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, flexShrink: 1 },
  paymentLabelActive: { color: Colors.primary, fontWeight: '600' },

  // Box type hint
  boxTypeHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  boxTypeHintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
    lineHeight: 18,
  },
});

