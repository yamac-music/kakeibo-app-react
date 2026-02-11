import { Target } from 'lucide-react';

export default function BudgetProgressPanel({ budgetComparison }) {
  if (budgetComparison.totalBudget <= 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Target size={20} />
        今月の予算進捗
      </h3>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>全体進捗</span>
          <span>{budgetComparison.totalSpent.toLocaleString()} / {budgetComparison.totalBudget.toLocaleString()}円</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              budgetComparison.overallPercentage > 100
                ? 'bg-red-500'
                : budgetComparison.overallPercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetComparison.overallPercentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {budgetComparison.overallPercentage.toFixed(1)}% 使用
          {budgetComparison.totalRemaining >= 0
            ? ` (残り ${budgetComparison.totalRemaining.toLocaleString()}円)`
            : ` (${Math.abs(budgetComparison.totalRemaining).toLocaleString()}円 超過)`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(budgetComparison.categories)
          .filter(([, data]) => data.budget > 0)
          .map(([category, data]) => (
            <div key={category} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{category}</span>
                <span className={data.isOverBudget ? 'text-red-600' : 'text-slate-600'}>
                  {data.spent.toLocaleString()} / {data.budget.toLocaleString()}円
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    data.isOverBudget
                      ? 'bg-red-500'
                      : data.percentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(data.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {data.percentage.toFixed(1)}% 使用
                {data.remaining >= 0
                  ? ` (残り ${data.remaining.toLocaleString()}円)`
                  : ` (${Math.abs(data.remaining).toLocaleString()}円 超過)`}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

