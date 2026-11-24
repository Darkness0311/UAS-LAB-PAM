/**
 * FINN v2.5 — Design System (Light-Mode Fintech Dashboard — Bento Grid & Lime Accent)
 * Gaya visual flat, bersih, lapang, tanpa neon/glow. Kedalaman dibangun lewat kontras warna kartu.
 * Seluruh key ekspor lama tetap dipertahankan 100% demi kompatibilitas seluruh komponen.
 */

import { Platform } from 'react-native';

export const COLORS = Object.freeze({
  // Palet Inti Light-Mode Fintech
  background: '#EEECE6', // Warm off-white page canvas
  surface: '#FFFFFF', // Pure white default Bento card
  surfaceSubtle: '#EEF4EF', // Soft mint secondary chip & circular icon fill
  surfaceElevated: '#F7F6F2', // Warm subtle input / nested surface
  border: '#E5E3DC', // Hairline warm divider (tanpa border tebal)
  borderGlow: '#D5DBD6', // Neutral subtle border (tanpa neon)
  borderFocused: '#111111',

  // Aksen Utama & Pastel (Referensi Desain)
  lime: '#E6FF4F', // Kartu aksen 1 (Lime)
  limeStrong: '#A3E635', // Garis atas bar lime tegas
  limeDeep: '#65A30D', // Kontras tinggi lime pada latar terang
  pastelBlue: '#BFE6EA', // Kartu aksen 2 (Biru pastel)
  mint: '#EEF4EF', // Background chip & ikon bulat
  ink: '#111111', // Elemen aktif/kontras (nav aktif, chip aktif, tooltip)

  // Status & Tint
  positive: '#16A34A', // Nilai positif + ikon ▲
  negative: '#DC2626', // Nilai negatif + ikon ▼
  tintGreen: '#E6F8E1', // Tint status hijau muda
  tintCream: '#FDF3E1', // Tint status krem

  // Key kompatibilitas (dipetakan rapi ke palet Light-Mode Fintech)
  primary: '#111111',
  primaryBright: '#111111',
  primaryMid: '#262626',
  primaryDark: '#000000',
  primarySoft: '#EEF4EF',
  magenta: '#111111',
  magentaSoft: '#EEF4EF',
  cyanAccent: '#111111',
  cyanSoft: '#BFE6EA',
  cyanBorder: '#9FD3D8',

  // Tipografi (WCAG AA/AAA)
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#8B909A',

  // Semantik Error / Peringatan
  expenseRed: '#DC2626',
  expenseRedSolid: '#DC2626',
  orphanSlate: '#6B7280',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#FECACA',
  warningSoft: '#FDF3E1',
  warningBorder: '#F3DFB8',
  warningText: '#92400E',
  xpTrack: '#E6E4DD',
  disabledBg: '#E6E4DD',
  disabledText: '#9CA3AF',
  backdrop: 'rgba(17, 17, 17, 0.45)',
  white: '#FFFFFF',
});

export const FONT_FAMILY = Object.freeze({
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: "'Plus Jakarta Sans', 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    default: 'System',
  }),
  sansMedium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    web: "'Plus Jakarta Sans', 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    default: 'System',
  }),
});

export const TYPOGRAPHY = Object.freeze({
  // Judul kartu: semi-bold, sentence case (bukan uppercase)
  cardTitle: {
    fontFamily: FONT_FAMILY.sansMedium,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.sansMedium,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: COLORS.textPrimary,
  },
  // Angka statistik hero: bold 36-44px, letter-spacing -0.02em, tabular numbers
  statHero: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statValue: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  labelSecondary: {
    fontFamily: FONT_FAMILY.sans,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});

export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24, // Bento grid gap 24px
  xxxl: 32, // Container padding / generous spacing
  listBottomPadding: 112, // Ruang lega di atas floating pill bottom navbar (tetap >= 96)
});

export const RADIUS = Object.freeze({
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 32, // rounded-[32px] Bento cards
  full: 9999, // rounded-full buttons, chips, nav, circular icons
});

// Flat fintech: shadow maksimal sangat halus (tanpa neon atau bayangan tebal)
export const SHADOWS = Object.freeze({
  card: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  primaryCard: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  neonGlow: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  neonMagentaGlow: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pillBar: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  fab: {
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
});
