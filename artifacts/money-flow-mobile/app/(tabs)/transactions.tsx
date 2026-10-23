import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ScreenHeading, TransactionRow } from '@/components/FinanceBits';
import { FinanceFormSheet } from '@/components/FinanceFormSheet';
import { useFinance, formatMoney, TransactionType } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | TransactionType;

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const filtered = useMemo(() => finance.transactions.filter((item) => filter === 'all' || item.type === filter), [finance.transactions, filter]);
  const sum = filtered.reduce((total, item) => total + (item.type === 'income' ? item.amount : -item.amount), 0);
  const removeItem = (id: string) => Alert.alert('Xóa giao dịch?', 'Thao tác này không thể hoàn tác.', [
    { text: 'Giữ lại', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => finance.removeTransaction(id) },
  ]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + (insets.top === 0 ? 67 : 14), paddingHorizontal: 20, paddingBottom: 115 }}>
      <ScreenHeading eyebrow="SỔ THU CHI" title="Giao dịch" action={
        <Pressable onPress={() => setFormOpen(true)} style={[styles.addButton, { backgroundColor: colors.primary }]} accessibilityLabel="Thêm giao dịch" testID="add-transaction">
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      } />
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>SỐ GIAO DỊCH</Text>
        <View style={styles.summaryBottom}><Text style={[styles.summaryCount, { color: colors.foreground }]}>{filtered.length}</Text>
          <Text style={[styles.summaryTotal, { color: sum >= 0 ? colors.primary : colors.danger }]}>{sum >= 0 ? '+' : '−'}{formatMoney(Math.abs(sum))}</Text>
        </View>
      </View>
      <View style={[styles.filters, { backgroundColor: colors.muted }]}>
        {([{ key: 'all', label: 'Tất cả' }, { key: 'income', label: 'Thu' }, { key: 'expense', label: 'Chi' }] as const).map((item) =>
          <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && { backgroundColor: colors.card }]}>
            <Text style={[styles.filterText, { color: filter === item.key ? colors.foreground : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>)}
      </View>
      {filtered.length ? <View style={{ marginTop: 13 }}>
        {filtered.map((item) => <TransactionRow key={item.id} item={item} onLongPress={() => removeItem(item.id)} />)}
      </View> : <EmptyState title={filter === 'all' ? 'Chưa có giao dịch' : `Chưa có ${filter === 'income' ? 'thu nhập' : 'chi tiêu'}`}
        detail="Thêm khoản đầu tiên để bắt đầu theo dõi dòng tiền." />}
      {!!filtered.length && <Text style={[styles.hint, { color: colors.mutedForeground }]}>Nhấn giữ một giao dịch để xóa.</Text>}
    </ScrollView>
    <FinanceFormSheet visible={formOpen} mode="transaction" onClose={() => setFormOpen(false)}
      onSaveTransaction={finance.addTransaction} onSaveAsset={finance.addAsset} onSaveDebt={finance.addDebt} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  addButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  summary: { borderWidth: 1, borderRadius: 19, padding: 16, marginTop: 2 },
  summaryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 },
  summaryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 9 },
  summaryCount: { fontFamily: 'Inter_700Bold', fontSize: 27 },
  summaryTotal: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  filters: { flexDirection: 'row', borderRadius: 14, padding: 4, marginTop: 17 },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 13 },
});
