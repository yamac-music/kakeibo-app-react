import { formatMonthYear } from './date';

export function listExpensesByMonth(expenses, currentMonth, options = {}) {
  const monthKey = formatMonthYear(currentMonth);
  const { searchTerm = '', isSearching = true } = options;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  let filtered = expenses.filter((expense) => {
    const expenseMonth = formatMonthYear(new Date(expense.date));
    return expenseMonth === monthKey;
  });

  if (isSearching && normalizedSearchTerm) {
    filtered = filtered.filter((expense) => {
      const target = `${expense.description} ${expense.category}`.toLowerCase();
      return target.includes(normalizedSearchTerm);
    });
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
