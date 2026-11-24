/**
 * FINN v2.5 — Pure Visual Lime Gradient Bar Chart (Fintech Light Mode)
 * Memvisualisasikan data transaksi asli (homeSummary.filteredTransactions) sesuai periodMode aktif:
 * - Bar lebar bergradasi lime (#E6FF4F) memudar ke transparan + garis atas lime tegas
 * - Grid horizontal putus-putus tipis & label sumbu abu-abu
 * - Ketuk bar untuk menampilkan tooltip pill hitam (#111111) dengan panah kecil
 * - Animasi tumbuh dari bawah 260ms yang menghormati prefers-reduced-motion
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme.js';
import { formatCompactIDR } from '../../utils/amountUtils.js';
import { PERIOD_MODES } from '../../utils/dateUtils.js';
import useReducedMotion from '../common/useReducedMotion.js';

const SHORT_MONTHS = [
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
];

const CHART_HEIGHT = 136;

function buildBarBuckets(transactions, periodMode) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const bucketMap = new Map();

  if (periodMode === PERIOD_MODES.MONTH) {
    // Kelompokkan per minggu bulan (M1–M4) agar bar lebar, rapi, dan tidak menumpuk
    const labels = [
      { key: 'W1', label: 'M1', fullLabel: 'Minggu 1 (1–7)' },
      { key: 'W2', label: 'M2', fullLabel: 'Minggu 2 (8–14)' },
      { key: 'W3', label: 'M3', fullLabel: 'Minggu 3 (15–21)' },
      { key: 'W4', label: 'M4', fullLabel: 'Minggu 4 (22+)' },
    ];
    labels.forEach((b) =>
      bucketMap.set(b.key, { ...b, total: 0, count: 0 })
    );

    for (let i = 0; i < transactions.length; i += 1) {
      const tx = transactions[i];
      const dayNum = Number(String(tx.transaction_date || '').slice(8, 10)) || 1;
      const key =
        dayNum <= 7 ? 'W1' : dayNum <= 14 ? 'W2' : dayNum <= 21 ? 'W3' : 'W4';
      const entry = bucketMap.get(key);
      entry.total += tx.amount;
      entry.count += 1;
    }

    return Array.from(bucketMap.values());
  }

  if (periodMode === PERIOD_MODES.YEAR) {
    for (let i = 0; i < transactions.length; i += 1) {
      const tx = transactions[i];
      const mIdx = (Number(String(tx.transaction_date || '').slice(5, 7)) || 1) - 1;
      const safeIdx = Math.max(0, Math.min(11, mIdx));
      const key = String(safeIdx).padStart(2, '0');
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          key,
          label: SHORT_MONTHS[safeIdx],
          fullLabel: SHORT_MONTHS[safeIdx],
          total: 0,
          count: 0,
        });
      }
      const entry = bucketMap.get(key);
      entry.total += tx.amount;
      entry.count += 1;
    }

    return Array.from(bucketMap.values())
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(-7);
  }

  if (periodMode === PERIOD_MODES.ALL) {
    // Kelompokkan per bulan (YYYY-MM) hingga 7 bulan terakhir yang memiliki transaksi
    for (let i = 0; i < transactions.length; i += 1) {
      const tx = transactions[i];
      const ym = String(tx.transaction_date || '').slice(0, 7);
      const yearShort = ym.slice(2, 4);
      const mIdx = (Number(ym.slice(5, 7)) || 1) - 1;
      const monthName = SHORT_MONTHS[Math.max(0, Math.min(11, mIdx))];
      if (!bucketMap.has(ym)) {
        bucketMap.set(ym, {
          key: ym,
          label: monthName,
          fullLabel: `${monthName} '${yearShort}`,
          total: 0,
          count: 0,
        });
      }
      const entry = bucketMap.get(ym);
      entry.total += tx.amount;
      entry.count += 1;
    }

    return Array.from(bucketMap.values())
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(-7);
  }

  // PERIOD_MODES.WEEK: kelompokkan per tanggal transaksi dalam minggu terpilih
  for (let i = 0; i < transactions.length; i += 1) {
    const tx = transactions[i];
    const iso = String(tx.transaction_date || '');
    const dayStr = iso.slice(8, 10);
    const mIdx = (Number(iso.slice(5, 7)) || 1) - 1;
    const monthName = SHORT_MONTHS[Math.max(0, Math.min(11, mIdx))];
    if (!bucketMap.has(iso)) {
      bucketMap.set(iso, {
        key: iso,
        label: dayStr,
        fullLabel: `${Number(dayStr)} ${monthName}`,
        total: 0,
        count: 0,
      });
    }
    const entry = bucketMap.get(iso);
    entry.total += tx.amount;
    entry.count += 1;
  }

  return Array.from(bucketMap.values())
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .slice(-7);
}

export default function ExpenseBarChart({ transactions, periodMode }) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `limeBar_${safeId}`;
  const activeGradId = `limeBarActive_${safeId}`;

  const reduceMotion = useReducedMotion();
  const growAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const [selectedKey, setSelectedKey] = useState(null);

  const buckets = useMemo(
    () => buildBarBuckets(transactions, periodMode),
    [transactions, periodMode]
  );

  const maxAmount = useMemo(() => {
    let maxVal = 0;
    for (let i = 0; i < buckets.length; i += 1) {
      if (buckets[i].total > maxVal) {
        maxVal = buckets[i].total;
      }
    }
    return maxVal;
  }, [buckets]);

  const dataSignature = useMemo(
    () => `${periodMode}:${buckets.map((b) => `${b.key}-${b.total}`).join('|')}`,
    [periodMode, buckets]
  );

  useEffect(() => {
    setSelectedKey(null);
  }, [dataSignature]);

  useEffect(() => {
    if (reduceMotion) {
      growAnim.setValue(1);
      return;
    }
    growAnim.setValue(0);
    Animated.timing(growAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dataSignature, reduceMotion, growAnim]);

  const activeBucket = useMemo(() => {
    if (buckets.length === 0) {
      return null;
    }
    if (selectedKey) {
      return buckets.find((b) => b.key === selectedKey) || null;
    }
    return null;
  }, [buckets, selectedKey]);

  if (buckets.length === 0 || maxAmount <= 0) {
    return (
      <View style={styles.emptyChartBox}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="bar-chart-outline"
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
        <Text style={styles.emptyChartText}>
          Grafik pengeluaran akan muncul saat ada transaksi di periode ini.
        </Text>
      </View>
    );
  }

  const midAmount = Math.round(maxAmount / 2);

  return (
    <View style={styles.container}>
      {/* Baris Info / Tooltip Pill Hitam dengan Panah Kecil */}
      <View style={styles.tooltipSlot}>
        {activeBucket ? (
          <View style={styles.tooltipAnchor}>
            <View style={styles.tooltipPill}>
              <Text style={styles.tooltipLabel}>{activeBucket.fullLabel}</Text>
              <Text style={styles.tooltipDot}>•</Text>
              <Text style={styles.tooltipAmount}>
                {formatCompactIDR(activeBucket.total)}
              </Text>
            </View>
            <View style={styles.tooltipArrow} />
          </View>
        ) : (
          <Text style={styles.chartHintText}>
            Ketuk batang untuk melihat rincian nominal
          </Text>
        )}
      </View>

      {/* Area Grafik: Sumbu Y + Grid Putus-Putus + Batang Lime */}
      <View style={styles.plotRow}>
        {/* Label Sumbu Y Abu-abu */}
        <View style={styles.yAxisColumn}>
          <Text style={styles.axisLabel} numberOfLines={1}>
            {formatCompactIDR(maxAmount)}
          </Text>
          <Text style={styles.axisLabel} numberOfLines={1}>
            {formatCompactIDR(midAmount)}
          </Text>
          <Text style={styles.axisLabel}>Rp0</Text>
        </View>

        {/* Kanvas Bar & Grid Putus-Putus */}
        <View style={styles.plotArea}>
          {/* 3 Garis Grid Horizontal Putus-Putus Tipis */}
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={styles.dashedGridLine} />
            <View style={styles.dashedGridLine} />
            <View style={styles.dashedGridLine} />
          </View>

          <View style={styles.barsRow}>
            {buckets.map((bucket) => {
              const isSelected = selectedKey === bucket.key;
              const ratio = maxAmount > 0 ? bucket.total / maxAmount : 0;
              const targetHeight =
                bucket.total > 0
                  ? Math.max(12, Math.round(ratio * (CHART_HEIGHT - 14)))
                  : 0;

              const animatedHeight = growAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetHeight],
              });

              return (
                <TouchableOpacity
                  key={bucket.key}
                  activeOpacity={0.8}
                  style={styles.barColumn}
                  onPress={() =>
                    setSelectedKey((prev) =>
                      prev === bucket.key ? null : bucket.key
                    )
                  }
                  accessibilityLabel={`${bucket.fullLabel}: ${formatCompactIDR(bucket.total)}`}
                >
                  <View style={styles.barTrack}>
                    {targetHeight > 0 && (
                      <Animated.View
                        style={[styles.barShape, { height: animatedHeight }]}
                      >
                        <Svg
                          width="100%"
                          height="100%"
                          preserveAspectRatio="none"
                          style={StyleSheet.absoluteFill}
                        >
                          <Defs>
                            <LinearGradient
                              id={isSelected ? activeGradId : gradId}
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <Stop
                                offset="0%"
                                stopColor={COLORS.lime}
                                stopOpacity={isSelected ? 1 : 0.85}
                              />
                              <Stop
                                offset="70%"
                                stopColor={COLORS.lime}
                                stopOpacity={isSelected ? 0.45 : 0.25}
                              />
                              <Stop
                                offset="100%"
                                stopColor={COLORS.lime}
                                stopOpacity={0.03}
                              />
                            </LinearGradient>
                          </Defs>
                          <Rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill={`url(#${isSelected ? activeGradId : gradId})`}
                          />
                        </Svg>

                        {/* Garis Atas Lime Tegas */}
                        <View
                          style={[
                            styles.barTopCap,
                            isSelected && styles.barTopCapSelected,
                          ]}
                        />
                      </Animated.View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.xAxisLabel,
                      isSelected && styles.xAxisLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {bucket.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tooltipSlot: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  tooltipAnchor: {
    alignItems: 'center',
  },
  tooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  tooltipDot: {
    fontSize: 11,
    color: COLORS.lime,
  },
  tooltipAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.ink,
  },
  chartHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisColumn: {
    width: 58,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 2,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  plotArea: {
    flex: 1,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: CHART_HEIGHT - 6,
    justifyContent: 'space-between',
  },
  dashedGridLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    maxWidth: 44,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barShape: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  barTopCap: {
    width: '100%',
    height: 3.5,
    backgroundColor: COLORS.limeStrong,
    borderRadius: RADIUS.full,
  },
  barTopCapSelected: {
    backgroundColor: COLORS.ink,
    height: 4,
  },
  xAxisLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  xAxisLabelActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  emptyChartBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});
