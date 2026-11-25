/**
 * FINN v2.5 — AnalyticsScreen (Tab 2: Analisis)
 * Visual Redesign: Light-Mode Fintech Dashboard (Bento Grid, Lime #E6FF4F, Pastel Blue #BFE6EA, Gauge Semi-Lingkaran)
 * - Header minimalis + Bento KPI 2 kolom (Lime & Biru Pastel)
 * - Selector Periode bersama, DonutChartCard flat, & SpendingGaugeCard semi-lingkaran bersegmen
 * - Peringkat Kategori bergaya tabel bersih dengan garis pemisah tipis
 * Seluruh hooks useFinn(), props, dan handler toggleAnalyticsCategoryHighlight 100% tetap sama.
 */

import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CategoryRankRow from '../components/analytics/CategoryRankRow.js';
import DonutChartCard from '../components/analytics/DonutChartCard.js';
import SpendingGaugeCard from '../components/analytics/SpendingGaugeCard.js';
import PeriodSelector from '../components/common/PeriodSelector.js';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme.js';
import { useFinn } from '../context/FinnContext.js';
import { formatCompactIDR } from '../utils/amountUtils.js';

const APP_BRAND_ICON = require('../../assets/icon.png');

export default function AnalyticsScreen() {
  const {
    periodLabel,
    homeSummary,
    analyticsSummary,
    toggleAnalyticsCategoryHighlight,
  } = useFinn();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
  const horizontalPadding = isWideLayout ? SPACING.xxxl : SPACING.lg;

  const {
    periodTotal,
    rankings,
    highlightedItem,
    effectiveHighlightedCatId,
    emptyStateMessage,
  } = analyticsSummary;

  const hasActiveCategories = periodTotal > 0 && rankings.length > 0;
  const topCategory = hasActiveCategories ? rankings[0] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 12) + 116,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Minimalis Fintech */}
        <View style={styles.topHeaderRow}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerIconCircle}>
              <Image
                source={APP_BRAND_ICON}
                style={styles.headerBrandImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.screenTitle}>Analisis</Text>
              <Text style={styles.screenSubtitle}>
                Proporsi &amp; peringkat pengeluaran
              </Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {rankings.length} kategori
            </Text>
          </View>
        </View>

        {/* Selector Periode Bersama (State sinkron dengan Tab 1 Beranda) */}
        <View style={styles.selectorWrap}>
          <PeriodSelector />
        </View>

        {/* Bento KPI Ringkasan Cepat (Lime #E6FF4F & Biru Pastel #BFE6EA) */}
        {Boolean(topCategory) && (
          <View style={styles.bentoStatsRow}>
            <View style={[styles.bentoStatCard, styles.bentoCardLime]}>
              <View style={styles.bentoStatHeader}>
                <View style={styles.bentoIconWhite}>
                  <Ionicons
                    name="trophy-outline"
                    size={15}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.bentoStatLabel} numberOfLines={1}>
                  Terbesar
                </Text>
              </View>
              <Text style={styles.bentoStatMain} numberOfLines={1}>
                {topCategory.category.name}
              </Text>
              <Text style={styles.bentoStatSubDark} numberOfLines={1}>
                ↗ {topCategory.percentageText} •{' '}
                {formatCompactIDR(topCategory.amount)}
              </Text>
            </View>

            <View style={[styles.bentoStatCard, styles.bentoCardPastel]}>
              <View style={styles.bentoStatHeader}>
                <View style={styles.bentoIconWhite}>
                  <Ionicons
                    name="pulse-outline"
                    size={15}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.bentoStatLabel} numberOfLines={1}>
                  Total periode
                </Text>
              </View>
              <Text
                style={styles.bentoStatAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {formatCompactIDR(periodTotal)}
              </Text>
              <Text style={styles.bentoStatSubDark} numberOfLines={1}>
                {rankings.length} kategori tercatat
              </Text>
            </View>
          </View>
        )}

        {/* Baris Bento Visualisasi: Donut Interaktif + Gauge Semi-Lingkaran */}
        <View
          style={[
            styles.chartsBentoRow,
            isWideLayout && hasActiveCategories && styles.chartsBentoRowWide,
          ]}
        >
          <View style={isWideLayout && hasActiveCategories ? styles.chartCol : undefined}>
            <DonutChartCard
              periodTotal={periodTotal}
              periodLabel={periodLabel}
              rankings={rankings}
              highlightedItem={highlightedItem}
              effectiveHighlightedCatId={effectiveHighlightedCatId}
              emptyStateMessage={emptyStateMessage}
              onToggleHighlight={toggleAnalyticsCategoryHighlight}
            />
          </View>

          {hasActiveCategories && (
            <View style={isWideLayout ? styles.chartCol : undefined}>
              <SpendingGaugeCard
                rankings={rankings}
                highlightedItem={highlightedItem}
                periodTotal={periodTotal}
                todayTotal={homeSummary.todayTotal}
                allTimeTotal={homeSummary.allTimeTotal}
              />
            </View>
          )}
        </View>

        {/* Daftar Peringkat Kategori (Header tabel bersih + garis tipis) */}
        {hasActiveCategories && (
          <View style={styles.rankingSection}>
            <View style={styles.rankingHeaderRow}>
              <Text style={styles.rankingSectionTitle}>
                Peringkat kategori ({rankings.length})
              </Text>

              {Boolean(highlightedItem) && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.clearHighlightBtn}
                  onPress={() =>
                    toggleAnalyticsCategoryHighlight(highlightedItem.categoryId)
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.clearHighlightText}>Reset sorotan</Text>
                </TouchableOpacity>
              )}
            </View>

            {rankings.map((item, index) => {
              const isHighlighted =
                effectiveHighlightedCatId === item.categoryId;
              const isDimmed =
                effectiveHighlightedCatId !== null && !isHighlighted;

              return (
                <CategoryRankRow
                  key={item.categoryId}
                  rankIndex={index}
                  item={item}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  onPressRow={toggleAnalyticsCategoryHighlight}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: SPACING.sm,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F6F0',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  headerBrandImage: {
    width: '100%',
    height: '100%',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  statusPill: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    ...SHADOWS.card,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  selectorWrap: {
    marginBottom: SPACING.lg,
  },
  bentoStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  bentoStatCard: {
    flex: 1,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  bentoCardLime: {
    backgroundColor: COLORS.lime,
  },
  bentoCardPastel: {
    backgroundColor: COLORS.pastelBlue,
  },
  bentoStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  bentoIconWhite: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoStatLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  bentoStatMain: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  bentoStatAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  bentoStatSubDark: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(17, 17, 17, 0.68)',
    fontVariant: ['tabular-nums'],
  },
  chartsBentoRow: {
    gap: SPACING.lg,
  },
  chartsBentoRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xxl,
  },
  chartCol: {
    flex: 1,
  },
  rankingSection: {
    marginTop: SPACING.xl,
  },
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankingSectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 20,
  },
  clearHighlightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: RADIUS.full,
  },
  clearHighlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
});
