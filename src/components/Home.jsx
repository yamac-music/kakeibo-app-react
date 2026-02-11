import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  PlusCircle,
  Users,
  ListChecks,
  PieChart as PieChartIcon,
  Info,
  Settings,
  Target,
  TrendingUp,
  DollarSign,
  Wallet,
  LogOut,
  Search
} from 'lucide-react';
import { db, appId } from '../firebase';
import { useAuth } from '../contexts/useAuth.jsx';
import IdleWarningModal from './IdleWarningModal.jsx';
import ExpenseFormModal from './home/ExpenseFormModal.jsx';
import SettingsModal from './home/SettingsModal.jsx';
import BudgetModal from './home/BudgetModal.jsx';
import PrivacyModal from './home/PrivacyModal.jsx';
import TermsModal from './home/TermsModal.jsx';
import NotificationToast from './ui/NotificationToast.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import {
  APP_COMMIT_SHA,
  APP_VERSION
} from '../config/appConfig.js';
import {
  CATEGORIES,
  PIE_CHART_COLORS,
  DEFAULT_DISPLAY_NAMES,
  createExpenseRepository,
  calculateTotals,
  calculateSettlement,
  formatMonthYear,
  validateDisplayNames,
  getDisplayNameFromPayerId
} from '../features/expenses';
import { validateExpenseData } from '../utils/validation.js';

const DEFAULT_NOTIFICATION_DURATION = 4000;

function buildSettingsState(settings) {
  return {
    displayNames: settings?.displayNames || DEFAULT_DISPLAY_NAMES,
    payerAliases: settings?.payerAliases || {
      [DEFAULT_DISPLAY_NAMES.user1]: 'user1',
      [DEFAULT_DISPLAY_NAMES.user2]: 'user2'
    },
    settlements: settings?.settlements || {}
  };
}

function buildImportResultMessage(result) {
  if (!result.success) {
    const detail = result.errors?.slice(0, 3).join('\n') || '詳細不明';
    return `インポートに失敗しました。\n${detail}`;
  }

  if (result.failedCount > 0) {
    const detail = result.errors?.slice(0, 3).join('\n') || '';
    return `${result.importedCount}件をインポートしました。\n${result.failedCount}件は失敗しました。${detail ? `\n${detail}` : ''}`;
  }

  return `${result.importedCount}件をインポートしました。`;
}

function toPayerIdFromDisplayName(name, displayNames) {
  if (name === displayNames.user1) return 'user1';
  if (name === displayNames.user2) return 'user2';
  return null;
}

export default function Home({ isDemoMode = false }) {
  const {
    currentUser,
    logout,
    showIdleWarning,
    remainingTime,
    extendSession
  } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [settingsState, setSettingsState] = useState(() => buildSettingsState());
  const [monthlyBudgets, setMonthlyBudgets] = useState({});

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [notification, setNotification] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const fileInputRef = useRef(null);

  const repository = useMemo(
    () => createExpenseRepository({ isDemoMode, currentUserId: currentUser?.uid, db, appId }),
    [isDemoMode, currentUser?.uid]
  );

  const applySnapshot = useCallback((snapshot) => {
    setExpenses(snapshot.expenses || []);
    setMonthlyBudgets(snapshot.monthlyBudgets || {});
    setSettingsState(buildSettingsState(snapshot.settings));
  }, []);

  const pushNotification = useCallback((payload) => {
    setNotification({
      ...payload,
      id: Date.now()
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    if (!notification) return undefined;

    const timeoutId = setTimeout(() => {
      closeNotification();
    }, DEFAULT_NOTIFICATION_DURATION);

    return () => clearTimeout(timeoutId);
  }, [notification, closeNotification]);

  const requestConfirm = useCallback((payload) => {
    return new Promise((resolve) => {
      setConfirmState({
        ...payload,
        resolve
      });
    });
  }, []);

  const handleConfirmAccept = useCallback(() => {
    if (!confirmState?.resolve) return;
    confirmState.resolve(true);
    setConfirmState(null);
  }, [confirmState]);

  const handleConfirmCancel = useCallback(() => {
    if (!confirmState?.resolve) return;
    confirmState.resolve(false);
    setConfirmState(null);
  }, [confirmState]);

  useEffect(() => {
    if (!repository) return undefined;

    const unsubscribe = repository.subscribe(
      (snapshot) => {
        applySnapshot(snapshot);
      },
      (error) => {
        pushNotification({
          type: 'error',
          title: 'データ読み込みエラー',
          message: error?.message || 'データ取得に失敗しました。'
        });
      }
    );

    return unsubscribe;
  }, [repository, applySnapshot, pushNotification]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      pushNotification({
        type: 'error',
        title: 'ログアウト失敗',
        message: error?.message || 'ログアウトに失敗しました。'
      });
    }
  }, [logout, pushNotification]);

  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
    }
  }, [searchTerm]);

  const handleClearSearch = useCallback(() => {
    setIsSearching(false);
    setSearchTerm('');
  }, []);

  const handleSearchKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleAddOrUpdateExpense = useCallback(async (expenseFormData) => {
    if (!repository) return;

    const validation = validateExpenseData(
      {
        ...expenseFormData
      },
      CATEGORIES
    );

    if (!validation.isValid) {
      pushNotification({
        type: 'error',
        title: '入力エラー',
        message: validation.errors.join('\n')
      });
      return;
    }

    try {
      const result = await repository.saveExpense({
        expense: {
          ...validation.sanitized,
          payerId: expenseFormData.payerId
        },
        existingExpense: editingExpense,
        settings: settingsState
      });

      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '保存失敗',
          message: result.error || '支出データの保存に失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      setShowExpenseForm(false);
      setEditingExpense(null);

      pushNotification({
        type: 'success',
        title: '保存完了',
        message: editingExpense ? '支出を更新しました。' : '支出を登録しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '保存失敗',
        message: error?.message || '支出データの保存に失敗しました。'
      });
    }
  }, [repository, editingExpense, settingsState, applySnapshot, pushNotification]);

  const handleDeleteExpense = useCallback(async (expenseId) => {
    if (!repository) return;

    if (!expenseId) {
      pushNotification({
        type: 'error',
        title: '削除不可',
        message: 'データIDが不正です。'
      });
      return;
    }

    const confirmed = await requestConfirm({
      title: '支出を削除',
      message: 'この支出データを削除しますか？',
      confirmLabel: '削除する',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const result = await repository.deleteExpense(expenseId);
      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '削除失敗',
          message: result.error || '支出データの削除に失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      pushNotification({
        type: 'success',
        title: '削除完了',
        message: '支出データを削除しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '削除失敗',
        message: error?.message || '支出データの削除に失敗しました。'
      });
    }
  }, [repository, requestConfirm, applySnapshot, pushNotification]);

  const handleSaveDisplayNames = useCallback(async (newUser1Name, newUser2Name) => {
    if (!repository) return;

    const validation = validateDisplayNames({
      user1: newUser1Name,
      user2: newUser2Name
    });

    if (!validation.ok) {
      pushNotification({
        type: 'error',
        title: '入力エラー',
        message: validation.errors.join('\n')
      });
      return;
    }

    try {
      const result = await repository.saveDisplayNames({
        displayNames: validation.displayNames,
        previousDisplayNames: settingsState.displayNames,
        payerAliases: settingsState.payerAliases,
        settlements: settingsState.settlements
      });

      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '保存失敗',
          message: result.error || 'ユーザー名の保存に失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      pushNotification({
        type: 'success',
        title: '保存完了',
        message: 'ユーザー名を保存しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '保存失敗',
        message: error?.message || 'ユーザー名の保存に失敗しました。'
      });
    }
  }, [repository, settingsState, applySnapshot, pushNotification]);

  const handleSaveBudgets = useCallback(async (nextMonthlyBudgets) => {
    if (!repository) return;

    try {
      const result = await repository.saveBudgets(nextMonthlyBudgets);

      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '保存失敗',
          message: result.error || '予算データの保存に失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      pushNotification({
        type: 'success',
        title: '保存完了',
        message: '予算を保存しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '保存失敗',
        message: error?.message || '予算データの保存に失敗しました。'
      });
    }
  }, [repository, applySnapshot, pushNotification]);

  const handleExportData = useCallback(() => {
    if (!repository) return;

    const result = repository.exportData({
      expenses,
      settings: settingsState,
      monthlyBudgets
    });

    if (!result.success) {
      pushNotification({
        type: 'error',
        title: 'エクスポート失敗',
        message: result.errors.slice(0, 3).join('\n') || 'エクスポートに失敗しました。'
      });
      return;
    }

    const dataString = JSON.stringify(result.payload, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataString)}`;
    const fileName = `家計簿データ_${new Date().toISOString().split('T')[0]}_v2.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();

    pushNotification({
      type: 'success',
      title: 'エクスポート完了',
      message: 'データをエクスポートしました。'
    });
  }, [repository, expenses, settingsState, monthlyBudgets, pushNotification]);

  const handleImportData = useCallback(async (event) => {
    if (!repository) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (readEvent) => {
      try {
        const rawData = JSON.parse(readEvent.target.result);

        const confirmed = await requestConfirm({
          title: 'データインポート',
          message: '既存データへ追加でインポートします。実行しますか？',
          confirmLabel: 'インポートする',
          variant: 'warning'
        });

        if (!confirmed) return;

        const result = await repository.importData({
          rawData,
          fallbackSettings: settingsState
        });

        if (result.snapshot) {
          applySnapshot(result.snapshot);
        }

        pushNotification({
          type: result.success ? 'success' : 'error',
          title: result.success ? 'インポート結果' : 'インポート失敗',
          message: buildImportResultMessage(result)
        });
      } catch {
        pushNotification({
          type: 'error',
          title: 'インポート失敗',
          message: 'データのインポートに失敗しました。ファイル形式を確認してください。'
        });
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  }, [repository, requestConfirm, settingsState, applySnapshot, pushNotification]);

  const navigateMonth = useCallback((direction) => {
    setCurrentMonth((prevMonth) => {
      const nextMonth = new Date(prevMonth);
      nextMonth.setMonth(nextMonth.getMonth() + direction);
      return nextMonth;
    });
  }, []);

  const monthlyFilteredExpenses = useMemo(() => {
    if (!repository) return [];

    return repository.listByMonth(expenses, currentMonth, {
      searchTerm,
      isSearching
    });
  }, [repository, expenses, currentMonth, searchTerm, isSearching]);

  const totals = useMemo(() => calculateTotals(monthlyFilteredExpenses), [monthlyFilteredExpenses]);

  const settlement = useMemo(
    () => calculateSettlement(totals, settingsState.displayNames),
    [totals, settingsState.displayNames]
  );

  const currentMonthKey = useMemo(() => formatMonthYear(currentMonth), [currentMonth]);
  const currentMonthSettlementRecord = settingsState.settlements?.[currentMonthKey] || null;
  const isSettlementOutdated = useMemo(() => {
    if (!currentMonthSettlementRecord) return false;
    if (settlement.amount <= 0) return false;
    return Math.abs((currentMonthSettlementRecord.amount || 0) - settlement.amount) >= 1;
  }, [currentMonthSettlementRecord, settlement.amount]);

  const handleMarkSettlementCompleted = useCallback(async () => {
    if (!repository) return;
    if (settlement.amount <= 0) {
      pushNotification({
        type: 'warning',
        title: '精算記録不可',
        message: '精算額が 0 円のため、記録は不要です。'
      });
      return;
    }

    const confirmed = await requestConfirm({
      title: '精算完了を記録',
      message: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月の精算完了を記録しますか？`,
      confirmLabel: '記録する',
      variant: 'primary'
    });
    if (!confirmed) return;

    const fromPayerId = toPayerIdFromDisplayName(settlement.from, settingsState.displayNames);
    const toPayerId = toPayerIdFromDisplayName(settlement.to, settingsState.displayNames);
    if (!fromPayerId || !toPayerId) {
      pushNotification({
        type: 'error',
        title: '精算記録失敗',
        message: '支払者を特定できないため、記録できませんでした。'
      });
      return;
    }

    try {
      const result = await repository.saveSettlementCompletion({
        monthKey: currentMonthKey,
        settlementRecord: {
          monthKey: currentMonthKey,
          amount: Math.floor(settlement.amount),
          fromPayerId,
          toPayerId,
          completedAt: new Date().toISOString()
        }
      });

      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '精算記録失敗',
          message: result.error || '精算完了の記録に失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      pushNotification({
        type: 'success',
        title: '精算記録完了',
        message: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月の精算完了を記録しました。`
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '精算記録失敗',
        message: error?.message || '精算完了の記録に失敗しました。'
      });
    }
  }, [
    repository,
    settlement,
    settingsState.displayNames,
    requestConfirm,
    currentMonth,
    currentMonthKey,
    pushNotification,
    applySnapshot
  ]);

  const handleClearSettlementCompleted = useCallback(async () => {
    if (!repository) return;
    if (!currentMonthSettlementRecord) return;

    const confirmed = await requestConfirm({
      title: '精算完了記録を取り消し',
      message: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月の精算完了記録を取り消しますか？`,
      confirmLabel: '取り消す',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const result = await repository.clearSettlementCompletion(currentMonthKey);
      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '取り消し失敗',
          message: result.error || '精算記録の取り消しに失敗しました。'
        });
        return;
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      pushNotification({
        type: 'success',
        title: '取り消し完了',
        message: '精算完了記録を取り消しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '取り消し失敗',
        message: error?.message || '精算記録の取り消しに失敗しました。'
      });
    }
  }, [
    repository,
    currentMonthSettlementRecord,
    requestConfirm,
    currentMonth,
    currentMonthKey,
    pushNotification,
    applySnapshot
  ]);

  const pieData = useMemo(
    () => Object.entries(totals.categories)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0),
    [totals.categories]
  );

  const budgetComparison = useMemo(() => {
    const monthKey = formatMonthYear(currentMonth);
    const currentMonthBudgets = monthlyBudgets[monthKey] || {};
    const comparison = {};
    let totalBudget = 0;
    const totalSpent = totals.user1Total + totals.user2Total;

    CATEGORIES.forEach((category) => {
      const budget = currentMonthBudgets[category] || 0;
      const spent = totals.categories[category] || 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      comparison[category] = {
        budget,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budget && budget > 0
      };
      totalBudget += budget;
    });

    return {
      categories: comparison,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overallPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [monthlyBudgets, currentMonth, totals]);

  const userDisplay = currentUser?.displayName || currentUser?.email || 'ゲストユーザー';

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="text-sky-700" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">二人暮らしの家計簿</h1>
              <div className="text-sm text-slate-600">{userDisplay}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBudgetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Target size={18} />
              <span className="hidden sm:inline">目標</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">設定</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
            前月
          </button>

          <h2 className="text-xl font-semibold text-slate-800">
            {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
          </h2>

          <button
            onClick={() => navigateMonth(1)}
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
                <div className="text-sm opacity-90">{settingsState.displayNames.user1}</div>
                <div className="text-2xl font-bold">{totals.user1Total.toLocaleString()}円</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-3">
              <Users size={24} />
              <div>
                <div className="text-sm opacity-90">{settingsState.displayNames.user2}</div>
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

        {(settlement.amount > 0 || currentMonthSettlementRecord) && (
          <div className="mt-6 space-y-3">
            {settlement.amount > 0 && (
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
                    onClick={handleMarkSettlementCompleted}
                    className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    精算完了として記録
                  </button>
                </div>
              </div>
            )}

            {currentMonthSettlementRecord && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-emerald-800">
                  <div className="font-semibold">この月は精算完了として記録済みです</div>
                  <div className="text-sm mt-1">
                    {new Date(currentMonthSettlementRecord.completedAt).toLocaleString('ja-JP')} に
                    {' '}
                    {getDisplayNameFromPayerId(currentMonthSettlementRecord.fromPayerId, settingsState.displayNames)}
                    {' → '}
                    {getDisplayNameFromPayerId(currentMonthSettlementRecord.toPayerId, settingsState.displayNames)}
                    {' '}
                    {currentMonthSettlementRecord.amount.toLocaleString()}円で記録
                  </div>

                  {isSettlementOutdated && (
                    <div className="text-xs mt-2 text-amber-700">
                      記録後に支出が変わっています。最新の精算額は {settlement.amount.toLocaleString()}円 です。
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {settlement.amount > 0 && (
                    <button
                      onClick={handleMarkSettlementCompleted}
                      className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    >
                      最新内容で再記録
                    </button>
                  )}
                  <button
                    onClick={handleClearSettlementCompleted}
                    className="px-3 py-1.5 text-sm bg-slate-500 text-white rounded-md hover:bg-slate-600"
                  >
                    精算完了記録を取り消し
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {budgetComparison.totalBudget > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} />
            今月の予算進捗
          </h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>全体進捗</span>
              <span>{budgetComparison.totalSpent.toLocaleString()} / {budgetComparison.totalBudget.toLocaleString()}円</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetComparison.overallPercentage > 100
                    ? 'bg-red-500'
                    : budgetComparison.overallPercentage > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetComparison.overallPercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {budgetComparison.overallPercentage.toFixed(1)}% 使用
              {budgetComparison.totalRemaining >= 0
                ? ` (残り ${budgetComparison.totalRemaining.toLocaleString()}円)`
                : ` (${Math.abs(budgetComparison.totalRemaining).toLocaleString()}円 超過)`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(budgetComparison.categories)
              .filter(([, data]) => data.budget > 0)
              .map(([category, data]) => (
                <div key={category} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{category}</span>
                    <span className={data.isOverBudget ? 'text-red-600' : 'text-slate-600'}>
                      {data.spent.toLocaleString()} / {data.budget.toLocaleString()}円
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        data.isOverBudget
                          ? 'bg-red-500'
                          : data.percentage > 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(data.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.percentage.toFixed(1)}% 使用
                    {data.remaining >= 0
                      ? ` (残り ${data.remaining.toLocaleString()}円)`
                      : ` (${Math.abs(data.remaining).toLocaleString()}円 超過)`}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ListChecks size={20} />
            支出一覧 ({monthlyFilteredExpenses.length}件)
          </h3>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="支出を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Search size={16} />
                検索
              </button>
              <button
                onClick={handleClearSearch}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                クリア
              </button>
            </div>
            {isSearching && (
              <div className="mt-2 text-sm text-gray-600">
                検索結果
                {searchTerm && (
                  <span className="ml-2 font-semibold">
                    「{searchTerm}」({monthlyFilteredExpenses.length}件)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {monthlyFilteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Info size={48} className="mx-auto mb-3 opacity-50" />
                <p>今月はまだ支出がありません</p>
                <p className="text-sm">右下の「+」ボタンから支出を記録しましょう</p>
              </div>
            ) : (
              monthlyFilteredExpenses.map((expense) => {
                const payerName = expense.payerId
                  ? getDisplayNameFromPayerId(expense.payerId, settingsState.displayNames)
                  : (expense.payerLegacy || expense.payer || '不明');
                const isInvalidPayer = !expense.payerId;

                return (
                  <div key={expense.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800">
                            {expense.description || '（項目名なし）'}
                          </span>
                          {!expense.description && (
                            <span className="text-xs text-red-500 ml-1">⚠️</span>
                          )}
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {expense.category}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {new Date(expense.date).toLocaleDateString('ja-JP')} -
                          <span className={isInvalidPayer ? 'text-orange-600 font-semibold' : ''}>
                            {payerName}
                            {isInvalidPayer && (
                              <span className="ml-1 text-xs">⚠️不明</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="font-semibold text-lg text-slate-800">
                          {expense.amount.toLocaleString()}円
                        </span>
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowExpenseForm(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
                  <Tooltip formatter={(value) => `${value.toLocaleString()}円`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setEditingExpense(null);
          setShowExpenseForm(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <PlusCircle size={24} />
      </button>

      {showExpenseForm && (
        <ExpenseFormModal
          editingExpense={editingExpense}
          displayNames={settingsState.displayNames}
          categories={CATEGORIES}
          onSave={handleAddOrUpdateExpense}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onNotify={pushNotification}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          displayNames={settingsState.displayNames}
          onSaveDisplayNames={handleSaveDisplayNames}
          onExportData={handleExportData}
          onImportData={handleImportData}
          fileInputRef={fileInputRef}
          onClose={() => setShowSettingsModal(false)}
          onShowPrivacy={() => setShowPrivacyModal(true)}
          onShowTerms={() => setShowTermsModal(true)}
          appVersion={APP_VERSION}
          commitSha={APP_COMMIT_SHA}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          currentMonth={currentMonth}
          monthlyBudgets={monthlyBudgets}
          categories={CATEGORIES}
          onSave={handleSaveBudgets}
          onClose={() => setShowBudgetModal(false)}
          onNotify={pushNotification}
          onRequestConfirm={requestConfirm}
        />
      )}

      {showPrivacyModal && (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {showTermsModal && (
        <TermsModal onClose={() => setShowTermsModal(false)} />
      )}

      <IdleWarningModal
        show={showIdleWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={handleLogout}
      />

      <NotificationToast notification={notification} onClose={closeNotification} />
      <ConfirmDialog
        state={confirmState}
        onConfirm={handleConfirmAccept}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
