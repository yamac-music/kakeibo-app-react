import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { PIE_CHART_COLORS } from '../../features/expenses';

export default function CategoryPiePanel({ totals, sixMonthTrend }) {
  const [showDetails, setShowDetails] = useState(false);

  const pieData = useMemo(
    () => Object.entries(totals.categories)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value),
    [totals.categories]
  );
  const topCategories = pieData.slice(0, 5);
  const shouldShowChart = pieData.length > 1;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <PieChartIcon size={20} />
        支出の内訳
      </h3>

      {pieData.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-slate-500">
          <div className="text-center">
            <PieChartIcon size={40} className="mx-auto mb-2 opacity-50" />
            <p>データがありません</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 ${shouldShowChart ? 'md:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[160px_minmax(0,1fr)]' : ''}`}>
          {shouldShowChart && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={1}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()}円`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2.5">
            {topCategories.map((item, index) => {
              const percent = totals.totalExpense > 0 ? Math.round((item.value / totals.totalExpense) * 100) : 0;

              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] }}
                      />
                      <span className="truncate font-medium text-slate-700">{item.name}</span>
                    </div>
                    <div className="shrink-0 font-semibold text-slate-900">
                      {item.value.toLocaleString()}円
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-slate-500">{percent}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
        >
          <span className="inline-flex items-center gap-1">
            <BarChart3 size={14} />
            詳細分析（6か月トレンド）
          </span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="font-semibold text-emerald-800 mb-1">増加カテゴリ Top3</div>
              {sixMonthTrend.increases.length === 0 ? (
                <div className="text-emerald-700">該当なし</div>
              ) : (
                sixMonthTrend.increases.map((item) => (
                  <div key={item.category} className="text-emerald-800">
                    {item.category}: +{Math.floor(item.diff).toLocaleString()}円
                  </div>
                ))
              )}
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="font-semibold text-amber-800 mb-1">減少カテゴリ Top3</div>
              {sixMonthTrend.decreases.length === 0 ? (
                <div className="text-amber-700">該当なし</div>
              ) : (
                sixMonthTrend.decreases.map((item) => (
                  <div key={item.category} className="text-amber-800">
                    {item.category}: {Math.floor(item.diff).toLocaleString()}円
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
