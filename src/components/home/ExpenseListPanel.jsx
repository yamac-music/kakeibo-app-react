import {
  Edit3,
  Info,
  Search,
  Trash2,
  Zap
} from 'lucide-react';
import { getDisplayNameFromPayerId } from '../../features/expenses';

function QuickButton({ label, subLabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-200"
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
  quickTemplates,
  recurringSuggestions,
  currentMonthClosed,
  onQuickAddTemplate,
  onQuickAddSuggestion,
  onEditExpense,
  onDeleteExpense
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        支出一覧 ({monthlyFilteredExpenses.length}件)
      </h3>

      {currentMonthClosed && (
        <div className="mb-3 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-sm px-3 py-2">
          この月は締め済みです。編集・削除には締め解除が必要です。
        </div>
      )}

      {(quickTemplates.length > 0 || recurringSuggestions.length > 0) && (
        <div className="mb-4 space-y-2">
          {quickTemplates.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">クイック登録テンプレート</div>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.map((template) => (
                  <QuickButton
                    key={template.id}
                    label={template.label}
                    subLabel={`${template.amount.toLocaleString()}円`}
                    onClick={() => onQuickAddTemplate(template)}
                  />
                ))}
              </div>
            </div>
          )}
          {recurringSuggestions.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">固定費候補</div>
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
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="支出を検索..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onClearSearch}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {monthlyFilteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Info size={48} className="mx-auto mb-3 opacity-50" />
            <p>今月はまだ支出がありません</p>
            <p className="text-sm">右下の「+」ボタンから支出を記録しましょう</p>
          </div>
        ) : (
          monthlyFilteredExpenses.map((expense) => {
            const payerName = expense.payerId
              ? getDisplayNameFromPayerId(expense.payerId, displayNames)
              : (expense.payerLegacy || expense.payer || '不明');
            const isInvalidPayer = !expense.payerId;

            return (
              <div key={expense.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">
                        {expense.description || '（項目名なし）'}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {expense.category}
                      </span>
                      {expense.quickAdded && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full inline-flex items-center gap-1">
                          <Zap size={10} />
                          Quick
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(expense.date).toLocaleDateString('ja-JP')} -
                      <span className={isInvalidPayer ? 'text-orange-600 font-semibold' : ''}>
                        {payerName}
                        {isInvalidPayer && <span className="ml-1 text-xs">⚠️不明</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="font-semibold text-lg text-slate-800">
                      {expense.amount.toLocaleString()}円
                    </span>
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
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
    </div>
  );
}

