import { AlertTriangle, ArrowRight, CheckCircle2, Lock, LockOpen } from 'lucide-react';
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
    <section className="space-y-2">
      {settlement.amount > 0 && !isClosed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-800">今月の精算</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-slate-950">
                <span className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm">{settlement.from}</span>
                <ArrowRight size={18} className="text-amber-700" />
                <span className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow-sm">{settlement.to}</span>
                <span className="ml-0 text-2xl font-bold md:ml-3">
                  {Math.floor(settlement.amount).toLocaleString()}円
                </span>
              </div>
              <div className="mt-1 text-xs text-amber-800">月を締めると、この精算額を履歴として残します。</div>
            </div>

            <button
              onClick={onCloseMonth}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Lock size={14} />
              この月を締める
            </button>
          </div>
        </div>
      )}

      {currentMonthSettlementRecord && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm">
          <div className="text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} />
              精算完了記録
            </div>
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
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3.5 shadow-sm">
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
              className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              <LockOpen size={14} />
              締めを解除
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
