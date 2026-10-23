import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cancelDebtReminder, clearDebtReminders, enableNotificationPermission, scheduleDebtReminder } from '@/utils/debtReminders';

export type TransactionType = 'income' | 'expense';
export type AssetKind = 'cash' | 'investment' | 'property' | 'business' | 'other';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface FinanceAsset {
  id: string;
  name: string;
  kind: AssetKind;
  value: number;
}

export interface FinanceDebt {
  id: string;
  name: string;
  kind: string;
  amount: number;
  dueDate?: string;
}

export interface FinanceData {
  transactions: FinanceTransaction[];
  assets: FinanceAsset[];
  debts: FinanceDebt[];
}

interface FinanceContextValue extends FinanceData {
  ready: boolean;
  remindersEnabled: boolean;
  reminderError: string;
  addTransaction: (item: Omit<FinanceTransaction, 'id' | 'date'>) => void;
  addAsset: (item: Omit<FinanceAsset, 'id'>) => void;
  addDebt: (item: Omit<FinanceDebt, 'id'>) => void;
  removeTransaction: (id: string) => void;
  removeAsset: (id: string) => void;
  removeDebt: (id: string) => void;
  enableDueReminders: () => Promise<{ granted: boolean; canAskAgain: boolean }>;
  disableDueReminders: () => Promise<void>;
  restoreData: (data: FinanceData) => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = '@dong-tien/finance-v1';
const REMINDERS_ENABLED_KEY = '@dong-tien/debt-reminders-enabled-v1';
const emptyData: FinanceData = { transactions: [], assets: [], debts: [] };
const FinanceContext = createContext<FinanceContextValue | null>(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(emptyData);
  const [ready, setReady] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderError, setReminderError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(REMINDERS_ENABLED_KEY)])
      .then(([raw, reminders]) => {
        if (!active) return;
        setRemindersEnabled(reminders === 'true');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<FinanceData>;
            setData({
              transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
              assets: Array.isArray(parsed.assets) ? parsed.assets : [],
              debts: Array.isArray(parsed.debts) ? parsed.debts : [],
            });
          } catch {
            setData(emptyData);
          }
        }
      })
      .catch(() => {
        if (active) setData(emptyData);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const value = useMemo<FinanceContextValue>(() => ({
    ...data,
    ready,
    remindersEnabled,
    reminderError,
    addTransaction: (item) => setData((prev) => ({
      ...prev,
      transactions: [{ ...item, id: makeId(), date: new Date().toISOString() }, ...prev.transactions],
    })),
    addAsset: (item) => setData((prev) => ({
      ...prev,
      assets: [{ ...item, id: makeId() }, ...prev.assets],
    })),
    addDebt: (item) => {
      const debt = { ...item, id: makeId() };
      setData((prev) => ({ ...prev, debts: [debt, ...prev.debts] }));
      setReminderError('');
      if (remindersEnabled && debt.dueDate) {
        void scheduleDebtReminder(debt).catch(() => setReminderError('Đã lưu khoản nợ nhưng chưa tạo được lời nhắc. Kiểm tra quyền thông báo và ngày đến hạn.'));
      }
    },
    removeTransaction: (id) => setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((item) => item.id !== id),
    })),
    removeAsset: (id) => setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((item) => item.id !== id),
    })),
    removeDebt: (id) => {
      setData((prev) => ({ ...prev, debts: prev.debts.filter((item) => item.id !== id) }));
      void cancelDebtReminder(id).catch(() => setReminderError('Không thể hủy lời nhắc đã đặt.'));
    },
    enableDueReminders: async () => {
      const permission = await enableNotificationPermission();
      if (!permission.granted) return permission;
      setReminderError('');
      await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, 'true');
      setRemindersEnabled(true);
      try {
        await Promise.all(data.debts.map((debt) => scheduleDebtReminder(debt)));
      } catch {
        setReminderError('Không tạo được một số lời nhắc. Kiểm tra ngày đến hạn của các khoản nợ.');
      }
      return permission;
    },
    disableDueReminders: async () => {
      await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, 'false');
      setRemindersEnabled(false);
      await clearDebtReminders();
      setReminderError('');
    },
    restoreData: async (nextData) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      setData(nextData);
      if (remindersEnabled) {
        await clearDebtReminders();
        try {
          await Promise.all(nextData.debts.map((debt) => scheduleDebtReminder(debt)));
        } catch {
          setReminderError('Đã khôi phục dữ liệu nhưng chưa tạo được một số lời nhắc.');
        }
      }
    },
    clearAll: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setData(emptyData);
      await clearDebtReminders();
      setReminderError('');
    },
  }), [data, ready, remindersEnabled, reminderError]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}

export function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr`;
  }
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} ₫`;
}
