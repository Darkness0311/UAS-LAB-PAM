/**
 * FINN v2.5 — Interactive SVG Donut Chart Card (Modul 4: Analisis)
 * Visual Redesign: Light-Mode Fintech Flat Bento Card (#FFFFFF, rounded-[32px], tanpa neon/glow).
 * Guard P_periode === 0, rumus keliling C = 2*PI*r, props, strokeLinecap, dan interaksi sorotan 100% tetap sama.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme.js';
import { formatCompactIDR } from '../../utils/amountUtils.js';

const SVG_SIZE = 232;
const STROKE_WIDTH = 26;
const HIGHLIGHT_STROKE_WIDTH = 31;
const CENTER = SVG_SIZE / 2; // cx = 116, cy = 116
const RADIUS_VAL = (SVG_SIZE - HIGHLIGHT_STROKE_WIDTH) / 2 - 4; // r = 96.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VAL;

export default function DonutChartCard({
  periodTotal,
  periodLabel,
  rankings,
  highlightedItem,
  effectiveHighlightedCatId,
  emptyStateMessage,
  onToggleHighlight,
}) {
  const hasExpenses =
    typeof periodTotal === 'number' &&
    periodTotal > 0 &&
    Array.isArray(rankings) &&
    rankings.length > 0;

  // Hitung geometri irisan SVG hanya bila periodTotal > 0 (Bebas Division by Zero)
  const slices = useMemo(() => {
    if (!hasExpenses || periodTotal <= 0) {
      return [];
    }

    let cumulativeAngle = 0;
    const isSingleCategory = rankings.length === 1;

    return rankings.map((item) => {
      const proportion = item.amount / periodTotal;
      const safeProportion = Number.isFinite(proportion)
        ? Math.max(0, Math.min(1, proportion))
        : 0;
      const sliceLength = safeProportion * CIRCUMFERENCE;
      const sliceAngle = safeProportion * 360;
      const rotationAngle = cumulativeAngle - 90;

      cumulativeAngle += sliceAngle;

      return {
        categoryId: item.categoryId,
        color: item.category.color,
        name: item.category.name,
        sliceLength,
        rotationAngle,
        strokeLinecap: isSingleCategory ? 'round' : 'butt',
      };
    });
  }, [hasExpenses, periodTotal, rankings]);

  // Empty State: P_periode === 0 -> cincin abu-abu hangat + teks "Tidak ada pengeluaran di [label periode]."
  if (!hasExpenses) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircleMint}>
              <Ionicons name="pie-chart-outline" size={16} color={COLORS.ink} />
            </View>
            <Text style={styles.cardTitle}>Distribusi pengeluaran</Text>
          </View>
          <View style={styles.statusPillIdle}>
            <Text style={styles.statusPillIdleText}>Kosong</Text>
          </View>
        </View>

        <View style={styles.donutWrapper}>
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS_VAL}
              stroke={COLORS.border}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
          </Svg>

          <View style={styles.centerHoleOverlay} pointerEvents="none">
            <View style={styles.emptyCenterIconCircle}>
              <Ionicons
                name="pie-chart-outline"
                size={22}
                color={COLORS.textSecondary}
              />
            </View>
            <Text style={styles.emptyCenterAmount}>Rp0</Text>
          </View>
        </View>

        <Text style={styles.emptyStateText}>{emptyStateMessage}</Text>
      </View>
    );
  }

  const centerTitle = highlightedItem
    ? highlightedItem.category.name
    : `Total ${periodLabel}`;

  const centerAmount = highlightedItem
    ? formatCompactIDR(highlightedItem.amount)
    : formatCompactIDR(periodTotal);

  const centerSubLabel = highlightedItem
    ? `${highlightedItem.percentageText} • ${highlightedItem.transactionCount} transaksi`
    : `${rankings.length} kategori aktif`;

  return (
    <View style={styles.card}>
      {/* Header Kartu */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircleMint}>
            <Ionicons name="pie-chart-outline" size={16} color={COLORS.ink} />
          </View>
          <Text style={styles.cardTitle}>Distribusi pengeluaran</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            highlightedItem && styles.statusPillFocused,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              highlightedItem && styles.statusPillTextFocused,
            ]}
          >
            {highlightedItem ? 'Terfokus' : 'Interaktif'}
          </Text>
        </View>
      </View>

      <View style={styles.donutWrapper}>
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          {/* Cincin track latar hangat */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS_VAL}
            stroke={COLORS.background}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            pointerEvents="none"
          />

          {/* Irisan Donut Utama Interaktif (Flat & Bersih) */}
          <G>
            {slices.map((slice) => {
              const isHighlighted =
                effectiveHighlightedCatId === slice.categoryId;
              const isDimmed =
                effectiveHighlightedCatId !== null && !isHighlighted;

              return (
                <Circle
                  key={slice.categoryId}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS_VAL}
                  stroke={slice.color}
                  strokeWidth={
                    isHighlighted ? HIGHLIGHT_STROKE_WIDTH : STROKE_WIDTH
                  }
                  strokeDasharray={`${slice.sliceLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={0}
                  rotation={slice.rotationAngle}
                  origin={`${CENTER}, ${CENTER}`}
                  strokeLinecap={slice.strokeLinecap}
                  opacity={isDimmed ? 0.25 : 1}
                  fill="transparent"
                  onPress={() => {
                    if (onToggleHighlight) {
                      onToggleHighlight(slice.categoryId);
                    }
                  }}
                />
              );
            })}
          </G>
        </Svg>

        {/* Informasi Pusat Donut */}
        <TouchableOpacity
          activeOpacity={0.78}
          disabled={!highlightedItem}
          style={styles.centerHoleOverlay}
          onPress={() => {
            if (highlightedItem && onToggleHighlight) {
              onToggleHighlight(highlightedItem.categoryId);
            }
          }}
        >
          {highlightedItem ? (
            <View
              style={[
                styles.highlightDot,
                { backgroundColor: highlightedItem.category.color },
              ]}
            />
          ) : null}

          <Text style={styles.centerLabel} numberOfLines={1}>
            {centerTitle}
          </Text>

          <Text
            style={[
              styles.centerAmount,
              highlightedItem && { color: highlightedItem.category.color },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
          >
            {centerAmount}
          </Text>

          <View style={styles.centerSubPill}>
            <Text style={styles.centerSubText} numberOfLines={1}>
              {centerSubLabel}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.hintBox}>
        <View style={styles.hintIconCircle}>
          <Ionicons
            name="hand-left-outline"
            size={13}
            color={COLORS.textPrimary}
          />
        </View>
        <Text style={styles.hintText}>
          {highlightedItem
            ? 'Ketuk kembali kategori atau tengah lingkaran untuk melepas sorotan'
            : 'Ketuk irisan diagram atau baris peringkat untuk menyorot kategori'}
        </Text>
      </View>
    </View>
  );
}

const CENTER_HOLE_SIZE = SVG_SIZE - HIGHLIGHT_STROKE_WIDTH * 2 - 24;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleMint: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
  },
  statusPill: {
    backgroundColor: COLORS.mint,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  statusPillFocused: {
    backgroundColor: COLORS.ink,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusPillTextFocused: {
    color: COLORS.white,
  },
  statusPillIdle: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  statusPillIdleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  donutWrapper: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerHoleOverlay: {
    position: 'absolute',
    width: CENTER_HOLE_SIZE,
    height: CENTER_HOLE_SIZE,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  emptyCenterIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  highlightDot: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  centerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  centerSubPill: {
    marginTop: 5,
    backgroundColor: COLORS.mint,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: RADIUS.full,
    maxWidth: '94%',
  },
  centerSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyCenterAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyStateText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  hintBox: {
    marginTop: SPACING.md,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hintIconCircle: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
