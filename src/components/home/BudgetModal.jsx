import { useMemo, useState, useCallback } from 'react';
import { Copy, Save, XCircle } from 'lucide-react';
import { formatMonthYear } from '../../features/expenses';

export default function BudgetModal({
  currentMonth,
  monthlyBudgets,
  categories,
  onSave,
  onClose,
  onNotify,
  onRequestConfirm
}) {
  const monthKey = formatMonthYear(currentMonth);
  const currentMonthBudgets = monthlyBudgets[monthKey] || {};

  const previousMonth = useMemo(() => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth;
  }, [currentMonth]);

  const previousMonthKey = useMemo(() => formatMonthYear(previousMonth), [previousMonth]);
  const previousMonthBudgets = useMemo(
    () => monthlyBudgets[previousMonthKey] || {},
    [monthlyBudgets, previousMonthKey]
  );

  const [tempBudgets, setTempBudgets] = useState(() => {
    const budgets = {};
    categories.forEach((category) => {
      budgets[category] = currentMonthBudgets[category] || 0;
    });
    return budgets;
  });

  const handleSave = () => {
    const nextMonthlyBudgets = {
      ...monthlyBudgets,
      [monthKey]: tempBudgets
    };
    onSave(nextMonthlyBudgets);
    onClose();
  };

  const hasPreviousData = useMemo(
    () => Object.values(previousMonthBudgets).some((budget) => budget > 0),
    [previousMonthBudgets]
  );

  const handleCopyFromPreviousMonth = useCallback(async () => {
    if (!hasPreviousData) {
      onNotify({
        type: 'warning',
        title: 'コピー不可',
        message: '前月の予算データが存在しません。'
      });
      return;
    }

    const previousMonthName = `${previousMonth.getFullYear()}年${previousMonth.getMonth() + 1}月`;
    const confirmed = await onRequestConfirm({
      title: '前月予算をコピー',
      message: `前月（${previousMonthName}）の予算をコピーしますか？\n現在の入力内容は上書きされます。`,
      confirmLabel: 'コピーする',
      variant: 'warning'
    });

    if (!confirmed) return;

    const copiedBudgets = {};
    categories.forEach((category) => {
      copiedBudgets[category] = previousMonthBudgets[category] || 0;
    });

    setTempBudgets(copiedBudgets);
  }, [categories, hasPreviousData, onNotify, onRequestConfirm, previousMonth, previousMonthBudgets]);

  const totalBudget = Object.values(tempBudgets).reduce((sum, budget) => sum + budget, 0);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月 予算設定
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={handleCopyFromPreviousMonth}
            disabled={!hasPreviousData}
            title={hasPreviousData
              ? `前月（${previousMonth.getFullYear()}年${previousMonth.getMonth() + 1}月）の予算をコピー`
              : '前月の予算データが存在しません'}
            aria-label={`前月（${previousMonth.getFullYear()}年${previousMonth.getMonth() + 1}月）から予算をコピー`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Copy size={16} />
            前月からコピー
            {!hasPreviousData && (
              <span className="text-xs ml-1">(データなし)</span>
            )}
          </button>
          {hasPreviousData && (
            <p className="text-xs text-gray-600 mt-1 text-center">
              {previousMonth.getFullYear()}年{previousMonth.getMonth() + 1}月の予算を利用できます
            </p>
          )}
        </div>

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{category}</label>
              <input
                type="number"
                value={tempBudgets[category]}
                onChange={(e) => setTempBudgets((prev) => ({
                  ...prev,
                  [category]: parseInt(e.target.value, 10) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          ))}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-700">合計予算</span>
              <span className="text-lg font-semibold">{totalBudget.toLocaleString()}円</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
