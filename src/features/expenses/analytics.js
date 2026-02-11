import { formatMonthYear } from './date';
import { buildExpenseFingerprint } from './normalizers';

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function normalizeMonth(date) {
  const normalized = new Date(date);
  normalized.setDate(1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function shiftMonth(date, diff) {
  const next = normalizeMonth(date);
  next.setMonth(next.getMonth() + diff);
  return next;
}

export function calculateMonthlyKpis({
  totals,
  previousTotals,
  monthlyBudgets,
  currentMonth
}) {
  const currentMonthBudgets = monthlyBudgets[formatMonthYear(currentMonth)] || {};
  const budgetTotal = Object.values(currentMonthBudgets).reduce((sum, amount) => sum + Number(amount || 0), 0);
  const spent = totals.user1Total + totals.user2Total;
  const budgetDelta = budgetTotal - spent;
  const previousSpent = previousTotals.user1Total + previousTotals.user2Total;
  const monthOverMonthDelta = spent - previousSpent;

  return {
    budgetDelta,
    monthOverMonthDelta,
    settlementForecast: Math.abs(totals.user1Total - totals.user2Total) / 2
  };
}

export function calculateSixMonthTrend(expenses, currentMonth) {
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(currentMonth, index - 5));
  const monthKeys = months.map((month) => formatMonthYear(month));
  const byMonthCategory = {};

  monthKeys.forEach((monthKey) => {
    byMonthCategory[monthKey] = {};
  });

  expenses.forEach((expense) => {
    const expenseMonthKey = formatMonthYear(new Date(expense.date));
    if (!byMonthCategory[expenseMonthKey]) return;
    byMonthCategory[expenseMonthKey][expense.category] = (byMonthCategory[expenseMonthKey][expense.category] || 0) + Number(expense.amount || 0);
  });

  if (monthKeys.length < 2) {
    return { increases: [], decreases: [], monthKeys };
  }

  const currentKey = monthKeys[monthKeys.length - 1];
  const previousKey = monthKeys[monthKeys.length - 2];
  const currentCategories = byMonthCategory[currentKey] || {};
  const previousCategories = byMonthCategory[previousKey] || {};
  const categories = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)]);

  const diffs = Array.from(categories).map((category) => ({
    category,
    diff: (currentCategories[category] || 0) - (previousCategories[category] || 0)
  }));

  return {
    monthKeys,
    increases: diffs.filter((item) => item.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 3),
    decreases: diffs.filter((item) => item.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 3)
  };
}

export function detectExpenseAnomaly(expense, expenses) {
  const normalizedDescription = (expense.description || '').trim().toLowerCase();
  if (!normalizedDescription || !expense.category || !expense.payerId) {
    return {
      isAnomaly: false,
      threshold: 0,
      median: 0,
      sampleCount: 0
    };
  }

  const candidates = expenses.filter((item) => {
    if (item.payerId !== expense.payerId) return false;
    if (item.category !== expense.category) return false;
    return (item.description || '').trim().toLowerCase() === normalizedDescription;
  });

  const amounts = candidates
    .map((item) => Number(item.amount || 0))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  const sampleCount = amounts.length;
  if (sampleCount < 3) {
    return {
      isAnomaly: false,
      threshold: 0,
      median: 0,
      sampleCount
    };
  }

  const medianAmount = median(amounts);
  const threshold = medianAmount * 2.5;
  const currentAmount = Number(expense.amount || 0);

  return {
    isAnomaly: currentAmount > threshold,
    threshold,
    median: medianAmount,
    sampleCount
  };
}

export function suggestRecurringExpenses(expenses, currentMonth) {
  const targetMonthKey = formatMonthYear(currentMonth);
  const groups = new Map();

  expenses.forEach((expense) => {
    if (!expense.description || !expense.category || !expense.payerId) return;
    const key = `${expense.description.toLowerCase()}|${expense.category}|${expense.payerId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(expense);
  });

  const suggestions = [];
  groups.forEach((items) => {
    if (items.length < 2) return;
    const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    const hasCurrentMonth = sorted.some((item) => formatMonthYear(new Date(item.date)) === targetMonthKey);
    if (hasCurrentMonth) return;

    const amounts = sorted.map((item) => Number(item.amount || 0)).filter((amount) => Number.isFinite(amount) && amount > 0);
    if (amounts.length === 0) return;

    const suggested = {
      description: latest.description,
      amount: Math.round(median(amounts)),
      category: latest.category,
      payerId: latest.payerId,
      date: new Date().toISOString().slice(0, 10),
      sourceCount: sorted.length
    };

    suggestions.push({
      ...suggested,
      fingerprint: buildExpenseFingerprint(suggested)
    });
  });

  return suggestions
    .sort((a, b) => b.sourceCount - a.sourceCount)
    .slice(0, 3);
}

