/**
 * FINN v2.5 — Shared Period Selector Component (Dipakai Bersama Tab 1 & Tab 2)
 * Visual Redesign: Light-Mode Fintech Bento Card (#FFFFFF, rounded-[32px])
 * - Segmented control pill (mint #EEF4EF track, aktif = hitam #111111 teks putih)
 * - Navigasi periode ‹ label › dengan tombol bulat mint (#EEF4EF)
 * Seluruh state, props, dan handler (changePeriodMode, navigatePeriod) 100% tetap sama.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';
import { PERIOD_MODES } from '../../utils/dateUtils.js';

const SEGMENT_OPTIONS = Object.freeze([
  { mode: PERIOD_MODES.WEEK, label: 'Minggu' },
  { mode: PERIOD_MODES.MONTH, label: 'Bulan' },
  { mode: PERIOD_MODES.YEAR, label: 'Tahun' },
  { mode: PERIOD_MODES.ALL, label: 'Semua' },
]);

export default function PeriodSelector() {
  const {
    periodState,
    periodLabel,
    periodBounds,
    changePeriodMode,
    navigatePeriod,
    isBusy,
  } = useFinn();

  const { canGoPrev, canGoNext } = periodBounds;

  return (
    <View style={styles.container}>
      {/* Kontrol Segmen Pill: Minggu | Bulan | Tahun | Semua */}
      <View style={styles.segmentedTrack}>
        {SEGMENT_OPTIONS.map((option) => {
          const isActive = periodState.periodMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              activeOpacity={0.82}
              disabled={isBusy}
              style={[
                styles.segmentButton,
                isActive && styles.segmentButtonActive,
              ]}
              onPress={() => changePeriodMode(option.mode)}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bar Navigasi ‹ label › */}
      <View style={styles.navigatorRow}>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={!canGoPrev || isBusy}
          style={[
            styles.navArrowButton,
            (!canGoPrev || isBusy) && styles.navArrowDisabled,
          ]}
          onPress={() => navigatePeriod(-1)}
          accessibilityLabel="Periode sebelumnya"
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={
              canGoPrev && !isBusy ? COLORS.ink : COLORS.disabledText
            }
          />
        </TouchableOpacity>

        <View style={styles.labelWrapper}>
          <Text style={styles.periodCaption}>Periode aktif</Text>
          <Text
            style={styles.periodLabelText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {periodLabel}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={!canGoNext || isBusy}
          style={[
            styles.navArrowButton,
            (!canGoNext || isBusy) && styles.navArrowDisabled,
          ]}
          onPress={() => navigatePeriod(1)}
          accessibilityLabel="Periode berikutnya"
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={
              canGoNext && !isBusy ? COLORS.ink : COLORS.disabledText
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.mint,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.md,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.ink,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  navigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navArrowButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    backgroundColor: COLORS.surfaceElevated,
    opacity: 0.45,
  },
  labelWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  periodLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
