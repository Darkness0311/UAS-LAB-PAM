/**
 * FINN v2.5 — Pure Visual Semi-Circular Segmented Gauge Card (Light-Mode Fintech)
 * Memetakan komponen gauge semi-lingkaran referensi ke data asli Finn (analyticsSummary & homeSummary):
 * - Arc bersegmen berujung membulat dengan gradasi merah -> oranye -> kuning -> hijau
 * - Titik penanda hitam (#111111) yang menyapu halus saat load (menghormati prefers-reduced-motion)
 * - Tiga mini-kartu perbandingan periode asli (hijau muda #E6F8E1 / krem #FDF3E1)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../constants/theme.js';
import { formatCompactIDR } from '../../utils/amountUtils.js';
import useReducedMotion from '../common/useReducedMotion.js';

const GAUGE_WIDTH = 244;
const GAUGE_HEIGHT = 136;
const CX = GAUGE_WIDTH / 2; // 122
const CY = 118;
const R = 90;
const ARC_STROKE = 14;

const SEGMENTS = [
  { startDeg: 176, endDeg: 139, color: '#DC2626' }, // Merah
  { startDeg: 131, endDeg: 94, color: '#F97316' }, // Oranye
  { startDeg: 86, endDeg: 49, color: '#EAB308' }, // Kuning
  { startDeg: 41, endDeg: 4, color: '#16A34A' }, // Hijau
];

function polarToCartesian(deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
  };
}

function describeArc(startDeg, endDeg) {
  const start = polarToCartesian(startDeg);
  const end = polarToCartesian(endDeg);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function getBalanceStatus(score) {
  if (score >= 75) {
    return { label: 'Sangat seimbang', color: COLORS.positive };
  }
  if (score >= 50) {
    return { label: 'Cukup seimbang', color: '#B45309' };
  }
  if (score >= 25) {
    return { label: 'Cenderung terpusat', color: '#C2410C' };
  }
  return { label: 'Sangat terpusat', color: COLORS.negative };
}

export default function SpendingGaugeCard({
  rankings,
  highlightedItem,
  periodTotal,
  todayTotal,
  allTimeTotal,
}) {
  const reduceMotion = useReducedMotion();

  const topShare =
    Array.isArray(rankings) && rankings.length > 0
      ? Math.max(0, Math.min(100, Math.round(rankings[0].rawPercentage || 0)))
      : 0;

  // Skor 0-100: jika kategori disorot tampilkan porsi kategori tersebut; default = indeks sebaran pengeluaran
  const isFocusedMode = Boolean(highlightedItem);
  const targetScore = isFocusedMode
    ? Math.max(0, Math.min(100, Math.round(highlightedItem.rawPercentage || 0)))
    : Math.max(0, Math.min(100, 100 - topShare));

  const statusInfo = isFocusedMode
    ? {
        label: highlightedItem.category.name,
        color: COLORS.textSecondary,
      }
    : getBalanceStatus(targetScore);

  const sweepAnim = useRef(
    new Animated.Value(reduceMotion ? targetScore : 0)
  ).current;
  const [renderedScore, setRenderedScore] = useState(
    reduceMotion ? targetScore : 0
  );

  useEffect(() => {
    const listenerId = sweepAnim.addListener(({ value }) => {
      setRenderedScore(value);
    });
    return () => {
      sweepAnim.removeListener(listenerId);
    };
  }, [sweepAnim]);

  useEffect(() => {
    if (reduceMotion) {
      sweepAnim.setValue(targetScore);
      setRenderedScore(targetScore);
      return;
    }
    sweepAnim.setValue(0);
    Animated.timing(sweepAnim, {
      toValue: targetScore,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [targetScore, reduceMotion, sweepAnim]);

  // Konversi skor 0..100 ke sudut 176°..4° pada arc semi-lingkaran
  const markerDeg = 176 - (Math.max(0, Math.min(100, renderedScore)) / 100) * 172;
  const markerPos = polarToCartesian(markerDeg);

  return (
    <View style={styles.card}>
      {/* Header Kartu */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircleMint}>
            <Ionicons name="speedometer-outline" size={16} color={COLORS.ink} />
          </View>
          <Text style={styles.cardTitle}>
            {isFocusedMode ? 'Porsi kategori' : 'Sebaran pengeluaran'}
          </Text>
        </View>

        <View style={styles.modePill}>
          <Text style={styles.modePillText}>
            {isFocusedMode ? 'Terfokus' : 'Indeks'}
          </Text>
        </View>
      </View>

      {/* Gauge Semi-Lingkaran Bersegmen */}
      <View style={styles.gaugeWrapper}>
        <Svg width={GAUGE_WIDTH} height={GAUGE_HEIGHT}>
          {SEGMENTS.map((seg) => (
            <Path
              key={`${seg.startDeg}_${seg.endDeg}`}
              d={describeArc(seg.startDeg, seg.endDeg)}
              fill="none"
              stroke={seg.color}
              strokeWidth={ARC_STROKE}
              strokeLinecap="round"
            />
          ))}

          {/* Titik Penanda Hitam dengan Ring Putih Tipis */}
          <Circle
            cx={markerPos.x}
            cy={markerPos.y}
            r={10}
            fill={COLORS.surface}
          />
          <Circle cx={markerPos.x} cy={markerPos.y} r={6.5} fill={COLORS.ink} />
        </Svg>

        {/* Angka Besar & Label Status di Tengah */}
        <View style={styles.gaugeCenterReadout} pointerEvents="none">
          <Text style={styles.gaugeScoreValue}>
            {Math.round(renderedScore)}
            {isFocusedMode ? '%' : ''}
          </Text>
          <Text
            style={[styles.gaugeStatusLabel, { color: statusInfo.color }]}
            numberOfLines={1}
          >
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* 3 Mini-Kartu Perbandingan Periode Asli (Hijau Muda #E6F8E1 / Krem #FDF3E1) */}
      <View style={styles.miniCardsRow}>
        <View style={[styles.miniCard, styles.miniCardGreen]}>
          <Text style={styles.miniCardLabel} numberOfLines={1}>
            Hari ini
          </Text>
          <Text
            style={styles.miniCardValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompactIDR(todayTotal)}
          </Text>
        </View>

        <View style={[styles.miniCard, styles.miniCardCream]}>
          <Text style={styles.miniCardLabel} numberOfLines={1}>
            Periode ini
          </Text>
          <Text
            style={styles.miniCardValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompactIDR(periodTotal)}
          </Text>
        </View>

        <View style={[styles.miniCard, styles.miniCardGreen]}>
          <Text style={styles.miniCardLabel} numberOfLines={1}>
            Semua waktu
          </Text>
          <Text
            style={styles.miniCardValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatCompactIDR(allTimeTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleMint: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
  },
  modePill: {
    backgroundColor: COLORS.mint,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  gaugeCenterReadout: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
    width: 150,
  },
  gaugeScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
  },
  gaugeStatusLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  miniCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  miniCardGreen: {
    backgroundColor: COLORS.tintGreen,
  },
  miniCardCream: {
    backgroundColor: COLORS.tintCream,
  },
  miniCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  miniCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
