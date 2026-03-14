// ============================================================
// ALiN Move — Brand Logo Component (official image asset)
// ============================================================

import React from 'react';
import { Image, StyleSheet } from 'react-native';

// Base dimensions of the logo image (width:height ratio ≈ 3.2:1)
const BASE_WIDTH  = 240;
const BASE_HEIGHT = 75;

type Props = {
  /** Scale multiplier. Default 1. */
  scale?: number;
};

export default function AlinMoveLogo({ scale = 1 }: Props) {
  return (
    <Image
      source={require('../../assets/alin-move-logo.png')}
      style={[styles.logo, { width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});

