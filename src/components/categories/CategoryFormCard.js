/**
 * FINN v2.5 — Custom Category Add / Edit Form Card (Modul 3: Manajemen Kategori)
 * Visual Redesign: Light-Mode Fintech Flat Bento Card (#FFFFFF, rounded-[32px], pill controls, tanpa neon).
 * Seluruh state, validasi, limit 15 kategori, dialog dampak edit, dan handlers 100% tetap sama.
 */

import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_ICON_LIST,
  DEFAULT_CUSTOM_CATEGORY_COLOR,
  DEFAULT_CUSTOM_CATEGORY_ICON,
  DOMAIN_LIMITS,
} from '../../constants/defaultCategories.js';
import { MESSAGES } from '../../constants/messages.js';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';
import { validateCategoryForm } from '../../utils/validationUtils.js';
import ConfirmDialog from '../common/ConfirmDialog.js';

export default function CategoryFormCard() {
  const {
    categories,
    categoryUsageMap,
    customCategoryMeta,
    editingCategoryId,
    editingCategory,
    isBusy,
    cancelEditingCategory,
    saveCustomCategory,
  } = useFinn();

  const isEditMode = Boolean(editingCategory);
  const isAddLockedByLimit =
    !isEditMode && customCategoryMeta.isLimitReached;

  const [nameInput, setNameInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    DEFAULT_CUSTOM_CATEGORY_COLOR
  );
  const [selectedIcon, setSelectedIcon] = useState(
    DEFAULT_CUSTOM_CATEGORY_ICON
  );

  const [nameTouched, setNameTouched] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [showImpactConfirm, setShowImpactConfirm] = useState(false);

  // Sinkronisasi form saat beralih antara Mode Tambah & Mode Edit
  useEffect(() => {
    if (editingCategory) {
      setNameInput(editingCategory.name);
      setSelectedColor(editingCategory.color);
      setSelectedIcon(editingCategory.icon);
    } else {
      setNameInput('');
      setSelectedColor(DEFAULT_CUSTOM_CATEGORY_COLOR);
      setSelectedIcon(DEFAULT_CUSTOM_CATEGORY_ICON);
    }
    setNameTouched(false);
    setNameError(null);
    setShowImpactConfirm(false);
  }, [editingCategory]);

  const affectedTxCount = editingCategoryId
    ? categoryUsageMap[editingCategoryId] || 0
    : 0;

  const quotaProgressPercent =
    DOMAIN_LIMITS.MAX_CUSTOM_CATEGORIES > 0 &&
    customCategoryMeta.customCount > 0
      ? Math.max(
          6,
          Math.min(
            100,
            Math.round(
              (customCategoryMeta.customCount /
                DOMAIN_LIMITS.MAX_CUSTOM_CATEGORIES) *
                100
            )
          )
        )
      : 0;

  const handleNameChange = (text) => {
    const clean = text.replace(/[\r\n]+/g, ' ');
    setNameInput(clean);
    setNameTouched(true);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleNameBlur = () => {
    if (!nameTouched && nameInput.trim().length === 0) {
      return;
    }
    if (isAddLockedByLimit) {
      return;
    }
    const validation = validateCategoryForm({
      nameInput,
      color: selectedColor,
      icon: selectedIcon,
      existingCategories: categories,
      editingCategoryId,
    });
    if (!validation.isValid) {
      setNameError(validation.error);
    } else {
      setNameError(null);
    }
  };

  const executeSaveCategory = async () => {
    setShowImpactConfirm(false);
    const result = await saveCustomCategory({
      nameInput,
      color: selectedColor,
      icon: selectedIcon,
    });

    if (!result.ok && result.validationError) {
      setNameError(result.validationError);
      return;
    }

    if (result.ok && !isEditMode) {
      // Reset ke default setelah berhasil tambah kategori kustom baru
      setNameInput('');
      setSelectedColor(DEFAULT_CUSTOM_CATEGORY_COLOR);
      setSelectedIcon(DEFAULT_CUSTOM_CATEGORY_ICON);
      setNameTouched(false);
      setNameError(null);
    }
  };

  const handlePressSubmit = async () => {
    if (isBusy || isAddLockedByLimit) {
      return;
    }
    Keyboard.dismiss();
    setNameTouched(true);

    const validation = validateCategoryForm({
      nameInput,
      color: selectedColor,
      icon: selectedIcon,
      existingCategories: categories,
      editingCategoryId,
    });

    if (!validation.isValid) {
      setNameError(validation.error);
      return;
    }

    setNameError(null);

    // Bila sedang mode Edit dan >= 1 transaksi terdampak, tampilkan dialog konfirmasi dulu
    if (isEditMode && affectedTxCount >= 1) {
      setShowImpactConfirm(true);
      return;
    }

    await executeSaveCategory();
  };

  const handleCancelEdit = () => {
    if (isBusy) {
      return;
    }
    Keyboard.dismiss();
    cancelEditingCategory();
  };

  return (
    <View style={[styles.card, isEditMode && styles.cardEditMode]}>
      {/* Header Form & Indikator Kuota 15 Kategori Kustom */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View
            style={[
              styles.headerIconCircle,
              isEditMode && styles.headerIconCircleEdit,
            ]}
          >
            <Ionicons
              name={isEditMode ? 'create-outline' : 'add-circle-outline'}
              size={18}
              color={COLORS.ink}
            />
          </View>
          <Text style={styles.cardTitle}>
            {isEditMode ? 'Edit kategori kustom' : 'Tambah kategori kustom'}
          </Text>
        </View>

        <View style={[styles.quotaBadge, isEditMode && styles.quotaBadgeEdit]}>
          <Text
            style={[
              styles.quotaBadgeText,
              isEditMode && styles.quotaBadgeTextEdit,
            ]}
          >
            {customCategoryMeta.customCount}/
            {DOMAIN_LIMITS.MAX_CUSTOM_CATEGORIES} kustom
          </Text>
        </View>
      </View>

      {/* Progress Bar Kuota Flat */}
      <View style={styles.quotaTrack}>
        {quotaProgressPercent > 0 && (
          <View
            style={[styles.quotaFill, { width: `${quotaProgressPercent}%` }]}
          />
        )}
      </View>

      {/* Pratinjau Langsung Kategori */}
      <View style={styles.previewRow}>
        <View style={styles.previewIconCircle}>
          <Ionicons name={selectedIcon} size={20} color={selectedColor} />
        </View>
        <View style={styles.previewTextCol}>
          <Text style={styles.previewLabel}>Pratinjau tampilan</Text>
          <Text style={styles.previewName} numberOfLines={1}>
            {nameInput.trim() || 'Nama kategori baru'}
          </Text>
        </View>
        <View
          style={[
            styles.previewColorDot,
            { backgroundColor: selectedColor },
          ]}
        />
      </View>

      {/* Input Nama Kategori */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Nama kategori</Text>
          <Text style={styles.counterText}>
            {nameInput.trim().length}/{DOMAIN_LIMITS.MAX_CATEGORY_NAME_LENGTH}
          </Text>
        </View>

        <TextInput
          style={[
            styles.textInput,
            Boolean(nameError) && styles.textInputError,
            isAddLockedByLimit && styles.textInputDisabled,
          ]}
          value={nameInput}
          onChangeText={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="Contoh: Langganan Digital"
          placeholderTextColor={COLORS.disabledText}
          maxLength={DOMAIN_LIMITS.MAX_CATEGORY_NAME_LENGTH}
          editable={!isBusy && !isAddLockedByLimit}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        {Boolean(nameError) && (
          <Text style={styles.inlineErrorText}>{nameError}</Text>
        )}
      </View>

      {/* Pemilih 9 Warna Palet */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Pilih warna (9 palet)</Text>
        <View style={styles.colorGrid}>
          {CATEGORY_COLOR_PALETTE.map((hexColor) => {
            const isSelected = selectedColor === hexColor;
            return (
              <TouchableOpacity
                key={hexColor}
                activeOpacity={0.82}
                disabled={isBusy || isAddLockedByLimit}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: hexColor },
                  isSelected && styles.colorSwatchSelected,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedColor(hexColor);
                }}
                accessibilityLabel={`Warna ${hexColor}`}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Pemilih 13 Ikon Ionicons */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Pilih ikon (13 ikon)</Text>
        <View style={styles.iconGrid}>
          {CATEGORY_ICON_LIST.map((iconName) => {
            const isSelected = selectedIcon === iconName;
            return (
              <TouchableOpacity
                key={iconName}
                activeOpacity={0.82}
                disabled={isBusy || isAddLockedByLimit}
                style={[
                  styles.iconOptionButton,
                  isSelected && {
                    backgroundColor: selectedColor,
                  },
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedIcon(iconName);
                }}
                accessibilityLabel={`Ikon ${iconName}`}
              >
                <Ionicons
                  name={iconName}
                  size={19}
                  color={isSelected ? COLORS.white : COLORS.textPrimary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Keterangan bila Batas 15 Kategori Kustom Tercapai */}
      {isAddLockedByLimit && (
        <View style={styles.limitNoticeBox}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.warningText}
          />
          <Text style={styles.limitNoticeText}>
            {MESSAGES.CATEGORY_LIMIT_REACHED}
          </Text>
        </View>
      )}

      {/* Tombol Aksi Pill (Simpan / Batal Edit) */}
      <View style={styles.actionButtonsRow}>
        {isEditMode && (
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isBusy}
            style={[styles.cancelEditBtn, isBusy && styles.disabledBtn]}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelEditBtnText}>Batal edit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isBusy || isAddLockedByLimit}
          style={[
            styles.submitBtn,
            (isBusy || isAddLockedByLimit) && styles.disabledBtn,
          ]}
          onPress={handlePressSubmit}
        >
          <Ionicons
            name={isEditMode ? 'save-outline' : 'add-circle-outline'}
            size={18}
            color={COLORS.lime}
          />
          <Text style={styles.submitBtnText}>
            {isBusy
              ? 'Menyimpan...'
              : isEditMode
                ? 'Simpan kategori'
                : 'Tambah kategori'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dialog Konfirmasi Perubahan Kategori Terpakai */}
      <ConfirmDialog
        visible={showImpactConfirm}
        title="Simpan Perubahan Kategori?"
        message={`${MESSAGES.renameCategoryImpact(affectedTxCount)}. Lanjutkan menyimpan perubahan kategori "${nameInput.trim()}"?`}
        confirmText="Ya, Simpan"
        cancelText="Batal"
        confirmVariant="primary"
        disabled={isBusy}
        onCancel={() => setShowImpactConfirm(false)}
        onConfirm={executeSaveCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  cardEditMode: {
    borderWidth: 1.5,
    borderColor: COLORS.ink,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconCircleEdit: {
    backgroundColor: COLORS.lime,
  },
  cardTitle: {
    flex: 1,
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
  },
  quotaBadge: {
    backgroundColor: COLORS.mint,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  quotaBadgeEdit: {
    backgroundColor: COLORS.lime,
  },
  quotaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  quotaBadgeTextEdit: {
    color: COLORS.ink,
  },
  quotaTrack: {
    width: '100%',
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  quotaFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  previewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  previewTextCol: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  previewColorDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  textInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  textInputError: {
    borderColor: COLORS.negative,
    backgroundColor: COLORS.dangerSoft,
  },
  textInputDisabled: {
    backgroundColor: COLORS.disabledBg,
    color: COLORS.disabledText,
  },
  inlineErrorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.negative,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: COLORS.ink,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  iconOptionButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.tintCream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  limitNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warningText,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledBtn: {
    opacity: 0.45,
  },
});
