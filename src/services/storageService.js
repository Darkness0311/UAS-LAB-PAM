/**
 * FINN v2.5 — Storage Service (AsyncStorage Persistence Layer)
 * Mengimplementasikan aturan Bagian 2 dan Bagian 3.3 Blueprint:
 * - Hidrasi dengan multiGet dan validasi skema mendalam (loading | ready | corrupt).
 * - Pemakaian pertama (kedua key null) diinisialisasi dengan multiSet.
 * - Tidak ada penulisan otomatis saat status corrupt.
 * - Pemulihan corrupt menyalin data mentah ke @finn_backup_corrupt sebelum multiSet.
 * - Mutasi 1 koleksi memakai setItem; inisialisasi & reset memakai multiSet (Write-Then-Commit).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories.js';
import { MESSAGES } from '../constants/messages.js';
import { STORAGE_KEYS } from '../constants/storageKeys.js';
import { validateHydratedStorage } from '../models/schemaValidator.js';

/**
 * Membentuk string dump mentah yang informatif untuk penyelamatan data saat status corrupt.
 * @param {string | null} rawCategories
 * @param {string | null} rawTransactions
 * @param {string} reason
 * @returns {string}
 */
export function buildCorruptDumpString(
  rawCategories,
  rawTransactions,
  reason = 'UNKNOWN'
) {
  const payload = {
    dump_created_at: new Date().toISOString(),
    corrupt_reason: reason,
    raw_storage: {
      [STORAGE_KEYS.CATEGORIES]: rawCategories,
      [STORAGE_KEYS.TRANSACTIONS]: rawTransactions,
    },
  };

  try {
    return JSON.stringify(payload, null, 2);
  } catch (_err) {
    return [
      `=== FINN CORRUPT DATA DUMP ===`,
      `Reason: ${reason}`,
      `--- ${STORAGE_KEYS.CATEGORIES} ---`,
      String(rawCategories),
      `--- ${STORAGE_KEYS.TRANSACTIONS} ---`,
      String(rawTransactions),
    ].join('\n');
  }
}

/**
 * Melakukan hidrasi awal aplikasi dari AsyncStorage menggunakan multiGet.
 * Menangani:
 * 1. Pemakaian pertama (kedua key null) -> tulis 6 kategori bawaan & [] dengan multiSet.
 * 2. Data valid -> kembalikan status 'ready' beserta categories dan transactions.
 * 3. Data rusak / gagal baca -> kembalikan status 'corrupt' beserta teks mentah tanpa menimpa storage.
 *
 * @returns {Promise<{
 *   status: 'ready' | 'corrupt',
 *   categories: Array<object>,
 *   transactions: Array<object>,
 *   rawCorruptDump: string | null,
 *   corruptReason: string | null
 * }>}
 */
export async function hydrateStorageData() {
  let rawCategories = null;
  let rawTransactions = null;

  try {
    const pairs = await AsyncStorage.multiGet([
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.TRANSACTIONS,
    ]);

    const catPair = pairs.find((pair) => pair[0] === STORAGE_KEYS.CATEGORIES);
    const txPair = pairs.find((pair) => pair[0] === STORAGE_KEYS.TRANSACTIONS);

    rawCategories = catPair ? catPair[1] : null;
    rawTransactions = txPair ? txPair[1] : null;
  } catch (readError) {
    const dumpStr = buildCorruptDumpString(
      null,
      null,
      `ASYNC_STORAGE_READ_ERROR: ${readError?.message || 'Unknown error'}`
    );
    return {
      status: 'corrupt',
      categories: [],
      transactions: [],
      rawCorruptDump: dumpStr,
      corruptReason: 'ASYNC_STORAGE_READ_ERROR',
    };
  }

  const validation = validateHydratedStorage(rawCategories, rawTransactions);

  // Pemakaian pertama: kedua key masih null -> tulis kondisi awal dengan multiSet
  if (validation.status === 'first_launch') {
    const initialCategories = DEFAULT_CATEGORIES.map((cat) => ({ ...cat }));
    const initialTransactions = [];

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories)],
        [STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions)],
      ]);

      return {
        status: 'ready',
        categories: initialCategories,
        transactions: initialTransactions,
        rawCorruptDump: null,
        corruptReason: null,
      };
    } catch (initWriteError) {
      const dumpStr = buildCorruptDumpString(
        rawCategories,
        rawTransactions,
        `FIRST_LAUNCH_WRITE_ERROR: ${initWriteError?.message || 'Unknown error'}`
      );
      return {
        status: 'corrupt',
        categories: [],
        transactions: [],
        rawCorruptDump: dumpStr,
        corruptReason: 'FIRST_LAUNCH_WRITE_ERROR',
      };
    }
  }

  // Data tidak valid / corrupt: JANGAN menulis apa pun ke storage
  if (validation.status === 'corrupt') {
    const dumpStr = buildCorruptDumpString(
      rawCategories,
      rawTransactions,
      validation.reason || 'SCHEMA_VALIDATION_FAILED'
    );
    return {
      status: 'corrupt',
      categories: [],
      transactions: [],
      rawCorruptDump: dumpStr,
      corruptReason: validation.reason,
    };
  }

  // Status ready
  return {
    status: 'ready',
    categories: validation.categories,
    transactions: validation.transactions,
    rawCorruptDump: null,
    corruptReason: null,
  };
}

/**
 * Menyimpan koleksi transaksi ke AsyncStorage memakai setItem (mutasi 1 koleksi).
 * Dipakai dalam pola Write-Then-Commit: UI hanya diperbarui bila fungsi ini mengembalikan { ok: true }.
 *
 * @param {Array<object>} nextTransactions
 * @returns {Promise<{ ok: boolean, error: string | null }>}
 */
export async function commitTransactionsToStorage(nextTransactions) {
  try {
    const serialized = JSON.stringify(nextTransactions);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, serialized);
    return { ok: true, error: null };
  } catch (_writeError) {
    return {
      ok: false,
      error: MESSAGES.SAVE_ERROR,
    };
  }
}

/**
 * Menyimpan koleksi kategori ke AsyncStorage memakai setItem (mutasi 1 koleksi).
 * Dipakai dalam pola Write-Then-Commit: UI hanya diperbarui bila fungsi ini mengembalikan { ok: true }.
 *
 * @param {Array<object>} nextCategories
 * @returns {Promise<{ ok: boolean, error: string | null }>}
 */
export async function commitCategoriesToStorage(nextCategories) {
  try {
    const serialized = JSON.stringify(nextCategories);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, serialized);
    return { ok: true, error: null };
  } catch (_writeError) {
    return {
      ok: false,
      error: MESSAGES.SAVE_ERROR,
    };
  }
}

/**
 * Mereset seluruh data (kategori kembali ke 6 bawaan & transaksi menjadi [])
 * menggunakan multiSet sesuai Bagian 3.3 & Bagian 4 Modul 5.
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   categories: Array<object> | null,
 *   transactions: Array<object> | null,
 *   error: string | null
 * }>}
 */
export async function resetAllStorageData() {
  const defaultCategoriesCopy = DEFAULT_CATEGORIES.map((cat) => ({ ...cat }));
  const emptyTransactions = [];

  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategoriesCopy)],
      [STORAGE_KEYS.TRANSACTIONS, JSON.stringify(emptyTransactions)],
    ]);

    return {
      ok: true,
      categories: defaultCategoriesCopy,
      transactions: emptyTransactions,
      error: null,
    };
  } catch (_resetError) {
    return {
      ok: false,
      categories: null,
      transactions: null,
      error: MESSAGES.SAVE_ERROR,
    };
  }
}

/**
 * Menjalankan aksi "Mulai dari awal" dari layar Corrupt Data sesuai Bagian 3.3:
 * 1. Menyalin teks mentah ke @finn_backup_corrupt terlebih dahulu.
 * 2. Mengganti @finn_categories dan @finn_transactions ke kondisi awal menggunakan multiSet.
 *
 * @param {string | null} rawCorruptDump Teks mentah yang sudah ditangkap saat hidrasi
 * @returns {Promise<{
 *   ok: boolean,
 *   categories: Array<object> | null,
 *   transactions: Array<object> | null,
 *   error: string | null
 * }>}
 */
export async function backupAndResetCorruptStorage(rawCorruptDump) {
  try {
    let dumpToBackup = rawCorruptDump;

    // Jika karena suatu hal dumpToBackup kosong, baca ulang isi mentah dari storage sebelum menimpa
    if (!dumpToBackup) {
      const pairs = await AsyncStorage.multiGet([
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.TRANSACTIONS,
      ]);
      const rawCat = pairs[0] ? pairs[0][1] : null;
      const rawTx = pairs[1] ? pairs[1][1] : null;
      dumpToBackup = buildCorruptDumpString(
        rawCat,
        rawTx,
        'MANUAL_CORRUPT_RESET_BACKUP'
      );
    }

    // Langkah 1: Salin data mentah ke @finn_backup_corrupt
    await AsyncStorage.setItem(STORAGE_KEYS.BACKUP_CORRUPT, dumpToBackup);

    // Langkah 2: Reset kedua koleksi utama menggunakan multiSet
    const defaultCategoriesCopy = DEFAULT_CATEGORIES.map((cat) => ({ ...cat }));
    const emptyTransactions = [];

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategoriesCopy)],
      [STORAGE_KEYS.TRANSACTIONS, JSON.stringify(emptyTransactions)],
    ]);

    return {
      ok: true,
      categories: defaultCategoriesCopy,
      transactions: emptyTransactions,
      error: null,
    };
  } catch (_error) {
    return {
      ok: false,
      categories: null,
      transactions: null,
      error: MESSAGES.SAVE_ERROR,
    };
  }
}
