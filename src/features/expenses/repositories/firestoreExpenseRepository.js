import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { SCHEMA_VERSION } from '../constants';
import { listExpensesByMonth } from '../selectors';
import {
  buildExportPayload,
  commitInChunks,
  normalizeImportPayload
} from '../importExport';
import {
  mergeAliasesWithDisplayNameChange,
  normalizeExpenseRecord,
  normalizeSettings,
  toExpenseWriteModel
} from '../normalizers';

function toTimestamp(value) {
  if (value?.toDate && typeof value.toDate === 'function') {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
  }

  return Timestamp.fromDate(new Date());
}

function buildMeta(previousMeta) {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    dataRevision: Math.max(1, Number(previousMeta?.dataRevision || 1)) + 1
  };
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

function buildSettingsDoc(currentUserId, settings, previousMeta) {
  return {
    uid: currentUserId,
    displayNames: settings.displayNames,
    payerAliases: settings.payerAliases,
    settlements: settings.settlements,
    monthClosures: settings.monthClosures,
    preferences: settings.preferences,
    user1Name: settings.displayNames.user1,
    user2Name: settings.displayNames.user2,
    meta: buildMeta(previousMeta),
    updatedAt: Timestamp.fromDate(new Date())
  };
}

export function createFirestoreExpenseRepository({ db, appId, currentUserId }) {
  const expensesPath = `artifacts/${appId}/users/${currentUserId}/expenses`;
  const userSettingsPath = `artifacts/${appId}/users/${currentUserId}/settings/userNames`;
  const budgetPath = `artifacts/${appId}/users/${currentUserId}/settings/budgets`;

  let cachedSnapshot = {
    expenses: [],
    settings: normalizeSettings({}),
    monthlyBudgets: {}
  };

  return {
    subscribe(onData, onError = () => {}) {
      let rawExpenses = [];
      let rawSettings = {};
      let rawBudgets = {};

      const emit = () => {
        const settings = normalizeSettings(rawSettings);
        const expenses = rawExpenses.map((expense) => normalizeExpenseRecord(expense, settings));

        cachedSnapshot = {
          expenses,
          settings,
          monthlyBudgets: rawBudgets
        };

        onData(cachedSnapshot);
      };

      const unsubExpenses = onSnapshot(
        collection(db, expensesPath),
        (snapshot) => {
          rawExpenses = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));
          emit();
        },
        onError
      );

      const unsubSettings = onSnapshot(
        doc(db, userSettingsPath),
        (snapshot) => {
          rawSettings = snapshot.exists() ? snapshot.data() : {};
          emit();
        },
        onError
      );

      const unsubBudgets = onSnapshot(
        doc(db, budgetPath),
        (snapshot) => {
          const data = snapshot.exists() ? snapshot.data() : {};
          rawBudgets = data.monthlyBudgets || {};
          emit();
        },
        onError
      );

      return () => {
        unsubExpenses();
        unsubSettings();
        unsubBudgets();
      };
    },

    async saveExpense({ expense, existingExpense, settings }) {
      const writeModel = toExpenseWriteModel(expense, settings);
      if (!writeModel.payerId) {
        return {
          success: false,
          error: '支払者が未設定です。'
        };
      }

      const payload = {
        ...writeModel,
        uid: currentUserId,
        createdAt: existingExpense?.createdAt ? toTimestamp(existingExpense.createdAt) : Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        schemaVersion: SCHEMA_VERSION
      };

      if (existingExpense?.id) {
        await setDoc(doc(db, expensesPath, existingExpense.id), payload);
      } else {
        await addDoc(collection(db, expensesPath), payload);
      }

      return {
        success: true
      };
    },

    async deleteExpense(expenseId) {
      await deleteDoc(doc(db, expensesPath, expenseId));
      return {
        success: true
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
      const nextAliases = mergeAliasesWithDisplayNameChange(
        payerAliases,
        previousDisplayNames,
        displayNames
      );

      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        displayNames,
        payerAliases: nextAliases,
        settlements: settlements || cachedSnapshot.settings?.settlements || {},
        monthClosures: monthClosures || cachedSnapshot.settings?.monthClosures || {},
        preferences: {
          ...(cachedSnapshot.settings?.preferences || {}),
          ...(preferences || {})
        }
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return {
        success: true
      };
    },

    async savePreferences({ preferences }) {
      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        preferences: {
          ...(cachedSnapshot.settings?.preferences || {}),
          ...(preferences || {})
        }
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return { success: true };
    },

    async saveSettlementCompletion({ monthKey, settlementRecord }) {
      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        settlements: {
          ...(cachedSnapshot.settings?.settlements || {}),
          [monthKey]: settlementRecord
        }
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return {
        success: true
      };
    },

    async clearSettlementCompletion(monthKey) {
      const nextSettlements = {
        ...(cachedSnapshot.settings?.settlements || {})
      };
      delete nextSettlements[monthKey];

      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        settlements: nextSettlements
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return {
        success: true
      };
    },

    async saveMonthClosure({ monthKey, closureRecord }) {
      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        monthClosures: {
          ...(cachedSnapshot.settings?.monthClosures || {}),
          [monthKey]: closureRecord
        }
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return { success: true };
    },

    async reopenMonth({ monthKey, reason }) {
      const currentClosure = cachedSnapshot.settings?.monthClosures?.[monthKey] || {};
      const mergedSettings = normalizeSettings({
        ...cachedSnapshot.settings,
        monthClosures: {
          ...(cachedSnapshot.settings?.monthClosures || {}),
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
      });

      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      return { success: true };
    },

    async saveBudgets(monthlyBudgets) {
      await setDoc(doc(db, budgetPath), {
        uid: currentUserId,
        monthlyBudgets,
        meta: buildMeta(cachedSnapshot.settings?.meta),
        updatedAt: Timestamp.fromDate(new Date())
      });

      return {
        success: true
      };
    },

    async importData({ rawData, fallbackSettings, options = {} }) {
      const normalized = normalizeImportPayload(rawData, fallbackSettings, {
        ...options,
        existingFingerprints: cachedSnapshot.expenses.map((expense) => expense.fingerprint).filter(Boolean)
      });
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

      const importedCount = await commitInChunks(
        normalized.expenses,
        async (chunk) => {
          const batch = writeBatch(db);
          chunk.forEach((expense) => {
            const newDocRef = doc(collection(db, expensesPath));
            batch.set(newDocRef, {
              ...expense,
              uid: currentUserId,
              createdAt: toTimestamp(expense.createdAt),
              updatedAt: Timestamp.fromDate(new Date()),
              schemaVersion: SCHEMA_VERSION
            });
          });
          await batch.commit();
        }
      );

      const mergedSettings = mergeSettings(cachedSnapshot.settings, normalized.settings);
      await setDoc(
        doc(db, userSettingsPath),
        buildSettingsDoc(currentUserId, mergedSettings, cachedSnapshot.settings?.meta),
        { merge: true }
      );

      if (Object.keys(normalized.monthlyBudgets).length > 0) {
        await setDoc(
          doc(db, budgetPath),
          {
            uid: currentUserId,
            monthlyBudgets: {
              ...(cachedSnapshot.monthlyBudgets || {}),
              ...normalized.monthlyBudgets
            },
            meta: buildMeta(cachedSnapshot.settings?.meta),
            updatedAt: Timestamp.fromDate(new Date())
          },
          { merge: true }
        );
      }

      return {
        success: true,
        importedCount,
        failedCount: normalized.errors.length,
        duplicateCount: normalized.duplicateCount || 0,
        validationSummary: normalized.validationSummary,
        errors: normalized.errors
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
      return cachedSnapshot;
    }
  };
}

