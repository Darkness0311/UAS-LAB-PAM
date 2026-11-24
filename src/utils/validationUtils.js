/**
 * FINN v2.5 — Form & Input Validation Pure Utilities
 * Mengimplementasikan aturan validasi Bagian 4 (Modul 2 & Modul 3) dan pesan Bagian 8 Blueprint.
 */

import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_ICON_LIST,
  DEFAULT_CUSTOM_CATEGORY_COLOR,
  DEFAULT_CUSTOM_CATEGORY_ICON,
  DOMAIN_LIMITS,
  RESERVED_CATEGORY_NAMES_LOWER,
} from '../constants/defaultCategories.js';
import { MESSAGES } from '../constants/messages.js';
import { parseAmountInput } from './amountUtils.js';
import { isValidISODateString } from './dateUtils.js';

/**
 * Menyanitasi catatan saat diketik di TextInput:
 * - Mengganti baris baru (\r, \n) dengan spasi
 * - Membatasi panjang maksimal 100 karakter
 * @param {string} rawNote
 * @returns {string}
 */
export function sanitizeNoteOnChange(rawNote = '') {
  if (typeof rawNote !== 'string') {
    return '';
  }
  const withoutNewlines = rawNote.replace(/[\r\n]+/g, ' ');
  if (withoutNewlines.length > DOMAIN_LIMITS.MAX_NOTE_LENGTH) {
    return withoutNewlines.slice(0, DOMAIN_LIMITS.MAX_NOTE_LENGTH);
  }
  return withoutNewlines;
}

/**
 * Menyanitasi catatan saat disimpan (.trim() + tanpa baris baru + maks 100 karakter).
 * @param {string} rawNote
 * @returns {string}
 */
export function sanitizeNoteOnSubmit(rawNote = '') {
  return sanitizeNoteOnChange(rawNote).trim();
}

/**
 * Memvalidasi field Nominal saja (digunakan saat blur maupun saat Simpan).
 * @param {string} amountInput
 * @returns {{ isValid: boolean, error: string | null, parsedAmount: number | null, normalizedString: string }}
 */
export function validateAmountField(amountInput) {
  const trimmed = typeof amountInput === 'string' ? amountInput.trim() : '';
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.AMOUNT_REQUIRED,
      parsedAmount: null,
      normalizedString: '',
    };
  }

  const parsed = parseAmountInput(trimmed);
  if (parsed.isEmpty || parsed.value === null) {
    return {
      isValid: false,
      error: MESSAGES.AMOUNT_REQUIRED,
      parsedAmount: null,
      normalizedString: '',
    };
  }

  if (parsed.value < DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT) {
    return {
      isValid: false,
      error: MESSAGES.AMOUNT_MIN,
      parsedAmount: parsed.value,
      normalizedString: parsed.normalizedString,
    };
  }

  if (parsed.value > DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT) {
    return {
      isValid: false,
      error: MESSAGES.AMOUNT_MAX,
      parsedAmount: parsed.value,
      normalizedString: parsed.normalizedString,
    };
  }

  return {
    isValid: true,
    error: null,
    parsedAmount: parsed.value,
    normalizedString: parsed.normalizedString,
  };
}

/**
 * Menghitung batas tanggal maksimum yang diizinkan pada form transaksi sesuai Bagian 4 Modul 2:
 * - Mode Tambah: maximumDate = T0 (todayISO)
 * - Mode Edit: maximumDate = max(T0, original_transaction_date) agar transaksi yang tercatat
 *   di zona waktu lebih maju tetap dapat diedit tanpa crash.
 * @param {string} todayISO T0
 * @param {string | null} [originalDateISO=null]
 * @returns {string} YYYY-MM-DD
 */
export function getMaxAllowedTransactionDate(todayISO, originalDateISO = null) {
  if (
    originalDateISO &&
    isValidISODateString(originalDateISO) &&
    originalDateISO > todayISO
  ) {
    return originalDateISO;
  }
  return todayISO;
}

/**
 * Memvalidasi field Tanggal transaksi terhadap batas maksimum max(T0, original_transaction_date).
 * @param {string} dateISO
 * @param {string} todayISO T0 (dibaca ulang saat Simpan)
 * @param {string | null} [originalDateISO=null]
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateTransactionDateField(
  dateISO,
  todayISO,
  originalDateISO = null
) {
  if (!isValidISODateString(dateISO)) {
    return {
      isValid: false,
      error: MESSAGES.DATE_FUTURE,
    };
  }

  const maxAllowedISO = getMaxAllowedTransactionDate(todayISO, originalDateISO);
  if (dateISO > maxAllowedISO) {
    return {
      isValid: false,
      error: MESSAGES.DATE_FUTURE,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Memvalidasi keseluruhan form Tambah/Edit Transaksi saat tombol Simpan ditekan.
 * @param {{
 *   amountInput: string,
 *   dateISO: string,
 *   todayISO: string,
 *   originalDateISO?: string | null,
 *   noteInput?: string
 * }} payload
 * @returns {{
 *   isValid: boolean,
 *   errors: { amount: string | null, date: string | null },
 *   parsedAmount: number | null,
 *   normalizedAmountString: string,
 *   sanitizedNote: string
 * }}
 */
export function validateTransactionForm({
  amountInput,
  dateISO,
  todayISO,
  originalDateISO = null,
  noteInput = '',
}) {
  const amountResult = validateAmountField(amountInput);
  const dateResult = validateTransactionDateField(
    dateISO,
    todayISO,
    originalDateISO
  );
  const sanitizedNote = sanitizeNoteOnSubmit(noteInput);

  return {
    isValid: amountResult.isValid && dateResult.isValid,
    errors: {
      amount: amountResult.error,
      date: dateResult.error,
    },
    parsedAmount: amountResult.parsedAmount,
    normalizedAmountString: amountResult.normalizedString,
    sanitizedNote,
  };
}

/**
 * Memeriksa apakah form modal transaksi memiliki perubahan yang belum disimpan (Dirty Check)
 * sesuai aturan Bagian 4 Modul 2:
 * amountInput !== initialAmountInput ||
 * selectedCatId !== initialCatId ||
 * dateISO !== initialDateISO ||
 * noteInput.trim() !== initialNoteInput
 * (Perbandingan tanggal wajib berupa string YYYY-MM-DD, bukan referensi objek Date).
 *
 * @param {{
 *   amountInput: string,
 *   selectedCatId: string,
 *   dateISO: string,
 *   noteInput: string,
 *   initialAmountInput: string,
 *   initialCatId: string,
 *   initialDateISO: string,
 *   initialNoteInput: string
 * }} state
 * @returns {boolean}
 */
export function isTransactionFormDirty({
  amountInput,
  selectedCatId,
  dateISO,
  noteInput,
  initialAmountInput,
  initialCatId,
  initialDateISO,
  initialNoteInput,
}) {
  const cleanCurrentNote =
    typeof noteInput === 'string' ? sanitizeNoteOnSubmit(noteInput) : '';
  const cleanInitialNote =
    typeof initialNoteInput === 'string'
      ? sanitizeNoteOnSubmit(initialNoteInput)
      : '';

  return (
    String(amountInput) !== String(initialAmountInput) ||
    String(selectedCatId) !== String(initialCatId) ||
    String(dateISO) !== String(initialDateISO) ||
    cleanCurrentNote !== cleanInitialNote
  );
}

/**
 * Memvalidasi nama & atribut kategori kustom sesuai Bagian 4 Modul 3 & Bagian 8:
 * - Wajib diisi setelah .trim()
 * - Panjang 1–24 karakter
 * - Tidak boleh "Semua" maupun "Tanpa Kategori" (case-insensitive)
 * - Unik case-insensitive terhadap kategori lain (bawaan maupun kustom; kategori yang sedang diedit dikecualikan)
 * - Saat tambah baru (editingCategoryId === null), periksa batas 15 kategori kustom.
 *
 * @param {{
 *   nameInput: string,
 *   color?: string,
 *   icon?: string,
 *   existingCategories: Array<{ id: string, name: string, is_default?: boolean }>,
 *   editingCategoryId?: string | null
 * }} params
 * @returns {{
 *   isValid: boolean,
 *   error: string | null,
 *   trimmedName: string,
 *   safeColor: string,
 *   safeIcon: string
 * }}
 */
export function validateCategoryForm({
  nameInput,
  color = DEFAULT_CUSTOM_CATEGORY_COLOR,
  icon = DEFAULT_CUSTOM_CATEGORY_ICON,
  existingCategories = [],
  editingCategoryId = null,
}) {
  const trimmedName =
    typeof nameInput === 'string'
      ? nameInput.replace(/[\r\n]+/g, ' ').trim()
      : '';

  const safeColor = CATEGORY_COLOR_PALETTE.includes(color)
    ? color
    : DEFAULT_CUSTOM_CATEGORY_COLOR;
  const safeIcon = CATEGORY_ICON_LIST.includes(icon)
    ? icon
    : DEFAULT_CUSTOM_CATEGORY_ICON;

  // Cek batas 15 kategori kustom hanya saat menambah kategori baru
  if (!editingCategoryId) {
    const customCount = existingCategories.filter(
      (cat) => !cat.is_default
    ).length;
    if (customCount >= DOMAIN_LIMITS.MAX_CUSTOM_CATEGORIES) {
      return {
        isValid: false,
        error: MESSAGES.CATEGORY_LIMIT_REACHED,
        trimmedName,
        safeColor,
        safeIcon,
      };
    }
  }

  if (trimmedName.length < DOMAIN_LIMITS.MIN_CATEGORY_NAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.CATEGORY_NAME_REQUIRED,
      trimmedName,
      safeColor,
      safeIcon,
    };
  }

  if (trimmedName.length > DOMAIN_LIMITS.MAX_CATEGORY_NAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.CATEGORY_NAME_MAX_LENGTH,
      trimmedName,
      safeColor,
      safeIcon,
    };
  }

  const lowerName = trimmedName.toLowerCase();

  if (RESERVED_CATEGORY_NAMES_LOWER.includes(lowerName)) {
    return {
      isValid: false,
      error: MESSAGES.CATEGORY_NAME_RESERVED,
      trimmedName,
      safeColor,
      safeIcon,
    };
  }

  const isDuplicate = existingCategories.some(
    (cat) =>
      cat.id !== editingCategoryId &&
      typeof cat.name === 'string' &&
      cat.name.trim().toLowerCase() === lowerName
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: MESSAGES.CATEGORY_NAME_DUPLICATE,
      trimmedName,
      safeColor,
      safeIcon,
    };
  }

  return {
    isValid: true,
    error: null,
    trimmedName,
    safeColor,
    safeIcon,
  };
}
