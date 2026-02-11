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

function isValidMonthKey(monthKey) {
  return typeof monthKey === 'string' && /^\d{4}-\d{2}$/.test(monthKey);
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
      completedAt: record.completedAt || new Date().toISOString(),
      memo: sanitizeString(record.memo || '')
    };
  });

  return normalized;
}

export function normalizeSettings(rawSettings) {
  const displayNames = normalizeDisplayNames(rawSettings || {});
  const payerAliases = normalizePayerAliases(rawSettings?.payerAliases, displayNames);
  const settlements = normalizeSettlementRecords(
    rawSettings?.settlements || rawSettings?.settlementHistory
  );

  return {
    displayNames,
    payerAliases,
    settlements,
    meta: {
      schemaVersion: rawSettings?.meta?.schemaVersion || SCHEMA_VERSION,
      updatedAt: rawSettings?.meta?.updatedAt || new Date().toISOString()
    }
  };
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
