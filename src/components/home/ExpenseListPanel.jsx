import {
  AlertCircle,
  Edit3,
  Info,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { getDisplayNameFromPayerId } from '../../features/expenses';

function QuickButton({ label, subLabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sm text-sky-800 hover:bg-sky-100"
    >
      <span className="font-medium">{label}</span>
      {subLabel && <span className="ml-1 text-xs opacity-80">{subLabel}</span>}
    </button>
  );
}

export default function ExpenseListPanel({
  monthlyFilteredExpenses,
  searchTerm,
  onSearchTermChange,
  onClearSearch,
  displayNames,
  recurringSuggestions,
  currentMonthClosed,
  onQuickAddSuggestion,
  onEditExpense,
  onDeleteExpense,
  onAddExpense
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">支出一覧</h3>
          <div className="text-sm text-slate-500">{monthlyFilteredExpenses.length}件</div>
        </div>
        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <Plus size={16} />
          支出を追加
        </button>
      </div>

      {currentMonthClosed && (
        <div className="mb-2 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-sm px-3 py-2">
          この月は締め済みです。編集・削除には締め解除が必要です。
        </div>
      )}

      {recurringSuggestions.length > 0 && (
        <div className="mb-3 space-y-2">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">よく使う支出</div>
            <div className="flex flex-wrap gap-2">
              {recurringSuggestions.map((suggestion) => (
                <QuickButton
                  key={`${suggestion.fingerprint}-${suggestion.description}`}
                  label={suggestion.description}
                  subLabel={`${suggestion.amount.toLocaleString()}円`}
                  onClick={() => onQuickAddSuggestion(suggestion)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="支出を検索..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {monthlyFilteredExpenses.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Info size={40} className="mx-auto mb-2 opacity-50" />
            <p>今月はまだ支出がありません</p>
            <p className="text-sm">「支出を追加」から記録しましょう</p>
          </div>
        ) : (
          monthlyFilteredExpenses.map((expense) => {
            const payerName = expense.payerId
              ? getDisplayNameFromPayerId(expense.payerId, displayNames)
              : (expense.payerLegacy || expense.payer || '不明');
            const isInvalidPayer = !expense.payerId;

            return (
              <div key={expense.id} className="rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {expense.description || '（項目名なし）'}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>{new Date(expense.date).toLocaleDateString('ja-JP')}</span>
                      <span className="text-slate-300">/</span>
                      <span className={isInvalidPayer ? 'inline-flex items-center gap-1 font-semibold text-orange-700' : ''}>
                        {payerName}
                        {isInvalidPayer && <AlertCircle size={13} />}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="min-w-24 text-right text-lg font-semibold text-slate-900">
                      {expense.amount.toLocaleString()}円
                    </span>
                    <button
                      onClick={() => onEditExpense(expense)}
                      aria-label="支出を編集"
                      className="rounded-md p-1.5 text-sky-700 hover:bg-sky-50"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      aria-label="支出を削除"
                      className="rounded-md p-1.5 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
