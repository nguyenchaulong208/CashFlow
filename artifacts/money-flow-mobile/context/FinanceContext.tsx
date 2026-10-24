import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cancelDebtReminder, clearDebtReminders, enableNotificationPermission, scheduleDebtReminder } from '@/utils/debtReminders';
import { FINANCE_SCHEMA_VERSION, migrateFinanceData, UnsupportedFinanceSchemaVersionError } from '@/utils/financeMigrations';

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
  storageWritable: boolean;
  storageError: string;
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
// Keep this key stable across app updates; migrate its contents instead of renaming it.
const STORAGE_SCHEMA_KEY = '@dong-tien/finance-schema-version';
const LAST_GOOD_STORAGE_KEY = '@dong-tien/finance-last-good-v1';
const LAST_GOOD_FORMAT = 'dong-tien-local-snapshot-v1';
const REMINDERS_ENABLED_KEY = '@dong-tien/debt-reminders-enabled-v1';
const emptyData: FinanceData = { transactions: [], assets: [], debts: [] };
const FinanceContext = createContext<FinanceContextValue | null>(null);

function readSchemaVersion(raw: string | null) {
  if (raw === null) return 0;
  const version = Number(raw);
  if (!Number.isInteger(version) || version < 0) throw new Error('Stored finance schema version is invalid.');
  return version;
}

function readLastGoodSnapshot(raw: string | null) {
  if (!raw) return null;
  const snapshot: unknown = JSON.parse(raw);
  if (!snapshot || typeof snapshot !== 'object') return null;
  const value = snapshot as Record<string, unknown>;
  if (value.format !== LAST_GOOD_FORMAT || typeof value.schemaVersion !== 'number') return null;
  return migrateFinanceData(value.data, value.schemaVersion);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(emptyData);
  const [ready, setReady] = useState(false);
  const [storageWritable, setStorageWritable] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const persistQueue = useRef<Promise<void>>(Promise.resolve());

  const persistData = useCallback((nextData: FinanceData) => {
    const write = async () => {
      const [previousRaw, previousVersionRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(STORAGE_SCHEMA_KEY),
      ]);
      if (previousRaw) {
        try {
          const previousData = migrateFinanceData(JSON.parse(previousRaw), readSchemaVersion(previousVersionRaw));
          await AsyncStorage.setItem(LAST_GOOD_STORAGE_KEY, JSON.stringify({
            format: LAST_GOOD_FORMAT,
            schemaVersion: FINANCE_SCHEMA_VERSION,
            data: previousData,
          }));
        } catch (error) {
          if (error instanceof UnsupportedFinanceSchemaVersionError) throw error;
          // Keep the last known-good snapshot when the current value cannot be decoded.
        }
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      await AsyncStorage.setItem(STORAGE_SCHEMA_KEY, String(FINANCE_SCHEMA_VERSION));
    };
    const task = persistQueue.current.catch(() => undefined).then(write);
    persistQueue.current = task;
    return task;
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [raw, schemaRaw, lastGoodRaw, reminders] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_SCHEMA_KEY),
          AsyncStorage.getItem(LAST_GOOD_STORAGE_KEY),
          AsyncStorage.getItem(REMINDERS_ENABLED_KEY),
        ]);
        if (!active) return;
        setRemindersEnabled(reminders === 'true');

        if (!raw) {
          try {
            const lastGoodData = readLastGoodSnapshot(lastGoodRaw);
            if (lastGoodData) {
              setData(lastGoodData);
              setStorageError('Đã khôi phục bản lưu gần nhất vì không tìm thấy dữ liệu chính. Hãy kiểm tra các thay đổi gần đây.');
            } else {
              setData(emptyData);
              setStorageError('');
            }
            setStorageWritable(true);
          } catch {
            setData(emptyData);
            setStorageWritable(false);
            setStorageError('Không đọc được bản sao dữ liệu cục bộ. Ứng dụng không ghi đè dữ liệu; hãy khôi phục từ tệp sao lưu JSON.');
          }
          return;
        }

        try {
          const migrated = migrateFinanceData(JSON.parse(raw), readSchemaVersion(schemaRaw));
          setData(migrated);
          setStorageWritable(true);
          setStorageError('');
        } catch (error) {
          if (error instanceof UnsupportedFinanceSchemaVersionError) {
            setData(emptyData);
            setStorageWritable(false);
            setStorageError('Dữ liệu được tạo bởi phiên bản mới hơn. Ứng dụng giữ nguyên bản lưu và không ghi đè.');
            return;
          }
          try {
            const lastGoodData = readLastGoodSnapshot(lastGoodRaw);
            if (!lastGoodData) throw new Error('No valid local snapshot.');
            setData(lastGoodData);
            setStorageWritable(true);
            setStorageError('Bản lưu chính không đọc được. Đã khôi phục bản sao gần nhất; có thể thiếu thay đổi sau lần sao lưu đó.');
          } catch {
            setData(emptyData);
            setStorageWritable(false);
            setStorageError('Không đọc được dữ liệu đã lưu. Ứng dụng không ghi đè bản gốc; hãy nhập tệp sao lưu JSON để khôi phục.');
          }
        }
      } catch {
        if (active) {
          setData(emptyData);
          setStorageWritable(false);
          setStorageError('Không thể truy cập bộ nhớ trên điện thoại. Dữ liệu hiện có chưa bị thay đổi.');
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready && storageWritable) {
      void persistData(data)
        .then(() => setStorageError((current) => current.startsWith('Không thể lưu dữ liệu vào điện thoại') ? '' : current))
        .catch((error) => {
          if (error instanceof UnsupportedFinanceSchemaVersionError) {
            setStorageWritable(false);
            setStorageError('Ứng dụng không thể ghi đè dữ liệu tạo bởi phiên bản mới hơn.');
          } else {
            setStorageError('Không thể lưu dữ liệu vào điện thoại. Hãy tạo bản sao lưu và kiểm tra dung lượng thiết bị.');
          }
        });
    }
  }, [data, persistData, ready, storageWritable]);

  const value = useMemo<FinanceContextValue>(() => ({
    ...data,
    ready,
    storageWritable,
    storageError,
    remindersEnabled,
    reminderError,
    addTransaction: (item) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
      setData((prev) => ({
        ...prev,
        transactions: [{ ...item, id: makeId(), date: new Date().toISOString() }, ...prev.transactions],
      }));
    },
    addAsset: (item) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
      setData((prev) => ({
        ...prev,
        assets: [{ ...item, id: makeId() }, ...prev.assets],
      }));
    },
    addDebt: (item) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
      const debt = { ...item, id: makeId() };
      setData((prev) => ({ ...prev, debts: [debt, ...prev.debts] }));
      setReminderError('');
      if (remindersEnabled && debt.dueDate) {
        void scheduleDebtReminder(debt).catch(() => setReminderError('Đã lưu khoản nợ nhưng chưa tạo được lời nhắc. Kiểm tra quyền thông báo và ngày đến hạn.'));
      }
    },
    removeTransaction: (id) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
      setData((prev) => ({ ...prev, transactions: prev.transactions.filter((item) => item.id !== id) }));
    },
    removeAsset: (id) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
      setData((prev) => ({ ...prev, assets: prev.assets.filter((item) => item.id !== id) }));
    },
    removeDebt: (id) => {
      if (!storageWritable) {
        setStorageError('Chưa thể sửa dữ liệu vì bản lưu không đọc được. Khôi phục từ tệp sao lưu trước khi tiếp tục.');
        return;
      }
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
      const validatedData = migrateFinanceData(nextData, FINANCE_SCHEMA_VERSION);
      await persistData(validatedData);
      setData(validatedData);
      setStorageWritable(true);
      setStorageError('');
      if (remindersEnabled) {
        await clearDebtReminders();
        try {
          await Promise.all(validatedData.debts.map((debt) => scheduleDebtReminder(debt)));
        } catch {
          setReminderError('Đã khôi phục dữ liệu nhưng chưa tạo được một số lời nhắc.');
        }
      }
    },
    clearAll: async () => {
      const task = persistQueue.current.catch(() => undefined).then(async () => {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEY),
          AsyncStorage.removeItem(STORAGE_SCHEMA_KEY),
          AsyncStorage.removeItem(LAST_GOOD_STORAGE_KEY),
        ]);
      });
      persistQueue.current = task;
      await task;
      setData(emptyData);
      setStorageWritable(true);
      setStorageError('');
      await clearDebtReminders();
      setReminderError('');
    },
  }), [data, ready, storageWritable, storageError, remindersEnabled, reminderError, persistData]);

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
