import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Trash2, Edit3, Save, XCircle, PlusCircle, Users, ListChecks, PieChart as PieChartIcon, Info, Download, Upload, Settings, Target, TrendingUp, DollarSign, Wallet, LogOut } from 'lucide-react';

// Firebaseのインポート
import { 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    Timestamp,
    writeBatch
} from 'firebase/firestore';

import { db, isFirebaseAvailable, appId } from '../firebase';
import { useAuth } from '../contexts/AuthContext.jsx';

// --- アプリケーションのデフォルト値 ---
const DEFAULT_USER1_NAME = "ユーザー1";
const DEFAULT_USER2_NAME = "ユーザー2";
const CATEGORIES = ["食費", "日用品", "趣味・娯楽", "交通費", "住宅費", "医療費", "教育費", "交際費", "衣服・美容", "特別な支出", "その他"];
const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D', '#FFC0CB', '#A52A2A', '#DEB887', '#5F9EA0', '#7FFF00', '#DA70D6'];

// --- ヘルパー関数 ---
const formatMonthYear = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const formatDateToInput = (dateStringOrDate) => {
    if (!dateStringOrDate) return '';
    const date = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};


// --- メインホームコンポーネント ---
function Home() {
    const { currentUser, logout } = useAuth();
    
    // --- State定義 ---
    const [expenses, setExpenses] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const [user1Name, setUser1Name] = useState(DEFAULT_USER1_NAME);
    const [user2Name, setUser2Name] = useState(DEFAULT_USER2_NAME);

    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const fileInputRef = useRef(null);

    const [monthlyBudgets, setMonthlyBudgets] = useState({});
    const [showBudgetModal, setShowBudgetModal] = useState(false);

    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // --- Firestoreコレクションパスの定義 ---
    const getExpensesCollectionPath = useCallback(() => {
        if (!currentUser) return null;
        return `artifacts/${appId}/users/${currentUser.uid}/expenses`;
    }, [currentUser]);

    const getUserSettingsDocPath = useCallback(() => {
        if (!currentUser) return null;
        return `artifacts/${appId}/users/${currentUser.uid}/settings/userNames`;
    }, [currentUser]);

    const getBudgetDocPath = useCallback(() => {
        if (!currentUser) return null;
        return `artifacts/${appId}/users/${currentUser.uid}/settings/budgets`;
    }, [currentUser]);

    // --- ログアウト処理 ---
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }
    };

    // --- Effectフック ---
    // ユーザー設定 (名前) の読み込み (Firestoreから)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const userSettingsPath = getUserSettingsDocPath();
        if (!userSettingsPath) return;

        const unsubscribe = onSnapshot(doc(db, userSettingsPath), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setUser1Name(data.user1Name || DEFAULT_USER1_NAME);
                setUser2Name(data.user2Name || DEFAULT_USER2_NAME);
            }
        }, (error) => {
            console.error("ユーザー設定の読み込みエラー:", error);
        });

        return () => unsubscribe();
    }, [currentUser, getUserSettingsDocPath]);

    // 支出データの読み込み (Firestoreから)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const expensesPath = getExpensesCollectionPath();
        if (!expensesPath) return;

        const unsubscribe = onSnapshot(collection(db, expensesPath), (querySnapshot) => {
            const expenseList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                expenseList.push({
                    id: doc.id,
                    ...data,
                    // 編集された日付を優先し、存在しない場合のみcreatedAtを使用
                    date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : formatDateToInput(new Date()))
                });
            });
            setExpenses(expenseList);
        }, (error) => {
            console.error("支出データの読み込みエラー:", error);
        });

        return () => unsubscribe();
    }, [currentUser, getExpensesCollectionPath]);

    // 予算データの読み込み (Firestoreから)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const budgetPath = getBudgetDocPath();
        if (!budgetPath) return;

        const unsubscribe = onSnapshot(doc(db, budgetPath), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setMonthlyBudgets(data.monthlyBudgets || {});
            }
        }, (error) => {
            console.error("予算データの読み込みエラー:", error);
        });

        return () => unsubscribe();
    }, [currentUser, getBudgetDocPath]);

    // --- CRUD関数 (支出データ) ---
    const handleAddOrUpdateExpense = async (expenseFormData) => {
        if (!currentUser) {
            alert('ユーザーが認証されていません。');
            return;
        }

        try {
            const expensesPath = getExpensesCollectionPath();
            if (!expensesPath) {
                alert('データパスが取得できません。');
                return;
            }

            const expenseData = {
                ...expenseFormData,
                uid: currentUser.uid,
                // dateフィールドを明示的に保存し、createdAtは作成時刻のみ記録
                date: expenseFormData.date,
                createdAt: editingExpense ? editingExpense.createdAt : Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date())
            };

            if (editingExpense) {
                await setDoc(doc(db, expensesPath, editingExpense.id), expenseData);
            } else {
                await addDoc(collection(db, expensesPath), expenseData);
            }

            setShowExpenseForm(false);
            setEditingExpense(null);
        } catch (error) {
            console.error('支出データの保存エラー:', error);
            alert('支出データの保存に失敗しました。');
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('この支出データを削除しますか？')) return;

        try {
            const expensesPath = getExpensesCollectionPath();
            if (!expensesPath) {
                alert('データパスが取得できません。');
                return;
            }

            await deleteDoc(doc(db, expensesPath, expenseId));
        } catch (error) {
            console.error('支出データの削除エラー:', error);
            alert('支出データの削除に失敗しました。');
        }
    };

    // --- CRUD関数 (ユーザー設定) ---
    const handleSaveUserNames = async (newUser1Name, newUser2Name) => {
        if (!currentUser) {
            alert('ユーザーが認証されていません。');
            return;
        }

        try {
            const userSettingsPath = getUserSettingsDocPath();
            if (!userSettingsPath) {
                alert('データパスが取得できません。');
                return;
            }

            await setDoc(doc(db, userSettingsPath), {
                user1Name: newUser1Name || DEFAULT_USER1_NAME,
                user2Name: newUser2Name || DEFAULT_USER2_NAME,
                uid: currentUser.uid,
                updatedAt: Timestamp.fromDate(new Date())
            });

            alert('ユーザー名が保存されました。');
        } catch (error) {
            console.error('ユーザー設定の保存エラー:', error);
            alert('ユーザー設定の保存に失敗しました。');
        }
    };

    // --- CRUD関数 (予算データ) ---
    const handleSaveBudgets = async (newMonthlyBudgets) => {
        if (!currentUser) {
            alert('ユーザーが認証されていません。');
            return;
        }

        try {
            const budgetPath = getBudgetDocPath();
            if (!budgetPath) {
                alert('データパスが取得できません。');
                return;
            }

            await setDoc(doc(db, budgetPath), {
                monthlyBudgets: newMonthlyBudgets,
                uid: currentUser.uid,
                updatedAt: Timestamp.fromDate(new Date())
            });

            alert('予算が保存されました。');
        } catch (error) {
            console.error('予算データの保存エラー:', error);
            alert('予算データの保存に失敗しました。');
        }
    };

    // --- 月移動 ---
    const navigateMonth = (direction) => {
        setCurrentMonth(prevMonth => {
            const newMonth = new Date(prevMonth);
            newMonth.setMonth(newMonth.getMonth() + direction);
            return newMonth;
        });
    };
    
    // --- 計算ロジック (メモ化) ---
    const monthlyFilteredExpenses = useMemo(() => {
        const monthYearStr = formatMonthYear(currentMonth);
        return expenses
            .filter(expense => formatMonthYear(new Date(expense.date)) === monthYearStr)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    }, [expenses, currentMonth]);

    const totals = useMemo(() => { 
        let user1ExpenseTotal = 0;
        let user2ExpenseTotal = 0; 
        const expenseCategories = {};
        monthlyFilteredExpenses.forEach(e => {
            if (e.payer === user1Name) user1ExpenseTotal += e.amount; 
            else if (e.payer === user2Name) user2ExpenseTotal += e.amount;
            expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
        });
        
        return { 
            user1Total: user1ExpenseTotal, 
            user2Total: user2ExpenseTotal,
            categories: expenseCategories,
            totalExpense: user1ExpenseTotal + user2ExpenseTotal
        };
    }, [monthlyFilteredExpenses, user1Name, user2Name]);

    const settlement = useMemo(() => { 
        const totalSpent = totals.user1Total + totals.user2Total; 
        const fairShare = totalSpent / 2; 
        const diffUser1 = totals.user1Total - fairShare;
        
        if (totalSpent === 0) return { message: "まだ支出がありません。", amount: 0, from: "", to: ""};
        if (Math.abs(diffUser1) < 0.01) return { message: "負担額は均等です。", amount: 0, from: "", to: ""}; 
        
        return diffUser1 > 0 
            ? { message: `${user2Name}が${user1Name}に ${Math.abs(diffUser1).toLocaleString()} 円支払う`, amount: Math.abs(diffUser1), from: user2Name, to: user1Name }
            : { message: `${user1Name}が${user2Name}に ${Math.abs(diffUser1).toLocaleString()} 円支払う`, amount: Math.abs(diffUser1), from: user1Name, to: user2Name };
    }, [totals, user1Name, user2Name]);

    const pieData = useMemo(() => 
        Object.entries(totals.categories)
            .map(([name, value]) => ({ name, value }))
            .filter(e => e.value > 0), 
    [totals.categories]);

    const budgetComparison = useMemo(() => {
        const monthKey = formatMonthYear(currentMonth);
        const currentMonthBudgets = monthlyBudgets[monthKey] || {};
        const comparison = {};
        let totalBudget = 0;
        let totalSpent = totals.user1Total + totals.user2Total;

        CATEGORIES.forEach(category => {
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

    // --- データのエクスポート・インポート ---
    const handleExportData = () => {
        const dataToExport = {
            expenses: expenses,
            userNames: { user1Name, user2Name },
            monthlyBudgets: monthlyBudgets,
            exportDate: new Date().toISOString(),
            version: "1.0"
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `家計簿データ_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportData = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.expenses || !Array.isArray(importedData.expenses)) {
                    alert('無効なデータ形式です。');
                    return;
                }

                const confirmImport = confirm(
                    `${importedData.expenses.length}件の支出データをインポートしますか？\n` +
                    '既存のデータに追加されます。'
                );
                
                if (!confirmImport) return;

                // Firestoreにデータを一括追加
                if (isFirebaseAvailable && currentUser) {
                    const expensesPath = getExpensesCollectionPath();
                    if (expensesPath) {
                        const batch = writeBatch(db);
                        
                        importedData.expenses.forEach(expense => {
                            const newDocRef = doc(collection(db, expensesPath));
                            batch.set(newDocRef, {
                                ...expense,
                                uid: currentUser.uid,
                                // インポート時もdateフィールドを保持し、作成日時は現在時刻
                                date: expense.date,
                                createdAt: Timestamp.fromDate(new Date()),
                                updatedAt: Timestamp.fromDate(new Date())
                            });
                        });
                        
                        await batch.commit();
                    }
                }

                // ユーザー名設定のインポート（任意）
                if (importedData.userNames) {
                    await handleSaveUserNames(
                        importedData.userNames.user1Name,
                        importedData.userNames.user2Name
                    );
                }

                // 予算設定のインポート（任意）
                if (importedData.monthlyBudgets) {
                    await handleSaveBudgets(importedData.monthlyBudgets);
                }

                alert('データのインポートが完了しました。');
            } catch (error) {
                console.error('インポートエラー:', error);
                alert('データのインポートに失敗しました。ファイル形式を確認してください。');
            }
        };
        
        reader.readAsText(file); 
    };


    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 font-sans">
            {/* ヘッダー */}
            <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Wallet className="text-sky-700" size={28} />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">二人暮らしの家計簿</h1>
                            <div className="text-sm text-slate-600">
                                {currentUser?.displayName || currentUser?.email || 'ゲストユーザー'}
                            </div>
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

            {/* 月選択とサマリー */}
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

                {/* 支出サマリー */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-3">
                            <Users size={24} />
                            <div>
                                <div className="text-sm opacity-90">{user1Name}</div>
                                <div className="text-2xl font-bold">{totals.user1Total.toLocaleString()}円</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-3">
                            <Users size={24} />
                            <div>
                                <div className="text-sm opacity-90">{user2Name}</div>
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

                {/* 精算情報 */}
                {settlement.amount > 0 && (
                    <div className="mt-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="text-yellow-600" size={20} />
                                <div className="text-yellow-800">
                                    <div className="font-semibold">精算が必要です</div>
                                    <div className="text-sm">{settlement.message}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 予算進捗 */}
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
                                    budgetComparison.overallPercentage > 100 ? 'bg-red-500' : 
                                    budgetComparison.overallPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(budgetComparison.overallPercentage, 100)}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {budgetComparison.overallPercentage.toFixed(1)}% 使用
                            {budgetComparison.totalRemaining >= 0 ? 
                                ` (残り ${budgetComparison.totalRemaining.toLocaleString()}円)` : 
                                ` (${Math.abs(budgetComparison.totalRemaining).toLocaleString()}円 超過)`
                            }
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
                                            data.isOverBudget ? 'bg-red-500' : 
                                            data.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {data.percentage.toFixed(1)}% 使用
                                    {data.remaining >= 0 ? 
                                        ` (残り ${data.remaining.toLocaleString()}円)` : 
                                        ` (${Math.abs(data.remaining).toLocaleString()}円 超過)`
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* メインコンテンツ - 2列レイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 支出リスト */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <ListChecks size={20} />
                        支出一覧 ({monthlyFilteredExpenses.length}件)
                    </h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {monthlyFilteredExpenses.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Info size={48} className="mx-auto mb-3 opacity-50" />
                                <p>今月はまだ支出がありません</p>
                                <p className="text-sm">右下の「+」ボタンから支出を記録しましょう</p>
                            </div>
                        ) : (
                            monthlyFilteredExpenses.map(expense => (
                                <div key={expense.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-800">{expense.description}</span>
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                    {expense.category}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {new Date(expense.date).toLocaleDateString('ja-JP')} - {expense.payer}
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
                            ))
                        )}
                    </div>
                </div>

                {/* 円グラフ */}
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

            {/* 浮動アクションボタン - 支出追加 */}
            <button
                onClick={() => {
                    setEditingExpense(null);
                    setShowExpenseForm(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center hover:scale-105"
            >
                <PlusCircle size={24} />
            </button>

            {/* 支出フォームモーダル */}
            {showExpenseForm && (
                <ExpenseFormModal 
                    editingExpense={editingExpense}
                    user1Name={user1Name}
                    user2Name={user2Name}
                    onSave={handleAddOrUpdateExpense}
                    onClose={() => {
                        setShowExpenseForm(false);
                        setEditingExpense(null);
                    }}
                />
            )}

            {/* 設定モーダル */}
            {showSettingsModal && (
                <SettingsModal 
                    user1Name={user1Name}
                    user2Name={user2Name}
                    onSaveUserNames={handleSaveUserNames}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                    fileInputRef={fileInputRef}
                    onClose={() => setShowSettingsModal(false)}
                    onShowPrivacy={() => setShowPrivacyModal(true)}
                    onShowTerms={() => setShowTermsModal(true)}
                />
            )}

            {/* 予算設定モーダル */}
            {showBudgetModal && (
                <BudgetModal 
                    currentMonth={currentMonth}
                    monthlyBudgets={monthlyBudgets}
                    onSave={handleSaveBudgets}
                    onClose={() => setShowBudgetModal(false)}
                />
            )}

            {/* プライバシーポリシーモーダル */}
            {showPrivacyModal && (
                <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
            )}

            {/* 利用規約モーダル */}
            {showTermsModal && (
                <TermsModal onClose={() => setShowTermsModal(false)} />
            )}

        </div>
    );
}

// --- 支出フォームモーダルコンポーネント ---
const ExpenseFormModal = ({ editingExpense, user1Name, user2Name, onSave, onClose }) => {
    const [description, setDescription] = useState(editingExpense?.description || '');
    const [amount, setAmount] = useState(editingExpense?.amount || '');
    const [category, setCategory] = useState(editingExpense?.category || CATEGORIES[0]);
    const [payer, setPayer] = useState(editingExpense?.payer || user1Name);
    const [date, setDate] = useState(editingExpense?.date || formatDateToInput(new Date()));

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!description.trim() || !amount || amount <= 0) {
            alert('説明と正の金額を入力してください。');
            return;
        }

        onSave({
            description: description.trim(),
            amount: parseInt(amount),
            category,
            payer,
            date
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            説明
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="支出の説明を入力"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            金額
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="金額を入力"
                            min="1"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            カテゴリ
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            支払者
                        </label>
                        <select
                            value={payer}
                            onChange={(e) => setPayer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={user1Name}>{user1Name}</option>
                            <option value={user2Name}>{user2Name}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            日付
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
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
};

// --- 設定モーダルコンポーネント ---
const SettingsModal = ({ user1Name, user2Name, onSaveUserNames, onExportData, onImportData, fileInputRef, onClose, onShowPrivacy, onShowTerms }) => {
    const [tempUser1Name, setTempUser1Name] = useState(user1Name);
    const [tempUser2Name, setTempUser2Name] = useState(user2Name);

    const handleSave = () => {
        onSaveUserNames(tempUser1Name, tempUser2Name);
    };

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-40 p-4" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
        >
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">設定</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* ユーザー名設定 */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">ユーザー名設定</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ユーザー1の名前</label>
                                <input
                                    type="text"
                                    value={tempUser1Name}
                                    onChange={(e) => setTempUser1Name(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ユーザー1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ユーザー2の名前</label>
                                <input
                                    type="text"
                                    value={tempUser2Name}
                                    onChange={(e) => setTempUser2Name(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ユーザー2"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                ユーザー名を保存
                            </button>
                        </div>
                    </div>

                    {/* データ管理 */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">データ管理</h4>
                        <div className="space-y-3">
                            <button
                                onClick={onExportData}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
                            >
                                <Download size={16} />
                                データをエクスポート
                            </button>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-center gap-2"
                            >
                                <Upload size={16} />
                                データをインポート
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={onImportData}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* その他 */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">その他</h4>
                        <div className="space-y-2">
                            <button
                                onClick={onShowPrivacy}
                                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                                プライバシーポリシー
                            </button>
                            <button
                                onClick={onShowTerms}
                                className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                                利用規約
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 予算設定モーダルコンポーネント ---
const BudgetModal = ({ currentMonth, monthlyBudgets, onSave, onClose }) => {
    const monthKey = formatMonthYear(currentMonth);
    const currentMonthBudgets = monthlyBudgets[monthKey] || {};
    
    const [tempBudgets, setTempBudgets] = useState(() => {
        const budgets = {};
        CATEGORIES.forEach(category => {
            budgets[category] = currentMonthBudgets[category] || 0;
        });
        return budgets;
    });

    const handleSave = () => {
        const newMonthlyBudgets = {
            ...monthlyBudgets,
            [monthKey]: tempBudgets
        };
        onSave(newMonthlyBudgets);
        onClose();
    };

    const totalBudget = Object.values(tempBudgets).reduce((sum, budget) => sum + budget, 0);

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-40 p-4" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
        >
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月 予算設定
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {CATEGORIES.map(category => (
                        <div key={category}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {category}
                            </label>
                            <input
                                type="number"
                                value={tempBudgets[category]}
                                onChange={(e) => setTempBudgets(prev => ({
                                    ...prev,
                                    [category]: parseInt(e.target.value) || 0
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    ))}

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-medium text-gray-700">合計予算</span>
                            <span className="text-lg font-semibold">{totalBudget.toLocaleString()}円</span>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                保存
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- プライバシーポリシーモーダル ---
const PrivacyModal = ({ onClose }) => (
    <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">プライバシーポリシー</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <XCircle size={20} />
                </button>
            </div>
            <div className="prose prose-sm max-w-none">
                <h4>個人情報の収集について</h4>
                <p>当アプリケーションは、サービス提供のために以下の情報を収集します：</p>
                <ul>
                    <li>メールアドレス（認証目的）</li>
                    <li>支出データ（アプリ機能提供目的）</li>
                    <li>設定情報（アプリ機能提供目的）</li>
                </ul>
                
                <h4>情報の利用目的</h4>
                <p>収集した情報は以下の目的でのみ利用します：</p>
                <ul>
                    <li>サービスの提供・運営</li>
                    <li>ユーザー認証</li>
                    <li>データの保存・同期</li>
                </ul>
                
                <h4>情報の保護</h4>
                <p>お客様の個人情報は、Firebase Authenticationおよび Firebase Firestoreにより適切に暗号化・保護されています。</p>
                
                <h4>情報の第三者提供</h4>
                <p>当アプリケーションは、お客様の個人情報を第三者に提供することはありません。</p>
                
                <h4>お問い合わせ</h4>
                <p>プライバシーポリシーに関するお問い合わせは、開発者までご連絡ください。</p>
            </div>
        </div>
    </div>
);

// --- 利用規約モーダル ---
const TermsModal = ({ onClose }) => (
    <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(2px)' }}
    >
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">利用規約</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <XCircle size={20} />
                </button>
            </div>
            <div className="prose prose-sm max-w-none">
                <h4>サービスの利用について</h4>
                <p>当アプリケーションは、個人の家計管理を目的として提供されています。</p>
                
                <h4>禁止事項</h4>
                <p>以下の行為を禁止します：</p>
                <ul>
                    <li>本サービスの妨害行為</li>
                    <li>他のユーザーへの迷惑行為</li>
                    <li>虚偽の情報の登録</li>
                    <li>商業目的での利用</li>
                </ul>
                
                <h4>免責事項</h4>
                <p>当アプリケーションの使用により生じた損害について、開発者は一切の責任を負いません。</p>
                
                <h4>サービスの変更・終了</h4>
                <p>開発者は、事前の通知なしにサービスの内容を変更、または終了する場合があります。</p>
                
                <h4>準拠法</h4>
                <p>本規約は日本法に準拠し、日本の裁判所を専属的合意管轄とします。</p>
            </div>
        </div>
    </div>
);

export default Home;