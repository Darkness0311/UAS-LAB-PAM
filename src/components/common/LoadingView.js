/**
 * FINN v2.5 — Full-Screen Loading View
 * Visual Redesign: Light-Mode Fintech Flat Card (#EEECE6 canvas, #FFFFFF rounded-[32px]).
 * Tetap menampilkan spinner layar penuh tanpa angka Rp0 sesaat.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.spinnerCircle}>
          <ActivityIndicator size="large" color={COLORS.ink} />
        </View>
        <Text style={styles.title}>Memuat data Finn</Text>
        <Text style={styles.subtitle}>
          Menyiapkan catatan pengeluaran lokal Anda
        </Text>
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
  spinnerCircle: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
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
});
