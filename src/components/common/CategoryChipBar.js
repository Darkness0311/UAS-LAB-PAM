/**
 * FINN v2.5 — Category Chip Filter Bar (Tab 1: Beranda)
 * Visual Redesign: Light-Mode Fintech Pill Chips
 * - Aktif: hitam (#111111) teks & ikon putih (#FFFFFF)
 * - Sekunder: mint sangat muda (#EEF4EF) teks abu (#6B7280) dengan ikon bulat rapi
 * Seluruh urutan chip, state, dan handler selectCategoryChip 100% tetap sama.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme.js';
import { useFinn } from '../../context/FinnContext.js';

export default function CategoryChipBar() {
  const { categories, selectedCategoryFilter, selectCategoryChip } = useFinn();

  const isAllSelected = selectedCategoryFilter === null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chip "Semua" */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={[styles.chip, isAllSelected && styles.chipActive]}
          onPress={() => selectCategoryChip(null)}
        >
          <View
            style={[
              styles.chipIconCircle,
              isAllSelected && styles.chipIconCircleActive,
            ]}
          >
            <Ionicons
              name="apps-outline"
              size={13}
              color={isAllSelected ? COLORS.ink : COLORS.textPrimary}
            />
          </View>
          <Text
            style={[styles.chipText, isAllSelected && styles.chipTextActive]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        {/* 6 Kategori Bawaan + Kategori Kustom sesuai urutan array categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.82}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => selectCategoryChip(cat.id)}
            >
              <View
                style={[
                  styles.chipIconCircle,
                  isSelected && styles.chipIconCircleActive,
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? COLORS.ink : cat.color}
                />
              </View>
              <Text
                style={[styles.chipText, isSelected && styles.chipTextActive]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SPACING.lg,
  },
  scrollContent: {
    paddingVertical: 2,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: RADIUS.full,
  },
  chipActive: {
    backgroundColor: COLORS.ink,
  },
  chipIconCircle: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  chipIconCircleActive: {
    backgroundColor: COLORS.lime,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
