/**
 * FINN v2.5 — Toast & Storage Error Banner
 * Visual Redesign: Light-Mode Fintech Pill Toast (#111111 + lime icon / #FEE2E2 error).
 * Seluruh hooks dan handler (clearToast, clearStorageError) 100% tetap sama.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';

export default function ToastBanner() {
  const {
    toastMessage,
    storageErrorMessage,
    clearToast,
    clearStorageError,
  } = useFinn();

  if (!toastMessage && !storageErrorMessage) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {Boolean(storageErrorMessage) && (
        <View style={[styles.banner, styles.errorBanner]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle" size={18} color={COLORS.negative} />
          </View>
          <Text style={[styles.bannerText, styles.errorBannerText]}>
            {storageErrorMessage}
          </Text>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={clearStorageError}
          >
            <Ionicons name="close" size={18} color={COLORS.negative} />
          </TouchableOpacity>
        </View>
      )}

      {Boolean(toastMessage) && (
        <View style={[styles.banner, styles.infoBanner]}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="checkmark" size={16} color={COLORS.ink} />
          </View>
          <Text style={styles.bannerText}>{toastMessage}</Text>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={clearToast}
          >
            <Ionicons name="close" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 999,
    gap: SPACING.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    ...SHADOWS.pillBar,
  },
  infoBanner: {
    backgroundColor: COLORS.ink,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  errorIconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 18,
    marginRight: SPACING.xs,
  },
  errorBannerText: {
    color: COLORS.negative,
  },
});
