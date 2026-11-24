/**
 * FINN v2.5 — Bottom Sheet Modal Form Tambah & Edit Transaksi (Modul 2)
 * Visual Redesign: Light-Mode Fintech Flat Sheet (#FFFFFF, rounded-[32px], pill controls, tanpa neon).
 * Seluruh state, validasi, dirty check, DateTimePicker, props, dan handler 100% tetap sama.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_CATEGORIES,
  DOMAIN_LIMITS,
} from '../../constants/defaultCategories.js';
import { MESSAGES } from '../../constants/messages.js';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';
import {
  formatRupiah,
  handleAmountTextChange,
  parseAmountInput,
} from '../../utils/amountUtils.js';
import {
  formatIndonesianFullDate,
  getLocalISODate,
  getYesterdayISODate,
  isoDateToLocalDate,
} from '../../utils/dateUtils.js';
import {
  getMaxAllowedTransactionDate,
  isTransactionFormDirty,
  sanitizeNoteOnChange,
  validateAmountField,
  validateTransactionDateField,
} from '../../utils/validationUtils.js';
import ConfirmDialog from '../common/ConfirmDialog.js';

export default function TransactionFormModal() {
  const {
    isTxModalVisible,
    editingTransaction,
    categories,
    todayISO,
    isBusy,
    storageErrorMessage,
    closeTransactionModal,
    saveTransaction,
  } = useFinn();

  const isEditMode = Boolean(editingTransaction);

  // State Nilai Awal (untuk Dirty Check)
  const [initialState, setInitialState] = useState({
    amountInput: '',
    selectedCatId: DEFAULT_CATEGORIES[0].id,
    dateISO: todayISO,
    noteInput: '',
  });

  // State Field Form Aktif
  const [amountInput, setAmountInput] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(DEFAULT_CATEGORIES[0].id);
  const [dateISO, setDateISO] = useState(todayISO);
  const [noteInput, setNoteInput] = useState('');

  // State Validasi Inline & Sentuhan Field
  const [amountTouched, setAmountTouched] = useState(false);
  const [amountError, setAmountError] = useState(null);
  const [dateError, setDateError] = useState(null);

  // State DateTimePicker & Dialog Dirty Check
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Inisialisasi ulang state setiap kali modal dibuka atau target transaksi berubah
  useEffect(() => {
    if (!isTxModalVisible) {
      setShowDatePicker(false);
      setShowDiscardConfirm(false);
      return;
    }

    if (editingTransaction) {
      const catExists = categories.some(
        (cat) => cat.id === editingTransaction.category_id
      );
      const resolvedCatId = catExists
        ? editingTransaction.category_id
        : DEFAULT_CATEGORIES[0].id;
      const cleanNote = sanitizeNoteOnChange(editingTransaction.note || '').trim();
      const amountStr = String(editingTransaction.amount);
      const txDateStr = editingTransaction.transaction_date;

      setInitialState({
        amountInput: amountStr,
        selectedCatId: resolvedCatId,
        dateISO: txDateStr,
        noteInput: cleanNote,
      });

      setAmountInput(amountStr);
      setSelectedCatId(resolvedCatId);
      setDateISO(txDateStr);
      setNoteInput(cleanNote);
    } else {
      const defaultCatId =
        categories.length > 0 ? categories[0].id : DEFAULT_CATEGORIES[0].id;

      setInitialState({
        amountInput: '',
        selectedCatId: defaultCatId,
        dateISO: todayISO,
        noteInput: '',
      });

      setAmountInput('');
      setSelectedCatId(defaultCatId);
      setDateISO(todayISO);
      setNoteInput('');
    }

    setAmountTouched(false);
    setAmountError(null);
    setDateError(null);
    setShowDatePicker(false);
    setShowDiscardConfirm(false);
  }, [isTxModalVisible, editingTransaction, categories, todayISO]);

  const yesterdayISO = useMemo(
    () => getYesterdayISODate(todayISO),
    [todayISO]
  );

  const originalDateISO = editingTransaction
    ? editingTransaction.transaction_date
    : null;

  const maxAllowedDateISO = useMemo(
    () => getMaxAllowedTransactionDate(todayISO, originalDateISO),
    [todayISO, originalDateISO]
  );

  const maxAllowedDateObj = useMemo(
    () => isoDateToLocalDate(maxAllowedDateISO),
    [maxAllowedDateISO]
  );

  const currentPickerDateObj = useMemo(
    () => isoDateToLocalDate(dateISO),
    [dateISO]
  );

  // Dirty check sesuai aturan Bagian 4 Modul 2
  const isDirty = useMemo(
    () =>
      isTransactionFormDirty({
        amountInput,
        selectedCatId,
        dateISO,
        noteInput,
        initialAmountInput: initialState.amountInput,
        initialCatId: initialState.selectedCatId,
        initialDateISO: initialState.dateISO,
        initialNoteInput: initialState.noteInput,
      }),
    [amountInput, selectedCatId, dateISO, noteInput, initialState]
  );

  // Pratinjau nominal terformat bila angka valid
  const amountPreviewText = useMemo(() => {
    const parsed = parseAmountInput(amountInput);
    if (parsed.isEmpty || parsed.value === null || parsed.value < 1) {
      return null;
    }
    return formatRupiah(parsed.value);
  }, [amountInput]);

  // Handler Perubahan Input Nominal
  const onChangeAmount = (nextText) => {
    const cleaned = handleAmountTextChange(amountInput, nextText);
    setAmountInput(cleaned);
    setAmountTouched(true);
    if (amountError) {
      setAmountError(null);
    }
  };

  // Handler Blur pada Input Nominal
  const onBlurAmount = () => {
    if (!amountTouched && amountInput.length === 0) {
      return;
    }
    const validation = validateAmountField(amountInput);
    if (!validation.isValid) {
      setAmountError(validation.error);
    } else {
      setAmountError(null);
      if (validation.normalizedString !== amountInput) {
        setAmountInput(validation.normalizedString);
      }
    }
  };

  // Handler Pilih Tanggal Cepat (Hari Ini / Kemarin)
  const handleSelectQuickDate = (targetISO) => {
    Keyboard.dismiss();
    setShowDatePicker(false);
    setDateISO(targetISO);
    if (dateError) {
      setDateError(null);
    }
  };

  // Handler Perubahan DateTimePicker
  const handleDatePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed' || !selectedDate) {
      return;
    }

    const pickedISO = getLocalISODate(selectedDate);
    setDateISO(pickedISO);

    const check = validateTransactionDateField(
      pickedISO,
      todayISO,
      originalDateISO
    );
    setDateError(check.isValid ? null : check.error);
  };

  // Handler Perubahan Catatan
  const handleNoteChange = (text) => {
    setNoteInput(sanitizeNoteOnChange(text));
  };

  // Handler Penutupan Modal (memeriksa Dirty Check)
  const handleAttemptClose = () => {
    if (isBusy) {
      return;
    }
    Keyboard.dismiss();
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeTransactionModal();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    closeTransactionModal();
  };

  // Handler Tombol Simpan
  const handlePressSave = async () => {
    if (isBusy) {
      return;
    }
    Keyboard.dismiss();
    setAmountTouched(true);

    const result = await saveTransaction({
      amountInput,
      categoryId: selectedCatId,
      dateISO,
      noteInput,
    });

    if (!result.ok && result.validationErrors) {
      setAmountError(result.validationErrors.amount || null);
      setDateError(result.validationErrors.date || null);
      if (
        result.normalizedAmountString &&
        result.normalizedAmountString !== amountInput
      ) {
        setAmountInput(result.normalizedAmountString);
      }
    }
  };

  if (!isTxModalVisible) {
    return null;
  }

  return (
    <Modal
      visible={isTxModalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleAttemptClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop — ketukan di luar sheet memicu handleAttemptClose (Dirty Check) */}
          <Pressable
            style={styles.backdropPressable}
            onPress={handleAttemptClose}
          />

          <View style={styles.sheetContainer}>
            {/* Drag Handle & Header Modal */}
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                {isEditMode ? 'Edit pengeluaran' : 'Catat pengeluaran'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.72}
                disabled={isBusy}
                style={styles.closeButton}
                onPress={handleAttemptClose}
                accessibilityLabel="Tutup formulir"
              >
                <Ionicons name="close" size={20} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            {/* Banner Error Penyimpanan bila terjadi kegagalan I/O */}
            {Boolean(storageErrorMessage) && (
              <View style={styles.storageErrorBox}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={COLORS.negative}
                />
                <Text style={styles.storageErrorText}>
                  {storageErrorMessage}
                </Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* 1. FIELD NOMINAL */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Nominal pengeluaran</Text>
                  {Boolean(amountPreviewText) && !amountError && (
                    <Text style={styles.amountPreview}>{amountPreviewText}</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.amountInputWrapper,
                    Boolean(amountError) && styles.inputWrapperError,
                  ]}
                >
                  <Text style={styles.currencyPrefix}>Rp</Text>
                  <TextInput
                    style={styles.amountTextInput}
                    value={amountInput}
                    onChangeText={onChangeAmount}
                    onBlur={onBlurAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.disabledText}
                    keyboardType="number-pad"
                    editable={!isBusy}
                    maxLength={15}
                    selectTextOnFocus
                  />
                  {amountInput.length > 0 && !isBusy && (
                    <TouchableOpacity
                      onPress={() => {
                        setAmountInput('');
                        if (amountError) {
                          setAmountError(null);
                        }
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={19}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {Boolean(amountError) && (
                  <Text style={styles.inlineErrorText}>{amountError}</Text>
                )}
              </View>

              {/* 2. FIELD KATEGORI */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kategori</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.82}
                        disabled={isBusy}
                        style={[
                          styles.categoryOption,
                          isSelected && styles.categoryOptionSelected,
                        ]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedCatId(cat.id);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryIconBadge,
                            isSelected && styles.categoryIconBadgeSelected,
                          ]}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={15}
                            color={isSelected ? COLORS.ink : cat.color}
                          />
                        </View>
                        <Text
                          style={[
                            styles.categoryOptionText,
                            isSelected && styles.categoryOptionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3. FIELD TANGGAL (DateTimePicker + Tombol Cepat Hari Ini / Kemarin) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tanggal transaksi</Text>

                <View style={styles.quickDateRow}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={[
                      styles.quickDateChip,
                      dateISO === todayISO && styles.quickDateChipActive,
                    ]}
                    onPress={() => handleSelectQuickDate(todayISO)}
                  >
                    <Ionicons
                      name="sunny-outline"
                      size={14}
                      color={
                        dateISO === todayISO
                          ? COLORS.white
                          : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.quickDateChipText,
                        dateISO === todayISO && styles.quickDateChipTextActive,
                      ]}
                    >
                      Hari Ini
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={[
                      styles.quickDateChip,
                      dateISO === yesterdayISO && styles.quickDateChipActive,
                    ]}
                    onPress={() => handleSelectQuickDate(yesterdayISO)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={
                        dateISO === yesterdayISO
                          ? COLORS.white
                          : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.quickDateChipText,
                        dateISO === yesterdayISO &&
                          styles.quickDateChipTextActive,
                      ]}
                    >
                      Kemarin
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={styles.datePickerTrigger}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowDatePicker((prev) => !prev);
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={COLORS.ink}
                    />
                    <Text style={styles.datePickerTriggerText}>
                      Pilih Tanggal
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.82}
                  disabled={isBusy}
                  style={[
                    styles.selectedDateBox,
                    Boolean(dateError) && styles.inputWrapperError,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowDatePicker((prev) => !prev);
                  }}
                >
                  <View style={styles.dateBoxIconCircle}>
                    <Ionicons name="calendar" size={16} color={COLORS.ink} />
                  </View>
                  <View style={styles.selectedDateTextCol}>
                    <Text style={styles.selectedDateMain}>
                      {formatIndonesianFullDate(dateISO)}
                    </Text>
                    <Text style={styles.selectedDateISO}>{dateISO}</Text>
                  </View>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {Boolean(dateError) && (
                  <Text style={styles.inlineErrorText}>{dateError}</Text>
                )}

                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={currentPickerDateObj}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      themeVariant="light"
                      maximumDate={maxAllowedDateObj}
                      onChange={handleDatePickerChange}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={styles.iosClosePickerBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.iosClosePickerText}>
                          Selesai Pilih Tanggal
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* 4. FIELD CATATAN (OPSIONAL, MAKS 100 KARAKTER) */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
                  <Text style={styles.charCounterText}>
                    {noteInput.length}/{DOMAIN_LIMITS.MAX_NOTE_LENGTH}
                  </Text>
                </View>

                <TextInput
                  style={styles.noteTextInput}
                  value={noteInput}
                  onChangeText={handleNoteChange}
                  placeholder="Contoh: Kopi susu & roti bakar"
                  placeholderTextColor={COLORS.disabledText}
                  maxLength={DOMAIN_LIMITS.MAX_NOTE_LENGTH}
                  editable={!isBusy}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              {/* TOMBOL AKSI PILL (BATAL & SIMPAN) */}
              <View style={styles.footerButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={isBusy}
                  style={[
                    styles.cancelButton,
                    isBusy && styles.disabledButton,
                  ]}
                  onPress={handleAttemptClose}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isBusy}
                  style={[styles.saveButton, isBusy && styles.disabledButton]}
                  onPress={handlePressSave}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color={COLORS.lime}
                  />
                  <Text style={styles.saveButtonText}>
                    {isBusy ? 'Menyimpan...' : 'Simpan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Dialog Dirty Check ("Buang perubahan?") */}
      <ConfirmDialog
        visible={showDiscardConfirm}
        title={MESSAGES.DISCARD_CHANGES_TITLE}
        message={MESSAGES.DISCARD_CHANGES_MESSAGE}
        confirmText="Ya, Buang"
        cancelText="Lanjut Mengisi"
        confirmVariant="danger"
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.lg,
    ...SHADOWS.pillBar,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  storageErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.negative,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
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
    marginBottom: 6,
  },
  amountPreview: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 58,
  },
  inputWrapperError: {
    borderColor: COLORS.negative,
    backgroundColor: COLORS.dangerSoft,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  inlineErrorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.negative,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 2,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.ink,
  },
  categoryIconBadge: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryIconBadgeSelected: {
    backgroundColor: COLORS.lime,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  quickDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
  },
  quickDateChipActive: {
    backgroundColor: COLORS.ink,
  },
  quickDateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickDateChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  datePickerTrigger: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.pastelBlue,
  },
  datePickerTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  selectedDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  dateBoxIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateTextCol: {
    flex: 1,
  },
  selectedDateMain: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedDateISO: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  datePickerContainer: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iosClosePickerBtn: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: COLORS.ink,
    borderRadius: RADIUS.full,
  },
  iosClosePickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  charCounterText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  noteTextInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 15,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
