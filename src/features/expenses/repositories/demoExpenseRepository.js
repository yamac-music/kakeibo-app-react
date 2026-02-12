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

function buildMeta(previousMeta) {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    dataRevision: Math.max(1, Number(previousMeta?.dataRevision || 1)) + 1
  };
}

function buildSettingsPayload(nextSettings, previousSettings) {
  return {
    ...nextSettings,
    user1Name: nextSettings.displayNames.user1,
    user2Name: nextSettings.displayNames.user2,
    meta: buildMeta(previousSettings?.meta || nextSettings?.meta)
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

function persistSnapshot(snapshot, previousSettings) {
  setStorageItem(DEMO_STORAGE_KEYS.EXPENSES, snapshot.expenses);
  setStorageItem(DEMO_STORAGE_KEYS.BUDGETS, snapshot.monthlyBudgets);
  setStorageItem(
    DEMO_STORAGE_KEYS.SETTINGS,
    buildSettingsPayload(snapshot.settings, previousSettings || snapshot.settings)
  );
  setStorageItem(DEMO_STORAGE_KEYS.LEGACY_USER_NAMES, {
    user1Name: snapshot.settings.displayNames.user1,
    user2Name: snapshot.settings.displayNames.user2,
    updatedAt: new Date().toISOString()
  });
}

function mergeSettings(currentSettings, patchSettings) {
  const normalizedPatch = normalizeSettings(patchSettings || {});
  return normalizeSettings({
    ...currentSettings,
    ...normalizedPatch,
    settlements: {
      ...(currentSettings?.settlements || {}),
      ...(normalizedPatch?.settlements || {})
    },
    monthClosures: {
      ...(currentSettings?.monthClosures || {}),
      ...(normalizedPatch?.monthClosures || {})
    },
    preferences: {
      ...(currentSettings?.preferences || {}),
      ...(normalizedPatch?.preferences || {})
    }
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

      persistSnapshot(snapshot, current.settings);

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

      persistSnapshot(snapshot, current.settings);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveDisplayNames({
      displayNames,
      previousDisplayNames,
      payerAliases,
      settlements,
      monthClosures,
      preferences
    }) {
      const current = refreshSnapshot();
      const nextAliases = mergeAliasesWithDisplayNameChange(
        payerAliases,
        previousDisplayNames,
        displayNames
      );

      snapshot = {
        ...current,
        settings: normalizeSettings({
          ...current.settings,
          displayNames,
          payerAliases: nextAliases,
          settlements: settlements || current.settings.settlements || {},
          monthClosures: monthClosures || current.settings.monthClosures || {},
          preferences: {
            ...(current.settings.preferences || {}),
            ...(preferences || {})
          }
        })
      };

      persistSnapshot(snapshot, current.settings);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async savePreferences({ preferences }) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        settings: normalizeSettings({
          ...current.settings,
          preferences: {
            ...(current.settings.preferences || {}),
            ...(preferences || {})
          }
        })
      };
      persistSnapshot(snapshot, current.settings);
      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveSettlementCompletion({ monthKey, settlementRecord }) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        settings: normalizeSettings({
          ...current.settings,
          settlements: {
            ...(current.settings?.settlements || {}),
            [monthKey]: settlementRecord
          }
        })
      };

      persistSnapshot(snapshot, current.settings);

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
        settings: normalizeSettings({
          ...current.settings,
          settlements: nextSettlements
        })
      };

      persistSnapshot(snapshot, current.settings);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async saveMonthClosure({ monthKey, closureRecord }) {
      const current = refreshSnapshot();
      snapshot = {
        ...current,
        settings: normalizeSettings({
          ...current.settings,
          monthClosures: {
            ...(current.settings?.monthClosures || {}),
            [monthKey]: closureRecord
          }
        })
      };
      persistSnapshot(snapshot, current.settings);
      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async reopenMonth({ monthKey, reason }) {
      const current = refreshSnapshot();
      const currentClosure = current.settings?.monthClosures?.[monthKey] || {};

      snapshot = {
        ...current,
        settings: normalizeSettings({
          ...current.settings,
          monthClosures: {
            ...(current.settings?.monthClosures || {}),
            [monthKey]: {
              ...currentClosure,
              status: 'open',
              closedAt: null,
              reopenHistory: [
                ...(Array.isArray(currentClosure?.reopenHistory) ? currentClosure.reopenHistory : []),
                {
                  reopenedAt: new Date().toISOString(),
                  reason
                }
              ]
            }
          }
        })
      };

      persistSnapshot(snapshot, current.settings);
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

      persistSnapshot(snapshot, current.settings);

      return {
        success: true,
        snapshot: refreshSnapshot()
      };
    },

    async importData({ rawData, fallbackSettings, options = {} }) {
      const current = refreshSnapshot();
      const normalized = normalizeImportPayload(
        rawData,
        fallbackSettings || current.settings,
        {
          ...options,
          existingFingerprints: current.expenses.map((expense) => expense.fingerprint).filter(Boolean)
        }
      );

      if (!normalized.ok) {
        return {
          success: false,
          importedCount: 0,
          failedCount: normalized.errors.length,
          duplicateCount: 0,
          validationSummary: normalized.validationSummary || null,
          errors: normalized.errors
        };
      }

      if (options?.dryRun) {
        return {
          success: true,
          dryRun: true,
          importedCount: normalized.expenses.length,
          failedCount: normalized.errors.length,
          duplicateCount: normalized.duplicateCount || 0,
          validationSummary: normalized.validationSummary,
          errors: normalized.errors
        };
      }

      const importedExpenses = normalized.expenses.map((expense, index) => ({
        ...expense,
        id: `${Date.now()}-import-${index}-${Math.random().toString(36).slice(2, 6)}`
      }));

      snapshot = {
        expenses: [...current.expenses, ...importedExpenses],
        settings: mergeSettings(current.settings, normalized.settings),
        monthlyBudgets: {
          ...current.monthlyBudgets,
          ...normalized.monthlyBudgets
        }
      };

      persistSnapshot(snapshot, current.settings);

      return {
        success: true,
        importedCount: importedExpenses.length,
        failedCount: normalized.errors.length,
        duplicateCount: normalized.duplicateCount || 0,
        validationSummary: normalized.validationSummary,
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

