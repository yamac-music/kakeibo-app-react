import {
  CATEGORIES,
  EXPORT_VERSION,
  FIRESTORE_IMPORT_CHUNK_SIZE,
  SCHEMA_VERSION
} from './constants';
import {
  buildExpenseFingerprint,
  getDisplayNameFromPayerId,
  isValidPayerId,
  normalizeDisplayNames,
  normalizeMonthClosures,
  normalizePayerAliases,
  normalizeSettlementRecords,
  normalizeSettings,
  resolvePayerId
} from './normalizers';
import {
  sanitizeString,
  validateAmount,
  validateDate,
  validateDescription,
  validateUsername
} from '../../utils/validation.js';

function normalizeBudgetMap(rawBudgets) {
  if (!rawBudgets || typeof rawBudgets !== 'object') {
    return {};
  }

  const result = {};
  Object.entries(rawBudgets).forEach(([monthKey, categoryBudgets]) => {
    if (!monthKey || typeof categoryBudgets !== 'object') return;

    const normalizedCategories = {};
    Object.entries(categoryBudgets).forEach(([category, amount]) => {
      const normalizedAmount = Number(amount);
      if (Number.isFinite(normalizedAmount) && normalizedAmount >= 0) {
        normalizedCategories[sanitizeString(category)] = Math.floor(normalizedAmount);
      }
    });

    result[monthKey] = normalizedCategories;
  });

  return result;
}

function parseImportSettings(rawData, fallbackSettings) {
  const normalizedFallback = normalizeSettings(fallbackSettings || {});
  const legacyDisplayNames = rawData?.userNames
    ? {
        user1Name: rawData.userNames.user1Name,
        user2Name: rawData.userNames.user2Name
      }
    : null;

  const normalizedDisplayNames = normalizeDisplayNames(
    rawData?.settings || legacyDisplayNames || normalizedFallback.displayNames
  );

  const normalizedPayerAliases = normalizePayerAliases(
    rawData?.settings?.payerAliases || normalizedFallback.payerAliases,
    normalizedDisplayNames
  );

  const importedSettings = normalizeSettings(rawData?.settings || {});

  return {
    displayNames: normalizedDisplayNames,
    payerAliases: normalizedPayerAliases,
    settlements: normalizeSettlementRecords(
      rawData?.settings?.settlements || normalizedFallback?.settlements
    ),
    monthClosures: normalizeMonthClosures(
      rawData?.settings?.monthClosures || normalizedFallback?.monthClosures
    ),
    preferences: {
      suggestionsEnabled:
        rawData?.settings?.preferences?.suggestionsEnabled
        ?? normalizedFallback?.preferences?.suggestionsEnabled
        ?? true
    },
    meta: {
      schemaVersion: rawData?.settings?.meta?.schemaVersion || importedSettings.meta.schemaVersion || SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      dataRevision: Math.max(
        1,
        Number(rawData?.settings?.meta?.dataRevision || normalizedFallback?.meta?.dataRevision || 1)
      )
    }
  };
}

function normalizeImportedExpense(rawExpense, index, settings) {
  const amountValidation = validateAmount(rawExpense.amount);
  if (!amountValidation.isValid) {
    return {
      ok: false,
      error: `#${index + 1}: 金額が不正です (${amountValidation.error})`
    };
  }

  const descriptionValidation = validateDescription(rawExpense.description || '');
  if (!descriptionValidation.isValid) {
    return {
      ok: false,
      error: `#${index + 1}: 説明が不正です (${descriptionValidation.error})`
    };
  }

  const category = sanitizeString(rawExpense.category || '');
  if (!CATEGORIES.includes(category)) {
    return {
      ok: false,
      error: `#${index + 1}: カテゴリが不正です`
    };
  }

  const dateValidation = validateDate(rawExpense.date || '');
  if (!dateValidation.isValid) {
    return {
      ok: false,
      error: `#${index + 1}: 日付が不正です (${dateValidation.error})`
    };
  }

  const resolvedPayer = resolvePayerId(rawExpense, settings.displayNames, settings.payerAliases);
  if (!resolvedPayer.payerId) {
    return {
      ok: false,
      error: `#${index + 1}: 支払者を user1/user2 に解決できません`
    };
  }

  const expense = {
    description: descriptionValidation.sanitized,
    amount: amountValidation.sanitized,
    category,
    payerId: resolvedPayer.payerId,
    payer: getDisplayNameFromPayerId(resolvedPayer.payerId, settings.displayNames),
    date: dateValidation.sanitized,
    createdAt: rawExpense.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION
  };

  return {
    ok: true,
    expense: {
      ...expense,
      fingerprint: buildExpenseFingerprint(expense)
    }
  };
}

function createValidationSummary({
  totalCount,
  importedCount,
  failedCount,
  duplicateCount,
  skippedDuplicateCount,
  dryRun
}) {
  return {
    totalCount,
    importedCount,
    failedCount,
    duplicateCount,
    skippedDuplicateCount,
    dryRun: Boolean(dryRun)
  };
}

export function normalizeImportPayload(rawData, fallbackSettings, options = {}) {
  const errors = [];
  const skipDuplicates = options.skipDuplicates !== false;
  const dryRun = options.dryRun === true;

  if (!rawData || typeof rawData !== 'object') {
    return {
      ok: false,
      errors: ['JSON のルート要素がオブジェクトではありません。']
    };
  }

  if (!Array.isArray(rawData.expenses)) {
    return {
      ok: false,
      errors: ['expenses 配列が存在しません。']
    };
  }

  const settings = parseImportSettings(rawData, fallbackSettings);
  const expenses = [];
  let duplicateCount = 0;
  let skippedDuplicateCount = 0;

  const existingFingerprints = new Set(
    Array.isArray(options.existingFingerprints)
      ? options.existingFingerprints.filter((value) => typeof value === 'string' && value.length > 0)
      : []
  );
  const importedFingerprints = new Set();

  rawData.expenses.forEach((expense, index) => {
    const normalized = normalizeImportedExpense(expense, index, settings);
    if (!normalized.ok) {
      errors.push(normalized.error);
      return;
    }

    const fingerprint = normalized.expense.fingerprint || buildExpenseFingerprint(normalized.expense);
    const isDuplicate = existingFingerprints.has(fingerprint) || importedFingerprints.has(fingerprint);
    if (isDuplicate) {
      duplicateCount += 1;
      if (skipDuplicates) {
        skippedDuplicateCount += 1;
        return;
      }
    }

    importedFingerprints.add(fingerprint);
    expenses.push(normalized.expense);
  });

  const validationSummary = createValidationSummary({
    totalCount: rawData.expenses.length,
    importedCount: expenses.length,
    failedCount: errors.length,
    duplicateCount,
    skippedDuplicateCount,
    dryRun
  });

  return {
    ok: true,
    dryRun,
    settings,
    monthlyBudgets: normalizeBudgetMap(rawData.monthlyBudgets),
    expenses,
    errors,
    duplicateCount,
    skippedDuplicateCount,
    validationSummary
  };
}

export function buildExportPayload({ expenses, settings, monthlyBudgets }) {
  const errors = [];

  const normalizedExpenses = expenses
    .map((expense, index) => {
      const payerId = expense.payerId;
      if (!isValidPayerId(payerId)) {
        errors.push(`#${index + 1}: payerId が未設定です`);
        return null;
      }

      const amountValidation = validateAmount(expense.amount);
      const dateValidation = validateDate(expense.date || '');
      const descriptionValidation = validateDescription(expense.description || '');

      if (!amountValidation.isValid) {
        errors.push(`#${index + 1}: amount が不正です`);
        return null;
      }

      if (!dateValidation.isValid) {
        errors.push(`#${index + 1}: date が不正です`);
        return null;
      }

      if (!descriptionValidation.isValid) {
        errors.push(`#${index + 1}: description が不正です`);
        return null;
      }

      const normalizedExpense = {
        id: expense.id,
        description: descriptionValidation.sanitized,
        amount: amountValidation.sanitized,
        category: sanitizeString(expense.category),
        payerId,
        date: dateValidation.sanitized,
        createdAt: expense.createdAt || null,
        updatedAt: expense.updatedAt || null,
        schemaVersion: SCHEMA_VERSION
      };

      return {
        ...normalizedExpense,
        fingerprint: expense.fingerprint || buildExpenseFingerprint(normalizedExpense)
      };
    })
    .filter(Boolean);

  const normalizedSettings = normalizeSettings(settings);

  return {
    errors,
    payload: {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      settings: {
        displayNames: normalizedSettings.displayNames,
        payerAliases: normalizedSettings.payerAliases,
        settlements: normalizedSettings.settlements,
        monthClosures: normalizedSettings.monthClosures,
        preferences: normalizedSettings.preferences,
        meta: {
          schemaVersion: SCHEMA_VERSION,
          updatedAt: new Date().toISOString(),
          dataRevision: Math.max(1, Number(normalizedSettings.meta?.dataRevision || 1))
        }
      },
      monthlyBudgets,
      expenses: normalizedExpenses
    }
  };
}

export function splitIntoChunks(items, chunkSize = FIRESTORE_IMPORT_CHUNK_SIZE) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function commitInChunks(items, commitChunk, chunkSize = FIRESTORE_IMPORT_CHUNK_SIZE) {
  const chunks = splitIntoChunks(items, chunkSize);
  let committedCount = 0;

  for (const chunk of chunks) {
    await commitChunk(chunk);
    committedCount += chunk.length;
  }

  return committedCount;
}

export function validateDisplayNames(displayNames) {
  const user1 = validateUsername(displayNames.user1 || '');
  const user2 = validateUsername(displayNames.user2 || '');

  const errors = [];
  if (!user1.isValid) errors.push(`ユーザー1: ${user1.error}`);
  if (!user2.isValid) errors.push(`ユーザー2: ${user2.error}`);

  return {
    ok: errors.length === 0,
    errors,
    displayNames: {
      user1: user1.sanitized,
      user2: user2.sanitized
    }
  };
}

