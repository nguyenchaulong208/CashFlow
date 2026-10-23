import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeading } from '@/components/FinanceBits';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { buildFinanceBackup, isFinanceBackup } from '@/utils/financeBackup';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const finance = useFinance();
  const [backupBusy, setBackupBusy] = useState(false);
  const exportData = async () => {
    setBackupBusy(true);
    try {
      const json = JSON.stringify(buildFinanceBackup(finance), null, 2);
      if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
        await Share.share({ title: 'Bản sao dữ liệu tài chính', message: json });
        return;
      }
      const file = new File(Paths.cache, `dong-tien-${new Date().toISOString().slice(0, 10)}.json`);
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Chia sẻ bản sao tài chính' });
    } catch {
      Alert.alert('Không thể sao lưu', 'Hãy thử lại sau hoặc dùng chức năng chia sẻ trên thiết bị.');
    } finally {
      setBackupBusy(false);
    }
  };
  const importData = async () => {
    setBackupBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const json = await new File(result.assets[0].uri).text();
      const parsed: unknown = JSON.parse(json);
      if (!isFinanceBackup(parsed)) {
        Alert.alert('Tệp không hợp lệ', 'Chọn tệp sao lưu JSON được tạo từ ứng dụng Dòng Tiền.');
        return;
      }
      const data = { transactions: parsed.transactions, assets: parsed.assets, debts: parsed.debts };
      Alert.alert(
        'Khôi phục dữ liệu?',
        `Thao tác này thay thế dữ liệu hiện có bằng ${data.transactions.length} giao dịch, ${data.assets.length} tài sản và ${data.debts.length} khoản nợ trong tệp.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Khôi phục',
            style: 'destructive',
            onPress: () => {
              void finance.restoreData(data)
                .then(() => Alert.alert('Đã khôi phục', 'Dữ liệu từ tệp sao lưu đã được nạp vào thiết bị.'))
                .catch(() => Alert.alert('Không thể khôi phục', 'Dữ liệu hiện tại chưa bị thay đổi. Hãy thử lại.'));
            },
          },
        ],
      );
    } catch {
      Alert.alert('Không thể mở tệp', 'Tệp có thể bị hỏng hoặc không đúng định dạng JSON.');
    } finally {
      setBackupBusy(false);
    }
  };
  const toggleReminders = async () => {
    try {
      if (finance.remindersEnabled) {
        await finance.disableDueReminders();
        return;
      }
      const permission = await finance.enableDueReminders();
      if (permission.granted) return;
      Alert.alert(
        'Cần quyền thông báo',
        'Cho phép thông báo để nhận nhắc hạn trên điện thoại. Dữ liệu khoản nợ vẫn ở trên thiết bị.',
        [
          { text: 'Để sau', style: 'cancel' },
          ...(Platform.OS !== 'web' && !permission.canAskAgain
            ? [{ text: 'Mở Cài đặt', onPress: () => { void Linking.openSettings().catch(() => undefined); } }]
            : []),
        ],
      );
    } catch {
      Alert.alert('Không thể bật nhắc hạn', 'Hãy kiểm tra quyền thông báo trên thiết bị rồi thử lại.');
    }
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
      <Pressable onPress={exportData} disabled={backupBusy} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: backupBusy ? 0.55 : 1 }]} testID="share-backup">
        <View style={[styles.actionIcon, { backgroundColor: colors.successSoft }]}><Feather name="share-2" size={17} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Sao lưu ra tệp JSON</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Lưu hoặc chia sẻ bản sao dữ liệu</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={importData} disabled={backupBusy} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 9, opacity: backupBusy ? 0.55 : 1 }]} testID="restore-backup">
        <View style={[styles.actionIcon, { backgroundColor: colors.successSoft }]}><Feather name="download" size={17} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Khôi phục từ tệp JSON</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Tệp nhập sẽ thay thế dữ liệu hiện có</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={reset} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 9 }]} testID="clear-data">
        <View style={[styles.actionIcon, { backgroundColor: colors.dangerSoft }]}><Feather name="trash-2" size={17} color={colors.danger} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.danger }]}>Xóa dữ liệu trên thiết bị</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Xóa giao dịch, tài sản và khoản nợ</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </Pressable>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NHẮC HẠN TRÊN ĐIỆN THOẠI</Text>
      <Pressable onPress={toggleReminders} style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} testID="toggle-debt-reminders">
        <View style={[styles.actionIcon, { backgroundColor: finance.remindersEnabled ? colors.successSoft : colors.muted }]}>
          <Feather name="bell" size={17} color={finance.remindersEnabled ? colors.primary : colors.secondaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>{finance.remindersEnabled ? 'Đang bật nhắc hạn' : 'Bật nhắc hạn khoản nợ'}</Text>
          <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Thông báo cục bộ trước ngày đến hạn 1 ngày lúc 09:00</Text>
        </View>
        <Feather name={finance.remindersEnabled ? 'toggle-right' : 'toggle-left'} size={23} color={finance.remindersEnabled ? colors.primary : colors.mutedForeground} />
      </Pressable>
      {!!finance.reminderError && <Text style={[styles.reminderError, { color: colors.danger }]}>{finance.reminderError}</Text>}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KẾT NỐI TÙY CHỌN</Text>
      <View style={[styles.connectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.connectionRow}><View style={[styles.actionIcon, { backgroundColor: colors.muted }]}><Feather name="calendar" size={17} color={colors.secondaryForeground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Google Calendar</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Đồng bộ sự kiện · Cần cấu hình OAuth riêng</Text></View>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.connectionRow}><View style={[styles.actionIcon, { backgroundColor: colors.muted }]}><Feather name="users" size={17} color={colors.secondaryForeground} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>Google Drive / OneDrive</Text><Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Mỗi người đăng nhập tài khoản riêng · Cần OAuth</Text></View>
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
  reminderError: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: 8 },
});
