import { useEffect, useRef, useState } from 'react';
import { Save, XCircle } from 'lucide-react';
import { formatDateToInput, isValidPayerId } from '../../features/expenses';

function buildInitialFormState(editingExpense, initialDraft, categories) {
  if (editingExpense) {
    return {
      description: editingExpense.description || '',
      amount: editingExpense.amount || '',
      category: editingExpense.category || categories[0],
      payerId: editingExpense.payerId || '',
      date: editingExpense.date || formatDateToInput(new Date())
    };
  }

  return {
    description: initialDraft?.description || '',
    amount: initialDraft?.amount || '',
    category: initialDraft?.category || categories[0],
    payerId: initialDraft?.payerId || '',
    date: initialDraft?.date || formatDateToInput(new Date())
  };
}

export default function ExpenseFormModal({
  editingExpense,
  initialDraft,
  displayNames,
  categories,
  onSave,
  onClose,
  onNotify
}) {
  const [formState, setFormState] = useState(() => buildInitialFormState(editingExpense, initialDraft, categories));

  const descriptionInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const saveButtonRef = useRef(null);

  useEffect(() => {
    setFormState(buildInitialFormState(editingExpense, initialDraft, categories));
  }, [editingExpense, initialDraft, categories]);

  useEffect(() => {
    const target = editingExpense ? descriptionInputRef.current : amountInputRef.current;
    target?.focus();
  }, [editingExpense]);

  const hasLegacyPayer = editingExpense?.payerLegacy && !editingExpense?.payerId;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.description.trim() || !formState.amount || Number(formState.amount) <= 0) {
      onNotify({
        type: 'error',
        title: '入力エラー',
        message: '説明と正の金額を入力してください。'
      });
      return;
    }

    if (!isValidPayerId(formState.payerId)) {
      onNotify({
        type: 'error',
        title: '入力エラー',
        message: '支払者を選択してください。'
      });
      return;
    }

    onSave({
      description: formState.description.trim(),
      amount: parseInt(formState.amount, 10),
      category: formState.category,
      payerId: formState.payerId,
      date: formState.date
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-40 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingExpense ? '支出を編集' : '新しい支出を追加'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={20} />
          </button>
        </div>

        {hasLegacyPayer && (
          <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-md text-sm text-amber-800">
            旧データの支払者「{editingExpense.payerLegacy}」を検出しました。新しい支払者を選択して保存してください。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <input
              ref={descriptionInputRef}
              type="text"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="支出の説明を入力"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
            <input
              ref={amountInputRef}
              type="number"
              inputMode="numeric"
              value={formState.amount}
              onChange={(event) => setFormState((prev) => ({ ...prev, amount: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveButtonRef.current?.focus();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="金額を入力"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={formState.category}
              onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払者</label>
            <select
              value={formState.payerId}
              onChange={(event) => setFormState((prev) => ({ ...prev, payerId: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              <option value="user1">{displayNames.user1}</option>
              <option value="user2">{displayNames.user2}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              ref={saveButtonRef}
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {editingExpense ? '更新' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

