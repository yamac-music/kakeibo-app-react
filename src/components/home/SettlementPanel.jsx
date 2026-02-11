import { AlertTriangle, Lock, LockOpen, TrendingUp } from 'lucide-react';
import { getDisplayNameFromPayerId } from '../../features/expenses';

export default function SettlementPanel({
  settlement,
  currentMonth,
  currentMonthSettlementRecord,
  currentMonthClosure,
  displayNames,
  isSettlementOutdated,
  isClosureOutdated,
  onCloseMonth,
  onReopenMonth
}) {
  if (settlement.amount <= 0 && !currentMonthSettlementRecord && !currentMonthClosure) {
    return null;
  }

  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;
  const isClosed = currentMonthClosure?.status === 'closed';

  return (
    <div className="mt-6 space-y-3">
      {settlement.amount > 0 && !isClosed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-yellow-600" size={20} />
            <div className="text-yellow-800">
              <div className="font-semibold">精算が必要です</div>
              <div className="text-sm">{settlement.message}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onCloseMonth}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1"
            >
              <Lock size={14} />
              この月を締める
            </button>
          </div>
        </div>
      )}

      {currentMonthSettlementRecord && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800">
            <div className="font-semibold">精算完了記録</div>
            <div className="text-sm mt-1">
              {new Date(currentMonthSettlementRecord.completedAt).toLocaleString('ja-JP')} に
              {' '}
              {getDisplayNameFromPayerId(currentMonthSettlementRecord.fromPayerId, displayNames)}
              {' → '}
              {getDisplayNameFromPayerId(currentMonthSettlementRecord.toPayerId, displayNames)}
              {' '}
              {currentMonthSettlementRecord.amount.toLocaleString()}円で記録
            </div>
          </div>
          {isSettlementOutdated && (
            <div className="text-xs mt-2 text-amber-700 flex items-start gap-1">
              <AlertTriangle size={14} />
              記録後に支出が変わっています。最新精算額は {Math.floor(settlement.amount).toLocaleString()}円 です。
            </div>
          )}
        </div>
      )}

      {isClosed && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <div className="text-sky-800">
            <div className="font-semibold flex items-center gap-2">
              <Lock size={14} />
              {monthLabel} は締め済みです
            </div>
            <div className="text-sm mt-1">
              締め日時: {currentMonthClosure?.closedAt ? new Date(currentMonthClosure.closedAt).toLocaleString('ja-JP') : '不明'}
            </div>
          </div>

          {isClosureOutdated && (
            <div className="text-xs mt-2 text-amber-700 flex items-start gap-1">
              <AlertTriangle size={14} />
              締め後にデータが変化しています。差分を確認して再締めしてください。
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={onReopenMonth}
              className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700 flex items-center gap-1"
            >
              <LockOpen size={14} />
              締めを解除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

