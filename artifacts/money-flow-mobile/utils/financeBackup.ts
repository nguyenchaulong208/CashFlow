import type { FinanceData } from '@/context/FinanceContext';
import { FINANCE_SCHEMA_VERSION, migrateFinanceData } from '@/utils/financeMigrations';

export const FINANCE_BACKUP_FORMAT = 'dong-tien-backup-v1';

export type FinanceBackupData = FinanceData;

export function isFinanceBackup(value: unknown): value is FinanceBackupData & { format: string } {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Record<string, unknown>;
  if (backup.format !== FINANCE_BACKUP_FORMAT) return false;
  try {
    migrateFinanceData(backup, FINANCE_SCHEMA_VERSION);
    return true;
  } catch {
    return false;
  }
}

export function buildFinanceBackup(data: FinanceBackupData) {
  return {
    format: FINANCE_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    transactions: data.transactions,
    assets: data.assets,
    debts: data.debts,
  };
}
