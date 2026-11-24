/**
 * FINN v2.5 — Central State Management & Business Logic Context (FinnContext)
 * Mengorkestrasi:
 * - Siklus hidup T0 (todayISO) sesuai Bagian 3.1
 * - State filter periode bersama Tab 1 & Tab 2 + clampPeriod sesuai Bagian 3.2
 * - Hidrasi, status loading/ready/corrupt, kunci tunggal isBusy, dan mutasi Write-Then-Commit sesuai Bagian 3.3
 * - Kalkulasi useMemo Beranda (Modul 1), Transaksi (Modul 2), Kategori (Modul 3), Analisis (Modul 4), Ekspor & Reset (Modul 5)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_CATEGORIES,
  DOMAIN_LIMITS,
} from '../constants/defaultCategories.js';
import { MESSAGES } from '../constants/messages.js';
import {
  generateCustomCategoryId,
  generateTransactionId,
  resolveCategory,
  sortTransactionsForHistory,
} from '../models/schemaValidator.js';
import {
  exportCorruptDumpFile,
  exportTransactionsCsvFile,
} from '../services/exportService.js';
import {
  backupAndResetCorruptStorage,
  commitCategoriesToStorage,
  commitTransactionsToStorage,
  hydrateStorageData,
  resetAllStorageData,
} from '../services/storageService.js';
import {
  formatCompactIDR,
  formatPercentage,
  formatRupiah,
} from '../utils/amountUtils.js';
import {
  createPeriodFromISODate,
  getLocalISODate,
  getMinTxDate,
  getPeriodLabel,
  getPeriodNavigationBounds,
  isDateInPeriod,
  PERIOD_MODES,
  stepPeriod,
  transitionPeriodMode,
} from '../utils/dateUtils.js';
import {
  validateCategoryForm,
  validateTransactionForm,
} from '../utils/validationUtils.js';

const FinnContext = createContext(null);

export function FinnProvider({ children }) {
  // 1. Status Hidrasi & Penyimpanan ('loading' | 'ready' | 'corrupt')
  const [appStatus, setAppStatus] = useState('loading');
  const [corruptRawDump, setCorruptRawDump] = useState(null);
  const [corruptReason, setCorruptReason] = useState(null);

  // 2. Koleksi Data Utama
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // 3. Tanggal Lokal Hari Ini (T0) — hanya diperbarui pada 4 momen eksplisit (Bagian 3.1)
  const [todayISO, setTodayISO] = useState(() => getLocalISODate());

  // 4. Kunci Mutasi Tunggal (isBusy) — dikawal state + ref sinkron untuk mencegah klik ganda
  const [isBusy, setIsBusy] = useState(false);
  const isBusyRef = useRef(false);

  const setBusyLock = useCallback((locked) => {
    isBusyRef.current = locked;
    setIsBusy(locked);
  }, []);

  // 5. State Filter Periode Bersama (Tab 1 & Tab 2) — Default: mode 'month', bulan berjalan T0
  const [periodState, setPeriodState] = useState(() =>
    createPeriodFromISODate(getLocalISODate(), PERIOD_MODES.MONTH)
  );

  // 6. State Filter & Sorotan UI Lintas Tab
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); // null = 'Semua'
  const [selectedAnalyticsCatId, setSelectedAnalyticsCatId] = useState(null);
  const [editingTxId, setEditingTxId] = useState(null);
  const [isTxModalVisible, setIsTxModalVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // 7. State Feedback Error & Toast Banner (2,5 detik)
  const [storageErrorMessage, setStorageErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, DOMAIN_LIMITS.TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const clearStorageError = useCallback(() => {
    setStorageErrorMessage(null);
  }, []);

  /**
   * Memperbarui T0 (todayISO) secara sinkron dan mengembalikan string YYYY-MM-DD terbaru.
   */
  const refreshTodayISO = useCallback(() => {
    const freshToday = getLocalISODate();
    setTodayISO(freshToday);
    return freshToday;
  }, []);

  /**
   * Hidrasi data dari AsyncStorage (dijalankan saat peluncuran aplikasi & tombol "Coba lagi" di layar corrupt).
   */
  const runHydration = useCallback(async () => {
    setAppStatus('loading');
    setStorageErrorMessage(null);

    const freshToday = getLocalISODate();
    setTodayISO(freshToday);

    const result = await hydrateStorageData();

    if (result.status === 'corrupt') {
      setCorruptRawDump(result.rawCorruptDump);
      setCorruptReason(result.corruptReason);
      setAppStatus('corrupt');
      return { ok: false, status: 'corrupt' };
    }

    setCategories(result.categories);
    setTransactions(result.transactions);
    setCorruptRawDump(null);
    setCorruptReason(null);
    setPeriodState(createPeriodFromISODate(freshToday, PERIOD_MODES.MONTH));
    setAppStatus('ready');
    return { ok: true, status: 'ready' };
  }, []);

  useEffect(() => {
    runHydration();
  }, [runHydration]);

  // ============================================================================
  // SELECTORS & KALKULASI TURUNAN (useMemo)
  // ============================================================================

  /**
   * Transaksi tertua (minTxDate <= T0). Bila belum ada transaksi atau semua > T0, bernilai T0.
   */
  const minTxDate = useMemo(
    () => getMinTxDate(transactions, todayISO),
    [transactions, todayISO]
  );

  /**
   * Label periode aktif (contoh: "Oktober 2026", "Minggu 2 • 8–14 Okt 2026", "2026", "Semua Waktu").
   */
  const periodLabel = useMemo(
    () => getPeriodLabel(periodState),
    [periodState]
  );

  /**
   * Status aktif tombol navigasi periode ‹ (canGoPrev) dan › (canGoNext).
   */
  const periodBounds = useMemo(
    () => getPeriodNavigationBounds(periodState, minTxDate, todayISO),
    [periodState, minTxDate, todayISO]
  );

  /**
   * Peta jumlah transaksi per category_id untuk Modul 3 (Manajemen Kategori).
   */
  const categoryUsageMap = useMemo(() => {
    const map = {};
    for (let i = 0; i < transactions.length; i += 1) {
      const catId = transactions[i].category_id;
      map[catId] = (map[catId] || 0) + 1;
    }
    return map;
  }, [transactions]);

  /**
   * Jumlah kategori kustom saat ini & status batas maksimal 15 kategori kustom.
   */
  const customCategoryMeta = useMemo(() => {
    let customCount = 0;
    for (let i = 0; i < categories.length; i += 1) {
      if (!categories[i].is_default) {
        customCount += 1;
      }
    }
    return {
      customCount,
      isLimitReached: customCount >= DOMAIN_LIMITS.MAX_CUSTOM_CATEGORIES,
    };
  }, [categories]);

  /**
   * Objek transaksi yang sedang diedit pada modal (bila editingTxId !== null).
   */
  const editingTransaction = useMemo(() => {
    if (!editingTxId) {
      return null;
    }
    return transactions.find((tx) => tx.id === editingTxId) || null;
  }, [transactions, editingTxId]);

  /**
   * Objek kategori kustom yang sedang diedit di Tab 3 (bila editingCategoryId !== null).
   */
  const editingCategory = useMemo(() => {
    if (!editingCategoryId) {
      return null;
    }
    return (
      categories.find(
        (cat) => cat.id === editingCategoryId && !cat.is_default
      ) || null
    );
  }, [categories, editingCategoryId]);

  /**
   * Modul 1 — Ringkasan Pengeluaran & Riwayat (Tab 1: Beranda)
   * Dihitung dengan useMemo (dependency: transactions, categories, todayISO, periodState, selectedCategoryFilter, periodLabel)
   */
  const homeSummary = useMemo(() => {
    let periodTotal = 0;
    let todayTotal = 0;
    let allTimeTotal = 0;
    const matchingPeriodAndCategory = [];

    for (let i = 0; i < transactions.length; i += 1) {
      const tx = transactions[i];
      const amount = tx.amount;

      allTimeTotal += amount;

      if (tx.transaction_date === todayISO) {
        todayTotal += amount;
      }

      const inPeriod = isDateInPeriod(tx.transaction_date, periodState);
      if (inPeriod) {
        periodTotal += amount;

        const inCategory =
          selectedCategoryFilter === null ||
          tx.category_id === selectedCategoryFilter;
        if (inCategory) {
          matchingPeriodAndCategory.push(tx);
        }
      }
    }

    const sortedFilteredTransactions = sortTransactionsForHistory(
      matchingPeriodAndCategory
    );

    let filteredTotal = 0;
    for (let i = 0; i < sortedFilteredTransactions.length; i += 1) {
      filteredTotal += sortedFilteredTransactions[i].amount;
    }

    const filteredCount = sortedFilteredTransactions.length;
    const allTimeCount = transactions.length;

    const selectedCategoryObj =
      selectedCategoryFilter !== null
        ? categories.find((cat) => cat.id === selectedCategoryFilter) || null
        : null;

    const categoryScopeLabel = selectedCategoryObj
      ? selectedCategoryObj.name
      : 'Semua Kategori';

    // Format nominal untuk Bar Sub-Total Riwayat: memakai formatCompactIDR bila >= Rp100.000.000
    const formattedFilteredTotal =
      filteredTotal >= DOMAIN_LIMITS.COMPACT_IDR_THRESHOLD
        ? formatCompactIDR(filteredTotal)
        : formatRupiah(filteredTotal);

    const subTotalBarText = `${periodLabel} • ${categoryScopeLabel} • ${filteredCount} Transaksi (${formattedFilteredTotal})`;

    let emptyStateMessage = '';
    if (allTimeCount === 0) {
      emptyStateMessage = MESSAGES.EMPTY_ALL_TRANSACTIONS;
    } else if (selectedCategoryObj) {
      emptyStateMessage = MESSAGES.emptyCategoryInPeriod(
        selectedCategoryObj.name,
        periodLabel
      );
    } else {
      emptyStateMessage = MESSAGES.emptyPeriod(periodLabel);
    }

    return {
      periodTotal,
      todayTotal,
      allTimeTotal,
      allTimeCount,
      filteredTransactions: sortedFilteredTransactions,
      filteredTotal,
      filteredCount,
      selectedCategoryObj,
      categoryScopeLabel,
      subTotalBarText,
      emptyStateMessage,
    };
  }, [
    transactions,
    categories,
    todayISO,
    periodState,
    selectedCategoryFilter,
    periodLabel,
  ]);

  /**
   * Modul 4 — Analisis Donut & Peringkat Kategori (Tab 2: Analisis)
   * Sorotan diturunkan saat render (bukan lewat useEffect): bila kategori yang disorot tidak ada
   * pada peringkat saat ini, otomatis dianggap null dan pusat donut kembali menampilkan P_periode.
   */
  const analyticsSummary = useMemo(() => {
    let periodTotal = 0;
    const bucketByCatId = {};

    for (let i = 0; i < transactions.length; i += 1) {
      const tx = transactions[i];
      if (isDateInPeriod(tx.transaction_date, periodState)) {
        periodTotal += tx.amount;
        const resolvedCat = resolveCategory(tx.category_id, categories);
        const key = resolvedCat.id;

        if (!bucketByCatId[key]) {
          bucketByCatId[key] = {
            category: resolvedCat,
            amount: 0,
            transactionCount: 0,
          };
        }
        bucketByCatId[key].amount += tx.amount;
        bucketByCatId[key].transactionCount += 1;
      }
    }

    // Hanya kategori dengan nominal > 0 pada periode terpilih,
    // urut amount DESC lalu name.toLowerCase() ASC (Bagian 4 Modul 4)
    const rankings = Object.values(bucketByCatId)
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => {
        if (b.amount !== a.amount) {
          return b.amount - a.amount;
        }
        const nameA = a.category.name.toLowerCase();
        const nameB = b.category.name.toLowerCase();
        if (nameA !== nameB) {
          return nameA < nameB ? -1 : 1;
        }
        return 0;
      })
      .map((entry) => {
        const rawPercentage =
          periodTotal > 0 ? (entry.amount / periodTotal) * 100 : 0;
        const percentageText = formatPercentage(entry.amount, periodTotal);
        const progressBarWidthPercent = Math.max(
          Math.min(rawPercentage, 100),
          DOMAIN_LIMITS.MIN_PROGRESS_BAR_PERCENT
        );

        return {
          categoryId: entry.category.id,
          category: entry.category,
          amount: entry.amount,
          transactionCount: entry.transactionCount,
          rawPercentage,
          percentageText,
          progressBarWidthPercent,
        };
      });

    // Turunkan sorotan saat render (null-safe terhadap perubahan periode / hapus transaksi)
    const highlightedItem =
      selectedAnalyticsCatId !== null
        ? rankings.find((item) => item.categoryId === selectedAnalyticsCatId) ||
          null
        : null;

    const effectiveHighlightedCatId = highlightedItem
      ? highlightedItem.categoryId
      : null;

    return {
      periodTotal,
      rankings,
      highlightedItem,
      effectiveHighlightedCatId,
      emptyStateMessage: MESSAGES.emptyPeriod(periodLabel),
    };
  }, [
    transactions,
    categories,
    periodState,
    selectedAnalyticsCatId,
    periodLabel,
  ]);

  // ============================================================================
  // ACTIONS — FILTER PERIODE, CHIP KATEGORI, & SOROTAN ANALISIS
  // ============================================================================

  /**
   * Berpindah mode periode pada kontrol segmen (Minggu | Bulan | Tahun | Semua)
   * dan menjalankan clampPeriod sesuai Bagian 3.2.
   */
  const changePeriodMode = useCallback(
    (nextMode) => {
      setPeriodState((prev) =>
        transitionPeriodMode(prev, nextMode, minTxDate, todayISO)
      );
    },
    [minTxDate, todayISO]
  );

  /**
   * Navigasi periode mundur (-1) atau maju (+1) dengan memeriksa batas minTxDate dan T0.
   */
  const navigatePeriod = useCallback(
    (direction) => {
      setPeriodState((prev) => {
        const bounds = getPeriodNavigationBounds(prev, minTxDate, todayISO);
        if (direction < 0 && !bounds.canGoPrev) {
          return prev;
        }
        if (direction > 0 && !bounds.canGoNext) {
          return prev;
        }
        return stepPeriod(prev, direction);
      });
    },
    [minTxDate, todayISO]
  );

  /**
   * Memilih chip filter kategori di Tab 1 (null untuk 'Semua').
   */
  const selectCategoryChip = useCallback((categoryId) => {
    setSelectedCategoryFilter(categoryId || null);
  }, []);

  /**
   * Menyorot / melepas sorotan kategori pada Tab 2 Analisis.
   */
  const toggleAnalyticsCategoryHighlight = useCallback((categoryId) => {
    setSelectedAnalyticsCatId((prev) =>
      prev === categoryId ? null : categoryId
    );
  }, []);

  // ============================================================================
  // ACTIONS — MODAL & CRUD TRANSAKSI (MODUL 2)
  // ============================================================================

  /**
   * Membuka modal dalam Mode Tambah:
   * - Membaca ulang T0
   * - editingTxId = null
   */
  const openAddTransactionModal = useCallback(() => {
    if (isBusyRef.current) {
      return;
    }
    refreshTodayISO();
    setStorageErrorMessage(null);
    setEditingTxId(null);
    setIsTxModalVisible(true);
  }, [refreshTodayISO]);

  /**
   * Membuka modal dalam Mode Edit:
   * - Membaca ulang T0
   * - editingTxId = transactionId
   */
  const openEditTransactionModal = useCallback(
    (transactionId) => {
      if (isBusyRef.current) {
        return;
      }
      refreshTodayISO();
      setStorageErrorMessage(null);
      setEditingTxId(transactionId);
      setIsTxModalVisible(true);
    },
    [refreshTodayISO]
  );

  /**
   * Menutup modal form transaksi dan membersihkan state edit.
   */
  const closeTransactionModal = useCallback(() => {
    if (isBusyRef.current) {
      return;
    }
    setIsTxModalVisible(false);
    setEditingTxId(null);
    setStorageErrorMessage(null);
  }, []);

  /**
   * Menyimpan transaksi baru atau perubahan transaksi (Write-Then-Commit):
   * 1. Perbarui T0 saat tombol Simpan ditekan (Bagian 3.1).
   * 2. Validasi seluruh input terhadap T0 terbaru.
   * 3. Kunci isBusy, tulis ke AsyncStorage dengan setItem.
   * 4. Jika berhasil: perbarui state transactions, tutup modal, dan tampilkan toast 2,5 detik
   *    bila transaksi berada di luar filter periode atau chip kategori aktif di Beranda.
   */
  const saveTransaction = useCallback(
    async ({ amountInput, categoryId, dateISO, noteInput }) => {
      if (isBusyRef.current || appStatus !== 'ready') {
        return { ok: false, busy: true };
      }

      // Perbarui T0 tepat saat Simpan ditekan
      const freshToday = refreshTodayISO();
      setStorageErrorMessage(null);

      const existingTx = editingTxId
        ? transactions.find((tx) => tx.id === editingTxId) || null
        : null;

      const originalDateISO = existingTx ? existingTx.transaction_date : null;

      const validation = validateTransactionForm({
        amountInput,
        dateISO,
        todayISO: freshToday,
        originalDateISO,
        noteInput,
      });

      if (!validation.isValid) {
        return {
          ok: false,
          validationErrors: validation.errors,
          normalizedAmountString: validation.normalizedAmountString,
        };
      }

      // Pastikan category_id valid (jika tidak ditemukan, fallback ke cat_exp_1)
      const validCatExists = categories.some((cat) => cat.id === categoryId);
      const finalCategoryId = validCatExists
        ? categoryId
        : DEFAULT_CATEGORIES[0].id;

      setBusyLock(true);

      try {
        let savedTransaction;
        let nextTransactions;

        if (existingTx) {
          // Mode Edit: pertahankan created_at asli
          savedTransaction = {
            ...existingTx,
            amount: validation.parsedAmount,
            category_id: finalCategoryId,
            transaction_date: dateISO,
            note: validation.sanitizedNote,
            created_at: existingTx.created_at,
          };

          nextTransactions = transactions.map((tx) =>
            tx.id === existingTx.id ? savedTransaction : tx
          );
        } else {
          // Mode Tambah
          savedTransaction = {
            id: generateTransactionId(),
            amount: validation.parsedAmount,
            category_id: finalCategoryId,
            transaction_date: dateISO,
            note: validation.sanitizedNote,
            created_at: Date.now(),
          };

          nextTransactions = [savedTransaction, ...transactions];
        }

        // Write-Then-Commit ke AsyncStorage
        const writeResult = await commitTransactionsToStorage(nextTransactions);
        if (!writeResult.ok) {
          setStorageErrorMessage(writeResult.error);
          return {
            ok: false,
            error: writeResult.error,
          };
        }

        // Commit ke State UI
        setTransactions(nextTransactions);
        setIsTxModalVisible(false);
        setEditingTxId(null);

        // Cek apakah transaksi yang disimpan berada di luar filter aktif di Beranda
        const isInsidePeriod = isDateInPeriod(
          savedTransaction.transaction_date,
          periodState
        );
        const isInsideCategory =
          selectedCategoryFilter === null ||
          savedTransaction.category_id === selectedCategoryFilter;

        if (!isInsidePeriod || !isInsideCategory) {
          showToast(
            MESSAGES.savedOutsideFilterToast(savedTransaction.transaction_date)
          );
        }

        return {
          ok: true,
          transaction: savedTransaction,
        };
      } finally {
        setBusyLock(false);
      }
    },
    [
      appStatus,
      refreshTodayISO,
      editingTxId,
      transactions,
      categories,
      setBusyLock,
      periodState,
      selectedCategoryFilter,
      showToast,
    ]
  );

  /**
   * Menghapus satu transaksi berdasarkan ID (Write-Then-Commit):
   * Tidak menjalankan clampPeriod agar menghapus transaksi terakhir di suatu bulan
   * tetap menampilkan empty state bulan tersebut dan tidak melompat tiba-tiba.
   */
  const deleteTransaction = useCallback(
    async (transactionId) => {
      if (isBusyRef.current || appStatus !== 'ready') {
        return { ok: false, busy: true };
      }

      setStorageErrorMessage(null);
      setBusyLock(true);

      try {
        const nextTransactions = transactions.filter(
          (tx) => tx.id !== transactionId
        );

        const writeResult = await commitTransactionsToStorage(nextTransactions);
        if (!writeResult.ok) {
          setStorageErrorMessage(writeResult.error);
          return {
            ok: false,
            error: writeResult.error,
          };
        }

        setTransactions(nextTransactions);
        if (editingTxId === transactionId) {
          setEditingTxId(null);
          setIsTxModalVisible(false);
        }

        return { ok: true };
      } finally {
        setBusyLock(false);
      }
    },
    [appStatus, transactions, setBusyLock, editingTxId]
  );

  // ============================================================================
  // ACTIONS — MANAJEMEN KATEGORI KUSTOM (MODUL 3)
  // ============================================================================

  const startEditingCategory = useCallback((categoryId) => {
    setStorageErrorMessage(null);
    setEditingCategoryId(categoryId);
  }, []);

  const cancelEditingCategory = useCallback(() => {
    setStorageErrorMessage(null);
    setEditingCategoryId(null);
  }, []);

  /**
   * Menyimpan kategori kustom baru atau hasil edit kategori kustom (Write-Then-Commit):
   * - Kategori kustom baru selalu ditempatkan di bagian paling bawah daftar.
   */
  const saveCustomCategory = useCallback(
    async ({ nameInput, color, icon }) => {
      if (isBusyRef.current || appStatus !== 'ready') {
        return { ok: false, busy: true };
      }

      setStorageErrorMessage(null);

      const validation = validateCategoryForm({
        nameInput,
        color,
        icon,
        existingCategories: categories,
        editingCategoryId,
      });

      if (!validation.isValid) {
        return {
          ok: false,
          validationError: validation.error,
        };
      }

      setBusyLock(true);

      try {
        let nextCategories;
        let savedCategory;

        if (editingCategoryId) {
          const targetCat = categories.find(
            (cat) => cat.id === editingCategoryId
          );
          if (!targetCat || targetCat.is_default) {
            return {
              ok: false,
              error: MESSAGES.SAVE_ERROR,
            };
          }

          savedCategory = {
            ...targetCat,
            name: validation.trimmedName,
            color: validation.safeColor,
            icon: validation.safeIcon,
            is_default: false,
          };

          nextCategories = categories.map((cat) =>
            cat.id === editingCategoryId ? savedCategory : cat
          );
        } else {
          savedCategory = {
            id: generateCustomCategoryId(),
            name: validation.trimmedName,
            color: validation.safeColor,
            icon: validation.safeIcon,
            is_default: false,
          };

          // Tempatkan di bagian paling bawah daftar
          nextCategories = [...categories, savedCategory];
        }

        const writeResult = await commitCategoriesToStorage(nextCategories);
        if (!writeResult.ok) {
          setStorageErrorMessage(writeResult.error);
          return {
            ok: false,
            error: writeResult.error,
          };
        }

        setCategories(nextCategories);
        setEditingCategoryId(null);

        return {
          ok: true,
          category: savedCategory,
        };
      } finally {
        setBusyLock(false);
      }
    },
    [appStatus, categories, editingCategoryId, setBusyLock]
  );

  /**
   * Menghapus kategori kustom yang memiliki 0 transaksi (Write-Then-Commit):
   * - Bila selectedCategoryFilter menunjuk kategori itu, state kembali ke null (Semua).
   * - editingCategoryId direset bila yang dihapus sedang diedit.
   */
  const deleteCustomCategory = useCallback(
    async (categoryId) => {
      if (isBusyRef.current || appStatus !== 'ready') {
        return { ok: false, busy: true };
      }

      const targetCat = categories.find((cat) => cat.id === categoryId);
      if (!targetCat || targetCat.is_default) {
        return { ok: false, error: MESSAGES.SAVE_ERROR };
      }

      const usageCount = categoryUsageMap[categoryId] || 0;
      if (usageCount > 0) {
        return {
          ok: false,
          error: 'Kategori yang memiliki transaksi tidak dapat dihapus.',
        };
      }

      setStorageErrorMessage(null);
      setBusyLock(true);

      try {
        const nextCategories = categories.filter(
          (cat) => cat.id !== categoryId
        );

        const writeResult = await commitCategoriesToStorage(nextCategories);
        if (!writeResult.ok) {
          setStorageErrorMessage(writeResult.error);
          return {
            ok: false,
            error: writeResult.error,
          };
        }

        setCategories(nextCategories);

        if (selectedCategoryFilter === categoryId) {
          setSelectedCategoryFilter(null);
        }
        if (editingCategoryId === categoryId) {
          setEditingCategoryId(null);
        }

        return { ok: true };
      } finally {
        setBusyLock(false);
      }
    },
    [
      appStatus,
      categories,
      categoryUsageMap,
      setBusyLock,
      selectedCategoryFilter,
      editingCategoryId,
    ]
  );

  /**
   * Aksi tombol "Lihat transaksi" pada kategori terpakai di Tab 3 (Bagian 4 Modul 3):
   * 1. Mereset mode edit kategori di Tab 3 (editingCategoryId = null)
   * 2. Mengaktifkan chip kategori tersebut di Tab 1 (selectedCategoryFilter = categoryId)
   * 3. Mengubah mode periode ke Semua (PERIOD_MODES.ALL)
   */
  const prepareViewCategoryTransactions = useCallback((categoryId) => {
    setEditingCategoryId(null);
    setSelectedCategoryFilter(categoryId);
    setPeriodState((prev) => ({
      ...prev,
      periodMode: PERIOD_MODES.ALL,
    }));
  }, []);

  // ============================================================================
  // ACTIONS — EKSPOR CSV, RESET DATA, & PEMULIHAN CORRUPT (MODUL 5 & BAGIAN 3.3)
  // ============================================================================

  /**
   * Mengekspor seluruh transaksi ke CSV:
   * - Memperbarui T0 terlebih dahulu (Bagian 3.1 & Modul 5)
   * - Mengekspor ke finn_transaksi_YYYY-MM-DD.csv
   */
  const exportAllTransactionsCsv = useCallback(async () => {
    if (isBusyRef.current || appStatus !== 'ready') {
      return { ok: false, busy: true };
    }

    const freshToday = refreshTodayISO();
    setBusyLock(true);

    try {
      const result = await exportTransactionsCsvFile({
        transactions,
        categories,
        todayISO: freshToday,
      });
      return result;
    } finally {
      setBusyLock(false);
    }
  }, [appStatus, refreshTodayISO, setBusyLock, transactions, categories]);

  /**
   * Mereset seluruh data ke kondisi awal (setelah konfirmasi 2 langkah ketik "RESET"):
   * - Menghapus semua transaksi ([])
   * - Kategori kembali ke 6 bawaan
   * - selectedCategoryFilter, selectedAnalyticsCatId, editingTxId, editingCategoryId menjadi null
   * - Filter periode kembali ke default (month, bulan berjalan T0)
   * - Ditulis dengan multiSet
   */
  const resetAllAppData = useCallback(async () => {
    if (isBusyRef.current || appStatus !== 'ready') {
      return { ok: false, busy: true };
    }

    setStorageErrorMessage(null);
    setBusyLock(true);

    try {
      const resetResult = await resetAllStorageData();
      if (!resetResult.ok) {
        setStorageErrorMessage(resetResult.error);
        return {
          ok: false,
          error: resetResult.error,
        };
      }

      const freshToday = refreshTodayISO();
      setCategories(resetResult.categories);
      setTransactions(resetResult.transactions);
      setSelectedCategoryFilter(null);
      setSelectedAnalyticsCatId(null);
      setEditingTxId(null);
      setIsTxModalVisible(false);
      setEditingCategoryId(null);
      setPeriodState(createPeriodFromISODate(freshToday, PERIOD_MODES.MONTH));
      clearToast();

      return { ok: true };
    } finally {
      setBusyLock(false);
    }
  }, [appStatus, setBusyLock, refreshTodayISO, clearToast]);

  /**
   * Aksi 1 pada layar Corrupt: Ekspor data mentah ke finn_corrupt_dump.txt
   */
  const exportCorruptRawData = useCallback(async () => {
    if (isBusyRef.current) {
      return { ok: false, busy: true };
    }
    setBusyLock(true);
    try {
      return await exportCorruptDumpFile(corruptRawDump || '');
    } finally {
      setBusyLock(false);
    }
  }, [corruptRawDump, setBusyLock]);

  /**
   * Aksi 2 pada layar Corrupt: Coba lagi (jalankan ulang hidrasi)
   */
  const retryHydration = useCallback(async () => {
    if (isBusyRef.current) {
      return { ok: false, busy: true };
    }
    setBusyLock(true);
    try {
      return await runHydration();
    } finally {
      setBusyLock(false);
    }
  }, [runHydration, setBusyLock]);

  /**
   * Aksi 3 pada layar Corrupt: Mulai dari awal
   * Menyalin teks mentah ke @finn_backup_corrupt dulu, baru mengganti data ke kondisi awal dengan multiSet.
   */
  const resetFromCorruptState = useCallback(async () => {
    if (isBusyRef.current) {
      return { ok: false, busy: true };
    }

    setStorageErrorMessage(null);
    setBusyLock(true);

    try {
      const result = await backupAndResetCorruptStorage(corruptRawDump);
      if (!result.ok) {
        setStorageErrorMessage(result.error);
        return {
          ok: false,
          error: result.error,
        };
      }

      const freshToday = refreshTodayISO();
      setCategories(result.categories);
      setTransactions(result.transactions);
      setCorruptRawDump(null);
      setCorruptReason(null);
      setSelectedCategoryFilter(null);
      setSelectedAnalyticsCatId(null);
      setEditingTxId(null);
      setIsTxModalVisible(false);
      setEditingCategoryId(null);
      setPeriodState(createPeriodFromISODate(freshToday, PERIOD_MODES.MONTH));
      setAppStatus('ready');

      return { ok: true };
    } finally {
      setBusyLock(false);
    }
  }, [corruptRawDump, setBusyLock, refreshTodayISO]);

  const contextValue = useMemo(
    () => ({
      // Status & Meta
      appStatus,
      corruptRawDump,
      corruptReason,
      isBusy,
      todayISO,
      minTxDate,
      storageErrorMessage,
      toastMessage,

      // Koleksi & Derivasi
      categories,
      transactions,
      categoryUsageMap,
      customCategoryMeta,
      periodState,
      periodLabel,
      periodBounds,
      selectedCategoryFilter,
      selectedAnalyticsCatId,
      homeSummary,
      analyticsSummary,

      // State Modal & Form Edit
      isTxModalVisible,
      editingTxId,
      editingTransaction,
      editingCategoryId,
      editingCategory,

      // Actions Umum & Navigasi Periode
      clearStorageError,
      clearToast,
      refreshTodayISO,
      changePeriodMode,
      navigatePeriod,
      selectCategoryChip,
      toggleAnalyticsCategoryHighlight,

      // Actions Transaksi
      openAddTransactionModal,
      openEditTransactionModal,
      closeTransactionModal,
      saveTransaction,
      deleteTransaction,

      // Actions Kategori
      startEditingCategory,
      cancelEditingCategory,
      saveCustomCategory,
      deleteCustomCategory,
      prepareViewCategoryTransactions,

      // Actions Data & Corrupt Recovery
      exportAllTransactionsCsv,
      resetAllAppData,
      exportCorruptRawData,
      retryHydration,
      resetFromCorruptState,
    }),
    [
      appStatus,
      corruptRawDump,
      corruptReason,
      isBusy,
      todayISO,
      minTxDate,
      storageErrorMessage,
      toastMessage,
      categories,
      transactions,
      categoryUsageMap,
      customCategoryMeta,
      periodState,
      periodLabel,
      periodBounds,
      selectedCategoryFilter,
      selectedAnalyticsCatId,
      homeSummary,
      analyticsSummary,
      isTxModalVisible,
      editingTxId,
      editingTransaction,
      editingCategoryId,
      editingCategory,
      clearStorageError,
      clearToast,
      refreshTodayISO,
      changePeriodMode,
      navigatePeriod,
      selectCategoryChip,
      toggleAnalyticsCategoryHighlight,
      openAddTransactionModal,
      openEditTransactionModal,
      closeTransactionModal,
      saveTransaction,
      deleteTransaction,
      startEditingCategory,
      cancelEditingCategory,
      saveCustomCategory,
      deleteCustomCategory,
      prepareViewCategoryTransactions,
      exportAllTransactionsCsv,
      resetAllAppData,
      exportCorruptRawData,
      retryHydration,
      resetFromCorruptState,
    ]
  );

  return React.createElement(
    FinnContext.Provider,
    { value: contextValue },
    children
  );
}

/**
 * Custom hook untuk mengakses state dan aksi FinnContext di komponen UI.
 */
export function useFinn() {
  const context = useContext(FinnContext);
  if (!context) {
    throw new Error('useFinn wajib digunakan di dalam FinnProvider.');
  }
  return context;
}
