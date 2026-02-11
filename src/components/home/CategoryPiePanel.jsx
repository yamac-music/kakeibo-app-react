import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  Cell,
  Legend,
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
      .filter((item) => item.value > 0),
    [totals.categories]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PieChartIcon size={20} />
        カテゴリ別支出
      </h3>

      {pieData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <PieChartIcon size={48} className="mx-auto mb-3 opacity-50" />
            <p>データがありません</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()}円`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="w-full flex items-center justify-between text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md px-3 py-2"
        >
          <span className="inline-flex items-center gap-1">
            <BarChart3 size={14} />
            詳細分析（6か月トレンド）
          </span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3 text-sm">
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
    </div>
  );
}

