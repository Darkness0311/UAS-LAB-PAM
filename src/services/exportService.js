/**
 * FINN v2.5 — Export Service (CSV Export & Corrupt Raw Dump Sharing)
 * Mengimplementasikan aturan Bagian 2, Bagian 3.3 (Ekspor data mentah corrupt),
 * dan Bagian 4 Modul 5 (Ekspor CSV RFC 4180 + injection guard).
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { MESSAGES } from '../constants/messages.js';
import {
  buildTransactionsCsv,
  getExportCsvFileName,
} from '../utils/csvUtils.js';

const CORRUPT_DUMP_FILENAME = 'finn_corrupt_dump.txt';

/**
 * Helper internal untuk memastikan base directory diakhiri dengan slash '/'.
 * @param {string | null | undefined} baseDir
 * @returns {string | null}
 */
function normalizeDirectoryUri(baseDir) {
  if (typeof baseDir !== 'string' || baseDir.trim().length === 0) {
    return null;
  }
  return baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
}

/**
 * Mengekspor seluruh transaksi menjadi file finn_transaksi_YYYY-MM-DD.csv
 * di FileSystem.cacheDirectory dengan encoding UTF-8 lalu membuka share sheet.
 * Memiliki fallback otomatis ke Share.share bawaan React Native bila file system/sharing terkendala.
 *
 * @param {{
 *   transactions: Array<object>,
 *   categories: Array<object>,
 *   todayISO: string
 * }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   isEmpty: boolean,
 *   fileName: string | null,
 *   message: string | null
 * }>}
 */
export async function exportTransactionsCsvFile({
  transactions,
  categories,
  todayISO,
}) {
  // Tanpa data -> pesan "Belum ada data untuk diekspor."
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      ok: false,
      isEmpty: true,
      fileName: null,
      message: MESSAGES.EXPORT_EMPTY,
    };
  }

  const fileName = getExportCsvFileName(todayISO);
  let csvContent = '';

  try {
    csvContent = buildTransactionsCsv(transactions, categories);
  } catch (_buildErr) {
    return {
      ok: false,
      isEmpty: false,
      fileName,
      message: MESSAGES.EXPORT_ERROR,
    };
  }

  const cacheDir = normalizeDirectoryUri(FileSystem.cacheDirectory);

  // Jalur Utama: Tulis ke FileSystem.cacheDirectory + Sharing.shareAsync
  if (cacheDir) {
    try {
      const fileUri = `${cacheDir}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: fileName,
          UTI: 'public.comma-separated-values-text',
        });

        return {
          ok: true,
          isEmpty: false,
          fileName,
          message: null,
        };
      }
    } catch (_fileShareError) {
      // Lanjut ke fallback Share.share bawaan React Native di bawah
    }
  }

  // Jalur Fallback: Share.share bawaan React Native
  try {
    await Share.share({
      title: fileName,
      message: csvContent,
    });

    return {
      ok: true,
      isEmpty: false,
      fileName,
      message: null,
    };
  } catch (_fallbackError) {
    return {
      ok: false,
      isEmpty: false,
      fileName,
      message: MESSAGES.EXPORT_ERROR,
    };
  }
}

/**
 * Mengekspor data mentah saat status corrupt ke file sementara finn_corrupt_dump.txt
 * di FileSystem.cacheDirectory lalu membagikannya lewat Sharing.shareAsync,
 * dengan fallback Share.share({ message }) bawaan React Native bila gagal menulis file (Bagian 3.3).
 *
 * @param {string} rawCorruptDump
 * @returns {Promise<{ ok: boolean, message: string | null }>}
 */
export async function exportCorruptDumpFile(rawCorruptDump) {
  const safeContent =
    typeof rawCorruptDump === 'string' && rawCorruptDump.length > 0
      ? rawCorruptDump
      : 'Tidak ada muatan data mentah yang dapat diekstrak.';

  const cacheDir = normalizeDirectoryUri(FileSystem.cacheDirectory);

  if (cacheDir) {
    try {
      const fileUri = `${cacheDir}${CORRUPT_DUMP_FILENAME}`;
      await FileSystem.writeAsStringAsync(fileUri, safeContent, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: CORRUPT_DUMP_FILENAME,
          UTI: 'public.plain-text',
        });

        return { ok: true, message: null };
      }
    } catch (_fileError) {
      // Lanjut ke fallback Share.share bawaan React Native
    }
  }

  try {
    await Share.share({
      title: CORRUPT_DUMP_FILENAME,
      message: safeContent,
    });
    return { ok: true, message: null };
  } catch (_shareError) {
    return {
      ok: false,
      message: MESSAGES.EXPORT_ERROR,
    };
  }
}
