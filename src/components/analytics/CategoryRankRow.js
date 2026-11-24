/**
 * FINN v2.5 — Category Ranking Row Component (Modul 4: Analisis)
 * Visual Redesign: Light-Mode Fintech Clean Table Row
 * - Baris putih lega (#FFFFFF, rounded-[24px], fill lime #E6FF4F saat disorot)
 * - Ikon bulat mint (#EEF4EF), badge peringkat rapi (#1 = pill hitam #111111), progress bar flat
 * Seluruh React.memo, props, kalkulasi lebar minimum 2%, dan onPressRow 100% tetap sama.
 */

import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { formatCompactIDR } from '../../utils/amountUtils.js';

function CategoryRankRowComponent({
  rankIndex,
  item,
  isHighlighted,
  isDimmed,
  onPressRow,
}) {
  const {
    categoryId,
    category,
    amount,
    transactionCount,
    percentageText,
    progressBarWidthPercent,
  } = item;

  const formattedAmount = formatCompactIDR(amount);
  const isTopRank = rankIndex === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.card,
        isHighlighted && styles.cardHighlighted,
        isDimmed && styles.cardDimmed,
      ]}
      onPress={() => onPressRow(categoryId)}
    >
      <View style={styles.topRow}>
        {/* Badge Nomor Peringkat & Ikon Bulat Mint */}
        <View style={styles.leftGroup}>
          <View
            style={[
              styles.rankBadge,
              (isTopRank || isHighlighted) && styles.rankBadgeInk,
            ]}
          >
            <Text
              style={[
                styles.rankNumberText,
                (isTopRank || isHighlighted) && styles.rankNumberTextInk,
              ]}
            >
              #{rankIndex + 1}
            </Text>
          </View>

          <View
            style={[
              styles.iconBox,
              isHighlighted && styles.iconBoxHighlighted,
            ]}
          >
            <Ionicons name={category.icon} size={19} color={category.color} />
          </View>

          <View style={styles.titleColumn}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {category.name}
            </Text>
            <Text
              style={[
                styles.txCountText,
                isHighlighted && styles.txCountTextHighlighted,
              ]}
            >
              {transactionCount} transaksi
            </Text>
          </View>
        </View>

        {/* Nominal & Persentase */}
        <View style={styles.rightGroup}>
          <View style={styles.amountRow}>
            <Text style={styles.expenseArrow}>▼</Text>
            <Text
              style={styles.amountText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formattedAmount}
            </Text>
          </View>

          <View
            style={[
              styles.percentPill,
              isHighlighted && styles.percentPillHighlighted,
            ]}
          >
            <Text
              style={[
                styles.percentText,
                isHighlighted && styles.percentTextHighlighted,
              ]}
            >
              {percentageText}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar Flat (Lebar Minimum 2% dari FinnContext) */}
      <View
        style={[
          styles.progressTrack,
          isHighlighted && styles.progressTrackHighlighted,
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressBarWidthPercent}%`,
              backgroundColor: isHighlighted ? COLORS.ink : category.color,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const CategoryRankRow = memo(CategoryRankRowComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    marginBottom: 10,
    ...SHADOWS.card,
  },
  cardHighlighted: {
    backgroundColor: COLORS.lime,
  },
  cardDimmed: {
    opacity: 0.48,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  rankBadge: {
    minWidth: 30,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  rankBadgeInk: {
    backgroundColor: COLORS.ink,
  },
  rankNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  rankNumberTextInk: {
    color: COLORS.lime,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconBoxHighlighted: {
    backgroundColor: COLORS.surface,
  },
  titleColumn: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  txCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  txCountTextHighlighted: {
    color: 'rgba(17, 17, 17, 0.68)',
  },
  rightGroup: {
    alignItems: 'flex-end',
    maxWidth: '45%',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  expenseArrow: {
    fontSize: 9,
    color: COLORS.negative,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  percentPill: {
    backgroundColor: COLORS.mint,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: RADIUS.full,
  },
  percentPillHighlighted: {
    backgroundColor: COLORS.ink,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  percentTextHighlighted: {
    color: COLORS.white,
  },
  progressTrack: {
    width: '100%',
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  progressTrackHighlighted: {
    backgroundColor: 'rgba(17, 17, 17, 0.14)',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});

export default CategoryRankRow;
