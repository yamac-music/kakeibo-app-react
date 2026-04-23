import {
  LogOut,
  Settings,
  Target,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth.jsx';
import IdleWarningModal from './IdleWarningModal.jsx';
import ExpenseFormModal from './home/ExpenseFormModal.jsx';
import SettingsModal from './home/SettingsModal.jsx';
import BudgetModal from './home/BudgetModal.jsx';
import PrivacyModal from './home/PrivacyModal.jsx';
import TermsModal from './home/TermsModal.jsx';
import MonthSummaryCard from './home/MonthSummaryCard.jsx';
import SettlementPanel from './home/SettlementPanel.jsx';
import ExpenseListPanel from './home/ExpenseListPanel.jsx';
import CategoryPiePanel from './home/CategoryPiePanel.jsx';
import BudgetProgressPanel from './home/BudgetProgressPanel.jsx';
import ZaimImportModal from './home/ZaimImportModal.jsx';
import NotificationToast from './ui/NotificationToast.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import PromptDialog from './ui/PromptDialog.jsx';
import {
  APP_COMMIT_SHA,
  APP_VERSION
} from '../config/appConfig.js';
import { CATEGORIES } from '../features/expenses';
import { useHomeController } from '../features/expenses/hooks/useHomeController.js';

export default function Home({ isDemoMode = false }) {
  const {
    currentUser,
    logout,
    showIdleWarning,
    remainingTime,
    extendSession
  } = useAuth();

  const {
    state,
    derived,
    actions
  } = useHomeController({
    isDemoMode,
    currentUser,
    logout
  });

  const shouldShowSettlementPanel = (
    derived.settlement.amount > 0
    || derived.currentMonthSettlementRecord
    || derived.currentMonthClosure
  );

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-3 pb-16 md:px-5 lg:px-6 font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Wallet className="text-sky-700" size={28} />
              <div>
                <h1 className="text-xl font-bold text-slate-900">二人暮らしの家計簿</h1>
                <div className="text-sm text-slate-500">{state.userDisplay}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => actions.setShowBudgetModal(true)}
                aria-label="予算目標を設定"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Target size={18} />
                <span className="hidden sm:inline">目標</span>
              </button>
              <button
                onClick={() => actions.setShowSettingsModal(true)}
                aria-label="設定を開く"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">設定</span>
              </button>
              <button
                onClick={actions.handleLogout}
                aria-label="ログアウト"
                className="flex items-center gap-2 px-4 py-2 bg-white text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </header>

        <MonthSummaryCard
          currentMonth={state.currentMonth}
          displayNames={state.settingsState.displayNames}
          totals={derived.totals}
          kpis={derived.kpis}
          onNavigateMonth={actions.navigateMonth}
        />

        {shouldShowSettlementPanel && (
          <div className="mb-3">
            <SettlementPanel
              settlement={derived.settlement}
              currentMonth={state.currentMonth}
              currentMonthSettlementRecord={derived.currentMonthSettlementRecord}
              currentMonthClosure={derived.currentMonthClosure}
              displayNames={state.settingsState.displayNames}
              isSettlementOutdated={derived.isSettlementOutdated}
              isClosureOutdated={derived.isClosureOutdated}
              onCloseMonth={actions.handleCloseMonth}
              onReopenMonth={actions.handleReopenMonth}
            />
          </div>
        )}

        <BudgetProgressPanel budgetComparison={derived.budgetComparison} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <ExpenseListPanel
            monthlyFilteredExpenses={derived.monthlyFilteredExpenses}
            searchTerm={state.searchTerm}
            onSearchTermChange={actions.setSearchTerm}
            onClearSearch={actions.clearSearch}
            displayNames={state.settingsState.displayNames}
            recurringSuggestions={derived.recurringSuggestions}
            currentMonthClosed={derived.isCurrentMonthClosed}
            onQuickAddSuggestion={actions.handleQuickAddFromSuggestion}
            onEditExpense={actions.openEditExpenseForm}
            onDeleteExpense={actions.handleDeleteExpense}
            onAddExpense={actions.openNewExpenseForm}
          />

          <CategoryPiePanel
            totals={derived.totals}
            sixMonthTrend={derived.sixMonthTrend}
          />
        </div>
      </div>

      {state.showExpenseForm && (
        <ExpenseFormModal
          editingExpense={state.editingExpense}
          initialDraft={state.initialExpenseDraft}
          displayNames={state.settingsState.displayNames}
          categories={CATEGORIES}
          onSave={actions.handleAddOrUpdateExpense}
          onClose={() => {
            actions.setShowExpenseForm(false);
            actions.setEditingExpense(null);
          }}
          onNotify={actions.pushNotification}
        />
      )}

      {state.showSettingsModal && (
        <SettingsModal
          displayNames={state.settingsState.displayNames}
          monthClosures={state.settingsState.monthClosures}
          backupRecords={state.backupRecords}
          suggestionsEnabled={state.settingsState.preferences?.suggestionsEnabled}
          onSaveDisplayNames={actions.handleSaveDisplayNames}
          onToggleSuggestions={actions.handleToggleSuggestions}
          onCreateBackup={actions.handleCreateManualBackup}
          onRestoreBackup={actions.handleRestoreBackup}
          onExportData={actions.handleExportData}
          onImportData={actions.handleImportData}
          onZaimImport={actions.handleZaimImportFile}
          fileInputRef={state.fileInputRef}
          zaimFileInputRef={state.zaimFileInputRef}
          onClose={() => actions.setShowSettingsModal(false)}
          onShowPrivacy={() => actions.setShowPrivacyModal(true)}
          onShowTerms={() => actions.setShowTermsModal(true)}
          appVersion={APP_VERSION}
          commitSha={APP_COMMIT_SHA}
        />
      )}

      {state.showBudgetModal && (
        <BudgetModal
          currentMonth={state.currentMonth}
          monthlyBudgets={state.monthlyBudgets}
          categories={CATEGORIES}
          onSave={actions.handleSaveBudgets}
          onClose={() => actions.setShowBudgetModal(false)}
          onNotify={actions.pushNotification}
          onRequestConfirm={actions.requestConfirm}
        />
      )}

      {state.showPrivacyModal && (
        <PrivacyModal onClose={() => actions.setShowPrivacyModal(false)} />
      )}

      {state.showTermsModal && (
        <TermsModal onClose={() => actions.setShowTermsModal(false)} />
      )}

      {state.showZaimImportModal && (
        <ZaimImportModal
          parsedExpenses={state.zaimParsedExpenses}
          displayNames={state.settingsState.displayNames}
          categories={CATEGORIES}
          onImport={actions.handleZaimImportConfirm}
          onClose={() => actions.setShowZaimImportModal(false)}
        />
      )}

      <IdleWarningModal
        show={showIdleWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={actions.handleLogout}
      />

      <NotificationToast notification={state.notification} onClose={actions.closeNotification} />
      <ConfirmDialog
        state={state.confirmState}
        onConfirm={actions.handleConfirmAccept}
        onCancel={actions.handleConfirmCancel}
      />
      <PromptDialog
        state={state.promptState}
        onConfirm={actions.handlePromptConfirm}
        onCancel={actions.handlePromptCancel}
      />
    </div>
  );
}
