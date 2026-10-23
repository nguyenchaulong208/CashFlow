import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { AssetKind, TransactionType } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormMode = 'transaction' | 'asset' | 'debt';
interface Props {
  visible: boolean;
  mode: FormMode;
  onClose: () => void;
  onSaveTransaction: (value: { type: TransactionType; amount: number; category: string; note: string }) => void;
  onSaveAsset: (value: { name: string; kind: AssetKind; value: number }) => void;
  onSaveDebt: (value: { name: string; kind: string; amount: number; dueDate?: string }) => void;
}

const categories = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Lương', 'Kinh doanh', 'Khác'];
const kinds: { key: AssetKind; label: string }[] = [
  { key: 'cash', label: 'Tiền mặt' },
  { key: 'investment', label: 'Đầu tư' },
  { key: 'property', label: 'Bất động sản' },
  { key: 'business', label: 'Kinh doanh' },
  { key: 'other', label: 'Khác' },
];
const debtKinds = ['Vay', 'Thẻ tín dụng', 'Trả góp', 'Khác'];

export function FinanceFormSheet({ visible, mode, onClose, onSaveTransaction, onSaveAsset, onSaveDebt }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Ăn uống');
  const [kind, setKind] = useState<AssetKind>('cash');
  const [debtKind, setDebtKind] = useState('Vay');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setName('');
      setNote('');
      setError('');
      setType(mode === 'transaction' ? 'expense' : 'income');
      setCategory(mode === 'transaction' ? 'Ăn uống' : '');
      setKind('cash');
      setDebtKind('Vay');
      setDueDate('');
    }
  }, [visible, mode]);

  const submit = () => {
    const numericAmount = Number(amount.replace(/[^\d]/g, ''));
    if (!numericAmount || numericAmount < 1) {
      setError('Nhập số tiền lớn hơn 0.');
      return;
    }
    if (mode !== 'transaction' && !name.trim()) {
      setError('Vui lòng nhập tên khoản mục.');
      return;
    }
    if (mode === 'transaction') {
      onSaveTransaction({ type, amount: numericAmount, category, note: note.trim() });
    } else if (mode === 'asset') {
      onSaveAsset({ name: name.trim(), kind, value: numericAmount });
    } else {
      onSaveDebt({ name: name.trim(), kind: debtKind, amount: numericAmount, dueDate: dueDate.trim() || undefined });
    }
    onClose();
  };

  const title = mode === 'transaction' ? 'Ghi giao dịch' : mode === 'asset' ? 'Thêm tài sản' : 'Thêm khoản nợ';
  const panelColor = colors.card;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng biểu mẫu" />
        <View style={[styles.sheet, { backgroundColor: panelColor, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Đóng">
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <KeyboardAwareScrollViewCompat bottomOffset={24} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {mode === 'transaction' && (
              <View style={[styles.segment, { backgroundColor: colors.muted }]}>
                {(['expense', 'income'] as const).map((option) => (
                  <Pressable key={option} onPress={() => { setType(option); setCategory(option === 'income' ? 'Lương' : 'Ăn uống'); }}
                    style={[styles.segmentItem, type === option && { backgroundColor: colors.card, shadowColor: '#16352D', shadowOpacity: 0.08, shadowRadius: 5 }]}>
                    <Text style={[styles.segmentText, { color: type === option ? colors.foreground : colors.mutedForeground }]}>
                      {option === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>SỐ TIỀN</Text>
            <View style={[styles.amountBox, { borderColor: colors.border }]}>
              <TextInput value={amount} onChangeText={(text) => setAmount(text.replace(/[^\d]/g, ''))}
                keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.mutedForeground}
                style={[styles.amountInput, { color: colors.foreground }]} accessibilityLabel="Số tiền" />
              <Text style={[styles.currency, { color: colors.mutedForeground }]}>₫</Text>
            </View>
            {mode === 'transaction' ? (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>DANH MỤC</Text>
                <View style={styles.chips}>
                  {categories.filter((item) => type === 'income' ? ['Lương', 'Kinh doanh', 'Khác'].includes(item) : item !== 'Lương' && item !== 'Kinh doanh').map((item) => (
                    <Pressable key={item} onPress={() => setCategory(item)}
                      style={[styles.chip, { borderColor: category === item ? colors.primary : colors.border, backgroundColor: category === item ? colors.successSoft : colors.card }]}>
                      <Text style={[styles.chipText, { color: category === item ? colors.primary : colors.foreground }]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>GHI CHÚ</Text>
                <TextInput value={note} onChangeText={setNote} placeholder="Ví dụ: cà phê sáng"
                  placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} />
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>TÊN KHOẢN MỤC</Text>
                <TextInput value={name} onChangeText={setName} placeholder={mode === 'asset' ? 'Ví dụ: Tiết kiệm ngân hàng' : 'Ví dụ: Thẻ tín dụng'}
                  placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} />
                {mode === 'asset' && <>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>LOẠI TÀI SẢN</Text>
                  <View style={styles.chips}>
                    {kinds.map((item) => <Pressable key={item.key} onPress={() => setKind(item.key)}
                      style={[styles.chip, { borderColor: kind === item.key ? colors.primary : colors.border, backgroundColor: kind === item.key ? colors.successSoft : colors.card }]}>
                      <Text style={[styles.chipText, { color: kind === item.key ? colors.primary : colors.foreground }]}>{item.label}</Text>
                    </Pressable>)}
                  </View>
                </>}
                {mode === 'debt' && <>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>LOẠI KHOẢN PHẢI TRẢ</Text>
                  <View style={styles.chips}>
                    {debtKinds.map((item) => <Pressable key={item} onPress={() => setDebtKind(item)}
                      style={[styles.chip, { borderColor: debtKind === item ? colors.primary : colors.border, backgroundColor: debtKind === item ? colors.successSoft : colors.card }]}>
                      <Text style={[styles.chipText, { color: debtKind === item ? colors.primary : colors.foreground }]}>{item}</Text>
                    </Pressable>)}
                  </View>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>NGÀY ĐẾN HẠN (TÙY CHỌN)</Text>
                  <TextInput value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} />
                </>}
              </>
            )}
            {!!error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            <Pressable onPress={submit} style={[styles.submit, { backgroundColor: colors.primary }]} accessibilityRole="button" testID="save-finance-item">
              <Text style={styles.submitText}>Lưu khoản mục</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,35,27,0.38)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10, maxHeight: '92%' },
  handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#D8E0DA', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  close: { padding: 6 },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 20 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 11 },
  segmentText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 9, marginTop: 14 },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, height: 62 },
  amountInput: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 25, paddingVertical: 0 },
  currency: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 12 },
  submit: { marginTop: 24, borderRadius: 16, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 },
  submitText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
