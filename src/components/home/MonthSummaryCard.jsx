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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <div>
              <div className="text-sm opacity-90">{displayNames.user1}</div>
              <div className="text-2xl font-bold">{totals.user1Total.toLocaleString()}円</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <div>
              <div className="text-sm opacity-90">{displayNames.user2}</div>
              <div className="text-2xl font-bold">{totals.user2Total.toLocaleString()}円</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <DollarSign size={24} />
            <div>
              <div className="text-sm opacity-90">合計支出</div>
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
          <div className={`font-semibold ${kpis.budgetDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatSignedAmount(kpis.budgetDelta)}
          </div>
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

