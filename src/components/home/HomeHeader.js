/**
 * FINN v2.5 — Home ListHeaderComponent (Tab 1: Beranda)
 * Visual Redesign: Light-Mode Fintech Dashboard (Bento Grid, Lime #E6FF4F, Pastel Blue #BFE6EA, Flat & Clean)
 * Pemetaan komponen referensi ke data Finn asli (tanpa fitur/angka palsu):
 * - Top Navbar: Logo bulat + "Finn" di kiri, pill putih tanggal lokal hari ini di kanan
 * - Bento Statistik: Hero Card Lime (Total pengeluaran + mini sparkline data asli),
 *   Sub-Card Biru Pastel (Hari ini), Sub-Card Putih (Sepanjang waktu)
 * - Kartu Grafik Batang Lime + PeriodSelector (responsif 2 kolom di tablet, 1 kolom di mobile)
 * - Chip Kategori Pill (hitam aktif / mint sekunder) & Header Tabel Riwayat Transaksi
 * Seluruh hooks useFinn(), variabel data, dan kontrak format angka/tanggal 100% tetap sama.
 */

import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';
import { formatCompactIDR } from '../../utils/amountUtils.js';
import { formatIndonesianFullDate } from '../../utils/dateUtils.js';
import CategoryChipBar from '../common/CategoryChipBar.js';
import MiniSparkline from '../common/MiniSparkline.js';
import PeriodSelector from '../common/PeriodSelector.js';
import ExpenseBarChart from './ExpenseBarChart.js';

const APP_BRAND_ICON = require('../../../assets/icon.png');

export default function HomeHeader() {
  const { todayISO, periodState, periodLabel, homeSummary } = useFinn();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;

  const fullTodayText = formatIndonesianFullDate(todayISO);
  const formattedPeriodTotal = formatCompactIDR(homeSummary.periodTotal);
  const formattedTodayTotal = formatCompactIDR(homeSummary.todayTotal);
  const formattedAllTimeTotal = formatCompactIDR(homeSummary.allTimeTotal);

  // Kalkulasi murni visual dari data asli homeSummary (bebas division by zero)
  const periodSharePercent =
    homeSummary.allTimeTotal > 0 && homeSummary.periodTotal > 0
      ? Math.min(
          100,
          Math.round((homeSummary.periodTotal / homeSummary.allTimeTotal) * 100)
        )
      : 0;

  // Rangkaian nilai harian asli untuk sparkline tipis pada kartu statistik utama
  const dailySparklineValues = useMemo(() => {
    const txs = homeSummary.filteredTransactions;
    if (!Array.isArray(txs) || txs.length < 2) {
      return [];
    }
    const byDate = new Map();
    for (let i = 0; i < txs.length; i += 1) {
      const d = txs[i].transaction_date;
      byDate.set(d, (byDate.get(d) || 0) + txs[i].amount);
    }
    const ordered = Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map((entry) => entry[1]);
    return ordered.length >= 2 ? ordered.slice(-10) : [];
  }, [homeSummary.filteredTransactions]);

  return (
    <View style={styles.container}>
      {/* 1. Top Navbar Minimalis: Logo kiri, Pill Putih Tanggal Hari Ini di kanan */}
      <View style={styles.topHeaderRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandAvatarCircle}>
            <Image
              source={APP_BRAND_ICON}
              style={styles.brandIconImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.brandTitle}>Finn</Text>
        </View>

        <View style={styles.datePill}>
          <View style={styles.dateIconCircle}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textPrimary}
            />
          </View>
          <Text style={styles.dateHeaderText} numberOfLines={1}>
            {fullTodayText}
          </Text>
        </View>
      </View>

      {/* 2. Baris Bento Utama (Responsif: 2 kolom di tablet >=768px, 1 kolom di mobile) */}
      <View style={[styles.bentoMainRow, isWideLayout && styles.bentoMainRowWide]}>
        {/* Kolom Kiri: Kartu Statistik (Hero Lime + 2 Sub-Kartu Pastel Blue & White) */}
        <View style={isWideLayout ? styles.bentoColumn : undefined}>
          {/* Kartu Utama Aksen 1 (Lime #E6FF4F) — Total Pengeluaran */}
          <View style={styles.mainCard}>
            <View style={styles.mainCardTopRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.heroIconCircle}>
                  <Ionicons
                    name="wallet-outline"
                    size={18}
                    color={COLORS.ink}
                  />
                </View>
                <View style={styles.heroTitleCol}>
                  <Text style={styles.mainCardLabel} numberOfLines={1}>
                    Total pengeluaran
                  </Text>
                  <Text style={styles.mainCardPeriodSub} numberOfLines={1}>
                    {periodLabel}
                  </Text>
                </View>
              </View>

              {/* Sparkline tipis dari data transaksi asli (otomatis dilewati bila < 2 titik) */}
              <MiniSparkline
                values={dailySparklineValues}
                color={COLORS.ink}
                width={72}
                height={30}
                strokeWidth={2}
              />
            </View>

            <View style={styles.mainCardBottom}>
              <View style={styles.metaBadgeRow}>
                <View style={styles.limeStatChip}>
                  <Text style={styles.limeStatChipText}>
                    {homeSummary.allTimeTotal > 0
                      ? `↗ ${periodSharePercent}% dari total`
                      : `${homeSummary.filteredCount} transaksi`}
                  </Text>
                </View>
                <Text style={styles.heroTxCountText}>
                  {homeSummary.filteredCount} catatan
                </Text>
              </View>

              <Text
                style={styles.mainCardAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.58}
              >
                {formattedPeriodTotal}
              </Text>
            </View>
          </View>

          {/* Sub-Kartu 2 Kolom: Kiri (Biru Pastel #BFE6EA) & Kanan (Putih #FFFFFF) */}
          <View style={styles.subCardsRow}>
            {/* Sub-Kartu Kiri: Hari Ini (Biru Pastel) */}
            <View style={[styles.subCard, styles.subCardPastel]}>
              <View style={styles.subCardHeaderRow}>
                <View style={styles.subIconCircleWhite}>
                  <Ionicons
                    name="today-outline"
                    size={16}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.subCardTitle} numberOfLines={1}>
                  Hari ini
                </Text>
              </View>

              <Text
                style={styles.subCardAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
              >
                {formattedTodayTotal}
              </Text>

              <Text style={styles.subCardCaptionDark} numberOfLines={1}>
                Tanggal {todayISO}
              </Text>
            </View>

            {/* Sub-Kartu Kanan: Sepanjang Waktu (Putih) */}
            <View style={[styles.subCard, styles.subCardWhite]}>
              <View style={styles.subCardHeaderRow}>
                <View style={styles.subIconCircleMint}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.subCardTitle} numberOfLines={1}>
                  Sepanjang waktu
                </Text>
              </View>

              <Text
                style={styles.subCardAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
              >
                {formattedAllTimeTotal}
              </Text>

              <Text style={styles.subCardCaption} numberOfLines={1}>
                {homeSummary.allTimeCount} transaksi
              </Text>
            </View>
          </View>
        </View>

        {/* Kolom Kanan: Selector Periode & Kartu Grafik Batang Lime */}
        <View style={isWideLayout ? styles.bentoColumn : undefined}>
          <View style={styles.periodSelectorSection}>
            <PeriodSelector />
          </View>

          <View style={styles.barChartCard}>
            <View style={styles.barChartHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.subIconCircleMint}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={16}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.chartCardTitle}>Ringkasan grafik</Text>
              </View>

              <View style={styles.chartPeriodPill}>
                <Text style={styles.chartPeriodPillText} numberOfLines={1}>
                  {periodLabel}
                </Text>
              </View>
            </View>

            <ExpenseBarChart
              transactions={homeSummary.filteredTransactions}
              periodMode={periodState.periodMode}
            />
          </View>
        </View>
      </View>

      {/* 3. Chip Filter Kategori (Pill Aktif Hitam / Sekunder Mint) */}
      <CategoryChipBar />

      {/* 4. Header Tabel Riwayat Transaksi (Tanpa background berat + satu garis pemisah tipis) */}
      <View style={styles.tableHeaderBlock}>
        <View style={styles.tableHeaderTopRow}>
          <Text style={styles.tableTitle}>Riwayat transaksi</Text>
          <View style={styles.countBadgeMint}>
            <Text style={styles.countBadgeText}>
              {homeSummary.filteredCount} item
            </Text>
          </View>
        </View>
        <Text
          style={styles.subTotalText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.74}
        >
          {homeSummary.subTotalBarText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: RADIUS.full,
    maxWidth: '66%',
    ...SHADOWS.card,
  },
  dateIconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bentoMainRow: {
    gap: SPACING.lg,
  },
  bentoMainRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xxl,
  },
  bentoColumn: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: COLORS.lime,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    marginBottom: SPACING.lg,
    ...SHADOWS.primaryCard,
  },
  mainCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    flex: 1,
  },
  mainCardLabel: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
    color: COLORS.ink,
  },
  mainCardPeriodSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(17, 17, 17, 0.64)',
    marginTop: 1,
  },
  mainCardBottom: {
    gap: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limeStatChip: {
    backgroundColor: 'rgba(17, 17, 17, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  limeStatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  heroTxCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(17, 17, 17, 0.65)',
  },
  mainCardAmount: {
    ...TYPOGRAPHY.statHero,
  },
  subCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  subCard: {
    flex: 1,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  subCardPastel: {
    backgroundColor: COLORS.pastelBlue,
  },
  subCardWhite: {
    backgroundColor: COLORS.surface,
  },
  subCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  subIconCircleWhite: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subIconCircleMint: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  subCardAmount: {
    ...TYPOGRAPHY.statValue,
    marginBottom: 4,
  },
  subCardCaptionDark: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(17, 17, 17, 0.64)',
  },
  subCardCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodSelectorSection: {
    marginBottom: SPACING.lg,
  },
  barChartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  barChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  chartCardTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
  },
  chartPeriodPill: {
    backgroundColor: COLORS.mint,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    maxWidth: '45%',
  },
  chartPeriodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tableHeaderBlock: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tableTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 20,
  },
  countBadgeMint: {
    backgroundColor: COLORS.mint,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  subTotalText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
