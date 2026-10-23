import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ScreenHeading } from '@/components/FinanceBits';
import { FinanceFormSheet } from '@/components/FinanceFormSheet';
import { AssetKind, useFinance, formatMoney } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

const kindNames: Record<AssetKind, string> = {
  cash: 'Tiền mặt & tiền gửi',
  investment: 'Đầu tư',
  property: 'Bất động sản',
  business: 'Kinh doanh',
  other: 'Tài sản khác',
};
const kindIcons: Record<AssetKind, keyof typeof Feather.glyphMap> = {
  cash: 'credit-card', investment: 'trending-up', property: 'home', business: 'briefcase', other: 'layers',
};

export default function AssetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const [formMode, setFormMode] = useState<'asset' | 'debt'>('asset');
  const [formOpen, setFormOpen] = useState(false);
  const declaredAssets = finance.assets.reduce((sum, item) => sum + item.value, 0);
  const netTransactions = finance.transactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0);
  const assetTotal = declaredAssets + netTransactions;
  const debtTotal = finance.debts.reduce((sum, item) => sum + item.amount, 0);
  const net = assetTotal - debtTotal;
  const openForm = (mode: 'asset' | 'debt') => { setFormMode(mode); setFormOpen(true); };
  const confirmDelete = (label: string, remove: () => void) => Alert.alert(`Xóa ${label}?`, 'Thao tác này không thể hoàn tác.', [
    { text: 'Giữ lại', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: remove },
  ]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + (insets.top === 0 ? 67 : 14), paddingHorizontal: 20, paddingBottom: 114 }}>
      <ScreenHeading eyebrow="BẢNG CÂN ĐỐI" title="Tài sản & nợ" />
      <View style={[styles.netCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.netLabel}>GIÁ TRỊ RÒNG</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.netValue}>{formatMoney(net)}</Text>
        <View style={styles.totalsRow}>
          <View><Text style={styles.totalCaption}>Tổng tài sản</Text><Text style={styles.totalValue}>{formatMoney(assetTotal, true)}</Text></View>
          <View style={styles.verticalLine} />
          <View><Text style={styles.totalCaption}>Tổng khoản nợ</Text><Text style={styles.totalValue}>{formatMoney(debtTotal, true)}</Text></View>
        </View>
      </View>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tài sản</Text>
        <Pressable onPress={() => openForm('asset')} style={[styles.smallAdd, { backgroundColor: colors.successSoft }]} testID="add-asset">
          <Feather name="plus" size={16} color={colors.primary} /><Text style={[styles.smallAddText, { color: colors.primary }]}>Thêm tài sản</Text>
        </Pressable>
      </View>
      {finance.assets.length ? finance.assets.map((asset) => <Pressable key={asset.id} onLongPress={() => confirmDelete(asset.name, () => finance.removeAsset(asset.id))}
        style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: colors.successSoft }]}><Feather name={kindIcons[asset.kind]} size={17} color={colors.primary} /></View>
        <View style={styles.itemMain}><Text style={[styles.itemName, { color: colors.foreground }]}>{asset.name}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{kindNames[asset.kind]}</Text></View>
        <Text style={[styles.itemAmount, { color: colors.foreground }]}>{formatMoney(asset.value)}</Text>
      </Pressable>) : <EmptyState title="Chưa có tài sản" detail="Thêm tiền mặt, khoản tiết kiệm, khoản đầu tư hoặc tài sản khác." />}
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Khoản phải trả</Text>
        <Pressable onPress={() => openForm('debt')} style={[styles.smallAdd, { backgroundColor: colors.dangerSoft }]} testID="add-debt">
          <Feather name="plus" size={16} color={colors.danger} /><Text style={[styles.smallAddText, { color: colors.danger }]}>Thêm khoản nợ</Text>
        </Pressable>
      </View>
      {finance.debts.length ? finance.debts.map((debt) => <Pressable key={debt.id} onLongPress={() => confirmDelete(debt.name, () => finance.removeDebt(debt.id))}
        style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: colors.dangerSoft }]}><Feather name="credit-card" size={17} color={colors.danger} /></View>
        <View style={styles.itemMain}><Text style={[styles.itemName, { color: colors.foreground }]}>{debt.name}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{debt.kind}</Text></View>
        <View style={styles.debtAmount}>
          <Text style={[styles.itemAmount, { color: colors.danger }]}>{formatMoney(debt.amount)}</Text>
          {!!debt.dueDate && <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Hạn {debt.dueDate}</Text>}
        </View>
      </Pressable>) : <EmptyState title="Chưa có khoản nợ" detail="Theo dõi dư nợ thẻ tín dụng, vay hoặc trả góp tại đây." />}
      <Text style={[styles.longPressHint, { color: colors.mutedForeground }]}>Nhấn giữ khoản mục để xóa.</Text>
    </ScrollView>
    <FinanceFormSheet visible={formOpen} mode={formMode} onClose={() => setFormOpen(false)}
      onSaveTransaction={finance.addTransaction} onSaveAsset={finance.addAsset} onSaveDebt={finance.addDebt} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  netCard: { borderRadius: 24, padding: 20, marginTop: 2 },
  netLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.3, color: '#DDF0E5' },
  netValue: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7, color: '#FFFFFF', marginTop: 10 },
  totalsRow: { flexDirection: 'row', gap: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 13, marginTop: 18 },
  totalCaption: { color: '#C4E0D1', fontFamily: 'Inter_400Regular', fontSize: 10, marginBottom: 5 },
  totalValue: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  verticalLine: { height: 30, width: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  smallAdd: { flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  smallAddText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  item: { borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  itemIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, marginRight: 11 },
  itemMain: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  itemAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginLeft: 8 },
  debtAmount: { alignItems: 'flex-end' },
  longPressHint: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 10 },
});
