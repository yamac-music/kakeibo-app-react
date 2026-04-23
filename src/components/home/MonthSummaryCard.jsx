import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards
} from 'lucide-react';

function formatSignedAmount(amount) {
  if (amount === 0) return '0円';
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${Math.abs(amount).toLocaleString()}円`;
}

export default function MonthSummaryCard({
  currentMonth,
  displayNames,
  totals,
  kpis,
  onNavigateMonth
}) {
  const payerTotals = [
    { name: displayNames.user1, amount: totals.user1Total },
    { name: displayNames.user2, amount: totals.user2Total }
  ];
  const maxPayerTotal = Math.max(...payerTotals.map((item) => item.amount), 1);
  const monthOverMonthTone = kpis.monthOverMonthDelta <= 0 ? 'text-emerald-700' : 'text-amber-700';
  const budgetTone = kpis.budgetDelta >= 0 ? 'text-emerald-700' : 'text-rose-700';

  return (
    <section className="mb-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigateMonth(-1)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">前月</span>
        </button>

        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </h2>

        <button
          onClick={() => onNavigateMonth(1)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <span className="hidden sm:inline">次月</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                <ReceiptText size={16} />
                今月の支出
              </div>
              <div className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                {totals.totalExpense.toLocaleString()}円
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                {kpis.monthOverMonthDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                先月比 <span className={monthOverMonthTone}>{formatSignedAmount(kpis.monthOverMonthDelta)}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                <WalletCards size={14} />
                予算 {kpis.hasBudget ? <span className={budgetTone}>{formatSignedAmount(kpis.budgetDelta)}</span> : <span className="text-slate-500">未設定</span>}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {payerTotals.map((payer) => (
              <div key={payer.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_7.5rem] items-center gap-3 text-sm">
                <div className="truncate font-medium text-slate-600">{payer.name}</div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-600"
                    style={{ width: `${Math.max(6, (payer.amount / maxPayerTotal) * 100)}%` }}
                  />
                </div>
                <div className="text-right font-semibold text-slate-900">{payer.amount.toLocaleString()}円</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50 p-3.5">
          <div className="text-sm font-medium text-sky-800">精算見込み</div>
          <div className="mt-1.5 text-3xl font-bold text-slate-950">
            {Math.floor(kpis.settlementForecast).toLocaleString()}円
          </div>
          <div className="mt-1 text-xs text-slate-500">
            二人の支払い差額から自動計算
          </div>
        </div>
      </div>
    </section>
  );
}
