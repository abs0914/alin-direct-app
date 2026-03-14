// ============================================================
// ALiN Move Customer App - Splash Screen
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import AlinMoveLogo from '../components/AlinMoveLogo';
import Colors from '../theme/colors';

const { width } = Dimensions.get('window');

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <AlinMoveLogo scale={1.5} />
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Fast & Reliable Delivery</Text>
        <Text style={styles.subTagline}>Book • Track • Deliver</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loader}>
          <Animated.View style={[styles.loaderBar]} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5A524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.55,
    height: width * 0.25,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.5,
  },
  subTagline: {
    fontSize: 14,
    color: '#333333',
    marginTop: 6,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loader: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loaderBar: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  version: {
    fontSize: 12,
    color: Colors.textLight,
  },
});

