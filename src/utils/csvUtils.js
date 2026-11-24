/**
 * FINN v2.5 — CSV Export Pure Utilities (RFC 4180 + CSV Injection Guard)
 * Mengimplementasikan aturan Bagian 4 Modul 5 Blueprint.
 */

import {
  resolveCategory,
  sortTransactionsForExport,
} from '../models/schemaValidator.js';

const CSV_FORMULA_PREFIX_REGEX = /^[=+\-@]/;
const CSV_NEEDS_QUOTES_REGEX = /[,"\r\n]/;

/**
 * Menghasilkan nama file ekspor CSV sesuai Bagian 4 Modul 5:
 * finn_transaksi_YYYY-MM-DD.csv (menggunakan T0).
 * @param {string} todayISO YYYY-MM-DD (T0)
 * @returns {string}
 */
export function getExportCsvFileName(todayISO) {
  return `finn_transaksi_${todayISO}.csv`;
}

/**
 * Menyanitasi sel CSV terhadap CSV Formula Injection & menerapkan aturan kutip RFC 4180:
 * 1. Bila applyFormulaGuard = true dan string diawali '=', '+', '-', atau '@',
 *    tambahkan awalan tanda petik tunggal ("'") agar tidak dieksekusi sebagai rumus di spreadsheet.
 * 2. Bila field memuat koma (,), kutip ganda ("), atau baris baru (\r, \n),
 *    gandakan kutip ganda di dalamnya (""), lalu bungkus seluruh field dengan kutip ganda ("...").
 *
 * @param {string | number} rawValue
 * @param {boolean} [applyFormulaGuard=false]
 * @returns {string}
 */
export function formatCsvField(rawValue, applyFormulaGuard = false) {
  if (rawValue === null || rawValue === undefined) {
    return '';
  }

  let cellText = String(rawValue);

  if (applyFormulaGuard && CSV_FORMULA_PREFIX_REGEX.test(cellText)) {
    cellText = `'${cellText}`;
  }

  if (CSV_NEEDS_QUOTES_REGEX.test(cellText)) {
    const escapedQuotes = cellText.replace(/"/g, '""');
    return `"${escapedQuotes}"`;
  }

  return cellText;
}

/**
 * Menyusun konten string CSV utuh dari seluruh transaksi dan daftar kategori:
 * - Diurutkan transaction_date ASC, lalu created_at ASC, lalu id ASC.
 * - Header: tanggal,kategori,nominal,catatan
 * - Kategori: menggunakan nama kategori saat ini, atau "Tanpa Kategori" bila orphan.
 * - Catatan: dilindungi CSV injection guard + RFC 4180 quoting.
 *
 * @param {Array<object>} transactions
 * @param {Array<object>} categories
 * @returns {string}
 */
export function buildTransactionsCsv(transactions, categories) {
  const sortedTransactions = sortTransactionsForExport(transactions);
  const headerLine = 'tanggal,kategori,nominal,catatan';
  const rows = [headerLine];

  for (let i = 0; i < sortedTransactions.length; i += 1) {
    const tx = sortedTransactions[i];
    const resolvedCat = resolveCategory(tx.category_id, categories);

    const colTanggal = formatCsvField(tx.transaction_date, false);
    const colKategori = formatCsvField(resolvedCat.name, true);
    const colNominal = formatCsvField(tx.amount, false);
    const colCatatan = formatCsvField(tx.note || '', true);

    rows.push(`${colTanggal},${colKategori},${colNominal},${colCatatan}`);
  }

  return rows.join('\n');
}
