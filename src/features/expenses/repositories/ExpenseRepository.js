/**
 * @typedef {Object} ExpenseRepository
 * @property {(onData: function, onError: function) => function} subscribe
 * @property {(payload: {expense: object, existingExpense?: object, settings: object}) => Promise<object>} saveExpense
 * @property {(expenseId: string) => Promise<object>} deleteExpense
 * @property {(payload: {displayNames: object, previousDisplayNames: object, payerAliases: object}) => Promise<object>} saveDisplayNames
 * @property {(payload: {monthKey: string, settlementRecord: object}) => Promise<object>} saveSettlementCompletion
 * @property {(monthKey: string) => Promise<object>} clearSettlementCompletion
 * @property {(monthlyBudgets: object) => Promise<object>} saveBudgets
 * @property {(payload: {rawData: object, fallbackSettings: object}) => Promise<object>} importData
 * @property {(payload: {expenses: object[], settings: object, monthlyBudgets: object}) => object} exportData
 * @property {(expenses: object[], currentMonth: Date, options: object) => object[]} listByMonth
 * @property {() => object} getSnapshot
 */

export {};
