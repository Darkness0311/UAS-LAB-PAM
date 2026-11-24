/**
 * FINN v2.5 — Category List Item Component (Modul 3: Manajemen Kategori)
 * Visual Redesign: Light-Mode Fintech Clean Table Row
 * - Baris putih lega (#FFFFFF, rounded-[24px], fill lime #E6FF4F saat sedang diedit)
 * - Ikon bulat mint (#EEF4EF), pill jumlah transaksi hijau muda (#E6F8E1), tombol pill biru pastel (#BFE6EA)
 * Seluruh React.memo, aturan kategori default/terpakai/0 transaksi, props, dan handler 100% tetap sama.
 */

import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';

function CategoryRowComponent({
  category,
  usageCount,
  isEditingThis,
  isBusy,
  onPressEdit,
  onPressDelete,
  onPressViewTransactions,
}) {
  const isDefault = Boolean(category.is_default);
  const isUsed = usageCount > 0;

  return (
    <View style={[styles.card, isEditingThis && styles.cardEditing]}>
      <View style={styles.topRow}>
        {/* Ikon Bulat Mint Rapi */}
        <View
          style={[
            styles.iconCircle,
            isEditingThis && styles.iconCircleEditing,
          ]}
        >
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>

        {/* Nama Kategori & Badge Status */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {category.name}
            </Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Ionicons
                  name="lock-closed-outline"
                  size={10}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.txCountBadge,
                isEditingThis
                  ? styles.txCountBadgeEditing
                  : isUsed
                    ? styles.txCountBadgeActive
                    : styles.txCountBadgeEmpty,
              ]}
            >
              <Text
                style={[
                  styles.txCountBadgeText,
                  isEditingThis
                    ? styles.txCountBadgeTextEditing
                    : isUsed
                      ? styles.txCountBadgeTextActive
                      : styles.txCountBadgeTextEmpty,
                ]}
              >
                {usageCount} transaksi
              </Text>
            </View>

            {isEditingThis && (
              <Text style={styles.editingTagText}>• Sedang diedit</Text>
            )}
          </View>
        </View>

        {/* Aksi Kanan (Lihat Transaksi / Edit / Hapus) */}
        <View style={styles.actionsGroup}>
          {isUsed && (
            <TouchableOpacity
              activeOpacity={0.78}
              disabled={isBusy}
              style={[
                styles.viewTxButton,
                isEditingThis && styles.viewTxButtonEditing,
                isBusy && styles.buttonDisabled,
              ]}
              onPress={() => onPressViewTransactions(category.id)}
            >
              <Ionicons
                name="eye-outline"
                size={13}
                color={isEditingThis ? COLORS.white : COLORS.ink}
              />
              <Text
                style={[
                  styles.viewTxButtonText,
                  isEditingThis && styles.viewTxButtonTextEditing,
                ]}
              >
                Lihat transaksi
              </Text>
            </TouchableOpacity>
          )}

          {!isDefault && (
            <View style={styles.iconActionsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={isBusy}
                style={[
                  styles.iconBtn,
                  isEditingThis ? styles.editBtnEditing : styles.editBtn,
                  isBusy && styles.buttonDisabled,
                ]}
                onPress={() => onPressEdit(category.id)}
                accessibilityLabel={`Edit kategori ${category.name}`}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={COLORS.ink}
                />
              </TouchableOpacity>

              {/* Hanya tampilkan tombol Hapus bila 0 transaksi (Bagian 4 Modul 3) */}
              {!isUsed && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={isBusy}
                  style={[
                    styles.iconBtn,
                    styles.deleteBtn,
                    isBusy && styles.buttonDisabled,
                  ]}
                  onPress={() => onPressDelete(category)}
                  accessibilityLabel={`Hapus kategori ${category.name}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={COLORS.negative}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const CategoryRow = memo(CategoryRowComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    marginBottom: 10,
    ...SHADOWS.card,
  },
  cardEditing: {
    backgroundColor: COLORS.lime,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconCircleEditing: {
    backgroundColor: COLORS.surface,
  },
  infoCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  categoryName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCountBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: RADIUS.full,
  },
  txCountBadgeActive: {
    backgroundColor: COLORS.tintGreen,
  },
  txCountBadgeEmpty: {
    backgroundColor: COLORS.surfaceElevated,
  },
  txCountBadgeEditing: {
    backgroundColor: 'rgba(17, 17, 17, 0.1)',
  },
  txCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  txCountBadgeTextActive: {
    color: COLORS.positive,
  },
  txCountBadgeTextEmpty: {
    color: COLORS.textSecondary,
  },
  txCountBadgeTextEditing: {
    color: COLORS.ink,
  },
  editingTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  actionsGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  viewTxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.pastelBlue,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  viewTxButtonEditing: {
    backgroundColor: COLORS.ink,
  },
  viewTxButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  viewTxButtonTextEditing: {
    color: COLORS.white,
  },
  iconActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: COLORS.mint,
  },
  editBtnEditing: {
    backgroundColor: COLORS.surface,
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerSoft,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});

export default CategoryRow;
