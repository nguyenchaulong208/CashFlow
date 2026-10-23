import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeading } from '@/components/FinanceBits';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const exportData = async () => {
    const payload = {
      format: 'dong-tien-backup-v1',
      exportedAt: new Date().toISOString(),
      transactions: finance.transactions,
      assets: finance.assets,
      debts: finance.debts,
    };
    await Share.share({ title: 'Bản sao dữ liệu tài chính', message: JSON.stringify(payload, null, 2) });
  };
  const reset = () => Alert.alert('Xóa toàn bộ dữ liệu?', 'Các giao dịch, tài sản và khoản nợ đã lưu trên thiết bị sẽ bị xóa vĩnh viễn.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa dữ liệu', style: 'destructive', onPress: () => finance.clearAll() },
  ]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + (insets.top === 0 ? 67 : 14), paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}>
      <ScreenHeading eyebrow="CÁ NHÂN HÓA" title="Cài đặt" action={
        <Pressable onPress={() => router.back()} accessibilityLabel="Quay lại"><Feather name="x" size={23} color={colors.mutedForeground} /></Pressable>
      } />
      <View style={[styles.privacyCard, { backgroundColor: colors.successSoft }]}>
        <View style={[styles.privacyIcon, { backgroundColor: colors.card }]}><Feather name="shield" size={19} color={colors.primary} /></View>
        <Text style={[styles.privacyTitle, { color: colors.foreground }]}>Riêng tư là mặc định</Text>
        <Text style={[styles.privacyDescription, { color: colors.mutedForeground }]}>Dữ liệu tài chính của bạn được lưu trên điện thoại. Ứng dụng không cần tài khoản để theo dõi thu chi cơ bản.</Text>
      </View>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DỮ LIỆU CỦA BẠN</Text>
      <Pressable onPress={exportData} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} testID="share-backup">
        <View style={[styles.actionIcon, { backgroundColor: colors.successSoft }]}><Feather name="share-2" size={17} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Chia sẻ bản sao JSON</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Tự chọn ứng dụng để gửi bản sao dữ liệu</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={reset} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 9 }]} testID="clear-data">
        <View style={[styles.actionIcon, { backgroundColor: colors.dangerSoft }]}><Feather name="trash-2" size={17} color={colors.danger} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.danger }]}>Xóa dữ liệu trên thiết bị</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Xóa giao dịch, tài sản và khoản nợ</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </Pressable>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KẾT NỐI TÙY CHỌN</Text>
      <View style={[styles.connectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.connectionRow}><View style={[styles.actionIcon, { backgroundColor: colors.muted }]}><Feather name="calendar" size={17} color={colors.secondaryForeground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Google Calendar</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Nhắc lịch khoản phải trả · Chưa kết nối</Text></View>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.connectionRow}><View style={[styles.actionIcon, { backgroundColor: colors.muted }]}><Feather name="users" size={17} color={colors.secondaryForeground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Chia sẻ cùng gia đình</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Chưa kết nối tài khoản đám mây</Text></View>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.connectionRow}><View style={[styles.actionIcon, { backgroundColor: colors.muted }]}><Feather name="zap" size={17} color={colors.secondaryForeground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Gemini AI</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Chưa kết nối · Phân tích cơ bản vẫn chạy cục bộ</Text></View>
        </View>
      </View>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>Dòng Tiền · Phiên bản 1.0</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  privacyCard: { borderRadius: 20, padding: 17, marginTop: 2 },
  privacyIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  privacyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  privacyDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 18, marginTop: 7 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.15, marginTop: 25, marginBottom: 10 },
  actionRow: { borderWidth: 1, borderRadius: 16, minHeight: 68, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  actionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  actionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 4 },
  connectionCard: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 12 },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  separator: { height: 1, marginLeft: 48 },
  version: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 24 },
});
