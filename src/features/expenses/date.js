export function formatMonthYear(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatDateToInput(dateStringOrDate) {
  if (!dateStringOrDate) return '';
  const date = typeof dateStringOrDate === 'string'
    ? new Date(dateStringOrDate)
    : dateStringOrDate;

  if (Number.isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeDateString(value) {
  if (!value) return formatDateToInput(new Date());

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    return formatDateToInput(value) || formatDateToInput(new Date());
  }

  if (value?.toDate) {
    return formatDateToInput(value.toDate()) || formatDateToInput(new Date());
  }

  return formatDateToInput(value) || formatDateToInput(new Date());
}
