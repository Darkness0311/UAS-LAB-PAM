/**
 * FINN v2.5 — Reusable Confirmation Modal (ConfirmDialog)
 * Visual Redesign: Light-Mode Fintech Flat Card (#FFFFFF, rounded-[32px], pill buttons).
 * Seluruh props dan event handler 100% tetap sama.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme.js';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  confirmVariant = 'danger', // 'danger' | 'primary'
  disabled = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) {
    return null;
  }

  const confirmButtonBg =
    confirmVariant === 'danger' ? COLORS.negative : COLORS.ink;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!disabled && onCancel) {
          onCancel();
        }
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (!disabled && onCancel) {
            onCancel();
          }
        }}
      >
        <Pressable style={styles.dialogCard} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {Boolean(message) && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.button, styles.cancelButton]}
              disabled={disabled}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              style={[
                styles.button,
                { backgroundColor: confirmButtonBg },
                disabled && styles.disabledButton,
              ]}
              disabled={disabled}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    ...SHADOWS.pillBar,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.mint,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
