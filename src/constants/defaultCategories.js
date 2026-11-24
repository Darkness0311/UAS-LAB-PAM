/**
 * FINN v2.5 — Default Categories, Palettes, Icons & Domain Limits
 * Sesuai Bagian 4 (Modul 2, 3, 4) dan Bagian 5 Blueprint.
 */

export const DEFAULT_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'cat_exp_1',
    name: 'Makan & Minum',
    icon: 'fast-food-outline',
    color: '#EF4444',
    is_default: true,
  }),
  Object.freeze({
    id: 'cat_exp_2',
    name: 'Nongkrong & Hiburan',
    icon: 'cafe-outline',
    color: '#F59E0B',
    is_default: true,
  }),
  Object.freeze({
    id: 'cat_exp_3',
    name: 'Transportasi',
    icon: 'car-outline',
    color: '#3B82F6',
    is_default: true,
  }),
  Object.freeze({
    id: 'cat_exp_4',
    name: 'Kebutuhan Kampus',
    icon: 'school-outline',
    color: '#8B5CF6',
    is_default: true,
  }),
  Object.freeze({
    id: 'cat_exp_5',
    name: 'Belanja & Tagihan',
    icon: 'cart-outline',
    color: '#EC4899',
    is_default: true,
  }),
  Object.freeze({
    id: 'cat_exp_6',
    name: 'Pengeluaran Lainnya',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#64748B',
    is_default: true,
  }),
]);

export const DEFAULT_CATEGORY_IDS = Object.freeze(
  DEFAULT_CATEGORIES.map((category) => category.id)
);

/**
 * Fallback Null-Safe untuk transaksi orphan (ketika category_id tidak ditemukan di array categories).
 * Tidak pernah disimpan ke AsyncStorage dan tidak memunculkan chip/grup virtual di filter.
 */
export const ORPHAN_CATEGORY = Object.freeze({
  id: 'orphan',
  name: 'Tanpa Kategori',
  color: '#94A3B8',
  icon: 'help-circle-outline',
  is_default: false,
});

/**
 * 9 Warna Palet untuk Kategori Kustom (Bagian 4 — Modul 3)
 */
export const CATEGORY_COLOR_PALETTE = Object.freeze([
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#64748B',
]);

/**
 * 13 Ikon Ionicons untuk Kategori Kustom (Bagian 4 — Modul 3)
 */
export const CATEGORY_ICON_LIST = Object.freeze([
  'fast-food-outline',
  'cafe-outline',
  'car-outline',
  'school-outline',
  'cart-outline',
  'game-controller-outline',
  'medkit-outline',
  'shirt-outline',
  'home-outline',
  'barbell-outline',
  'gift-outline',
  'construct-outline',
  'ellipsis-horizontal-circle-outline',
]);

export const DEFAULT_CUSTOM_CATEGORY_COLOR = CATEGORY_COLOR_PALETTE[0]; // '#EF4444'
export const DEFAULT_CUSTOM_CATEGORY_ICON = CATEGORY_ICON_LIST[0]; // 'fast-food-outline'

export const RESERVED_CATEGORY_NAMES_LOWER = Object.freeze([
  'semua',
  'tanpa kategori',
]);

export const DOMAIN_LIMITS = Object.freeze({
  MAX_CUSTOM_CATEGORIES: 15,
  MIN_CATEGORY_NAME_LENGTH: 1,
  MAX_CATEGORY_NAME_LENGTH: 24,
  MIN_TRANSACTION_AMOUNT: 1,
  MAX_TRANSACTION_AMOUNT: 999999999,
  MAX_NOTE_LENGTH: 100,
  COMPACT_IDR_THRESHOLD: 100000000,
  MIN_PROGRESS_BAR_PERCENT: 2,
  TOAST_DURATION_MS: 2500,
});
