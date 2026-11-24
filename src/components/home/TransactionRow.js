/**
 * FINN v2.5 — Memoized Transaction Row Component
 * Visual Redesign: Light-Mode Fintech Clean Table Row
 * - Baris lega putih (#FFFFFF, rounded-[24px], tanpa border berat)
 * - Ikon bulat mint (#EEF4EF) di samping nama kategori
 * - Nominal pengeluaran merah (#DC2626) dilengkapi indikator ikon ▼ (aksesibel WCAG)
 * - Tombol Edit & Hapus bulat rapi
 * Seluruh React.memo comparator, props, dan handler (onPressEdit, onPressDelete) 100% tetap sama.
 */

import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { formatRupiah } from '../../utils/amountUtils.js';
import { formatIndonesianShortDate } from '../../utils/dateUtils.js';

function TransactionRowComponent({
  transaction,
  category,
  isBusy,
  onPressEdit,
  onPressDelete,
}) {
  const formattedAmount = formatRupiah(transaction.amount);
  const formattedDate = formatIndonesianShortDate(transaction.transaction_date);
  const hasNote =
    typeof transaction.note === 'string' && transaction.note.trim().length > 0;

  return (
    <View style={styles.card}>
      {/* Ikon Bulat Mint Rapi */}
      <View style={styles.iconCircle}>
        <Ionicons name={category.icon} size={20} color={category.color} />
      </View>

      {/* Informasi Kategori, Catatan, dan Tanggal */}
      <View style={styles.infoColumn}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {category.name}
        </Text>
        {hasNote ? (
          <Text style={styles.noteText} numberOfLines={2}>
            {transaction.note}
          </Text>
        ) : null}
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* Nominal Negatif (▼ + Merah #DC2626) & Aksi Edit / Hapus Bulat */}
      <View style={styles.rightColumn}>
        <View style={styles.amountRow}>
          <Text style={styles.expenseIndicator}>▼</Text>
          <Text
            style={styles.amountText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formattedAmount}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.72}
            disabled={isBusy}
            style={[styles.iconButton, isBusy && styles.iconButtonDisabled]}
            onPress={() => onPressEdit(transaction.id)}
            accessibilityLabel="Edit transaksi"
          >
            <Ionicons name="create-outline" size={15} color={COLORS.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.72}
            disabled={isBusy}
            style={[
              styles.iconButton,
              styles.deleteButton,
              isBusy && styles.iconButtonDisabled,
            ]}
            onPress={() => onPressDelete(transaction)}
            accessibilityLabel="Hapus transaksi"
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={COLORS.negative}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const TransactionRow = memo(
  TransactionRowComponent,
  (prevProps, nextProps) =>
    prevProps.isBusy === nextProps.isBusy &&
    prevProps.transaction === nextProps.transaction &&
    prevProps.category === nextProps.category &&
    prevProps.onPressEdit === nextProps.onPressEdit &&
    prevProps.onPressDelete === nextProps.onPressDelete
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    marginBottom: 10,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoColumn: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 3,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    maxWidth: '45%',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  expenseIndicator: {
    fontSize: 9,
    color: COLORS.negative,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.negative,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerSoft,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
});

export default TransactionRow;
