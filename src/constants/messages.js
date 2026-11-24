/**
 * FINN v2.5 — Status, Error & Empty State Messages
 * Sesuai Bagian 3.3, Bagian 4, dan Bagian 8 Blueprint.
 */

export const MESSAGES = Object.freeze({
  // Empty States (Bagian 8)
  EMPTY_ALL_TRANSACTIONS: 'Belum ada pengeluaran. Ketuk + untuk mencatat.',
  emptyPeriod: (periodLabel) => `Tidak ada pengeluaran di ${periodLabel}.`,
  emptyCategoryInPeriod: (categoryName, periodLabel) =>
    `Tidak ada transaksi ${categoryName} di ${periodLabel}.`,

  // Status & Penyimpanan (Bagian 3.3 & 8)
  CORRUPT_TITLE: 'Data tidak dapat dibaca',
  CORRUPT_DESCRIPTION:
    'Format data penyimpanan lokal tidak valid atau rusak. Data Anda tidak ditimpa otomatis. Anda dapat mengekspor data mentah untuk diselamatkan, mencoba memuat ulang, atau memulai dari awal.',
  SAVE_ERROR: 'Gagal menyimpan. Perubahan tidak disimpan. Coba lagi.',
  savedOutsideFilterToast: (transactionDate) =>
    `Transaksi disimpan pada ${transactionDate}.`,

  // Validasi Form Transaksi (Bagian 4 Modul 2 & Bagian 8)
  AMOUNT_REQUIRED: 'Nominal wajib diisi.',
  AMOUNT_MIN: 'Nominal minimal Rp1.',
  AMOUNT_MAX: 'Nominal maksimal Rp999.999.999.',
  DATE_FUTURE: 'Tanggal tidak boleh melewati hari ini.',

  // Validasi Form Kategori (Bagian 4 Modul 3 & Bagian 8)
  CATEGORY_NAME_REQUIRED: 'Nama kategori wajib diisi.',
  CATEGORY_NAME_DUPLICATE: 'Nama kategori sudah dipakai.',
  CATEGORY_NAME_RESERVED: 'Nama ini tidak dapat digunakan.',
  CATEGORY_NAME_MAX_LENGTH: 'Nama kategori maksimal 24 karakter.',
  CATEGORY_LIMIT_REACHED: 'Batas 15 kategori kustom tercapai.',

  // Dialog Konfirmasi & Aksi (Bagian 4 Modul 2, 3, 5)
  DELETE_TRANSACTION_CONFIRM:
    'Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
  DISCARD_CHANGES_TITLE: 'Buang perubahan?',
  DISCARD_CHANGES_MESSAGE:
    'Perubahan yang belum disimpan pada formulir ini akan hilang.',
  renameCategoryImpact: (count) =>
    `${count} transaksi akan ikut berubah tampilannya`,
  DELETE_CATEGORY_CONFIRM: (categoryName) =>
    `Hapus kategori "${categoryName}"? Tindakan ini tidak dapat dibatalkan.`,

  // Ekspor & Reset (Bagian 4 Modul 5 & Bagian 8)
  EXPORT_EMPTY: 'Belum ada data untuk diekspor.',
  EXPORT_ERROR: 'Gagal mengekspor data.',
  RESET_WARNING_TITLE: 'Reset Semua Data?',
  RESET_WARNING_STEP_1:
    'Seluruh riwayat transaksi dan kategori kustom akan dihapus permanen. Kami sangat menyarankan Anda melakukan Ekspor CSV terlebih dahulu sebelum melanjutkan.',
  RESET_CONFIRM_KEYWORD: 'RESET',
});
