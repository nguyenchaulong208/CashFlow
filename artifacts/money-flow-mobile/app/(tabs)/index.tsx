import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FinanceFormSheet } from '@/components/FinanceFormSheet';
import { ScreenHeading, SectionTitle, TransactionRow, EmptyState } from '@/components/FinanceBits';
import { useFinance, formatMoney } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const [formOpen, setFormOpen] = useState(false);
  const monthTransactions = useMemo(() => {
    const now = new Date();
    return finance.transactions.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [finance.transactions]);
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const assetsValue = finance.assets.reduce((sum, item) => sum + item.value, 0);
  const cashValue = finance.assets.filter((item) => item.kind === 'cash').reduce((sum, item) => sum + item.value, 0);
  const totalIncome = finance.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = finance.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const debtsValue = finance.debts.reduce((sum, item) => sum + item.amount, 0);
  const available = cashValue + totalIncome - totalExpense;
  const netWorth = assetsValue + totalIncome - totalExpense - debtsValue;
  const month = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date());

  if (!finance.ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + (insets.top === 0 ? 67 : 14), paddingBottom: 114, paddingHorizontal: 20 }}>
        <ScreenHeading eyebrow="TÀI CHÍNH CỦA BẠN" title="Tổng quan" action={
          <Pressable onPress={() => router.push('/settings')} style={[styles.avatar, { backgroundColor: colors.successSoft }]} accessibilityLabel="Cài đặt">
            <Feather name="settings" size={19} color={colors.primary} />
          </Pressable>
        } />
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={styles.balanceTop}>
            <View><Text style={styles.balanceLabel}>TÀI SẢN RÒNG</Text><Text style={styles.balanceCaption}>Tổng tài sản trừ khoản phải trả</Text></View>
            <View style={styles.balanceIcon}><Feather name="activity" size={18} color="#E3F6EC" /></View>
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.balanceValue}>{formatMoney(netWorth)}</Text>
          <View style={styles.balanceFooter}>
            <View><Text style={styles.balanceSmallLabel}>Khả dụng</Text><Text style={styles.balanceSmallValue}>{formatMoney(available)}</Text></View>
            <View style={styles.balanceDivider} />
            <View><Text style={styles.balanceSmallLabel}>Nợ phải trả</Text><Text style={styles.balanceSmallValue}>{formatMoney(debtsValue)}</Text></View>
            <Feather name="arrow-up-right" size={19} color="#C8E6D7" />
          </View>
        </View>
        <View style={styles.monthRow}>
          <View><Text style={[styles.monthTitle, { color: colors.foreground }]}>Dòng tiền tháng này</Text><Text style={[styles.monthCaption, { color: colors.mutedForeground }]}>{month}</Text></View>
          <Pressable onPress={() => router.push('/analysis')} style={[styles.monthIcon, { backgroundColor: colors.card }]}><Feather name="bar-chart-2" size={18} color={colors.primary} /></Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}><Feather name="arrow-down-left" size={16} color={colors.primary} /></View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Thu nhập</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statValue, { color: colors.foreground }]}>{formatMoney(income, true)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.dangerSoft }]}><Feather name="arrow-up-right" size={16} color={colors.danger} /></View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Chi tiêu</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statValue, { color: colors.foreground }]}>{formatMoney(expense, true)}</Text>
          </View>
        </View>
        <View style={styles.quickActions}>
          <Pressable onPress={() => setFormOpen(true)} style={[styles.primaryAction, { backgroundColor: colors.primary }]} testID="add-transaction">
            <Feather name="plus" size={19} color="#FFFFFF" /><Text style={styles.primaryActionText}>Ghi giao dịch</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/assets')} style={[styles.secondaryAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="briefcase" size={17} color={colors.primary} /><Text style={[styles.secondaryActionText, { color: colors.foreground }]}>Tài sản & nợ</Text>
          </Pressable>
        </View>
        <SectionTitle title="Giao dịch gần đây" action="Xem tất cả" onPress={() => router.push('/transactions')} />
        {finance.transactions.length ? finance.transactions.slice(0, 4).map((item) => <TransactionRow key={item.id} item={item} />) :
          <EmptyState title="Bắt đầu ghi dòng tiền" detail="Giao dịch đầu tiên sẽ xuất hiện ở đây và được lưu riêng trên thiết bị." />}
        <View style={[styles.privacyNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={15} color={colors.primary} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>Dữ liệu được lưu trên thiết bị của bạn.</Text>
        </View>
      </ScrollView>
      <FinanceFormSheet visible={formOpen} mode="transaction" onClose={() => setFormOpen(false)}
        onSaveTransaction={finance.addTransaction} onSaveAsset={finance.addAsset} onSaveDebt={finance.addDebt} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  balanceCard: { borderRadius: 24, padding: 20, marginTop: 2, overflow: 'hidden' },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { color: '#DDF0E5', fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.35 },
  balanceCaption: { color: '#B8D9C8', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
  balanceIcon: { backgroundColor: 'rgba(255,255,255,0.14)', width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  balanceValue: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 31, letterSpacing: -0.8, marginTop: 19 },
  balanceFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', marginTop: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 18 },
  balanceSmallLabel: { color: '#C4E0D1', fontFamily: 'Inter_400Regular', fontSize: 10, marginBottom: 5 },
  balanceSmallValue: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.22)' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 },
  monthTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  monthCaption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  monthIcon: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 11 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 13 },
  statIcon: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 5 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 13 },
  primaryAction: { flex: 1, height: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  secondaryAction: { flex: 1, height: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1 },
  secondaryActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 22 },
  privacyText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});
