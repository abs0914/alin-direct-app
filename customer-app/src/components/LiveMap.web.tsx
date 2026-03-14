// ============================================================
// LiveMap — Web (Leaflet + OpenStreetMap, no API key required)
// This file is used ONLY on web (Metro resolves .web.tsx first).
// ============================================================

import React, { useRef, useEffect } from 'react';

export interface LiveMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  riderLat?: number | null;
  riderLng?: number | null;
  height?: number;
}

// --- Singleton Leaflet loader ---
let leafletReady = false;
let leafletLoading = false;
const pendingCallbacks: Array<() => void> = [];

function loadLeaflet(onReady: () => void) {
  if (leafletReady) { onReady(); return; }
  pendingCallbacks.push(onReady);
  if (leafletLoading) return;
  leafletLoading = true;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    leafletReady = true;
    leafletLoading = false;
    pendingCallbacks.splice(0).forEach(cb => cb());
  };
  document.head.appendChild(script);
}

function makeIcon(emoji: string, size = 28) {
  const L = (window as any).L;
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export default function LiveMap({
  pickupLat, pickupLng, dropoffLat, dropoffLng,
  riderLat, riderLng, height = 220,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    loadLeaflet(() => {
      if (!containerRef.current || mapRef.current) return;
      const L = (window as any).L;

      const midLat = (pickupLat + dropoffLat) / 2;
      const midLng = (pickupLng + dropoffLng) / 2;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      }).setView([midLat, midLng], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Draw dotted route line
      L.polyline(
        [[pickupLat, pickupLng], [dropoffLat, dropoffLng]],
        { color: '#F5A524', weight: 3, dashArray: '8 6', opacity: 0.85 }
      ).addTo(map);

      L.marker([pickupLat, pickupLng], { icon: makeIcon('📍') })
        .addTo(map).bindPopup('<b>Pickup</b>');
      L.marker([dropoffLat, dropoffLng], { icon: makeIcon('🏁') })
        .addTo(map).bindPopup('<b>Dropoff</b>');

      map.fitBounds(
        L.latLngBounds([[pickupLat, pickupLng], [dropoffLat, dropoffLng]]),
        { padding: [40, 40] }
      );

      mapRef.current = map;

      if (riderLat != null && riderLng != null) {
        riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: makeIcon('🛵') })
          .addTo(map).bindPopup('<b>Rider</b>');
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        riderMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move rider marker on GPS update
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;
    if (riderLat == null || riderLng == null) return;
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
    } else {
      riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: makeIcon('🛵') })
        .addTo(mapRef.current).bindPopup('<b>Rider</b>');
    }
  }, [riderLat, riderLng]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden', background: '#e8f0e9' }}
    />
  );
}

