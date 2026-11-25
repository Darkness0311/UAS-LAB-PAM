/**
 * FINN v2.5 — Full-Screen Loading View
 * Visual Redesign: Light-Mode Fintech Flat Card dengan logo Finn baru (#EEECE6 canvas, #FFFFFF rounded-[32px]).
 * Tetap menampilkan spinner layar penuh tanpa angka Rp0 sesaat.
 */

import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';

const APP_BRAND_ICON = require('../../../assets/icon.png');

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoCircle}>
          <Image
            source={APP_BRAND_ICON}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>Memuat data Finn</Text>
        <Text style={styles.subtitle}>
          Menyiapkan catatan pengeluaran lokal Anda
        </Text>
        <ActivityIndicator
          size="small"
          color={COLORS.ink}
          style={styles.spinner}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.card,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F6F0',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: SPACING.lg,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  spinner: {
    marginTop: SPACING.lg,
  },
});
