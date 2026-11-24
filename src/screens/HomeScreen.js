/**
 * FINN v2.5 — HomeScreen (Tab 1: Beranda & Pencatatan Transaksi)
 * Visual Redesign: Light-Mode Fintech Dashboard (#EEECE6 off-white hangat + flat Bento cards + FAB kontras #111111).
 * Seluruh FlatList config, lookup kategori O(1), empty state, state txToDelete, dan handlers 100% tetap sama.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
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
import ConfirmDialog from '../components/common/ConfirmDialog.js';
import HomeHeader from '../components/home/HomeHeader.js';
import TransactionFormModal from '../components/home/TransactionFormModal.js';
import TransactionRow from '../components/home/TransactionRow.js';
import { ORPHAN_CATEGORY } from '../constants/defaultCategories.js';
import { MESSAGES } from '../constants/messages.js';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme.js';
import { useFinn } from '../context/FinnContext.js';
import { formatRupiah } from '../utils/amountUtils.js';

export default function HomeScreen() {
  const {
    categories,
    homeSummary,
    isBusy,
    openAddTransactionModal,
    openEditTransactionModal,
    deleteTransaction,
  } = useFinn();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 768 ? SPACING.xxxl : SPACING.lg;

  const [txToDelete, setTxToDelete] = useState(null);

  // Peta lookup kategori O(1) dengan referensi objek stabil untuk React.memo TransactionRow
  const categoryByIdMap = useMemo(() => {
    const map = {};
    for (let i = 0; i < categories.length; i += 1) {
      const cat = categories[i];
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  const handleRequestEdit = useCallback(
    (transactionId) => {
      openEditTransactionModal(transactionId);
    },
    [openEditTransactionModal]
  );

  const handleRequestDelete = useCallback((transactionObj) => {
    setTxToDelete(transactionObj);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (isBusy) {
      return;
    }
    setTxToDelete(null);
  }, [isBusy]);

  const handleConfirmDelete = useCallback(async () => {
    if (!txToDelete || isBusy) {
      return;
    }
    const targetId = txToDelete.id;
    const result = await deleteTransaction(targetId);
    if (result.ok) {
      setTxToDelete(null);
    }
  }, [txToDelete, isBusy, deleteTransaction]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderTransactionItem = useCallback(
    ({ item }) => {
      const resolvedCategory =
        categoryByIdMap[item.category_id] || ORPHAN_CATEGORY;
      return (
        <TransactionRow
          transaction={item}
          category={resolvedCategory}
          isBusy={isBusy}
          onPressEdit={handleRequestEdit}
          onPressDelete={handleRequestDelete}
        />
      );
    },
    [categoryByIdMap, isBusy, handleRequestEdit, handleRequestDelete]
  );

  // ListHeaderComponent diberikan sebagai elemen JSX (bukan fungsi inline) sesuai Bagian 2 & 7
  const headerElement = useMemo(() => <HomeHeader />, []);

  // ListEmptyComponent sebagai elemen JSX
  const emptyElement = useMemo(
    () => (
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="receipt-outline"
            size={28}
            color={COLORS.textPrimary}
          />
        </View>
        <Text style={styles.emptyStateTitle}>Belum ada transaksi</Text>
        <Text style={styles.emptyStateText}>
          {homeSummary.emptyStateMessage}
        </Text>
      </View>
    ),
    [homeSummary.emptyStateMessage]
  );

  const deleteConfirmMessage = useMemo(() => {
    if (!txToDelete) {
      return MESSAGES.DELETE_TRANSACTION_CONFIRM;
    }
    const cat = categoryByIdMap[txToDelete.category_id] || ORPHAN_CATEGORY;
    return `${MESSAGES.DELETE_TRANSACTION_CONFIRM}\n\n(${cat.name} • ${formatRupiah(txToDelete.amount)})`;
  }, [txToDelete, categoryByIdMap]);

  const fabBottomOffset = Math.max(insets.bottom, 12) + 74;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <FlatList
          data={homeSummary.filteredTransactions}
          keyExtractor={keyExtractor}
          renderItem={renderTransactionItem}
          ListHeaderComponent={headerElement}
          ListEmptyComponent={emptyElement}
          contentContainerStyle={[
            styles.listContentContainer,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(insets.bottom, 12) + 150,
            },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={false}
        />

        {/* FAB '+' Bulat Melayang Kontras (#111111 dengan ikon Lime #E6FF4F) */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isBusy}
          style={[
            styles.fabButton,
            { bottom: fabBottomOffset },
            isBusy && styles.fabButtonDisabled,
          ]}
          onPress={openAddTransactionModal}
          accessibilityLabel="Tambah pengeluaran"
        >
          <Ionicons name="add" size={28} color={COLORS.lime} />
        </TouchableOpacity>

        {/* Modal Form Tambah / Edit Transaksi */}
        <TransactionFormModal />

        {/* Dialog Konfirmasi Hapus Transaksi */}
        <ConfirmDialog
          visible={Boolean(txToDelete)}
          title="Hapus Transaksi?"
          message={deleteConfirmMessage}
          confirmText="Hapus"
          cancelText="Batal"
          confirmVariant="danger"
          disabled={isBusy}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContentContainer: {
    paddingBottom: 150,
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
  },
  emptyStateCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabButton: {
    position: 'absolute',
    right: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.fab,
  },
  fabButtonDisabled: {
    opacity: 0.45,
  },
});
