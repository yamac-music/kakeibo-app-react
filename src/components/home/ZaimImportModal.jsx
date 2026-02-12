import { memo, useCallback, useMemo, useState } from 'react';
import { FileSpreadsheet, XCircle } from 'lucide-react';

const ZaimImportRow = memo(function ZaimImportRow({
  item,
  categories,
  onToggle,
  onChangeCategory
}) {
  return (
    <tr className={item.checked ? 'hover:bg-slate-50' : 'bg-slate-100 text-slate-400'}>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          className="rounded"
        />
      </td>
      <td className="px-2 py-1.5 text-sm whitespace-nowrap">{item.date}</td>
      <td className="px-2 py-1.5 text-sm max-w-[200px]">
        <div className="truncate" title={item.description}>{item.description}</div>
        {item.itemName && item.description !== item.itemName && (
          <div className="text-xs text-slate-400 truncate" title={item.itemName}>{item.itemName}</div>
        )}
      </td>
      <td className="px-2 py-1.5 text-sm text-right whitespace-nowrap">
        {item.amount.toLocaleString()}円
      </td>
      <td className="px-2 py-1.5 text-xs text-slate-500 whitespace-nowrap">
        <div>{item.zaimCategory}</div>
        {item.zaimSubCategory && (
          <div className="text-slate-400">{item.zaimSubCategory}</div>
        )}
      </td>
      <td className="px-2 py-1.5">
        <select
          value={item.category}
          onChange={(e) => onChangeCategory(item.id, e.target.value)}
          className="text-sm px-1 py-0.5 border border-slate-300 rounded w-full"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </td>
    </tr>
  );
});

export default function ZaimImportModal({
  parsedExpenses,
  displayNames,
  categories,
  onImport,
  onClose
}) {
  const [items, setItems] = useState(() =>
    parsedExpenses.map((expense, index) => ({
      ...expense,
      id: index,
      checked: !expense.preUnchecked,
      category: expense.mappedCategory,
    }))
  );
  const [defaultPayerId, setDefaultPayerId] = useState('user1');
  const [filterText, setFilterText] = useState('');

  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const term = filterText.trim().toLowerCase();
    return items.filter((item) =>
      item.description.toLowerCase().includes(term)
      || item.zaimCategory.toLowerCase().includes(term)
      || item.zaimSubCategory.toLowerCase().includes(term)
      || item.paymentSource.toLowerCase().includes(term)
    );
  }, [items, filterText]);

  const summary = useMemo(() => {
    const checked = items.filter((item) => item.checked);
    return {
      checkedCount: checked.length,
      totalCount: items.length,
      totalAmount: checked.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [items]);

  const handleToggle = useCallback((id) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  const handleChangeCategory = useCallback((id, category) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, category } : item
    ));
  }, []);

  const handleSelectAll = useCallback(() => {
    const visibleIds = new Set(filteredItems.map((item) => item.id));
    setItems((prev) => prev.map((item) =>
      visibleIds.has(item.id) ? { ...item, checked: true } : item
    ));
  }, [filteredItems]);

  const handleDeselectAll = useCallback(() => {
    const visibleIds = new Set(filteredItems.map((item) => item.id));
    setItems((prev) => prev.map((item) =>
      visibleIds.has(item.id) ? { ...item, checked: false } : item
    ));
  }, [filteredItems]);

  const handleImport = useCallback(() => {
    const selected = items
      .filter((item) => item.checked)
      .map((item) => ({
        description: item.description,
        amount: item.amount,
        category: item.category,
        payerId: defaultPayerId,
        date: item.date,
      }));
    onImport(selected);
  }, [items, defaultPayerId, onImport]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-teal-600" size={20} />
            <h3 className="text-lg font-semibold">Zaim CSVインポート</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">登録者:</label>
              <select
                value={defaultPayerId}
                onChange={(e) => setDefaultPayerId(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              >
                <option value="user1">{displayNames.user1}</option>
                <option value="user2">{displayNames.user2}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                すべて選択
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                すべて解除
              </button>
            </div>

            <div className="flex-1 min-w-[140px]">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="絞り込み..."
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="text-sm text-slate-600">
            選択: <span className="font-semibold text-slate-800">{summary.checkedCount}</span>件
            / {summary.totalCount}件
            {'　'}合計: <span className="font-semibold text-slate-800">{summary.totalAmount.toLocaleString()}</span>円
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-xs font-medium text-slate-500 w-10">選択</th>
                <th className="px-2 py-2 text-xs font-medium text-slate-500">日付</th>
                <th className="px-2 py-2 text-xs font-medium text-slate-500">説明</th>
                <th className="px-2 py-2 text-xs font-medium text-slate-500 text-right">金額</th>
                <th className="px-2 py-2 text-xs font-medium text-slate-500">Zaim</th>
                <th className="px-2 py-2 text-xs font-medium text-slate-500 w-28">カテゴリ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <ZaimImportRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  onToggle={handleToggle}
                  onChangeCategory={handleChangeCategory}
                />
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              {filterText ? '該当するデータがありません' : 'データがありません'}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={summary.checkedCount === 0}
            className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            反映する ({summary.checkedCount}件)
          </button>
        </div>
      </div>
    </div>
  );
}
