import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FinanceTransaction, formatMoney } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

export function ScreenHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.heading}>
    <View><Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow.toUpperCase()}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text></View>
    {action}
  </View>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}>
    <Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>
    {action && <Pressable onPress={onPress}><Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text></Pressable>}
  </View>;
}

export function TransactionRow({ item, onLongPress }: { item: FinanceTransaction; onLongPress?: () => void }) {
  const colors = useColors();
  const positive = item.type === 'income';
  const icon = item.category === 'Ăn uống' ? 'coffee' : item.category === 'Di chuyển' ? 'navigation' : item.category === 'Nhà ở' ? 'home' : positive ? 'trending-up' : 'shopping-bag';
  const time = new Date(item.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  return <Pressable onLongPress={onLongPress} style={styles.transactionRow} accessibilityHint="Nhấn giữ để xóa">
    <View style={[styles.transactionIcon, { backgroundColor: positive ? colors.successSoft : colors.muted }]}>
      <Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={positive ? colors.primary : colors.secondaryForeground} />
    </View>
    <View style={styles.transactionMain}>
      <Text numberOfLines={1} style={[styles.transactionTitle, { color: colors.foreground }]}>{item.note || item.category}</Text>
      <Text style={[styles.transactionSub, { color: colors.mutedForeground }]}>{item.category} · {time}</Text>
    </View>
    <Text style={[styles.transactionAmount, { color: positive ? colors.primary : colors.foreground }]}>
      {positive ? '+' : '−'}{formatMoney(item.amount)}
    </Text>
  </Pressable>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  const colors = useColors();
  return <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.successSoft }]}><Feather name="inbox" size={19} color={colors.primary} /></View>
    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{detail}</Text>
  </View>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.4, marginBottom: 5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.5 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 13 },
  sectionText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  transactionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionMain: { flex: 1, minWidth: 0 },
  transactionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  transactionSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  transactionAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 8 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 19, alignItems: 'center', marginTop: 8 },
  emptyIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5, textAlign: 'center', lineHeight: 17 },
});
