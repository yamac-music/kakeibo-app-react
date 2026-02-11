/**
 * @typedef {Object} ExpenseRepository
 * @property {(onData: function, onError: function) => function} subscribe
 * @property {(payload: {expense: object, existingExpense?: object, settings: object}) => Promise<object>} saveExpense
 * @property {(expenseId: string) => Promise<object>} deleteExpense
 * @property {(payload: {displayNames: object, previousDisplayNames: object, payerAliases: object, settlements?: object, monthClosures?: object, quickTemplates?: object[], preferences?: object}) => Promise<object>} saveDisplayNames
 * @property {(payload: {quickTemplates: object[]}) => Promise<object>} saveQuickTemplates
 * @property {(payload: {preferences: object}) => Promise<object>} savePreferences
 * @property {(payload: {monthKey: string, settlementRecord: object}) => Promise<object>} saveSettlementCompletion
 * @property {(monthKey: string) => Promise<object>} clearSettlementCompletion
 * @property {(payload: {monthKey: string, closureRecord: object}) => Promise<object>} saveMonthClosure
 * @property {(payload: {monthKey: string, reason: string}) => Promise<object>} reopenMonth
 * @property {(monthlyBudgets: object) => Promise<object>} saveBudgets
 * @property {(payload: {rawData: object, fallbackSettings: object, options?: {dryRun?: boolean, skipDuplicates?: boolean}}) => Promise<object>} importData
 * @property {(payload: {expenses: object[], settings: object, monthlyBudgets: object}) => object} exportData
 * @property {(expenses: object[], currentMonth: Date, options: object) => object[]} listByMonth
 * @property {() => object} getSnapshot
 */

export {};
