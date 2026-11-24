/**
 * FINN v2.5 — Two-Step Reset All Data Modal (Modul 5: Data — Ekspor & Reset)
 * Visual Redesign: Light-Mode Fintech Flat Confirmation Modal (#FFFFFF, rounded-[32px], pill actions).
 * Seluruh alur 2 langkah, ketik "RESET" case-sensitive, props, state, dan handler 100% tetap sama.
 */

import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MESSAGES } from '../../constants/messages.js';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';

export default function ResetDataModal({
  visible,
  isBusy,
  transactionCount,
  onClose,
  onPressExportFirst,
  onConfirmReset,
}) {
  // step 1 = Peringatan Awal, step 2 = Input Ketik "RESET"
  const [step, setStep] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setKeywordInput('');
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  // Case-sensitive: wajib persis "RESET"
  const isKeywordMatched = keywordInput === MESSAGES.RESET_CONFIRM_KEYWORD;

  const handleClose = () => {
    if (isBusy) {
      return;
    }
    Keyboard.dismiss();
    onClose();
  };

  const handleConfirmFinal = () => {
    if (isBusy || !isKeywordMatched) {
      return;
    }
    Keyboard.dismiss();
    onConfirmReset();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Badge Ikon Peringatan Bulat */}
            <View style={styles.warningIconBadge}>
              <Ionicons
                name={
                  step === 1
                    ? 'warning-outline'
                    : 'Flame-outline' in Ionicons.glyphMap
                      ? 'flame-outline'
                      : 'trash-outline'
                }
                size={28}
                color={COLORS.negative}
              />
            </View>

            {/* Indikator 2 Langkah Flat */}
            <View style={styles.stepBarRow}>
              <View style={[styles.stepBarSegment, styles.stepBarActive]} />
              <View
                style={[
                  styles.stepBarSegment,
                  step === 2 && styles.stepBarActive,
                ]}
              />
            </View>

            <Text style={styles.stepIndicator}>
              Langkah {step} dari 2 • Tindakan permanen
            </Text>

            <Text style={styles.title}>{MESSAGES.RESET_WARNING_TITLE}</Text>

            {step === 1 ? (
              <>
                <Text style={styles.description}>
                  {MESSAGES.RESET_WARNING_STEP_1}
                </Text>

                {transactionCount > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    disabled={isBusy}
                    style={[
                      styles.exportShortcutBtn,
                      isBusy && styles.disabledBtn,
                    ]}
                    onPress={onPressExportFirst}
                  >
                    <Ionicons
                      name="download-outline"
                      size={17}
                      color={COLORS.ink}
                    />
                    <Text style={styles.exportShortcutText}>
                      Ekspor {transactionCount} Transaksi ke CSV Dulu
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.footerRow}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={isBusy}
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isBusy}
                    style={[
                      styles.nextStepButton,
                      isBusy && styles.disabledBtn,
                    ]}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.nextStepButtonText}>Lanjutkan</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  Ketik kata{' '}
                  <Text style={styles.keywordHighlight}>
                    {MESSAGES.RESET_CONFIRM_KEYWORD}
                  </Text>{' '}
                  (huruf kapital semua) di bawah ini untuk mengonfirmasi
                  penghapusan seluruh transaksi dan kategori kustom.
                </Text>

                <TextInput
                  style={[
                    styles.keywordInput,
                    isKeywordMatched && styles.keywordInputMatched,
                  ]}
                  value={keywordInput}
                  onChangeText={setKeywordInput}
                  placeholder="Ketik RESET di sini"
                  placeholderTextColor={COLORS.disabledText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isBusy}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.footerRow}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={isBusy}
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!isKeywordMatched || isBusy}
                    style={[
                      styles.confirmDangerButton,
                      (!isKeywordMatched || isBusy) && styles.disabledBtn,
                    ]}
                    onPress={handleConfirmFinal}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={COLORS.white}
                    />
                    <Text style={styles.confirmDangerButtonText}>
                      {isBusy ? 'Mereset...' : 'Reset Semua Data'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.pillBar,
  },
  warningIconBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  stepBarRow: {
    flexDirection: 'row',
    width: 88,
    gap: 6,
    marginBottom: SPACING.sm,
  },
  stepBarSegment: {
    flex: 1,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  stepBarActive: {
    backgroundColor: COLORS.negative,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.negative,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  keywordHighlight: {
    fontWeight: '700',
    color: COLORS.negative,
  },
  exportShortcutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.pastelBlue,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  exportShortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  keywordInput: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: SPACING.lg,
  },
  keywordInputMatched: {
    borderColor: COLORS.negative,
    backgroundColor: COLORS.dangerSoft,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
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
  nextStepButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.negative,
  },
  nextStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  confirmDangerButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.negative,
  },
  confirmDangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
