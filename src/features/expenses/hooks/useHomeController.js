import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db, appId } from '../../../firebase';
import {
  calculateSettlement,
  calculateTotals,
  CATEGORIES,
  createExpenseRepository,
  DEFAULT_DISPLAY_NAMES,
  formatDateToInput,
  formatMonthYear,
  validateDisplayNames
} from '../index';
import { validateExpenseData } from '../../../utils/validation';
import {
  calculateMonthlyKpis,
  calculateSixMonthTrend,
  detectExpenseAnomaly,
  suggestRecurringExpenses
} from '../analytics';
import {
  createBackup,
  listBackups,
  restoreBackup
} from '../backupStorage';
import { mapZaimRowsToExpenses, parseZaimCsv } from '../zaimCsvParser';

const DEFAULT_NOTIFICATION_DURATION = 4000;
const LAST_EXPENSE_DRAFT_STORAGE_KEY = 'kakeibo_last_expense_draft_v1';

function buildSettingsState(settings) {
  return {
    displayNames: settings?.displayNames || DEFAULT_DISPLAY_NAMES,
    payerAliases: settings?.payerAliases || {
      [DEFAULT_DISPLAY_NAMES.user1]: 'user1',
      [DEFAULT_DISPLAY_NAMES.user2]: 'user2'
    },
    settlements: settings?.settlements || {},
    monthClosures: settings?.monthClosures || {},
    quickTemplates: settings?.quickTemplates || [],
    preferences: settings?.preferences || { suggestionsEnabled: true },
    meta: settings?.meta || {}
  };
}

function readLastExpenseDraft() {
  try {
    const raw = localStorage.getItem(LAST_EXPENSE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeLastExpenseDraft(draft) {
  try {
    localStorage.setItem(LAST_EXPENSE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // no-op
  }
}

function toPayerIdFromDisplayName(name, displayNames) {
  if (name === displayNames.user1) return 'user1';
  if (name === displayNames.user2) return 'user2';
  return null;
}

function buildImportPreviewMessage(result) {
  const summary = result.validationSummary;
  if (!summary) {
    return `${result.importedCount}件取り込み予定 / 失敗 ${result.failedCount}件`;
  }
  return [
    `検証結果:`,
    `- 合計: ${summary.totalCount}件`,
    `- 取り込み予定: ${summary.importedCount}件`,
    `- 重複候補: ${summary.duplicateCount}件`,
    `- 重複スキップ: ${summary.skippedDuplicateCount}件`,
    `- 検証失敗: ${summary.failedCount}件`
  ].join('\n');
}

function buildImportResultMessage(result) {
  if (!result.success) {
    const detail = result.errors?.slice(0, 3).join('\n') || '詳細不明';
    return `インポートに失敗しました。\n${detail}`;
  }

  if (result.failedCount > 0 || (result.duplicateCount || 0) > 0) {
    const detail = result.errors?.slice(0, 3).join('\n') || '';
    return `${result.importedCount}件をインポートしました。\n失敗: ${result.failedCount}件 / 重複: ${result.duplicateCount || 0}件${detail ? `\n${detail}` : ''}`;
  }

  return `${result.importedCount}件をインポートしました。`;
}

export function useHomeController({
  isDemoMode,
  currentUser,
  logout
}) {
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
  const [notification, setNotification] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);
  const [backupRecords, setBackupRecords] = useState(() => listBackups());
  const [lastExpenseDraft, setLastExpenseDraft] = useState(() => readLastExpenseDraft());

  const [showZaimImportModal, setShowZaimImportModal] = useState(false);
  const [zaimParsedExpenses, setZaimParsedExpenses] = useState([]);

  const fileInputRef = useRef(null);
  const zaimFileInputRef = useRef(null);

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

  const requestPrompt = useCallback((payload) => {
    return new Promise((resolve) => {
      setPromptState({
        ...payload,
        id: Date.now(),
        resolve
      });
    });
  }, []);

  const handlePromptConfirm = useCallback((value) => {
    if (!promptState?.resolve) return;
    promptState.resolve(value);
    setPromptState(null);
  }, [promptState]);

  const handlePromptCancel = useCallback(() => {
    if (!promptState?.resolve) return;
    promptState.resolve(null);
    setPromptState(null);
  }, [promptState]);

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

  const currentMonthKey = useMemo(() => formatMonthYear(currentMonth), [currentMonth]);

  const monthlyFilteredExpenses = useMemo(() => {
    if (!repository) return [];
    return repository.listByMonth(expenses, currentMonth, {
      searchTerm,
      isSearching: true
    });
  }, [repository, expenses, currentMonth, searchTerm]);

  const totals = useMemo(() => calculateTotals(monthlyFilteredExpenses), [monthlyFilteredExpenses]);

  const previousMonthTotals = useMemo(() => {
    if (!repository) {
      return {
        user1Total: 0,
        user2Total: 0,
        invalidPayerTotal: 0,
        categories: {},
        totalExpense: 0
      };
    }
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousExpenses = repository.listByMonth(expenses, previousMonth, {});
    return calculateTotals(previousExpenses);
  }, [repository, expenses, currentMonth]);

  const settlement = useMemo(
    () => calculateSettlement(totals, settingsState.displayNames),
    [totals, settingsState.displayNames]
  );

  const kpis = useMemo(
    () => calculateMonthlyKpis({
      totals,
      previousTotals: previousMonthTotals,
      monthlyBudgets,
      currentMonth
    }),
    [totals, previousMonthTotals, monthlyBudgets, currentMonth]
  );

  const sixMonthTrend = useMemo(
    () => calculateSixMonthTrend(expenses, currentMonth),
    [expenses, currentMonth]
  );

  const currentMonthSettlementRecord = settingsState.settlements?.[currentMonthKey] || null;
  const currentMonthClosure = settingsState.monthClosures?.[currentMonthKey] || null;
  const isCurrentMonthClosed = currentMonthClosure?.status === 'closed';

  const isSettlementOutdated = useMemo(() => {
    if (!currentMonthSettlementRecord) return false;
    if (settlement.amount <= 0) return false;
    return Math.abs((currentMonthSettlementRecord.amount || 0) - settlement.amount) >= 1;
  }, [currentMonthSettlementRecord, settlement.amount]);

  const isClosureOutdated = useMemo(() => {
    if (!isCurrentMonthClosed) return false;
    const closureTotals = currentMonthClosure?.totalsSnapshot;
    const closureSettlement = currentMonthClosure?.settlementSnapshot;
    if (!closureTotals && !closureSettlement) return false;

    if (closureTotals && Math.abs((closureTotals.totalExpense || 0) - totals.totalExpense) >= 1) {
      return true;
    }

    if (closureSettlement && Math.abs((closureSettlement.amount || 0) - Math.floor(settlement.amount || 0)) >= 1) {
      return true;
    }

    return false;
  }, [isCurrentMonthClosed, currentMonthClosure, totals.totalExpense, settlement.amount]);

  const recurringSuggestions = useMemo(() => {
    if (settingsState.preferences?.suggestionsEnabled === false) return [];
    return suggestRecurringExpenses(expenses, currentMonth);
  }, [settingsState.preferences?.suggestionsEnabled, expenses, currentMonth]);

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

  const ensureMonthOpenForWrite = useCallback(async () => {
    if (!repository) return false;
    if (!isCurrentMonthClosed) return true;

    const reason = await requestPrompt({
      title: '月次締めを解除',
      message: 'この月は締め済みです。編集を続行するには解除理由を入力してください。',
      inputLabel: '解除理由',
      placeholder: '例: 入力漏れの明細を追加するため',
      minLength: 3,
      confirmLabel: '解除して続行',
      variant: 'warning'
    });

    if (!reason) {
      return false;
    }

    try {
      const result = await repository.reopenMonth({
        monthKey: currentMonthKey,
        reason
      });
      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '締め解除失敗',
          message: result.error || '月次締めの解除に失敗しました。'
        });
        return false;
      }
      if (result.snapshot) applySnapshot(result.snapshot);
      pushNotification({
        type: 'success',
        title: '締め解除完了',
        message: 'この月の締めを解除しました。'
      });
      return true;
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '締め解除失敗',
        message: error?.message || '月次締めの解除に失敗しました。'
      });
      return false;
    }
  }, [
    repository,
    isCurrentMonthClosed,
    requestPrompt,
    currentMonthKey,
    applySnapshot,
    pushNotification
  ]);

  const persistExpense = useCallback(async ({ expensePayload, existingExpense }) => {
    if (!repository) return { ok: false };

    const validation = validateExpenseData(
      {
        ...expensePayload
      },
      CATEGORIES
    );

    if (!validation.isValid) {
      pushNotification({
        type: 'error',
        title: '入力エラー',
        message: validation.errors.join('\n')
      });
      return { ok: false };
    }

    try {
      const result = await repository.saveExpense({
        expense: {
          ...validation.sanitized,
          payerId: expensePayload.payerId
        },
        existingExpense,
        settings: settingsState
      });

      if (!result.success) {
        pushNotification({
          type: 'error',
          title: '保存失敗',
          message: result.error || '支出データの保存に失敗しました。'
        });
        return { ok: false };
      }

      if (result.snapshot) {
        applySnapshot(result.snapshot);
      }

      return { ok: true };
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '保存失敗',
        message: error?.message || '支出データの保存に失敗しました。'
      });
      return { ok: false };
    }
  }, [repository, settingsState, applySnapshot, pushNotification]);

  const saveQuickTemplates = useCallback(async (nextQuickTemplates) => {
    if (!repository?.saveQuickTemplates) return;
    const result = await repository.saveQuickTemplates({ quickTemplates: nextQuickTemplates });
    if (result.snapshot) {
      applySnapshot(result.snapshot);
    }
  }, [repository, applySnapshot]);

  const handleAddOrUpdateExpense = useCallback(async (expenseFormData) => {
    if (!repository) return;

    const writable = await ensureMonthOpenForWrite();
    if (!writable) return;

    if (!editingExpense) {
      const anomaly = detectExpenseAnomaly(expenseFormData, expenses);
      if (anomaly.isAnomaly) {
        const confirmed = await requestConfirm({
          title: '異常値の可能性',
          message: `過去中央値 ${Math.floor(anomaly.median).toLocaleString()}円 に対して高額です。\nこのまま保存しますか？`,
          confirmLabel: '保存する',
          variant: 'warning'
        });
        if (!confirmed) return;
      }
    }

    const result = await persistExpense({
      expensePayload: expenseFormData,
      existingExpense: editingExpense
    });

    if (!result.ok) return;

    const nextDraft = {
      category: expenseFormData.category,
      payerId: expenseFormData.payerId,
      date: expenseFormData.date || formatDateToInput(new Date())
    };
    setLastExpenseDraft(nextDraft);
    writeLastExpenseDraft(nextDraft);

    if (expenseFormData.saveAsTemplate) {
      const existing = settingsState.quickTemplates || [];
      const nextTemplate = {
        id: `tpl-${Date.now()}`,
        label: expenseFormData.description,
        amount: Number(expenseFormData.amount),
        category: expenseFormData.category,
        payerId: expenseFormData.payerId,
        lastUsedAt: new Date().toISOString()
      };
      const deduped = [nextTemplate, ...existing.filter((item) => item.label !== nextTemplate.label)]
        .slice(0, 8);
      await saveQuickTemplates(deduped);
    }

    setShowExpenseForm(false);
    setEditingExpense(null);

    pushNotification({
      type: 'success',
      title: '保存完了',
      message: editingExpense ? '支出を更新しました。' : '支出を登録しました。'
    });
  }, [
    repository,
    ensureMonthOpenForWrite,
    editingExpense,
    expenses,
    requestConfirm,
    persistExpense,
    settingsState.quickTemplates,
    saveQuickTemplates,
    pushNotification
  ]);

  const handleQuickAddFromTemplate = useCallback(async (template) => {
    const writable = await ensureMonthOpenForWrite();
    if (!writable) return;

    const result = await persistExpense({
      expensePayload: {
        description: template.label,
        amount: template.amount,
        category: template.category,
        payerId: template.payerId,
        date: formatDateToInput(new Date())
      },
      existingExpense: null
    });

    if (!result.ok) return;

    const nextTemplates = (settingsState.quickTemplates || []).map((item) => (
      item.id === template.id
        ? { ...item, lastUsedAt: new Date().toISOString() }
        : item
    ));
    await saveQuickTemplates(nextTemplates);

    pushNotification({
      type: 'success',
      title: 'クイック登録完了',
      message: `${template.label} を登録しました。`
    });
  }, [ensureMonthOpenForWrite, persistExpense, settingsState.quickTemplates, saveQuickTemplates, pushNotification]);

  const handleQuickAddFromSuggestion = useCallback(async (suggestion) => {
    const writable = await ensureMonthOpenForWrite();
    if (!writable) return;

    const result = await persistExpense({
      expensePayload: {
        description: suggestion.description,
        amount: suggestion.amount,
        category: suggestion.category,
        payerId: suggestion.payerId,
        date: suggestion.date || formatDateToInput(new Date())
      },
      existingExpense: null
    });

    if (!result.ok) return;

    pushNotification({
      type: 'success',
      title: '固定費候補を登録',
      message: `${suggestion.description} を登録しました。`
    });
  }, [ensureMonthOpenForWrite, persistExpense, pushNotification]);

  const handleDeleteExpense = useCallback(async (expenseId) => {
    if (!repository) return;

    const writable = await ensureMonthOpenForWrite();
    if (!writable) return;

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
  }, [repository, ensureMonthOpenForWrite, requestConfirm, applySnapshot, pushNotification]);

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
        settlements: settingsState.settlements,
        monthClosures: settingsState.monthClosures,
        quickTemplates: settingsState.quickTemplates,
        preferences: settingsState.preferences
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

  const handleSaveQuickTemplates = useCallback(async (nextQuickTemplates) => {
    try {
      await saveQuickTemplates(nextQuickTemplates);
      pushNotification({
        type: 'success',
        title: '保存完了',
        message: 'クイックテンプレートを保存しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '保存失敗',
        message: error?.message || 'クイックテンプレートの保存に失敗しました。'
      });
    }
  }, [saveQuickTemplates, pushNotification]);

  const handleToggleSuggestions = useCallback(async (enabled) => {
    if (!repository?.savePreferences) return;
    try {
      const result = await repository.savePreferences({
        preferences: {
          suggestionsEnabled: enabled
        }
      });
      if (result.snapshot) applySnapshot(result.snapshot);
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '設定保存失敗',
        message: error?.message || '提案機能設定の保存に失敗しました。'
      });
    }
  }, [repository, applySnapshot, pushNotification]);

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

  const createBackupFromCurrent = useCallback((reason) => {
    if (!repository) return null;
    const exported = repository.exportData({
      expenses,
      settings: settingsState,
      monthlyBudgets
    });
    if (!exported.success) return null;
    const backup = createBackup({
      reason,
      payload: exported.payload
    });
    setBackupRecords(listBackups());
    return backup;
  }, [repository, expenses, settingsState, monthlyBudgets]);

  const handleCreateManualBackup = useCallback(() => {
    const backup = createBackupFromCurrent('manual');
    if (!backup) {
      pushNotification({
        type: 'error',
        title: 'バックアップ失敗',
        message: 'バックアップデータの生成に失敗しました。'
      });
      return;
    }

    pushNotification({
      type: 'success',
      title: 'バックアップ作成',
      message: `${new Date(backup.createdAt).toLocaleString('ja-JP')} の復元ポイントを作成しました。`
    });
  }, [createBackupFromCurrent, pushNotification]);

  const handleRestoreBackup = useCallback(async (backupId) => {
    if (!repository) return;
    const payload = restoreBackup(backupId);
    if (!payload) {
      pushNotification({
        type: 'error',
        title: '復元失敗',
        message: 'バックアップデータが見つかりません。'
      });
      return;
    }

    const confirmed = await requestConfirm({
      title: '復元ポイントを適用',
      message: 'この復元ポイントを現在データへマージします。実行しますか？',
      confirmLabel: '適用する',
      variant: 'warning'
    });
    if (!confirmed) return;

    const result = await repository.importData({
      rawData: payload,
      fallbackSettings: settingsState,
      options: {
        dryRun: false,
        skipDuplicates: false
      }
    });

    if (result.snapshot) {
      applySnapshot(result.snapshot);
    }

    pushNotification({
      type: result.success ? 'success' : 'error',
      title: result.success ? '復元適用完了' : '復元失敗',
      message: buildImportResultMessage(result)
    });
  }, [repository, requestConfirm, settingsState, applySnapshot, pushNotification]);

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
    const fileName = `家計簿データ_${new Date().toISOString().split('T')[0]}_v21.json`;

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

        createBackupFromCurrent('beforeImport');
        if (rawData?.version && Number(rawData.version) < 2.1) {
          createBackupFromCurrent('beforeSchemaMigration');
        }

        const dryRunResult = await repository.importData({
          rawData,
          fallbackSettings: settingsState,
          options: {
            dryRun: true,
            skipDuplicates: true
          }
        });

        if (!dryRunResult.success) {
          pushNotification({
            type: 'error',
            title: 'インポート検証失敗',
            message: buildImportResultMessage(dryRunResult)
          });
          return;
        }

        const confirmed = await requestConfirm({
          title: 'インポート検証結果',
          message: `${buildImportPreviewMessage(dryRunResult)}\n\n取り込みを実行しますか？`,
          confirmLabel: '実行する',
          variant: 'warning'
        });

        if (!confirmed) return;

        const result = await repository.importData({
          rawData,
          fallbackSettings: settingsState,
          options: {
            dryRun: false,
            skipDuplicates: true
          }
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
  }, [repository, createBackupFromCurrent, settingsState, requestConfirm, applySnapshot, pushNotification]);

  const handleZaimImportFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readEvent) => {
      try {
        const csvText = readEvent.target.result;
        const { rows, errors } = parseZaimCsv(csvText);

        if (rows.length === 0) {
          pushNotification({
            type: 'error',
            title: 'CSV解析失敗',
            message: errors.length > 0
              ? errors.slice(0, 3).join('\n')
              : '取り込み可能な支払いデータが見つかりませんでした。'
          });
          return;
        }

        const mapped = mapZaimRowsToExpenses(rows);
        setZaimParsedExpenses(mapped);
        setShowZaimImportModal(true);

        if (errors.length > 0) {
          pushNotification({
            type: 'warning',
            title: 'CSV警告',
            message: `${errors.length}件の行にエラーがありました。`
          });
        }
      } catch {
        pushNotification({
          type: 'error',
          title: 'CSVインポート失敗',
          message: 'CSVの読み込みに失敗しました。ファイル形式を確認してください。'
        });
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  }, [pushNotification]);

  const handleZaimImportConfirm = useCallback(async (selectedExpenses) => {
    if (!repository) return;
    if (selectedExpenses.length === 0) return;

    createBackupFromCurrent('beforeZaimImport');

    const rawData = {
      expenses: selectedExpenses.map((item) => ({
        description: item.description,
        amount: item.amount,
        category: item.category,
        payerId: item.payerId,
        date: item.date,
      })),
      settings: settingsState,
    };

    const dryRunResult = await repository.importData({
      rawData,
      fallbackSettings: settingsState,
      options: { dryRun: true, skipDuplicates: true }
    });

    if (!dryRunResult.success) {
      pushNotification({
        type: 'error',
        title: 'Zaimインポート検証失敗',
        message: buildImportResultMessage(dryRunResult)
      });
      return;
    }

    const confirmed = await requestConfirm({
      title: 'Zaimインポート確認',
      message: `${buildImportPreviewMessage(dryRunResult)}\n\n取り込みを実行しますか？`,
      confirmLabel: '実行する',
      variant: 'warning'
    });

    if (!confirmed) return;

    const result = await repository.importData({
      rawData,
      fallbackSettings: settingsState,
      options: { dryRun: false, skipDuplicates: true }
    });

    if (result.snapshot) {
      applySnapshot(result.snapshot);
    }

    setShowZaimImportModal(false);
    setZaimParsedExpenses([]);

    pushNotification({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Zaimインポート結果' : 'Zaimインポート失敗',
      message: buildImportResultMessage(result)
    });
  }, [repository, settingsState, createBackupFromCurrent, requestConfirm, applySnapshot, pushNotification]);

  const handleCloseMonth = useCallback(async () => {
    if (!repository) return;
    if (isCurrentMonthClosed) {
      pushNotification({
        type: 'warning',
        title: '締め済み',
        message: 'この月はすでに締め済みです。'
      });
      return;
    }
    if (totals.totalExpense <= 0) {
      pushNotification({
        type: 'warning',
        title: '締め不可',
        message: '支出がない月は締めできません。'
      });
      return;
    }

    const confirmed = await requestConfirm({
      title: 'この月を締める',
      message: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月を締めます。\n以後は編集前に締め解除が必要になります。`,
      confirmLabel: '締める',
      variant: 'primary'
    });
    if (!confirmed) return;

    const fromPayerId = toPayerIdFromDisplayName(settlement.from, settingsState.displayNames);
    const toPayerId = toPayerIdFromDisplayName(settlement.to, settingsState.displayNames);
    const settlementSnapshot = settlement.amount > 0 && fromPayerId && toPayerId
      ? {
          amount: Math.floor(settlement.amount),
          fromPayerId,
          toPayerId
        }
      : null;

    try {
      const result = await repository.saveMonthClosure({
        monthKey: currentMonthKey,
        closureRecord: {
          status: 'closed',
          closedAt: new Date().toISOString(),
          closedBy: currentUser?.uid || 'demo-user',
          settlementSnapshot,
          totalsSnapshot: totals,
          reopenHistory: currentMonthClosure?.reopenHistory || []
        }
      });

      if (result.snapshot) applySnapshot(result.snapshot);

      if (settlementSnapshot) {
        await repository.saveSettlementCompletion({
          monthKey: currentMonthKey,
          settlementRecord: {
            monthKey: currentMonthKey,
            amount: settlementSnapshot.amount,
            fromPayerId: settlementSnapshot.fromPayerId,
            toPayerId: settlementSnapshot.toPayerId,
            completedAt: new Date().toISOString()
          }
        });
      }

      pushNotification({
        type: 'success',
        title: '月次締め完了',
        message: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月を締めました。`
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '月次締め失敗',
        message: error?.message || '月次締めの保存に失敗しました。'
      });
    }
  }, [
    repository,
    isCurrentMonthClosed,
    totals,
    requestConfirm,
    currentMonth,
    settlement,
    settingsState.displayNames,
    currentMonthKey,
    currentUser?.uid,
    currentMonthClosure?.reopenHistory,
    applySnapshot,
    pushNotification
  ]);

  const handleReopenMonth = useCallback(async () => {
    if (!repository) return;
    if (!isCurrentMonthClosed) return;

    const reason = await requestPrompt({
      title: '月次締めを解除',
      message: '解除理由を入力してください。履歴として保存されます。',
      inputLabel: '解除理由',
      placeholder: '例: 計上漏れを修正するため',
      minLength: 3,
      confirmLabel: '解除する',
      variant: 'warning'
    });
    if (!reason) return;

    try {
      const result = await repository.reopenMonth({
        monthKey: currentMonthKey,
        reason
      });
      if (result.snapshot) applySnapshot(result.snapshot);

      pushNotification({
        type: 'success',
        title: '解除完了',
        message: '月次締めを解除しました。'
      });
    } catch (error) {
      pushNotification({
        type: 'error',
        title: '解除失敗',
        message: error?.message || '月次締めの解除に失敗しました。'
      });
    }
  }, [repository, isCurrentMonthClosed, requestPrompt, currentMonthKey, applySnapshot, pushNotification]);

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

  const navigateMonth = useCallback((direction) => {
    setCurrentMonth((prevMonth) => {
      const nextMonth = new Date(prevMonth);
      nextMonth.setMonth(nextMonth.getMonth() + direction);
      return nextMonth;
    });
  }, []);

  const openNewExpenseForm = useCallback(() => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  }, []);

  const openEditExpenseForm = useCallback((expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const initialExpenseDraft = useMemo(() => {
    if (editingExpense) return null;
    const fallbackPayerId = settingsState.quickTemplates?.[0]?.payerId || '';
    const fallbackCategory = settingsState.quickTemplates?.[0]?.category || CATEGORIES[0];
    return {
      description: '',
      amount: '',
      category: lastExpenseDraft?.category || fallbackCategory,
      payerId: lastExpenseDraft?.payerId || fallbackPayerId,
      date: lastExpenseDraft?.date || formatDateToInput(new Date())
    };
  }, [editingExpense, settingsState.quickTemplates, lastExpenseDraft]);

  const userDisplay = currentUser?.displayName || currentUser?.email || 'ゲストユーザー';

  return {
    state: {
      expenses,
      settingsState,
      monthlyBudgets,
      currentMonth,
      showExpenseForm,
      editingExpense,
      showSettingsModal,
      showBudgetModal,
      showPrivacyModal,
      showTermsModal,
      searchTerm,
      notification,
      confirmState,
      promptState,
      fileInputRef,
      zaimFileInputRef,
      userDisplay,
      backupRecords,
      initialExpenseDraft,
      showZaimImportModal,
      zaimParsedExpenses
    },
    derived: {
      monthlyFilteredExpenses,
      totals,
      settlement,
      currentMonthSettlementRecord,
      currentMonthClosure,
      isSettlementOutdated,
      isClosureOutdated,
      isCurrentMonthClosed,
      budgetComparison,
      kpis,
      recurringSuggestions,
      sixMonthTrend
    },
    actions: {
      setShowExpenseForm,
      setEditingExpense,
      setShowSettingsModal,
      setShowBudgetModal,
      setShowPrivacyModal,
      setShowTermsModal,
      setSearchTerm,
      closeNotification,
      handleConfirmAccept,
      handleConfirmCancel,
      handlePromptConfirm,
      handlePromptCancel,
      handleLogout,
      navigateMonth,
      handleAddOrUpdateExpense,
      handleDeleteExpense,
      handleSaveDisplayNames,
      handleSaveBudgets,
      handleExportData,
      handleImportData,
      handleCloseMonth,
      handleReopenMonth,
      openNewExpenseForm,
      openEditExpenseForm,
      clearSearch,
      pushNotification,
      handleQuickAddFromTemplate,
      handleQuickAddFromSuggestion,
      handleSaveQuickTemplates,
      handleCreateManualBackup,
      handleRestoreBackup,
      handleToggleSuggestions,
      requestConfirm,
      handleZaimImportFile,
      handleZaimImportConfirm,
      setShowZaimImportModal
    }
  };
}
