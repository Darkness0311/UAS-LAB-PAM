/**
 * FINN v2.5 — Schema Validator, Null-Safe Category Lookup & Entity ID Factories
 * Mengimplementasikan aturan Bagian 3.3 (Validasi Skema Hidrasi), Bagian 4 Modul 3 (Lookup Null-Safe),
 * dan Bagian 5 (Skema Data Lokal).
 */

import {
  DEFAULT_CATEGORY_IDS,
  DOMAIN_LIMITS,
  ORPHAN_CATEGORY,
} from '../constants/defaultCategories.js';
import { isValidISODateString } from '../utils/dateUtils.js';

const ISO_DATE_STRICT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Menghasilkan string acak alfanumerik sepanjang length karakter.
 * @param {number} length
 * @returns {string}
 */
function randomAlphaNumeric(length = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars.charAt(idx);
  }
  return result;
}

/**
 * Menghasilkan ID unik untuk kategori kustom sesuai Bagian 5:
 * "cat_custom_" + Date.now() + "_" + random4
 * @returns {string}
 */
export function generateCustomCategoryId() {
  return `cat_custom_${Date.now()}_${randomAlphaNumeric(4)}`;
}

/**
 * Menghasilkan ID unik untuk transaksi sesuai Bagian 5:
 * "tx_" + Date.now() + "_" + randomString
 * @returns {string}
 */
export function generateTransactionId() {
  return `tx_${Date.now()}_${randomAlphaNumeric(6)}`;
}

/**
 * Memvalidasi satu objek kategori sesuai Bagian 3.3 poin 3:
 * wajib memiliki id (string), name (string tak kosong), color (string), icon (string).
 * @param {unknown} item
 * @returns {boolean}
 */
export function isValidCategoryObject(item) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return false;
  }

  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    return false;
  }

  if (typeof item.name !== 'string' || item.name.trim().length === 0) {
    return false;
  }

  if (typeof item.color !== 'string' || item.color.trim().length === 0) {
    return false;
  }

  if (typeof item.icon !== 'string' || item.icon.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Memvalidasi satu objek transaksi sesuai Bagian 3.3 poin 4:
 * - Objek valid
 * - id: string tak kosong
 * - amount: integer (1..999999999)
 * - category_id: string tak kosong
 * - transaction_date: sesuai /^\d{4}-\d{2}-\d{2}$/ dan tanggal kalender valid
 * - created_at: angka finite
 * @param {unknown} item
 * @returns {boolean}
 */
export function isValidTransactionObject(item) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return false;
  }

  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    return false;
  }

  if (
    typeof item.amount !== 'number' ||
    !Number.isInteger(item.amount) ||
    item.amount < DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT ||
    item.amount > DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT
  ) {
    return false;
  }

  if (
    typeof item.category_id !== 'string' ||
    item.category_id.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof item.transaction_date !== 'string' ||
    !ISO_DATE_STRICT_REGEX.test(item.transaction_date) ||
    !isValidISODateString(item.transaction_date)
  ) {
    return false;
  }

  if (typeof item.created_at !== 'number' || !Number.isFinite(item.created_at)) {
    return false;
  }

  if (item.note !== undefined && typeof item.note !== 'string') {
    return false;
  }

  return true;
}

/**
 * Memvalidasi payload mentah dari multiGet AsyncStorage sesuai seluruh aturan Bagian 3.3.
 * @param {string | null} rawCategoriesString
 * @param {string | null} rawTransactionsString
 * @returns {{
 *   status: 'first_launch' | 'ready' | 'corrupt',
 *   categories: Array<object> | null,
 *   transactions: Array<object> | null,
 *   reason: string | null
 * }}
 */
export function validateHydratedStorage(
  rawCategoriesString,
  rawTransactionsString
) {
  // Kondisi Pemakaian Pertama: kedua key kosong (null)
  if (rawCategoriesString === null && rawTransactionsString === null) {
    return {
      status: 'first_launch',
      categories: null,
      transactions: null,
      reason: null,
    };
  }

  // Kondisi Corrupt #1: salah satu key null sedangkan key lainnya berisi data
  if (rawCategoriesString === null || rawTransactionsString === null) {
    return {
      status: 'corrupt',
      categories: null,
      transactions: null,
      reason: 'PARTIAL_STORAGE_KEYS',
    };
  }

  let parsedCategories;
  let parsedTransactions;

  // Kondisi Corrupt #2: gagal JSON.parse atau hasil parse bukan Array
  try {
    parsedCategories = JSON.parse(rawCategoriesString);
    parsedTransactions = JSON.parse(rawTransactionsString);
  } catch (parseError) {
    return {
      status: 'corrupt',
      categories: null,
      transactions: null,
      reason: 'JSON_PARSE_FAILED',
    };
  }

  if (!Array.isArray(parsedCategories) || !Array.isArray(parsedTransactions)) {
    return {
      status: 'corrupt',
      categories: null,
      transactions: null,
      reason: 'ROOT_NOT_ARRAY',
    };
  }

  // Kondisi Corrupt #3: validasi setiap item kategori & keberadaan 6 ID kategori bawaan
  const categoryIdSet = new Set();
  const normalizedCategories = [];

  for (let i = 0; i < parsedCategories.length; i += 1) {
    const cat = parsedCategories[i];
    if (!isValidCategoryObject(cat)) {
      return {
        status: 'corrupt',
        categories: null,
        transactions: null,
        reason: `INVALID_CATEGORY_AT_INDEX_${i}`,
      };
    }

    if (categoryIdSet.has(cat.id)) {
      return {
        status: 'corrupt',
        categories: null,
        transactions: null,
        reason: `DUPLICATE_CATEGORY_ID_${cat.id}`,
      };
    }

    categoryIdSet.add(cat.id);
    normalizedCategories.push({
      id: cat.id,
      name: cat.name.trim(),
      color: cat.color,
      icon: cat.icon,
      is_default: DEFAULT_CATEGORY_IDS.includes(cat.id)
        ? true
        : Boolean(cat.is_default),
    });
  }

  for (let i = 0; i < DEFAULT_CATEGORY_IDS.length; i += 1) {
    const requiredDefaultId = DEFAULT_CATEGORY_IDS[i];
    if (!categoryIdSet.has(requiredDefaultId)) {
      return {
        status: 'corrupt',
        categories: null,
        transactions: null,
        reason: `MISSING_DEFAULT_CATEGORY_${requiredDefaultId}`,
      };
    }
  }

  // Kondisi Corrupt #4: validasi setiap item transaksi
  const txIdSet = new Set();
  const normalizedTransactions = [];

  for (let i = 0; i < parsedTransactions.length; i += 1) {
    const tx = parsedTransactions[i];
    if (!isValidTransactionObject(tx)) {
      return {
        status: 'corrupt',
        categories: null,
        transactions: null,
        reason: `INVALID_TRANSACTION_AT_INDEX_${i}`,
      };
    }

    if (txIdSet.has(tx.id)) {
      return {
        status: 'corrupt',
        categories: null,
        transactions: null,
        reason: `DUPLICATE_TRANSACTION_ID_${tx.id}`,
      };
    }

    txIdSet.add(tx.id);
    normalizedTransactions.push({
      id: tx.id,
      amount: tx.amount,
      category_id: tx.category_id,
      transaction_date: tx.transaction_date,
      note: typeof tx.note === 'string' ? tx.note.replace(/[\r\n]+/g, ' ').trim() : '',
      created_at: tx.created_at,
    });
  }

  return {
    status: 'ready',
    categories: normalizedCategories,
    transactions: normalizedTransactions,
    reason: null,
  };
}

/**
 * Pencarian kategori secara Null-Safe sesuai Bagian 4 Modul 3:
 * Bila category_id tidak ditemukan di array categories, kembalikan fallback ORPHAN_CATEGORY
 * ({ id: 'orphan', name: 'Tanpa Kategori', color: '#94A3B8', icon: 'help-circle-outline' })
 * agar baris transaksi, diagram donut, peringkat, dan ekspor CSV tidak pernah crash.
 *
 * @param {string} categoryId
 * @param {Array<{ id: string, name: string, color: string, icon: string, is_default?: boolean }>} categories
 * @returns {{ id: string, name: string, color: string, icon: string, is_default: boolean }}
 */
export function resolveCategory(categoryId, categories) {
  if (!Array.isArray(categories) || !categoryId) {
    return ORPHAN_CATEGORY;
  }
  const found = categories.find((cat) => cat.id === categoryId);
  return found || ORPHAN_CATEGORY;
}

/**
 * Mengurutkan daftar transaksi untuk tampilan Riwayat (Bagian 4 Modul 2):
 * transaction_date DESC, lalu created_at DESC, lalu id DESC.
 * @param {Array<object>} transactions
 * @returns {Array<object>} Salinan array terurut
 */
export function sortTransactionsForHistory(transactions) {
  if (!Array.isArray(transactions)) {
    return [];
  }
  return [...transactions].sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date > b.transaction_date ? -1 : 1;
    }
    if (a.created_at !== b.created_at) {
      return b.created_at - a.created_at;
    }
    if (a.id !== b.id) {
      return a.id > b.id ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Mengurutkan daftar transaksi untuk Ekspor CSV (Bagian 4 Modul 5):
 * transaction_date ASC, lalu created_at ASC, lalu id ASC.
 * @param {Array<object>} transactions
 * @returns {Array<object>} Salinan array terurut
 */
export function sortTransactionsForExport(transactions) {
  if (!Array.isArray(transactions)) {
    return [];
  }
  return [...transactions].sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return a.transaction_date < b.transaction_date ? -1 : 1;
    }
    if (a.created_at !== b.created_at) {
      return a.created_at - b.created_at;
    }
    if (a.id !== b.id) {
      return a.id < b.id ? -1 : 1;
    }
    return 0;
  });
}
