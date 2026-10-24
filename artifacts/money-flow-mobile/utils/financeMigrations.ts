import type {
  AssetKind,
  FinanceAsset,
  FinanceData,
  FinanceDebt,
  FinanceTransaction,
} from '@/context/FinanceContext';

export const FINANCE_SCHEMA_VERSION = 1;
// Bump this only with a migration path from every schema version already on users' phones.

export class UnsupportedFinanceSchemaVersionError extends Error {
  constructor(version: number) {
    super(`Finance data schema ${version} is newer than this app supports.`);
    this.name = 'UnsupportedFinanceSchemaVersionError';
  }
}

const assetKinds: AssetKind[] = ['cash', 'investment', 'property', 'business', 'other'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function migrateTransaction(value: unknown, version: number): FinanceTransaction {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || (value.type !== 'income' && value.type !== 'expense')
    || typeof value.amount !== 'number'
    || !Number.isFinite(value.amount)
    || value.amount <= 0
    || typeof value.category !== 'string'
    || typeof value.date !== 'string'
    || !Number.isFinite(Date.parse(value.date))) {
    throw new Error('A saved transaction is invalid.');
  }

  if (value.note !== undefined && typeof value.note !== 'string') {
    throw new Error('A saved transaction note is invalid.');
  }
  if (version >= 1 && typeof value.note !== 'string') {
    throw new Error('A saved transaction is missing its note.');
  }

  return {
    id: value.id,
    type: value.type,
    amount: value.amount,
    category: value.category,
    note: typeof value.note === 'string' ? value.note : '',
    date: value.date,
  };
}

function migrateAsset(value: unknown): FinanceAsset {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !assetKinds.includes(value.kind as AssetKind)
    || typeof value.value !== 'number'
    || !Number.isFinite(value.value)
    || value.value < 0) {
    throw new Error('A saved asset is invalid.');
  }
  return {
    id: value.id,
    name: value.name,
    kind: value.kind as AssetKind,
    value: value.value,
  };
}

function migrateDebt(value: unknown): FinanceDebt {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || typeof value.kind !== 'string'
    || typeof value.amount !== 'number'
    || !Number.isFinite(value.amount)
    || value.amount < 0
    || (value.dueDate !== undefined && typeof value.dueDate !== 'string')) {
    throw new Error('A saved debt is invalid.');
  }
  return {
    id: value.id,
    name: value.name,
    kind: value.kind,
    amount: value.amount,
    ...(typeof value.dueDate === 'string' ? { dueDate: value.dueDate } : {}),
  };
}

export function migrateFinanceData(value: unknown, fromVersion: number): FinanceData {
  if (fromVersion > FINANCE_SCHEMA_VERSION) {
    throw new UnsupportedFinanceSchemaVersionError(fromVersion);
  }
  if (!Number.isInteger(fromVersion) || fromVersion < 0 || !isRecord(value)) {
    throw new Error('Saved finance data has an invalid format.');
  }
  if (!Array.isArray(value.transactions) || !Array.isArray(value.assets) || !Array.isArray(value.debts)) {
    throw new Error('Saved finance data is incomplete.');
  }

  return {
    transactions: value.transactions.map((item) => migrateTransaction(item, fromVersion)),
    assets: value.assets.map(migrateAsset),
    debts: value.debts.map(migrateDebt),
  };
}

export function isFinanceData(value: unknown): value is FinanceData {
  try {
    migrateFinanceData(value, 0);
    return true;
  } catch {
    return false;
  }
}
