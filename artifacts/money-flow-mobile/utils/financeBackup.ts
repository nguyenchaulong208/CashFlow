import { AssetKind, FinanceAsset, FinanceDebt, FinanceTransaction } from '@/context/FinanceContext';

export const FINANCE_BACKUP_FORMAT = 'dong-tien-backup-v1';

export interface FinanceBackupData {
  transactions: FinanceTransaction[];
  assets: FinanceAsset[];
  debts: FinanceDebt[];
}

export function isFinanceBackup(value: unknown): value is FinanceBackupData & { format: string } {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Record<string, unknown>;
  if (backup.format !== FINANCE_BACKUP_FORMAT) return false;
  if (!Array.isArray(backup.transactions) || !Array.isArray(backup.assets) || !Array.isArray(backup.debts)) return false;

  const validTransaction = (item: unknown): item is FinanceTransaction => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    return typeof row.id === 'string'
      && (row.type === 'income' || row.type === 'expense')
      && typeof row.amount === 'number' && Number.isFinite(row.amount) && row.amount > 0
      && typeof row.category === 'string' && typeof row.note === 'string'
      && typeof row.date === 'string' && Number.isFinite(Date.parse(row.date));
  };
  const validAsset = (item: unknown): item is FinanceAsset => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    const kinds: AssetKind[] = ['cash', 'investment', 'property', 'business', 'other'];
    return typeof row.id === 'string' && typeof row.name === 'string'
      && kinds.includes(row.kind as AssetKind)
      && typeof row.value === 'number' && Number.isFinite(row.value) && row.value >= 0;
  };
  const validDebt = (item: unknown): item is FinanceDebt => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.kind === 'string'
      && typeof row.amount === 'number' && Number.isFinite(row.amount) && row.amount >= 0
      && (row.dueDate === undefined || typeof row.dueDate === 'string');
  };

  return backup.transactions.every(validTransaction)
    && backup.assets.every(validAsset)
    && backup.debts.every(validDebt);
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
