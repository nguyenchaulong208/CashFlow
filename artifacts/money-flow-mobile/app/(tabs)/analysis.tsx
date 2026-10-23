import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ScreenHeading } from '@/components/FinanceBits';
import { useFinance, formatMoney } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

export default function AnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const now = new Date();
  const monthItems = finance.transactions.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const income = monthItems.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = monthItems.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const grouped = useMemo(() => {
    const sums = new Map<string, number>();
    monthItems.filter((item) => item.type === 'expense').forEach((item) => sums.set(item.category, (sums.get(item.category) ?? 0) + item.amount));
    return [...sums.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthItems]);
  const totalExpense = grouped.reduce((sum, [, amount]) => sum + amount, 0);
  const month = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(now);
  const largestCategory = grouped[0];
  const insight = !monthItems.length
    ? 'Khi bạn ghi nhận thu chi, các xu hướng trong tháng sẽ được tổng hợp tại đây.'
    : expense === 0
      ? 'Tháng này chưa có khoản chi tiêu nào được ghi nhận.'
      : income === 0
        ? `Khoản chi nhiều nhất hiện tại là ${largestCategory?.[0] ?? '—'}. Hãy thêm thu nhập để xem đầy đủ dòng tiền.`
        : income >= expense
          ? `Thu nhập tháng này cao hơn chi tiêu ${formatMoney(income - expense)}. Bạn đang giữ được dòng tiền dương.`
          : `Chi tiêu đang cao hơn thu nhập ${formatMoney(expense - income)}. Hãy xem lại nhóm ${largestCategory?.[0] ?? 'chi tiêu lớn nhất'}.`;

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + (insets.top === 0 ? 67 : 14), paddingHorizontal: 20, paddingBottom: 114 }}>
      <ScreenHeading eyebrow="BÁO CÁO CÁ NHÂN" title="Phân tích" />
      <View style={[styles.period, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.periodIcon, { backgroundColor: colors.successSoft }]}><Feather name="calendar" size={16} color={colors.primary} /></View>
        <View><Text style={[styles.periodCaption, { color: colors.mutedForeground }]}>KỲ BÁO CÁO</Text><Text style={[styles.periodTitle, { color: colors.foreground }]}>{month}</Text></View>
      </View>
      <View style={[styles.cashflowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Thu và chi</Text>
        <View style={styles.barGroup}>
          <View style={styles.barLine}>
            <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Thu nhập</Text>
            <Text style={[styles.barAmount, { color: colors.primary }]}>{formatMoney(income)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.muted }]}><View style={[styles.fill, { width: `${income || expense ? Math.max(income / Math.max(income, expense) * 100, income ? 4 : 0) : 0}%`, backgroundColor: colors.primary }]} /></View>
          <View style={[styles.barLine, { marginTop: 17 }]}>
            <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Chi tiêu</Text>
            <Text style={[styles.barAmount, { color: colors.danger }]}>{formatMoney(expense)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.muted }]}><View style={[styles.fill, { width: `${income || expense ? Math.max(expense / Math.max(income, expense) * 100, expense ? 4 : 0) : 0}%`, backgroundColor: colors.danger }]} /></View>
        </View>
        <View style={[styles.netRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.netCaption, { color: colors.mutedForeground }]}>Dòng tiền ròng</Text>
          <Text style={[styles.netAmount, { color: income - expense >= 0 ? colors.primary : colors.danger }]}>{income - expense >= 0 ? '+' : '−'}{formatMoney(Math.abs(income - expense))}</Text>
        </View>
      </View>
      <View style={[styles.insightCard, { backgroundColor: colors.successSoft }]}>
        <View style={styles.insightHeader}><Feather name="sun" size={16} color={colors.primary} /><Text style={[styles.insightTitle, { color: colors.primary }]}>Gợi ý từ dữ liệu của bạn</Text></View>
        <Text style={[styles.insightText, { color: colors.foreground }]}>{insight}</Text>
        <Text style={[styles.localNote, { color: colors.mutedForeground }]}>Phân tích cơ bản chạy trên thiết bị, không cần gửi dữ liệu đi đâu.</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chi tiêu theo danh mục</Text>
      {grouped.length ? <View style={[styles.categories, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {grouped.map(([category, amount], index) => {
          const share = totalExpense ? amount / totalExpense : 0;
          return <View key={category} style={[styles.categoryItem, index < grouped.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.categoryHead}><Text style={[styles.categoryName, { color: colors.foreground }]}>{category}</Text>
              <Text style={[styles.categoryAmount, { color: colors.foreground }]}>{formatMoney(amount)}</Text></View>
            <View style={styles.categoryBottom}><View style={[styles.categoryTrack, { backgroundColor: colors.muted }]}><View style={[styles.categoryFill, { width: `${Math.max(share * 100, 3)}%`, backgroundColor: index === 0 ? colors.primary : colors.gold }]} /></View>
              <Text style={[styles.shareText, { color: colors.mutedForeground }]}>{Math.round(share * 100)}%</Text></View>
          </View>;
        })}
      </View> : <EmptyState title="Chưa đủ dữ liệu phân tích" detail="Thêm các khoản thu chi để xem tỷ trọng chi tiêu theo danh mục." />}
      <View style={[styles.aiNote, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="zap" size={17} color={colors.gold} />
        <View style={{ flex: 1 }}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Phân tích Gemini (tùy chọn)</Text>
          <Text style={[styles.aiDescription, { color: colors.mutedForeground }]}>Chưa kết nối. Phân tích hiện tại chỉ dùng dữ liệu lưu cục bộ.</Text></View>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  period: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 17, padding: 13, marginTop: 2 },
  periodIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  periodCaption: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1 },
  periodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 3, textTransform: 'capitalize' },
  cashflowCard: { borderWidth: 1, borderRadius: 20, padding: 17, marginTop: 14 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  barGroup: { marginTop: 17 },
  barLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  barLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  barAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  track: { height: 7, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 14, marginTop: 17 },
  netCaption: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  netAmount: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  insightCard: { borderRadius: 18, padding: 16, marginTop: 13 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  insightText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 20, marginTop: 10 },
  localNote: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 8 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 25, marginBottom: 12 },
  categories: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  categoryItem: { paddingVertical: 13 },
  categoryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  categoryAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  categoryBottom: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9 },
  categoryTrack: { flex: 1, height: 5, borderRadius: 5 },
  categoryFill: { height: 5, borderRadius: 5 },
  shareText: { width: 32, textAlign: 'right', fontFamily: 'Inter_500Medium', fontSize: 10 },
  aiNote: { flexDirection: 'row', gap: 11, alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 18 },
  aiTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  aiDescription: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 4 },
});
