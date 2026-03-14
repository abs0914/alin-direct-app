// ============================================================
// LiveMap — Native (react-native-maps / Apple Maps / Google Maps)
// This file is used on iOS and Android only.
// ============================================================

import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

export interface LiveMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  riderLat?: number | null;
  riderLng?: number | null;
  height?: number;
}

// Lazy-load react-native-maps so web bundle never imports it
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
}

export default function LiveMap({
  pickupLat, pickupLng, dropoffLat, dropoffLng,
  riderLat, riderLng, height = 220,
}: LiveMapProps) {
  if (!MapView) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>Map unavailable on this platform</Text>
      </View>
    );
  }

  const midLat = (pickupLat + dropoffLat) / 2;
  const midLng = (pickupLng + dropoffLng) / 2;
  const latDelta = Math.max(Math.abs(pickupLat - dropoffLat) * 1.6, 0.05);
  const lngDelta = Math.max(Math.abs(pickupLng - dropoffLng) * 1.6, 0.05);

  return (
    <MapView
      style={{ height, borderRadius: 10 }}
      region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      {Polyline && (
        <Polyline
          coordinates={[
            { latitude: pickupLat, longitude: pickupLng },
            { latitude: dropoffLat, longitude: dropoffLng },
          ]}
          strokeColor="#F5A524"
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />
      )}
      <Marker
        coordinate={{ latitude: pickupLat, longitude: pickupLng }}
        title="Pickup"
        pinColor="#3B82F6"
      />
      <Marker
        coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
        title="Dropoff"
        pinColor="#EF4444"
      />
      {riderLat != null && riderLng != null && (
        <Marker
          coordinate={{ latitude: riderLat, longitude: riderLng }}
          title="Rider"
          pinColor="#F5A524"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E8F0E9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

