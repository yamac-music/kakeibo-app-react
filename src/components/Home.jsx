import {
  LogOut,
  PlusCircle,
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="text-sky-700" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">二人暮らしの家計簿</h1>
              <div className="text-sm text-slate-600">{state.userDisplay}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => actions.setShowBudgetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Target size={18} />
              <span className="hidden sm:inline">目標</span>
            </button>
            <button
              onClick={() => actions.setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">設定</span>
            </button>
            <button
              onClick={actions.handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseListPanel
          monthlyFilteredExpenses={derived.monthlyFilteredExpenses}
          searchTerm={state.searchTerm}
          onSearchTermChange={actions.setSearchTerm}
          onClearSearch={actions.clearSearch}
          displayNames={state.settingsState.displayNames}
          quickTemplates={state.settingsState.quickTemplates || []}
          recurringSuggestions={derived.recurringSuggestions}
          currentMonthClosed={derived.isCurrentMonthClosed}
          onQuickAddTemplate={actions.handleQuickAddFromTemplate}
          onQuickAddSuggestion={actions.handleQuickAddFromSuggestion}
          onEditExpense={actions.openEditExpenseForm}
          onDeleteExpense={actions.handleDeleteExpense}
        />

        <CategoryPiePanel
          totals={derived.totals}
          sixMonthTrend={derived.sixMonthTrend}
        />
      </div>

      <button
        onClick={actions.openNewExpenseForm}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <PlusCircle size={24} />
      </button>

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
          categories={CATEGORIES}
          quickTemplates={state.settingsState.quickTemplates}
          monthClosures={state.settingsState.monthClosures}
          backupRecords={state.backupRecords}
          suggestionsEnabled={state.settingsState.preferences?.suggestionsEnabled}
          onSaveDisplayNames={actions.handleSaveDisplayNames}
          onSaveQuickTemplates={actions.handleSaveQuickTemplates}
          onToggleSuggestions={actions.handleToggleSuggestions}
          onCreateBackup={actions.handleCreateManualBackup}
          onRestoreBackup={actions.handleRestoreBackup}
          onExportData={actions.handleExportData}
          onImportData={actions.handleImportData}
          fileInputRef={state.fileInputRef}
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
