import {
  DEFAULT_DISPLAY_NAMES,
  DEFAULT_PAYER_IDS,
  SCHEMA_VERSION
} from './constants';
import { formatDateToInput, normalizeDateString } from './date';
import { sanitizeString } from '../../utils/validation';

export function isValidPayerId(payerId) {
  return DEFAULT_PAYER_IDS.includes(payerId);
}

export function buildDefaultAliases(displayNames) {
  return {
    [displayNames.user1]: 'user1',
    [displayNames.user2]: 'user2'
  };
}

function isValidMonthKey(monthKey) {
  return typeof monthKey === 'string' && /^\d{4}-\d{2}$/.test(monthKey);
}

function sanitizeIsoString(value) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeReopenHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .map((item) => ({
      reopenedAt: sanitizeIsoString(item?.reopenedAt) || new Date().toISOString(),
      reason: sanitizeString(item?.reason || '')
    }))
    .filter((item) => item.reason.length > 0);
}

function normalizeSettlementSnapshot(rawSettlementSnapshot) {
  if (!rawSettlementSnapshot || typeof rawSettlementSnapshot !== 'object') {
    return null;
  }

  const amount = Number(rawSettlementSnapshot.amount);
  const fromPayerId = isValidPayerId(rawSettlementSnapshot.fromPayerId)
    ? rawSettlementSnapshot.fromPayerId
    : null;
  const toPayerId = isValidPayerId(rawSettlementSnapshot.toPayerId)
    ? rawSettlementSnapshot.toPayerId
    : null;

  if (!Number.isFinite(amount) || amount <= 0 || !fromPayerId || !toPayerId) {
    return null;
  }

  return {
    amount: Math.floor(amount),
    fromPayerId,
    toPayerId
  };
}

function normalizeTotalsSnapshot(rawTotalsSnapshot) {
  if (!rawTotalsSnapshot || typeof rawTotalsSnapshot !== 'object') {
    return null;
  }

  const user1Total = Number(rawTotalsSnapshot.user1Total);
  const user2Total = Number(rawTotalsSnapshot.user2Total);
  const invalidPayerTotal = Number(rawTotalsSnapshot.invalidPayerTotal || 0);
  const totalExpense = Number(rawTotalsSnapshot.totalExpense);

  if (
    !Number.isFinite(user1Total)
    || !Number.isFinite(user2Total)
    || !Number.isFinite(totalExpense)
    || user1Total < 0
    || user2Total < 0
    || totalExpense < 0
  ) {
    return null;
  }

  const categories = {};
  const rawCategories = rawTotalsSnapshot.categories;
  if (rawCategories && typeof rawCategories === 'object') {
    Object.entries(rawCategories).forEach(([category, amount]) => {
      const normalizedCategory = sanitizeString(category);
      const normalizedAmount = Number(amount);
      if (!normalizedCategory || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return;
      }
      categories[normalizedCategory] = Math.floor(normalizedAmount);
    });
  }

  return {
    user1Total: Math.floor(user1Total),
    user2Total: Math.floor(user2Total),
    invalidPayerTotal: Number.isFinite(invalidPayerTotal) ? Math.floor(Math.max(invalidPayerTotal, 0)) : 0,
    totalExpense: Math.floor(totalExpense),
    categories
  };
}

export function normalizeDisplayNames(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_DISPLAY_NAMES };
  }

  if (raw.displayNames && typeof raw.displayNames === 'object') {
    return {
      user1: sanitizeString(raw.displayNames.user1 || raw.user1Name || DEFAULT_DISPLAY_NAMES.user1) || DEFAULT_DISPLAY_NAMES.user1,
      user2: sanitizeString(raw.displayNames.user2 || raw.user2Name || DEFAULT_DISPLAY_NAMES.user2) || DEFAULT_DISPLAY_NAMES.user2
    };
  }

  return {
    user1: sanitizeString(raw.user1Name || DEFAULT_DISPLAY_NAMES.user1) || DEFAULT_DISPLAY_NAMES.user1,
    user2: sanitizeString(raw.user2Name || DEFAULT_DISPLAY_NAMES.user2) || DEFAULT_DISPLAY_NAMES.user2
  };
}

export function normalizePayerAliases(rawAliases, displayNames) {
  const aliases = {
    ...buildDefaultAliases(displayNames)
  };

  if (rawAliases && typeof rawAliases === 'object') {
    Object.entries(rawAliases).forEach(([name, payerId]) => {
      const normalizedName = sanitizeString(name);
      if (normalizedName && isValidPayerId(payerId)) {
        aliases[normalizedName] = payerId;
      }
    });
  }

  aliases[displayNames.user1] = 'user1';
  aliases[displayNames.user2] = 'user2';

  return aliases;
}

export function normalizeSettlementRecords(rawSettlements) {
  if (!rawSettlements || typeof rawSettlements !== 'object') {
    return {};
  }

  const normalized = {};
  Object.entries(rawSettlements).forEach(([monthKey, record]) => {
    if (!isValidMonthKey(monthKey)) return;
    if (!record || typeof record !== 'object') return;

    const amount = Number(record.amount);
    const fromPayerId = isValidPayerId(record.fromPayerId) ? record.fromPayerId : null;
    const toPayerId = isValidPayerId(record.toPayerId) ? record.toPayerId : null;

    normalized[monthKey] = {
      monthKey,
      amount: Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0,
      fromPayerId,
      toPayerId,
      completedAt: sanitizeIsoString(record.completedAt) || new Date().toISOString(),
      memo: sanitizeString(record.memo || '')
    };
  });

  return normalized;
}

export function normalizeMonthClosures(rawClosures) {
  if (!rawClosures || typeof rawClosures !== 'object') {
    return {};
  }

  const normalized = {};
  Object.entries(rawClosures).forEach(([monthKey, record]) => {
    if (!isValidMonthKey(monthKey)) return;
    if (!record || typeof record !== 'object') return;

    const status = record.status === 'closed' ? 'closed' : 'open';
    normalized[monthKey] = {
      status,
      closedAt: status === 'closed'
        ? (sanitizeIsoString(record.closedAt) || new Date().toISOString())
        : null,
      closedBy: sanitizeString(record.closedBy || '') || null,
      settlementSnapshot: normalizeSettlementSnapshot(record.settlementSnapshot),
      totalsSnapshot: normalizeTotalsSnapshot(record.totalsSnapshot),
      reopenHistory: normalizeReopenHistory(record.reopenHistory)
    };
  });

  return normalized;
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      dataRevision: 1
    };
  }

  return {
    schemaVersion: sanitizeString(meta.schemaVersion || SCHEMA_VERSION) || SCHEMA_VERSION,
    updatedAt: sanitizeIsoString(meta.updatedAt) || new Date().toISOString(),
    dataRevision: Number.isFinite(Number(meta.dataRevision))
      ? Math.max(1, Math.floor(Number(meta.dataRevision)))
      : 1
  };
}

export function normalizeSettings(rawSettings) {
  const displayNames = normalizeDisplayNames(rawSettings || {});
  const payerAliases = normalizePayerAliases(rawSettings?.payerAliases, displayNames);
  const settlements = normalizeSettlementRecords(
    rawSettings?.settlements || rawSettings?.settlementHistory
  );
  const monthClosures = normalizeMonthClosures(rawSettings?.monthClosures);
  const rawPreferences = rawSettings?.preferences || {};
  const preferences = {
    suggestionsEnabled: rawPreferences.suggestionsEnabled !== false
  };

  return {
    displayNames,
    payerAliases,
    settlements,
    monthClosures,
    preferences,
    meta: normalizeMeta(rawSettings?.meta)
  };
}

function normalizeFingerprintPart(value) {
  return sanitizeString(String(value || ''))
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function buildExpenseFingerprint(expense) {
  const date = normalizeDateString(expense?.date);
  const amount = Number(expense?.amount);
  const payerId = isValidPayerId(expense?.payerId) ? expense.payerId : '';
  const category = normalizeFingerprintPart(expense?.category);
  const description = normalizeFingerprintPart(expense?.description);

  return [
    date,
    Number.isFinite(amount) ? Math.floor(amount) : 0,
    category,
    description,
    payerId
  ].join('|');
}

export function resolvePayerId({ payerId, payer }, displayNames, payerAliases) {
  if (isValidPayerId(payerId)) {
    return {
      payerId,
      legacyPayer: null
    };
  }

  const normalizedPayer = sanitizeString(payer || '');
  if (!normalizedPayer) {
    return {
      payerId: null,
      legacyPayer: null
    };
  }

  if (payerAliases[normalizedPayer]) {
    return {
      payerId: payerAliases[normalizedPayer],
      legacyPayer: null
    };
  }

  if (normalizedPayer === displayNames.user1) {
    return {
      payerId: 'user1',
      legacyPayer: null
    };
  }

  if (normalizedPayer === displayNames.user2) {
    return {
      payerId: 'user2',
      legacyPayer: null
    };
  }

  return {
    payerId: null,
    legacyPayer: normalizedPayer
  };
}

export function getDisplayNameFromPayerId(payerId, displayNames) {
  if (payerId === 'user1') return displayNames.user1;
  if (payerId === 'user2') return displayNames.user2;
  return '不明';
}

function normalizeDate(value) {
  if (!value) {
    return formatDateToInput(new Date());
  }

  if (value?.toDate) {
    return formatDateToInput(value.toDate()) || formatDateToInput(new Date());
  }

  return normalizeDateString(value);
}

function normalizeNumericAmount(value) {
  const amount = typeof value === 'string' ? Number(value) : value;
  const normalized = Number.isFinite(amount) ? Math.floor(amount) : 0;
  return normalized > 0 ? normalized : 0;
}

export function normalizeExpenseRecord(rawExpense, settings) {
  const { displayNames, payerAliases } = settings;
  const payer = resolvePayerId(rawExpense, displayNames, payerAliases);

  return {
    id: rawExpense.id,
    description: sanitizeString(rawExpense.description || ''),
    amount: normalizeNumericAmount(rawExpense.amount),
    category: sanitizeString(rawExpense.category || ''),
    payerId: payer.payerId,
    payerLegacy: payer.legacyPayer,
    payer: rawExpense.payer || null,
    date: normalizeDate(rawExpense.date || rawExpense.createdAt),
    createdAt: rawExpense.createdAt || null,
    updatedAt: rawExpense.updatedAt || null,
    fingerprint: sanitizeString(rawExpense.fingerprint || '') || null,
    schemaVersion: rawExpense.schemaVersion || '1.0'
  };
}

export function toExpenseWriteModel(expense, settings) {
  const { displayNames } = settings;
  const normalizedPayerId = isValidPayerId(expense.payerId) ? expense.payerId : null;

  return {
    description: sanitizeString(expense.description),
    amount: Number(expense.amount),
    category: sanitizeString(expense.category),
    payerId: normalizedPayerId,
    payer: normalizedPayerId ? getDisplayNameFromPayerId(normalizedPayerId, displayNames) : (expense.payerLegacy || null),
    date: normalizeDateString(expense.date),
    fingerprint: buildExpenseFingerprint(expense),
    schemaVersion: SCHEMA_VERSION
  };
}

export function mergeAliasesWithDisplayNameChange(existingAliases, previousDisplayNames, nextDisplayNames) {
  const nextAliases = {
    ...existingAliases
  };

  if (previousDisplayNames.user1) nextAliases[previousDisplayNames.user1] = 'user1';
  if (previousDisplayNames.user2) nextAliases[previousDisplayNames.user2] = 'user2';
  if (nextDisplayNames.user1) nextAliases[nextDisplayNames.user1] = 'user1';
  if (nextDisplayNames.user2) nextAliases[nextDisplayNames.user2] = 'user2';

  return normalizePayerAliases(nextAliases, nextDisplayNames);
}

