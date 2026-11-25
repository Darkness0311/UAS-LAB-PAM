/**
 * FINN v2.5 — CategoryDataScreen (Tab 3: Kategori & Data)
 * Visual Redesign: Light-Mode Fintech Dashboard (Bento Grid, Lime #E6FF4F, Pastel Blue #BFE6EA, Flat & Clean)
 * - Header minimalis + Bento Mini-Stat 2 kolom (Lime & Biru Pastel)
 * - Form kategori kustom, daftar kategori bergaya tabel bersih, kartu Ekspor CSV pill hitam, & panel Zona Berbahaya
 * Seluruh hooks useFinn(), navigation, state, dan event handlers 100% tetap sama.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import CategoryFormCard from '../components/categories/CategoryFormCard.js';
import CategoryRow from '../components/categories/CategoryRow.js';
import ResetDataModal from '../components/categories/ResetDataModal.js';
import ConfirmDialog from '../components/common/ConfirmDialog.js';
import { MESSAGES } from '../constants/messages.js';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme.js';
import { useFinn } from '../context/FinnContext.js';
import { getExportCsvFileName } from '../utils/csvUtils.js';

const APP_BRAND_ICON = require('../../assets/icon.png');

export default function CategoryDataScreen({ navigation }) {
  const {
    categories,
    transactions,
    categoryUsageMap,
    editingCategoryId,
    todayISO,
    isBusy,
    startEditingCategory,
    deleteCustomCategory,
    prepareViewCategoryTransactions,
    exportAllTransactionsCsv,
    resetAllAppData,
  } = useFinn();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
  const horizontalPadding = isWideLayout ? SPACING.xxxl : SPACING.lg;

  const scrollRef = useRef(null);

  // State konfirmasi hapus kategori kustom (0 transaksi)
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // State modal Reset Semua Data (2 langkah)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // State status & indikator khusus Ekspor / Reset
  const [isExporting, setIsExporting] = useState(false);
  const [dataSectionFeedback, setDataSectionFeedback] = useState(null); // { type: 'info'|'error'|'success', text: string }

  // Handler mulai edit kategori kustom & gulir ke atas menuju form
  const handleStartEditCategory = useCallback(
    (categoryId) => {
      startEditingCategory(categoryId);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      }
    },
    [startEditingCategory]
  );

  // Handler tombol "Lihat transaksi" pada kategori terpakai (Bagian 4 Modul 3)
  const handleViewCategoryTransactions = useCallback(
    (categoryId) => {
      prepareViewCategoryTransactions(categoryId);
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Beranda');
      }
    },
    [prepareViewCategoryTransactions, navigation]
  );

  // Handler permintaan hapus kategori kustom (0 transaksi)
  const handleRequestDeleteCategory = useCallback((categoryObj) => {
    setCategoryToDelete(categoryObj);
  }, []);

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete || isBusy) {
      return;
    }
    const targetId = categoryToDelete.id;
    const res = await deleteCustomCategory(targetId);
    if (res.ok) {
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, isBusy, deleteCustomCategory]);

  // Handler Ekspor CSV
  const handlePressExportCsv = useCallback(async () => {
    if (isBusy || isExporting) {
      return;
    }
    setDataSectionFeedback(null);
    setIsExporting(true);

    try {
      const result = await exportAllTransactionsCsv();

      if (!result.ok) {
        if (result.isEmpty) {
          setDataSectionFeedback({
            type: 'info',
            text: MESSAGES.EXPORT_EMPTY,
          });
        } else if (result.message) {
          setDataSectionFeedback({
            type: 'error',
            text: result.message,
          });
        }
        return;
      }

      setDataSectionFeedback({
        type: 'success',
        text: `File ${result.fileName} berhasil disiapkan.`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [isBusy, isExporting, exportAllTransactionsCsv]);

  // Handler Konfirmasi Final Reset Semua Data (setelah ketik "RESET")
  const handleConfirmResetAll = useCallback(async () => {
    if (isBusy) {
      return;
    }
    setDataSectionFeedback(null);
    const result = await resetAllAppData();
    if (result.ok) {
      setIsResetModalOpen(false);
      setDataSectionFeedback({
        type: 'info',
        text: 'Seluruh data berhasil direset ke kondisi awal.',
      });
    }
  }, [isBusy, resetAllAppData]);

  const expectedCsvFileName = getExportCsvFileName(todayISO);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 12) + 116,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <View style={styles.titleCol}>
              <Text style={styles.screenTitle}>Kategori &amp; data</Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                Kelola kategori, ekspor CSV, &amp; reset data
              </Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {categories.length} kategori
            </Text>
          </View>
        </View>

        {/* Bento Mini-Stat Strip (Lime #E6FF4F & Biru Pastel #BFE6EA) */}
        <View style={styles.bentoStatsRow}>
          <View style={[styles.bentoStatCard, styles.bentoCardLime]}>
            <View style={styles.bentoStatHeader}>
              <View style={styles.bentoIconWhite}>
                <Ionicons
                  name="pricetags-outline"
                  size={15}
                  color={COLORS.ink}
                />
              </View>
              <Text style={styles.bentoStatLabel} numberOfLines={1}>
                Total kategori
              </Text>
            </View>
            <Text style={styles.bentoStatValue}>{categories.length}</Text>
            <Text style={styles.bentoStatCaptionDark}>6 bawaan + kustom</Text>
          </View>

          <View style={[styles.bentoStatCard, styles.bentoCardPastel]}>
            <View style={styles.bentoStatHeader}>
              <View style={styles.bentoIconWhite}>
                <Ionicons
                  name="server-outline"
                  size={15}
                  color={COLORS.ink}
                />
              </View>
              <Text style={styles.bentoStatLabel} numberOfLines={1}>
                Log tersimpan
              </Text>
            </View>
            <Text style={styles.bentoStatValue}>{transactions.length}</Text>
            <Text style={styles.bentoStatCaptionDark}>
              100% lokal di perangkat
            </Text>
          </View>
        </View>

        {/* Layout Bento Utama (Responsif: 2 kolom di tablet >= 768px, 1 kolom di mobile) */}
        <View
          style={[
            styles.mainBentoGrid,
            isWideLayout && styles.mainBentoGridWide,
          ]}
        >
          {/* Kolom 1: Form Tambah/Edit Kategori + Data & Pencadangan */}
          <View style={isWideLayout ? styles.leftCol : undefined}>
            <CategoryFormCard />

            {/* Modul 5 — Data: Ekspor CSV & Reset Semua Data */}
            <View style={styles.dataManagementCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconCircleMint}>
                  <Ionicons
                    name="server-outline"
                    size={16}
                    color={COLORS.ink}
                  />
                </View>
                <Text style={styles.cardHeaderTitle}>Data &amp; pencadangan</Text>
              </View>

              <Text style={styles.dataDescription}>
                Seluruh data disimpan 100% lokal di perangkat Anda. Ekspor
                riwayat transaksi ke format CSV ({expectedCsvFileName}) secara
                berkala untuk pencadangan.
              </Text>

              {Boolean(dataSectionFeedback) && (
                <View
                  style={[
                    styles.feedbackBanner,
                    dataSectionFeedback.type === 'error' &&
                      styles.feedbackBannerError,
                    dataSectionFeedback.type === 'success' &&
                      styles.feedbackBannerSuccess,
                  ]}
                >
                  <Ionicons
                    name={
                      dataSectionFeedback.type === 'error'
                        ? 'alert-circle-outline'
                        : dataSectionFeedback.type === 'success'
                          ? 'checkmark-circle-outline'
                          : 'information-circle-outline'
                    }
                    size={18}
                    color={
                      dataSectionFeedback.type === 'error'
                        ? COLORS.negative
                        : dataSectionFeedback.type === 'success'
                          ? COLORS.positive
                          : COLORS.warningText
                    }
                  />
                  <Text
                    style={[
                      styles.feedbackBannerText,
                      dataSectionFeedback.type === 'error' && {
                        color: COLORS.negative,
                      },
                      dataSectionFeedback.type === 'success' && {
                        color: COLORS.positive,
                      },
                    ]}
                  >
                    {dataSectionFeedback.text}
                  </Text>
                </View>
              )}

              {/* Tombol Ekspor CSV Pill Hitam */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isBusy || isExporting}
                style={[
                  styles.exportButton,
                  (isBusy || isExporting) && styles.buttonDisabled,
                ]}
                onPress={handlePressExportCsv}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={COLORS.lime} />
                ) : (
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={COLORS.lime}
                  />
                )}
                <Text style={styles.exportButtonText}>
                  {isExporting
                    ? 'Menyiapkan CSV...'
                    : `Ekspor CSV (${transactions.length} Transaksi)`}
                </Text>
              </TouchableOpacity>

              {/* Sub-Panel Zona Berbahaya */}
              <View style={styles.dangerZonePanel}>
                <View style={styles.dangerZoneHeader}>
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color={COLORS.negative}
                  />
                  <Text style={styles.dangerZoneTitle}>Zona berbahaya</Text>
                </View>
                <Text style={styles.dangerZoneDescription}>
                  Menghapus seluruh transaksi dan mengembalikan kategori ke 6
                  kategori bawaan. Tindakan ini tidak dapat dibatalkan.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isBusy}
                  style={[styles.resetButton, isBusy && styles.buttonDisabled]}
                  onPress={() => {
                    setDataSectionFeedback(null);
                    setIsResetModalOpen(true);
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color={COLORS.negative}
                  />
                  <Text style={styles.resetButtonText}>Reset Semua Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Kolom 2: Daftar Kategori (6 Bawaan + Kustom di Bawah) */}
          <View
            style={[
              styles.sectionBlock,
              isWideLayout && styles.rightCol,
            ]}
          >
            <View style={styles.tableHeaderRow}>
              <Text style={styles.sectionTitle}>
                Daftar kategori ({categories.length})
              </Text>
              <View style={styles.countPillMint}>
                <Text style={styles.countPillText}>6 bawaan</Text>
              </View>
            </View>

            {categories.map((cat) => {
              const usageCount = categoryUsageMap[cat.id] || 0;
              const isEditingThis = editingCategoryId === cat.id;

              return (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  usageCount={usageCount}
                  isEditingThis={isEditingThis}
                  isBusy={isBusy}
                  onPressEdit={handleStartEditCategory}
                  onPressDelete={handleRequestDeleteCategory}
                  onPressViewTransactions={handleViewCategoryTransactions}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Dialog Konfirmasi Hapus Kategori Kustom (0 Transaksi) */}
      <ConfirmDialog
        visible={Boolean(categoryToDelete)}
        title="Hapus Kategori?"
        message={
          categoryToDelete
            ? MESSAGES.DELETE_CATEGORY_CONFIRM(categoryToDelete.name)
            : ''
        }
        confirmText="Hapus Kategori"
        cancelText="Batal"
        confirmVariant="danger"
        disabled={isBusy}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
      />

      {/* Modal Konfirmasi Reset Semua Data (Dua Langkah: Peringatan + Ketik "RESET") */}
      <ResetDataModal
        visible={isResetModalOpen}
        isBusy={isBusy}
        transactionCount={transactions.length}
        onClose={() => setIsResetModalOpen(false)}
        onPressExportFirst={handlePressExportCsv}
        onConfirmReset={handleConfirmResetAll}
      />
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
  titleCol: {
    flex: 1,
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
  bentoStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
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
  bentoStatValue: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  bentoStatCaptionDark: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(17, 17, 17, 0.65)',
  },
  mainBentoGrid: {
    gap: SPACING.lg,
  },
  mainBentoGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xxl,
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
  },
  sectionBlock: {
    marginBottom: SPACING.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 20,
  },
  countPillMint: {
    backgroundColor: COLORS.mint,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dataManagementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  cardIconCircleMint: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 17,
  },
  dataDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.tintCream,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  feedbackBannerError: {
    backgroundColor: COLORS.dangerSoft,
  },
  feedbackBannerSuccess: {
    backgroundColor: COLORS.tintGreen,
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  dangerZonePanel: {
    backgroundColor: '#FEF7F7',
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dangerZoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.negative,
  },
  dangerZoneDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerSoft,
    paddingVertical: 13,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.negative,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
