/**
 * FINN v2.5 — Corrupt Data Recovery View (Bagian 3.3 & Bagian 8 Blueprint)
 * Visual Redesign: Light-Mode Fintech Flat Card (#FFFFFF, rounded-[32px], pill buttons).
 * Seluruh 3 tombol penyelamatan, state, dan handler 100% tetap sama.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MESSAGES } from '../../constants/messages.js';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';
import ConfirmDialog from './ConfirmDialog.js';

export default function CorruptDataView() {
  const {
    corruptReason,
    isBusy,
    storageErrorMessage,
    exportCorruptRawData,
    retryHydration,
    resetFromCorruptState,
  } = useFinn();

  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  const handleExportDump = async () => {
    setFeedbackBanner(null);
    const res = await exportCorruptRawData();
    if (!res.ok && res.message) {
      setFeedbackBanner(res.message);
    }
  };

  const handleRetry = async () => {
    setFeedbackBanner(null);
    await retryHydration();
  };

  const handleConfirmReset = async () => {
    setFeedbackBanner(null);
    const res = await resetFromCorruptState();
    setIsConfirmResetOpen(false);
    if (!res.ok && res.error) {
      setFeedbackBanner(res.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons
              name="warning-outline"
              size={32}
              color={COLORS.negative}
            />
          </View>

          <Text style={styles.title}>{MESSAGES.CORRUPT_TITLE}</Text>
          <Text style={styles.description}>{MESSAGES.CORRUPT_DESCRIPTION}</Text>

          {Boolean(corruptReason) && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Kode diagnostik</Text>
              <Text style={styles.reasonCode}>{corruptReason}</Text>
            </View>
          )}

          {Boolean(storageErrorMessage || feedbackBanner) && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={COLORS.negative}
              />
              <Text style={styles.errorBannerText}>
                {storageErrorMessage || feedbackBanner}
              </Text>
            </View>
          )}

          <View style={styles.buttonStack}>
            {/* Tombol 1: Ekspor data mentah */}
            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.actionButton,
                styles.primaryButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              onPress={handleExportDump}
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.primaryButtonText}>Ekspor data mentah</Text>
            </TouchableOpacity>

            {/* Tombol 2: Coba lagi */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.actionButton,
                styles.secondaryButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              onPress={handleRetry}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.ink} />
              <Text style={styles.secondaryButtonText}>Coba lagi</Text>
            </TouchableOpacity>

            {/* Tombol 3: Mulai dari awal */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.actionButton,
                styles.dangerOutlineButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              onPress={() => setIsConfirmResetOpen(true)}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={COLORS.negative}
              />
              <Text style={styles.dangerOutlineButtonText}>
                Mulai dari awal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ConfirmDialog
        visible={isConfirmResetOpen}
        title="Mulai dari awal?"
        message="Salinan data mentah saat ini akan dicadangkan otomatis ke @finn_backup_corrupt, lalu penyimpanan utama akan diatur ulang ke 6 kategori bawaan dan 0 transaksi."
        confirmText="Ya, Mulai dari Awal"
        cancelText="Batal"
        confirmVariant="danger"
        disabled={isBusy}
        onCancel={() => setIsConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  reasonBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  reasonCode: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.negative,
  },
  buttonStack: {
    width: '100%',
    gap: SPACING.sm,
  },
  actionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  primaryButton: {
    backgroundColor: COLORS.ink,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.mint,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  dangerOutlineButton: {
    backgroundColor: COLORS.dangerSoft,
  },
  dangerOutlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.negative,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
