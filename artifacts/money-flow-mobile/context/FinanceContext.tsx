import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

interface FinanceData {
  transactions: FinanceTransaction[];
  assets: FinanceAsset[];
  debts: FinanceDebt[];
}

interface FinanceContextValue extends FinanceData {
  ready: boolean;
  addTransaction: (item: Omit<FinanceTransaction, 'id' | 'date'>) => void;
  addAsset: (item: Omit<FinanceAsset, 'id'>) => void;
  addDebt: (item: Omit<FinanceDebt, 'id'>) => void;
  removeTransaction: (id: string) => void;
  removeAsset: (id: string) => void;
  removeDebt: (id: string) => void;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = '@dong-tien/finance-v1';
const emptyData: FinanceData = { transactions: [], assets: [], debts: [] };
const FinanceContext = createContext<FinanceContextValue | null>(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
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
    addTransaction: (item) => setData((prev) => ({
      ...prev,
      transactions: [{ ...item, id: makeId(), date: new Date().toISOString() }, ...prev.transactions],
    })),
    addAsset: (item) => setData((prev) => ({
      ...prev,
      assets: [{ ...item, id: makeId() }, ...prev.assets],
    })),
    addDebt: (item) => setData((prev) => ({
      ...prev,
      debts: [{ ...item, id: makeId() }, ...prev.debts],
    })),
    removeTransaction: (id) => setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((item) => item.id !== id),
    })),
    removeAsset: (id) => setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((item) => item.id !== id),
    })),
    removeDebt: (id) => setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((item) => item.id !== id),
    })),
    clearAll: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setData(emptyData);
    },
  }), [data, ready]);

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
