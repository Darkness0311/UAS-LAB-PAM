/**
 * FINN v2.5 — Amount Parsing & Formatting Pure Utilities
 * Mengimplementasikan aturan Bagian 3.4 (formatRupiah, formatCompactIDR, formatPercentage)
 * dan Bagian 4 Modul 2 (parseAmountInput dengan aritmetika bilangan bulat murni & 8 kasus uji wajib).
 */

import { DOMAIN_LIMITS } from '../constants/defaultCategories.js';

const TRAILING_DECIMAL_REGEX = /([.,])(\d{1,2})$/;

/**
 * Mengurai string nominal (ketik maupun paste) menjadi bilangan bulat dengan aritmetika integer murni.
 * Aturan Bagian 4 Modul 2:
 * - Buang Rp (case-insensitive), spasi, dan semua karakter selain angka (0-9), titik (.), dan koma (,).
 * - Jika string berakhir dengan titik/koma diikuti tepat 1 atau 2 digit (/([.,])(\d{1,2})$/),
 *   maka pemisah terakhir tersebut adalah desimal:
 *   - bagianBulat = seluruh digit sebelum pemisah terakhir (semua titik/koma di dalamnya dibuang; bila kosong dianggap "0").
 *   - Dibulatkan ke atas bila digit desimal pertama >= 5, selain itu ke bawah (tanpa float).
 * - Selain itu, semua titik dan koma dianggap pemisah ribuan dan dibuang. Leading zero dibuang.
 *
 * @param {string | number | null | undefined} rawInput
 * @returns {{ isEmpty: boolean, value: number | null, normalizedString: string }}
 */
export function parseAmountInput(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return { isEmpty: true, value: null, normalizedString: '' };
  }

  const rawStr = String(rawInput);
  // Buang "Rp" (case-insensitive) dan semua karakter selain 0-9, titik (.), koma (,)
  const stripped = rawStr.replace(/rp/gi, '').replace(/[^0-9.,]/g, '');

  // Jika tidak ada satupun digit angka, anggap kosong
  if (!/\d/.test(stripped)) {
    return { isEmpty: true, value: null, normalizedString: '' };
  }

  const decimalMatch = stripped.match(TRAILING_DECIMAL_REGEX);
  let integerBigInt = 0n;

  if (decimalMatch && typeof decimalMatch.index === 'number') {
    const separatorIndex = decimalMatch.index;
    const decimalDigits = decimalMatch[2];
    const rawIntegerPart = stripped
      .slice(0, separatorIndex)
      .replace(/[.,]/g, '');
    const cleanIntegerStr = rawIntegerPart.replace(/^0+/, '') || '0';

    integerBigInt = BigInt(cleanIntegerStr);

    const firstDecimalDigit = Number(decimalDigits.charAt(0));
    if (firstDecimalDigit >= 5) {
      integerBigInt += 1n;
    }
  } else {
    const allDigits = stripped.replace(/[.,]/g, '');
    const cleanDigitsStr = allDigits.replace(/^0+/, '') || '0';
    integerBigInt = BigInt(cleanDigitsStr);
  }

  const normalizedString = integerBigInt.toString();

  // Konversi ke Number JS yang aman tanpa memotong diam-diam nilai > 999.999.999
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  const numericValue =
    integerBigInt > maxSafe
      ? Number.MAX_SAFE_INTEGER
      : Number(integerBigInt);

  return {
    isEmpty: false,
    value: numericValue,
    normalizedString,
  };
}

/**
 * Menangani perubahan teks pada TextInput Nominal:
 * - Saat pengguna mengetik 1 karakter biasa: hanya karakter digit (0-9) yang diterima, leading zero dinormalisasi.
 * - Saat pengguna melakukan Paste (penambahan > 1 karakter sekaligus atau mengandung titik/koma/Rp):
 *   langsung dinormalisasi menggunakan parseAmountInput tanpa memotong nilai > 999.999.999 diam-diam.
 *
 * @param {string} prevText Nilai input sebelumnya
 * @param {string} nextText Nilai input baru dari onChangeText
 * @returns {string} Nilai string bersih untuk disimpan di state input
 */
export function handleAmountTextChange(prevText = '', nextText = '') {
  if (!nextText) {
    return '';
  }

  const deltaLength = nextText.length - prevText.length;
  const hasFormattingChars = /[.,a-zA-Z\s]/.test(nextText);
  const isPasteAction = deltaLength > 1 || hasFormattingChars;

  if (isPasteAction) {
    const parsed = parseAmountInput(nextText);
    return parsed.isEmpty ? '' : parsed.normalizedString;
  }

  // Ketik per karakter: hanya izinkan digit
  const digitsOnly = nextText.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return '';
  }

  // Buang leading zero kecuali nilainya memang tunggal "0"
  return digitsOnly.replace(/^0+(?=\d)/, '');
}

/**
 * Memformat angka integer menjadi format Rupiah dengan titik ribuan tanpa Intl.
 * Contoh: 125000 -> "Rp125.000", 0 -> "Rp0"
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  const safeNum =
    typeof amount === 'number' && Number.isFinite(amount)
      ? Math.round(Math.abs(amount))
      : 0;
  const formattedDigits = String(safeNum).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return amount < 0 ? `-Rp${formattedDigits}` : `Rp${formattedDigits}`;
}

/**
 * Memformat nominal ke format ringkas (formatCompactIDR) bila nilai >= Rp100.000.000
 * sesuai aturan Bagian 3.4:
 * - Bila < Rp100.000.000 -> gunakan formatRupiah penuh.
 * - Satuan dipilih SETELAH pembulatan:
 *   - Jt (1 desimal, mis. Rp125,5 Jt)
 *   - M = miliar (2 desimal, mis. Rp1,25 M)
 *   - T = triliun (2 desimal)
 * - Bagian desimal ,0 atau ,00 dibuang.
 * - Nilai yang setelah pembulatan menjadi >= 1.000 Jt otomatis memakai M.
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatCompactIDR(amount) {
  const safeNum =
    typeof amount === 'number' && Number.isFinite(amount)
      ? Math.round(Math.abs(amount))
      : 0;

  if (safeNum < DOMAIN_LIMITS.COMPACT_IDR_THRESHOLD) {
    return formatRupiah(amount);
  }

  const prefix = amount < 0 ? '-Rp' : 'Rp';

  // Uji dalam satuan Juta dengan pembulatan 1 desimal (per 100.000)
  // tenthsOfMillion = Math.round(safeNum / 100_000) -> 1000.0 Jt berarti tenthsOfMillion >= 10000
  const tenthsOfMillion = Math.round(safeNum / 100000);
  if (tenthsOfMillion < 10000) {
    const wholeMillions = Math.floor(tenthsOfMillion / 10);
    const decimalTenths = tenthsOfMillion % 10;
    const formattedWhole = String(wholeMillions).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      '.'
    );
    if (decimalTenths === 0) {
      return `${prefix}${formattedWhole} Jt`;
    }
    return `${prefix}${formattedWhole},${decimalTenths} Jt`;
  }

  // Uji dalam satuan Miliar dengan pembulatan 2 desimal (per 10.000.000)
  // hundredthsOfBillion = Math.round(safeNum / 10_000_000) -> 1000.00 M berarti hundredthsOfBillion >= 100000
  const hundredthsOfBillion = Math.round(safeNum / 10000000);
  if (hundredthsOfBillion < 100000) {
    const wholeBillions = Math.floor(hundredthsOfBillion / 100);
    const decimalHundredths = hundredthsOfBillion % 100;
    const formattedWhole = String(wholeBillions).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      '.'
    );
    if (decimalHundredths === 0) {
      return `${prefix}${formattedWhole} M`;
    }
    const decStr = String(decimalHundredths).padStart(2, '0');
    return `${prefix}${formattedWhole},${decStr} M`;
  }

  // Satuan Triliun dengan pembulatan 2 desimal (per 10.000.000.000)
  const hundredthsOfTrillion = Math.round(safeNum / 10000000000);
  const wholeTrillions = Math.floor(hundredthsOfTrillion / 100);
  const decimalHundredths = hundredthsOfTrillion % 100;
  const formattedWhole = String(wholeTrillions).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  );
  if (decimalHundredths === 0) {
    return `${prefix}${formattedWhole} T`;
  }
  const decStr = String(decimalHundredths).padStart(2, '0');
  return `${prefix}${formattedWhole},${decStr} T`;
}

/**
 * Memformat proporsi persentase sesuai Bagian 3.4:
 * - Desimal koma 1 digit ("12,5%")
 * - Proporsi > 0 dan < 0,1% tampil "<0,1%"
 * @param {number} partAmount
 * @param {number} totalAmount
 * @returns {string}
 */
export function formatPercentage(partAmount, totalAmount) {
  if (
    typeof totalAmount !== 'number' ||
    totalAmount <= 0 ||
    typeof partAmount !== 'number' ||
    partAmount <= 0
  ) {
    return '0,0%';
  }

  const rawPercent = (partAmount / totalAmount) * 100;
  if (rawPercent > 0 && rawPercent < 0.1) {
    return '<0,1%';
  }

  const rounded = Math.round(rawPercent * 10) / 10;
  return `${rounded.toFixed(1).replace('.', ',')}%`;
}
