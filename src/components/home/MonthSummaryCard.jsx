import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet
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
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigateMonth(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
        >
          <ChevronLeft size={18} />
          前月
        </button>

        <h2 className="text-xl font-semibold text-slate-800">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </h2>

        <button
          onClick={() => onNavigateMonth(1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
        >
          次月
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 text-slate-500 shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <div className="text-sm text-slate-500">{displayNames.user1}</div>
              <div className="text-2xl font-semibold">{totals.user1Total.toLocaleString()}円</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 text-slate-500 shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <div className="text-sm text-slate-500">{displayNames.user2}</div>
              <div className="text-2xl font-semibold">{totals.user2Total.toLocaleString()}円</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-2 text-sky-700 shadow-sm">
              <DollarSign size={20} />
            </div>
            <div>
              <div className="text-sm text-sky-800">合計支出</div>
              <div className="text-2xl font-bold">{totals.totalExpense.toLocaleString()}円</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <div className="text-slate-500 flex items-center gap-1">
            <Wallet size={14} />
            予算乖離
          </div>
          {kpis.hasBudget ? (
            <div className={`font-semibold ${kpis.budgetDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatSignedAmount(kpis.budgetDelta)}
            </div>
          ) : (
            <div className="font-semibold text-slate-500">未設定</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <div className="text-slate-500 flex items-center gap-1">
            {kpis.monthOverMonthDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            先月比
          </div>
          <div className={`font-semibold ${kpis.monthOverMonthDelta <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {formatSignedAmount(kpis.monthOverMonthDelta)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
          <div className="text-slate-500">精算見込み</div>
          <div className="font-semibold text-slate-800">{Math.floor(kpis.settlementForecast).toLocaleString()}円</div>
        </div>
      </div>
    </div>
  );
}
