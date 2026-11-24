/**
 * FINN v2.5 — Date & Period Pure Utilities
 * Mengimplementasikan aturan Bagian 3.1 (T0 bebas bias UTC), Bagian 3.2 (Filter Periode & clampPeriod),
 * dan Bagian 3.4 (Format Tanggal Bahasa Indonesia tanpa Intl).
 */

export const INDONESIAN_DAYS = Object.freeze([
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]);

export const INDONESIAN_MONTHS_FULL = Object.freeze([
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]);

export const INDONESIAN_MONTHS_SHORT = Object.freeze([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]);

export const PERIOD_MODES = Object.freeze({
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all',
});

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mengambil tanggal lokal perangkat dalam format YYYY-MM-DD dari komponen lokal
 * getFullYear(), getMonth() + 1, getDate() (bukan toISOString() agar bebas bias UTC).
 * @param {Date} [dateObj=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function getLocalISODate(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Menghitung jumlah hari dalam bulan tertentu (1-12) pada tahun tertentu.
 * @param {number} year
 * @param {number} month 1..12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Memvalidasi apakah string sesuai format YYYY-MM-DD dan merupakan tanggal kalender yang sah.
 * @param {unknown} isoStr
 * @returns {boolean}
 */
export function isValidISODateString(isoStr) {
  if (typeof isoStr !== 'string' || !ISO_DATE_REGEX.test(isoStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = isoStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1900 || year > 9999) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  const maxDays = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDays;
}

/**
 * Mengurai string YYYY-MM-DD menjadi komponen angka { year, month, day }.
 * @param {string} isoStr
 * @returns {{ year: number, month: number, day: number }}
 */
export function parseISODateParts(isoStr) {
  const [yearStr, monthStr, dayStr] = String(isoStr).split('-');
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
  };
}

/**
 * Mengubah string YYYY-MM-DD menjadi objek Date lokal (pukul 12:00 siang lokal untuk menghindari pergeseran DST).
 * @param {string} isoStr
 * @returns {Date}
 */
export function isoDateToLocalDate(isoStr) {
  const { year, month, day } = parseISODateParts(isoStr);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Menghitung tanggal kemarin dari T0 sesuai Bagian 3.1:
 * dihitung dari objek Date lokal T0 dengan d.setDate(d.getDate() - 1) lalu diformat ke YYYY-MM-DD.
 * @param {string} todayISO
 * @returns {string} YYYY-MM-DD
 */
export function getYesterdayISODate(todayISO) {
  const d = isoDateToLocalDate(todayISO);
  d.setDate(d.getDate() - 1);
  return getLocalISODate(d);
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format header Bahasa Indonesia lengkap
 * (contoh: "Sabtu, 14 November 2026") tanpa bergantung pada Intl.
 * @param {string} isoStr
 * @returns {string}
 */
export function formatIndonesianFullDate(isoStr) {
  if (!isValidISODateString(isoStr)) {
    return isoStr || '';
  }
  const dateObj = isoDateToLocalDate(isoStr);
  const dayName = INDONESIAN_DAYS[dateObj.getDay()];
  const { year, month, day } = parseISODateParts(isoStr);
  const monthName = INDONESIAN_MONTHS_FULL[month - 1];
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format ringkas untuk baris transaksi / toast
 * (contoh: "14 Nov 2026").
 * @param {string} isoStr
 * @returns {string}
 */
export function formatIndonesianShortDate(isoStr) {
  if (!isValidISODateString(isoStr)) {
    return isoStr || '';
  }
  const { year, month, day } = parseISODateParts(isoStr);
  const shortMonth = INDONESIAN_MONTHS_SHORT[month - 1];
  return `${day} ${shortMonth} ${year}`;
}

/**
 * Rumus indeks minggu untuk tanggal d (1..31) sesuai Bagian 3.2:
 * week = min(floor((d - 1) / 7) + 1, 4)
 * Minggu 1: 1-7, Minggu 2: 8-14, Minggu 3: 15-21, Minggu 4: 22 s/d akhir bulan.
 * @param {number} dayOfMonth
 * @returns {number} 1 | 2 | 3 | 4
 */
export function getWeekOfMonth(dayOfMonth) {
  return Math.min(Math.floor((dayOfMonth - 1) / 7) + 1, 4);
}

/**
 * Membentuk objek state periode dari tanggal ISO dan mode periode.
 * @param {string} isoStr YYYY-MM-DD
 * @param {'week'|'month'|'year'|'all'} [periodMode='month']
 * @returns {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }}
 */
export function createPeriodFromISODate(isoStr, periodMode = PERIOD_MODES.MONTH) {
  const { year, month, day } = parseISODateParts(isoStr);
  return {
    periodMode,
    periodYear: year,
    periodMonth: month,
    periodWeek: getWeekOfMonth(day),
  };
}

/**
 * Menghitung rentang tanggal inklusif { startDate, endDate } dalam format YYYY-MM-DD
 * untuk state periode tertentu. Pada mode 'all', mengembalikan { startDate: null, endDate: null }.
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} periodState
 * @returns {{ startDate: string | null, endDate: string | null }}
 */
export function getPeriodRange(periodState) {
  const { periodMode, periodYear, periodMonth, periodWeek } = periodState;

  if (periodMode === PERIOD_MODES.ALL) {
    return { startDate: null, endDate: null };
  }

  const yearStr = String(periodYear);
  const monthStr = String(periodMonth).padStart(2, '0');
  const lastDayOfMonth = getDaysInMonth(periodYear, periodMonth);

  if (periodMode === PERIOD_MODES.YEAR) {
    return {
      startDate: `${yearStr}-01-01`,
      endDate: `${yearStr}-12-31`,
    };
  }

  if (periodMode === PERIOD_MODES.MONTH) {
    const endDayStr = String(lastDayOfMonth).padStart(2, '0');
    return {
      startDate: `${yearStr}-${monthStr}-01`,
      endDate: `${yearStr}-${monthStr}-${endDayStr}`,
    };
  }

  // Mode WEEK (Minggu 1..4)
  let startDay = 1;
  let endDay = 7;

  if (periodWeek === 1) {
    startDay = 1;
    endDay = 7;
  } else if (periodWeek === 2) {
    startDay = 8;
    endDay = 14;
  } else if (periodWeek === 3) {
    startDay = 15;
    endDay = 21;
  } else {
    startDay = 22;
    endDay = lastDayOfMonth;
  }

  return {
    startDate: `${yearStr}-${monthStr}-${String(startDay).padStart(2, '0')}`,
    endDate: `${yearStr}-${monthStr}-${String(endDay).padStart(2, '0')}`,
  };
}

/**
 * Menghasilkan label periode sesuai tabel Bagian 3.2:
 * - Minggu: "Minggu 2 • 8–14 Okt 2026"
 * - Bulan: "Oktober 2026"
 * - Tahun: "2026"
 * - Semua: "Semua Waktu"
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} periodState
 * @returns {string}
 */
export function getPeriodLabel(periodState) {
  const { periodMode, periodYear, periodMonth, periodWeek } = periodState;

  if (periodMode === PERIOD_MODES.ALL) {
    return 'Semua Waktu';
  }

  if (periodMode === PERIOD_MODES.YEAR) {
    return `${periodYear}`;
  }

  if (periodMode === PERIOD_MODES.MONTH) {
    return `${INDONESIAN_MONTHS_FULL[periodMonth - 1]} ${periodYear}`;
  }

  // Mode WEEK
  const lastDay = getDaysInMonth(periodYear, periodMonth);
  let startDay = 1;
  let endDay = 7;
  if (periodWeek === 2) {
    startDay = 8;
    endDay = 14;
  } else if (periodWeek === 3) {
    startDay = 15;
    endDay = 21;
  } else if (periodWeek === 4) {
    startDay = 22;
    endDay = lastDay;
  }

  const shortMonth = INDONESIAN_MONTHS_SHORT[periodMonth - 1];
  return `Minggu ${periodWeek} • ${startDay}–${endDay} ${shortMonth} ${periodYear}`;
}

/**
 * Memeriksa apakah suatu tanggal transaksi (YYYY-MM-DD) berada di dalam rentang periode aktif.
 * Menggunakan perbandingan string ISO sesuai Bagian 3.2.
 * @param {string} txDateISO
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} periodState
 * @returns {boolean}
 */
export function isDateInPeriod(txDateISO, periodState) {
  if (periodState.periodMode === PERIOD_MODES.ALL) {
    return true;
  }
  const { startDate, endDate } = getPeriodRange(periodState);
  return txDateISO >= startDate && txDateISO <= endDate;
}

/**
 * Menghitung Transaksi Tertua (minTxDate) sesuai Bagian 3.2:
 * Nilai transaction_date paling awal dari seluruh transaksi yang memenuhi transaction_date <= T0.
 * Bila belum ada transaksi (atau seluruh transaksi bertanggal > T0 akibat perpindahan zona waktu),
 * maka minTxDate = T0.
 * @param {Array<{ transaction_date: string }>} transactions
 * @param {string} todayISO T0
 * @returns {string} YYYY-MM-DD
 */
export function getMinTxDate(transactions, todayISO) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return todayISO;
  }

  let earliest = null;
  for (let i = 0; i < transactions.length; i += 1) {
    const txDate = transactions[i]?.transaction_date;
    if (typeof txDate === 'string' && txDate <= todayISO) {
      if (earliest === null || txDate < earliest) {
        earliest = txDate;
      }
    }
  }

  return earliest !== null ? earliest : todayISO;
}

/**
 * Membandingkan posisi kronologis dua periode pada mode yang sama.
 * Mengembalikan angka < 0 jika periodA sebelum periodB, 0 jika sama, > 0 jika sesudah.
 * @param {{ periodYear: number, periodMonth: number, periodWeek: number }} periodA
 * @param {{ periodYear: number, periodMonth: number, periodWeek: number }} periodB
 * @param {'week'|'month'|'year'|'all'} mode
 * @returns {number}
 */
export function comparePeriods(periodA, periodB, mode) {
  if (mode === PERIOD_MODES.ALL) {
    return 0;
  }
  if (periodA.periodYear !== periodB.periodYear) {
    return periodA.periodYear - periodB.periodYear;
  }
  if (mode === PERIOD_MODES.YEAR) {
    return 0;
  }
  if (periodA.periodMonth !== periodB.periodMonth) {
    return periodA.periodMonth - periodB.periodMonth;
  }
  if (mode === PERIOD_MODES.MONTH) {
    return 0;
  }
  return periodA.periodWeek - periodB.periodWeek;
}

/**
 * Menggeser periode mundur (direction = -1) atau maju (direction = +1) sesuai aturan Bagian 3.2:
 * - Minggu: ±1 minggu, melintasi bulan (Minggu 1 ‹ → Minggu 4 bulan sebelumnya; Minggu 4 › → Minggu 1 bulan berikutnya).
 * - Bulan dan Tahun: ±1 bulan / ±1 tahun.
 * - Mode Semua: tetap.
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} periodState
 * @param {-1 | 1} direction
 * @returns {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }}
 */
export function stepPeriod(periodState, direction) {
  const { periodMode, periodYear, periodMonth, periodWeek } = periodState;
  const step = direction >= 0 ? 1 : -1;

  if (periodMode === PERIOD_MODES.ALL) {
    return { ...periodState };
  }

  if (periodMode === PERIOD_MODES.YEAR) {
    return {
      ...periodState,
      periodYear: periodYear + step,
    };
  }

  if (periodMode === PERIOD_MODES.MONTH) {
    let nextMonth = periodMonth + step;
    let nextYear = periodYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    return {
      ...periodState,
      periodYear: nextYear,
      periodMonth: nextMonth,
    };
  }

  // Mode WEEK
  let nextWeek = periodWeek + step;
  let nextMonth = periodMonth;
  let nextYear = periodYear;

  if (nextWeek > 4) {
    nextWeek = 1;
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
  } else if (nextWeek < 1) {
    nextWeek = 4;
    nextMonth -= 1;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
  }

  return {
    ...periodState,
    periodYear: nextYear,
    periodMonth: nextMonth,
    periodWeek: nextWeek,
  };
}

/**
 * Menentukan apakah tombol navigasi ‹ (mundur) dan › (maju) aktif sesuai Bagian 3.2:
 * - Mode Semua: ‹ dan › nonaktif.
 * - Batas maju: › nonaktif pada periode yang memuat atau berada setelah T0.
 * - Batas mundur: ‹ nonaktif pada periode yang memuat atau berada sebelum minTxDate.
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} periodState
 * @param {string} minTxDate YYYY-MM-DD
 * @param {string} todayISO YYYY-MM-DD (T0)
 * @returns {{ canGoPrev: boolean, canGoNext: boolean }}
 */
export function getPeriodNavigationBounds(periodState, minTxDate, todayISO) {
  const { periodMode } = periodState;
  if (periodMode === PERIOD_MODES.ALL) {
    return { canGoPrev: false, canGoNext: false };
  }

  const minPeriod = createPeriodFromISODate(minTxDate, periodMode);
  const maxPeriod = createPeriodFromISODate(todayISO, periodMode);

  const canGoPrev = comparePeriods(periodState, minPeriod, periodMode) > 0;
  const canGoNext = comparePeriods(periodState, maxPeriod, periodMode) < 0;

  return { canGoPrev, canGoNext };
}

/**
 * Clamping saat Pindah Mode (clampPeriod) sesuai Bagian 3.2:
 * Dijalankan HANYA ketika pengguna berpindah mode (tidak saat hapus/edit transaksi).
 * Urutan prioritas:
 * 1. Bila periode target berada sebelum periode yang memuat minTxDate, geser ke periode yang memuat minTxDate.
 * 2. Prioritas tertinggi: Bila periode target berada setelah periode yang memuat T0, geser ke periode yang memuat T0.
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} targetPeriod
 * @param {string} minTxDate YYYY-MM-DD
 * @param {string} todayISO YYYY-MM-DD (T0)
 * @returns {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }}
 */
export function clampPeriod(targetPeriod, minTxDate, todayISO) {
  const { periodMode } = targetPeriod;
  if (periodMode === PERIOD_MODES.ALL) {
    return { ...targetPeriod };
  }

  const minPeriod = createPeriodFromISODate(minTxDate, periodMode);
  const maxPeriod = createPeriodFromISODate(todayISO, periodMode);

  let result = { ...targetPeriod };

  // Prioritas 1: Batas bawah (minTxDate)
  if (comparePeriods(result, minPeriod, periodMode) < 0) {
    result = { ...minPeriod };
  }

  // Prioritas 2 (Tertinggi): Batas atas (T0 / todayISO) menang atas batas bawah
  if (comparePeriods(result, maxPeriod, periodMode) > 0) {
    result = { ...maxPeriod };
  }

  return result;
}

/**
 * Mengelola transisi pindah mode pada kontrol segmen (Minggu | Bulan | Tahun | Semua)
 * sesuai seluruh aturan di Bagian 3.2 lalu mengunci dengan clampPeriod.
 * @param {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }} currentPeriod
 * @param {'week'|'month'|'year'|'all'} nextMode
 * @param {string} minTxDate YYYY-MM-DD
 * @param {string} todayISO YYYY-MM-DD (T0)
 * @returns {{ periodMode: string, periodYear: number, periodMonth: number, periodWeek: number }}
 */
export function transitionPeriodMode(
  currentPeriod,
  nextMode,
  minTxDate,
  todayISO
) {
  const prevMode = currentPeriod.periodMode;
  if (prevMode === nextMode) {
    return { ...currentPeriod };
  }

  const todayParts = parseISODateParts(todayISO);
  const todayWeek = getWeekOfMonth(todayParts.day);

  // Masuk ke mode Semua
  if (nextMode === PERIOD_MODES.ALL) {
    return {
      ...currentPeriod,
      periodMode: PERIOD_MODES.ALL,
    };
  }

  // Keluar dari mode Semua ke mode mana pun: kembali ke periode berjalan (T0) untuk mode tersebut
  if (prevMode === PERIOD_MODES.ALL) {
    const targetFromAll = {
      periodMode: nextMode,
      periodYear: todayParts.year,
      periodMonth: todayParts.month,
      periodWeek: todayWeek,
    };
    return clampPeriod(targetFromAll, minTxDate, todayISO);
  }

  let target = {
    ...currentPeriod,
    periodMode: nextMode,
  };

  if (prevMode === PERIOD_MODES.WEEK && nextMode === PERIOD_MODES.MONTH) {
    // Minggu -> Bulan: bulan dari minggu tersebut
    target.periodYear = currentPeriod.periodYear;
    target.periodMonth = currentPeriod.periodMonth;
  } else if (prevMode === PERIOD_MODES.MONTH && nextMode === PERIOD_MODES.YEAR) {
    // Bulan -> Tahun: tahun dari bulan tersebut
    target.periodYear = currentPeriod.periodYear;
  } else if (prevMode === PERIOD_MODES.WEEK && nextMode === PERIOD_MODES.YEAR) {
    // Minggu -> Tahun: tahun dari minggu tersebut
    target.periodYear = currentPeriod.periodYear;
  } else if (prevMode === PERIOD_MODES.MONTH && nextMode === PERIOD_MODES.WEEK) {
    // Bulan -> Minggu: jika bulan = bulan berjalan (T0), minggu yang memuat T0; selain itu Minggu 1
    if (
      currentPeriod.periodYear === todayParts.year &&
      currentPeriod.periodMonth === todayParts.month
    ) {
      target.periodWeek = todayWeek;
    } else {
      target.periodWeek = 1;
    }
  } else if (prevMode === PERIOD_MODES.YEAR && nextMode === PERIOD_MODES.MONTH) {
    // Tahun -> Bulan: jika tahun = tahun berjalan (T0), bulan berjalan (T0); selain itu Desember
    if (currentPeriod.periodYear === todayParts.year) {
      target.periodMonth = todayParts.month;
    } else {
      target.periodMonth = 12;
    }
  } else if (prevMode === PERIOD_MODES.YEAR && nextMode === PERIOD_MODES.WEEK) {
    // Tahun -> Minggu: jika tahun = tahun berjalan (T0), bulan & minggu berjalan (T0); selain itu Desember Minggu 1
    if (currentPeriod.periodYear === todayParts.year) {
      target.periodMonth = todayParts.month;
      target.periodWeek = todayWeek;
    } else {
      target.periodMonth = 12;
      target.periodWeek = 1;
    }
  }

  return clampPeriod(target, minTxDate, todayISO);
}
