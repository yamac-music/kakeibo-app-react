import {
  DEMO_STORAGE_KEYS,
  SCHEMA_VERSION
} from '../constants';
import { listExpensesByMonth } from '../selectors';
import {
  buildExportPayload,
  normalizeImportPayload
} from '../importExport';
import {
  mergeAliasesWithDisplayNameChange,
  normalizeExpenseRecord,
  normalizeSettings,
  toExpenseWriteModel
} from '../normalizers';
import { isEncryptionAvailable, secureStorage } from '../../../utils/encryption.js';

function getStorageItem(key, defaultValue) {
  if (isEncryptionAvailable()) {
    return secureStorage.getItem(key, defaultValue);
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem(key, value) {
  if (isEncryptionAvailable()) {
    return secureStorage.setItem(key, value);
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function buildSettingsPayload(nextSettings) {
  return {
    ...nextSettings,
    user1Name: nextSettings.displayNames.user1,
    user2Name: nextSettings.displayNames.user2,
    meta: {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: new Date().toISOString()
    }
  };
}

function readSettings() {
  const rawSettings = getStorageItem(DEMO_STORAGE_KEYS.SETTINGS, null);

  if (rawSettings) {
    return normalizeSettings(rawSettings);
  }

  const legacyUserNames = getStorageItem(DEMO_STORAGE_KEYS.LEGACY_USER_NAMES, null);
  if (legacyUserNames) {
    return normalizeSettings(legacyUserNames);
  }

  return normalizeSettings({});
}

function readBudgets() {
  return getStorageItem(DEMO_STORAGE_KEYS.BUDGETS, {});
}

function readExpenses(settings) {
  const rawExpenses = getStorageItem(DEMO_STORAGE_KEYS.EXPENSES, []);

  return rawExpenses
    .map((expense, index) => ({
      id: expense.id || `${Date.now()}-${index}`,
      ...expense
    }))
    .map((expense) => normalizeExpenseRecord(expense, settings));
}

function readSnapshot() {
  const settings = readSettings();
  const monthlyBudgets = readBudgets();
  const expenses = readExpenses(settings);

  return {
    expenses,
    settings,
    monthlyBudgets
  };
}

function persistSnapshot(snapshot) {
  setStorageItem(DEMO_STORAGE_KEYS.EXPENSES, snapshot.expenses);
  setStorageItem(DEMO_STORAGE_KEYS.BUDGETS, snapshot.monthlyBudgets);
  setStorageItem(DEMO_STORAGE_KEYS.SETTINGS, buildSettingsPayload(snapshot.settings));
  setStorageItem(DEMO_STORAGE_KEYS.LEGACY_USER_NAMES, {
    user1Name: snapshot.settings.displayNames.user1,
    user2Name: snapshot.settings.displayNames.user2,
    updatedAt: new Date().toISOString()
  });
}

export function createDemoExpenseRepository() {
  let snapshot = readSnapshot();

  const refreshSnapshot = () => {
    snapshot = readSnapshot();
    return snapshot;
  };

  const emitSnapshot = (onData) => {
    onData(refreshSnapshot());
  };

  return {
    subscribe(onData) {
      emitSnapshot(onData);

      const handler = (event) => {
        if (!Object.values(DEMO_STORAGE_KEYS).includes(event.key)) return;
        emitSnapshot(onData);
      };

      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },

    async saveExpense({ expense, existingExpense, settings }) {
      const current = refreshSnapshot();
      const writeModel = toExpenseWriteModel(expense, settings);

      if (!writeModel.payerId) {
        return {
          success: false,
          error: '支払者が未設定です。'
        };
      }

      const nowIso = new Date().toISOString();
      const nextExpense = {
        id: existingExpense?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...writeModel,
        createdAt: existingExpense?.createdAt || nowIso,
        updatedAt: nowIso
      };

      const expenses = existingExpense
        ? current.expenses.map((item) => (item.id === existingExpense.id ? nextExpense : item))
        : [...current.expenses, nextExpense];

      snapshot = {
        ...current,
        expenses
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async deleteExpense(expenseId) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        expenses: current.expenses.filter((expense) => expense.id !== expenseId)
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveDisplayNames({ displayNames, previousDisplayNames, payerAliases, settlements }) {
      const current = refreshSnapshot();
      const nextAliases = mergeAliasesWithDisplayNameChange(
        payerAliases,
        previousDisplayNames,
        displayNames
      );

      snapshot = {
        ...current,
        settings: {
          displayNames,
          payerAliases: nextAliases,
          settlements: settlements || current.settings.settlements || {},
          meta: {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: new Date().toISOString()
          }
        }
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveSettlementCompletion({ monthKey, settlementRecord }) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        settings: {
          ...current.settings,
          settlements: {
            ...(current.settings?.settlements || {}),
            [monthKey]: settlementRecord
          },
          meta: {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: new Date().toISOString()
          }
        }
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async clearSettlementCompletion(monthKey) {
      const current = refreshSnapshot();
      const nextSettlements = {
        ...(current.settings?.settlements || {})
      };
      delete nextSettlements[monthKey];

      snapshot = {
        ...current,
        settings: {
          ...current.settings,
          settlements: nextSettlements,
          meta: {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: new Date().toISOString()
          }
        }
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveBudgets(monthlyBudgets) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        monthlyBudgets
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async importData({ rawData, fallbackSettings }) {
      const current = refreshSnapshot();
      const normalized = normalizeImportPayload(rawData, fallbackSettings || current.settings);

      if (!normalized.ok) {
        return {
          success: false,
          importedCount: 0,
          failedCount: normalized.errors.length,
          errors: normalized.errors
        };
      }

      const importedExpenses = normalized.expenses.map((expense, index) => ({
        ...expense,
        id: `${Date.now()}-import-${index}-${Math.random().toString(36).slice(2, 6)}`
      }));

      snapshot = {
        expenses: [...current.expenses, ...importedExpenses],
        settings: {
          ...current.settings,
          ...normalized.settings,
          settlements: {
            ...(current.settings?.settlements || {}),
            ...(normalized.settings?.settlements || {})
          }
        },
        monthlyBudgets: {
          ...current.monthlyBudgets,
          ...normalized.monthlyBudgets
        }
      };

      persistSnapshot(snapshot);

      return {
        success: true,
        importedCount: importedExpenses.length,
        failedCount: normalized.errors.length,
        errors: normalized.errors,
        snapshot: refreshSnapshot()
      };
    },

    exportData({ expenses, settings, monthlyBudgets }) {
      const exportResult = buildExportPayload({ expenses, settings, monthlyBudgets });

      if (exportResult.errors.length > 0) {
        return {
          success: false,
          errors: exportResult.errors
        };
      }

      return {
        success: true,
        payload: exportResult.payload
      };
    },

    listByMonth(expenses, currentMonth, options = {}) {
      return listExpensesByMonth(expenses, currentMonth, options);
    },

    getSnapshot() {
      return refreshSnapshot();
    }
  };
}
