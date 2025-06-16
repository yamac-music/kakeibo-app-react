import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Trash2, Edit3, Save, XCircle, PlusCircle, Users, ListChecks, PieChart as PieChartIcon, AlertCircle, Info, Download, Upload, Settings, Target, TrendingUp, DollarSign, Wallet, LogOut } from 'lucide-react';

// Firebaseのインポート
import { 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    Timestamp,
    writeBatch,
    getDocs
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

    // Firebase未設定時のデモモード表示
    if (!isFirebaseAvailable) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-100">
                <div className="max-w-2xl text-center p-6">
                    <div className="text-3xl font-bold text-sky-700 mb-4">🏠 家計簿アプリ（デモモード）</div>
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
                        <div className="font-semibold mb-2">⚠️ Firebase設定が見つかりません</div>
                        <p className="text-sm">
                            現在デモモードで表示されています。完全な機能を利用するには、管理者がFirebaseの環境変数を設定する必要があります。
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                        <h3 className="text-xl font-semibold text-slate-700 mb-4">📊 主な機能</h3>
                        <ul className="text-left text-slate-600 space-y-2">
                            <li>• 💰 支出の記録と管理</li>
                            <li>• 🎯 カテゴリ別予算設定</li>
                            <li>• 📈 グラフによるデータ可視化</li>
                            <li>• 👥 二人での家計共有</li>
                            <li>• ⚖️ 自動精算計算</li>
                            <li>• 💾 データのバックアップ機能</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // 認証されていない場合（このコンポーネントはPrivateRouteで保護されているので通常は到達しない）
    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-100">
                <div className="text-xl font-semibold">認証が必要です</div>
            </div>
        );
    }

    // --- Effectフック ---
    // ユーザー設定 (名前) の読み込み (Firestoreから)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const settingsPath = getUserSettingsDocPath();
        if (!settingsPath) return;

        const docRef = doc(db, settingsPath);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser1Name(data.user1Name || DEFAULT_USER1_NAME);
                setUser2Name(data.user2Name || DEFAULT_USER2_NAME);
                console.log("Firestore: User names loaded.", data);
            } else {
                setUser1Name(DEFAULT_USER1_NAME);
                setUser2Name(DEFAULT_USER2_NAME);
                const defaultData = {
                    user1Name: DEFAULT_USER1_NAME,
                    user2Name: DEFAULT_USER2_NAME,
                    uid: currentUser.uid,
                    createdAt: Timestamp.fromDate(new Date())
                };
                setDoc(docRef, defaultData)
                    .then(() => console.log("Firestore: Default user names created."))
                    .catch(e => console.error("Firestore: Error creating default user names:", e));
            }
        }, (error) => {
            console.error("Firestore: Error listening to user names:", error);
        });
        return () => unsubscribe();
    }, [currentUser, getUserSettingsDocPath]);

    // 支出データの読み込み (Firestoreから、リアルタイム更新)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const expensesPath = getExpensesCollectionPath();
        if (!expensesPath) return;

        const q = query(collection(db, expensesPath)); 

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedExpenses = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedExpenses.push({
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                });
            });
            fetchedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(fetchedExpenses);
            console.log("Firestore: Expenses loaded/updated. Count:", fetchedExpenses.length);
        }, (error) => {
            console.error("Firestore: Error listening to expenses:", error);
        });

        return () => unsubscribe();
    }, [currentUser, getExpensesCollectionPath]);

    // 予算データの読み込み (Firestoreから、リアルタイム更新)
    useEffect(() => {
        if (!isFirebaseAvailable || !currentUser) return;

        const budgetPath = getBudgetDocPath();
        if (!budgetPath) return;

        const docRef = doc(db, budgetPath);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            try {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && typeof data === 'object') {
                        setMonthlyBudgets(data);
                        console.log("Firestore: Budget data loaded.", data);
                    } else {
                        console.warn("Invalid budget data structure:", data);
                        setMonthlyBudgets({});
                    }
                } else {
                    setMonthlyBudgets({});
                    console.log("Firestore: No budget data found, initializing empty object.");
                }
            } catch (error) {
                console.error("Error processing budget data:", error);
                setMonthlyBudgets({});
            }
        }, (error) => {
            console.error("Firestore: Error listening to budget data:", error);
            setMonthlyBudgets({});
        });
        return () => unsubscribe();
    }, [currentUser, getBudgetDocPath]);

    // --- CRUD関数 (支出データ) ---
    const handleAddOrUpdateExpense = async (expenseFormData) => {
        if (!currentUser) {
            alert("ユーザー認証が行われていません。");
            return;
        }
        const expensesPath = getExpensesCollectionPath();
        if (!expensesPath) return;

        const dataToSave = {
            ...expenseFormData,
            amount: parseFloat(expenseFormData.amount),
            date: Timestamp.fromDate(new Date(expenseFormData.date)),
            uid: currentUser.uid 
        };

        try {
            if (editingExpense) { 
                const docRef = doc(db, expensesPath, editingExpense.id);
                await setDoc(docRef, dataToSave, { merge: true });
                console.log("Firestore: Expense updated with ID:", editingExpense.id);
            } else { 
                const docRef = await addDoc(collection(db, expensesPath), dataToSave);
                console.log("Firestore: Expense added with ID:", docRef.id);
            }
            setShowExpenseForm(false);
            setEditingExpense(null);
        } catch (error) {
            console.error("Firestore: Error saving expense:", error);
            alert("支出の保存に失敗しました。");
        }
    };
    
    const handleDeleteExpense = async (id) => {
        if (!currentUser || !window.confirm("この支出を削除してもよろしいですか？")) return;
        
        const expensesPath = getExpensesCollectionPath();
        if (!expensesPath) return;

        try {
            await deleteDoc(doc(db, expensesPath, id));
            console.log("Firestore: Expense deleted with ID:", id);
        } catch (error) {
            console.error("Firestore: Error deleting expense:", error);
            alert("支出の削除に失敗しました。");
        }
    };
    
    const handleEditExpenseClick = (expense) => { 
        setEditingExpense(expense); 
        setShowExpenseForm(true);
    };

    // --- ユーザー名保存処理 ---
    const handleSaveUserNames = async (newName1, newName2) => {
        if (!currentUser) {
            alert("ユーザー認証が行われていません。");
            return;
        }
        const settingsPath = getUserSettingsDocPath();
        if (!settingsPath) return;

        try {
            const dataToSave = {
                user1Name: newName1,
                user2Name: newName2,
                uid: currentUser.uid,
                updatedAt: Timestamp.fromDate(new Date())
            };
            
            await setDoc(doc(db, settingsPath), dataToSave);
            alert("ユーザー名が保存されました。");
            console.log("Firestore: User names saved.");
        } catch (error) {
            console.error("Firestore: Error saving user names:", error);
            alert("ユーザー名の保存に失敗しました。");
        }
    };

    // --- 予算保存処理 ---
    const handleSaveBudgets = async (budgetData) => {
        if (!currentUser) {
            alert("ユーザー認証が行われていません。");
            return;
        }
        
        const budgetPath = getBudgetDocPath();
        if (!budgetPath) return;

        try {
            const dataToSave = {
                ...budgetData,
                uid: currentUser.uid,
                updatedAt: Timestamp.fromDate(new Date()),
                lastModified: new Date().toISOString()
            };
            
            const docRef = doc(db, budgetPath);
            await setDoc(docRef, dataToSave, { merge: true });
            console.log("Budget data successfully saved to Firestore");
            
            alert("予算が保存されました。");
            setShowBudgetModal(false);
        } catch (error) {
            console.error("Firestore: Error saving budget:", error);
            alert(`予算の保存に失敗しました: ${error.message}`);
        }
    };

    // --- 月ナビゲーション ---
    const navigateMonth = (direction) => {
        setCurrentMonth(prevMonth => {
            const newMonth = new Date(prevMonth); 
            newMonth.setDate(1); 
            newMonth.setMonth(prevMonth.getMonth() + direction); 
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
        try {
            const dataToExport = { 
                expenses: expenses.map(e => ({...e, date: new Date(e.date).toISOString()})),
                monthlyBudgets,
                user1Name, 
                user2Name, 
                categories: CATEGORIES,
                version: "kakeibo-app-firestore-v3.0"
            };
            const jsonString = JSON.stringify(dataToExport, null, 2); 
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-"); 
            link.download = `kakeibo_backup_${timestamp}.json`;
            document.body.appendChild(link);
            link.click(); 
            document.body.removeChild(link); 
            URL.revokeObjectURL(url); 
            alert("データがエクスポートされました！");
        } catch (error) {
            console.error("データのエクスポートに失敗しました:", error);
            alert("データのエクスポートに失敗しました。");
        }
    };

    const handleImportData = async (event) => {
        if (!currentUser) {
            alert("インポートする前にログインしてください。");
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.expenses || !importedData.user1Name || !importedData.user2Name) {
                    throw new Error("インポートされたファイル形式が正しくありません。");
                }
                if (!window.confirm("現在のFirestoreのデータをインポートしたデータで上書きしますか？この操作は元に戻せません。")) {
                    if(fileInputRef.current) fileInputRef.current.value = ""; 
                    return;
                }

                const expensesPath = getExpensesCollectionPath();
                const settingsPath = getUserSettingsDocPath();
                const budgetPath = getBudgetDocPath();
                if (!expensesPath || !settingsPath || !budgetPath) {
                    throw new Error("データパスの取得に失敗しました。");
                }

                const batch = writeBatch(db);
                
                const existingExpensesSnapshot = await getDocs(query(collection(db, expensesPath)));
                existingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
                
                (importedData.expenses || []).forEach(expense => {
                    const docRef = doc(collection(db, expensesPath));
                    batch.set(docRef, {
                        ...expense,
                        amount: parseFloat(expense.amount),
                        date: Timestamp.fromDate(new Date(expense.date)),
                        uid: currentUser.uid
                    });
                });

                batch.set(doc(db, settingsPath), {
                    user1Name: importedData.user1Name || DEFAULT_USER1_NAME,
                    user2Name: importedData.user2Name || DEFAULT_USER2_NAME,
                    uid: currentUser.uid,
                    updatedAt: Timestamp.fromDate(new Date())
                });

                if (importedData.monthlyBudgets) {
                    batch.set(doc(db, budgetPath), {
                        ...importedData.monthlyBudgets,
                        uid: currentUser.uid,
                        updatedAt: Timestamp.fromDate(new Date())
                    });
                }
                
                await batch.commit();

                alert("データが正常にインポートされました！");
                setShowSettingsModal(false); 
            } catch (error) {
                console.error("データのインポートに失敗しました:", error);
                alert(`データのインポートに失敗しました: ${error.message}`);
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = ""; 
            }
        };
        reader.readAsText(file); 
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8 font-sans">
            {/* ヘッダー */}
            <header className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={() => setShowBudgetModal(true)} 
                        className="p-2 text-slate-600 hover:text-emerald-600" 
                        title="予算設定"
                    >
                        <Target size={28} />
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold text-sky-700 text-center flex-grow">
                        家計簿アプリ
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div className="text-sm text-slate-600">
                            {currentUser.displayName || currentUser.email}
                        </div>
                        <button 
                            onClick={() => setShowSettingsModal(true)} 
                            className="p-2 text-slate-600 hover:text-sky-600" 
                            title="設定とバックアップ"
                        >
                            <Settings size={28} />
                        </button>
                        <button 
                            onClick={handleLogout} 
                            className="p-2 text-slate-600 hover:text-red-600" 
                            title="ログアウト"
                        >
                            <LogOut size={28} />
                        </button>
                    </div>
                </div>
                {/* 月ナビゲーション */}
                <div className="flex items-center justify-center space-x-4 my-4">
                    <button 
                        onClick={() => navigateMonth(-1)} 
                        className="p-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-semibold text-slate-700 w-48 text-center">
                        {formatMonthYear(currentMonth).replace('-', '年 ')}月
                    </h2>
                    <button 
                        onClick={() => navigateMonth(1)} 
                        className="p-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </header>

            {/* 支出追加ボタン (フローティング) */}
            <div className="fixed bottom-6 right-6 z-30">
                <button 
                    onClick={() => { 
                        setEditingExpense(null);
                        setShowExpenseForm(true); 
                    }} 
                    className="bg-rose-500 text-white p-4 rounded-full shadow-lg hover:bg-rose-600 transition-all duration-300 ease-in-out transform hover:scale-110"
                    aria-label="支出を記録する" 
                >
                    <PlusCircle size={32} />
                </button>
            </div>

            {/* 支出入力フォームモーダル */}
            {showExpenseForm && ( 
                <ExpenseFormModal
                    onSubmitExpense={handleAddOrUpdateExpense} 
                    user1Name={user1Name} 
                    user2Name={user2Name} 
                    categories={CATEGORIES} 
                    expenseToEdit={editingExpense} 
                    onClose={() => { 
                        setShowExpenseForm(false); 
                        setEditingExpense(null); 
                    }} 
                /> 
            )}

            
            {/* メインコンテンツ (集計とグラフ) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <SummarySection 
                    user1Name={user1Name} 
                    user2Name={user2Name} 
                    totals={totals} 
                    settlement={settlement} 
                    budgetComparison={budgetComparison}
                />
                <CategoryPieChart data={pieData} />
            </div>

            {/* 支出一覧テーブル */}
            <div className="mb-6">
                <ExpenseTable 
                    expenses={monthlyFilteredExpenses} 
                    onDeleteExpense={handleDeleteExpense} 
                    onEditExpense={handleEditExpenseClick} 
                    user1Name={user1Name} 
                    user2Name={user2Name} 
                />
            </div>
            
            {/* 設定モーダル */}
            {showSettingsModal && (
                <SettingsModal
                    isOpen={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    onExportData={handleExportData}
                    onImportDataTrigger={() => fileInputRef.current && fileInputRef.current.click()}
                    currentUser1Name={user1Name} 
                    currentUser2Name={user2Name} 
                    onSaveUserNames={handleSaveUserNames} 
                />
            )}

            {/* 予算設定モーダル */}
            {showBudgetModal && (
                <BudgetModal
                    isOpen={showBudgetModal}
                    onClose={() => setShowBudgetModal(false)}
                    onSaveBudgets={handleSaveBudgets}
                    currentMonth={currentMonth}
                    currentBudgets={monthlyBudgets[formatMonthYear(currentMonth)] || {}}
                    monthlyBudgets={monthlyBudgets}
                    categories={CATEGORIES}
                />
            )}

            {/* プライバシーポリシーモーダル */}
            {showPrivacyModal && (
                <PrivacyPolicyModal
                    isOpen={showPrivacyModal}
                    onClose={() => setShowPrivacyModal(false)}
                />
            )}

            {/* 利用規約モーダル */}
            {showTermsModal && (
                <TermsOfServiceModal
                    isOpen={showTermsModal}
                    onClose={() => setShowTermsModal(false)}
                />
            )}

            {/* ファイルインポート用の隠しinput要素 */}
            <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImportData} 
                style={{ display: 'none' }} 
            />

            {/* フッター */}
            <footer className="text-center mt-10 pt-6 border-t border-slate-300 text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} 家計簿アプリ. All rights reserved.</p>
                <p className="mt-1"> 
                    <Info size={14} className="inline mr-1"/> 
                    データはクラウド (Firestore) に保存されます。
                </p>
                <div className="mt-3 space-x-4">
                    <button 
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-sky-600 hover:text-sky-800 underline"
                    >
                        プライバシーポリシー
                    </button>
                    <button 
                        onClick={() => setShowTermsModal(true)}
                        className="text-sky-600 hover:text-sky-800 underline"
                    >
                        利用規約
                    </button>
                </div>
                <p className="mt-2">制作: YamaC</p>
            </footer>
        </div>
    );
}

// --- 子コンポーネント定義 ---

/**
 * 支出入力/編集モーダルコンポーネント
 */
function ExpenseFormModal({ onSubmitExpense, user1Name, user2Name, categories, expenseToEdit, onClose }) {
    const [purpose, setPurpose] = useState('');
    const [amount, setAmount] = useState('');
    const [payer, setPayer] = useState(user1Name);
    const [category, setCategory] = useState(categories[0]);
    const [date, setDate] = useState(formatDateToInput(new Date()));
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (expenseToEdit) {
            setPurpose(expenseToEdit.purpose); 
            setAmount(expenseToEdit.amount.toString()); 
            setPayer(expenseToEdit.payer);
            setCategory(expenseToEdit.category); 
            setDate(formatDateToInput(expenseToEdit.date));
        } else {
            setPurpose(''); 
            setAmount(''); 
            setPayer(user1Name); 
            setCategory(categories[0]);
            setDate(formatDateToInput(new Date()));
        }
    }, [expenseToEdit, user1Name, categories]);

    const handleSubmit = (e) => { 
        e.preventDefault();
        if (!purpose.trim() || !amount.trim() || !date || !category || !payer) { 
            setErrorMessage("すべての項目を入力してください。"); 
            return; 
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) { 
            setErrorMessage("金額は0より大きい数値を入力してください。"); 
            return; 
        }
        setErrorMessage('');
        onSubmitExpense({ purpose, amount: parsedAmount, payer, category, date });
    };

    return ( 
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-in-out">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative transform transition-all duration-300 ease-in-out scale-100 opacity-100">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
                > 
                    <XCircle size={24} /> 
                </button>
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-sky-700 text-center"> 
                    {expenseToEdit ? "支出を編集" : "支出を記録"} 
                </h3>
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center shadow">
                        <AlertCircle size={18} className="mr-2 flex-shrink-0"/>
                        <span className="text-sm">{errorMessage}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div> 
                        <label htmlFor="modal-date-form" className="block text-sm font-medium text-slate-700">日付</label> 
                        <input 
                            type="date" 
                            id="modal-date-form" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        /> 
                    </div>
                    <div> 
                        <label htmlFor="modal-purpose-form" className="block text-sm font-medium text-slate-700">用途</label> 
                        <input 
                            type="text" 
                            id="modal-purpose-form" 
                            value={purpose} 
                            onChange={e => setPurpose(e.target.value)} 
                            placeholder="例: スーパーでの買い物" 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                    </div>
                    <div> 
                        <label htmlFor="modal-amount-form" className="block text-sm font-medium text-slate-700">金額 (円)</label> 
                        <input 
                            type="number" 
                            id="modal-amount-form" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="例: 3000" 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        /> 
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div> 
                            <label htmlFor="modal-payer-form" className="block text-sm font-medium text-slate-700">支払った人</label> 
                            <select 
                                id="modal-payer-form" 
                                value={payer} 
                                onChange={e => setPayer(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            > 
                                <option value={user1Name}>{user1Name}</option> 
                                <option value={user2Name}>{user2Name}</option> 
                            </select> 
                        </div>
                        <div> 
                            <label htmlFor="modal-category-form" className="block text-sm font-medium text-slate-700">ジャンル</label> 
                            <select 
                                id="modal-category-form" 
                                value={category} 
                                onChange={e => setCategory(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            > 
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)} 
                            </select> 
                        </div>
                    </div>
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center"
                        > 
                            <Save size={18} className="mr-2"/> 
                            {expenseToEdit ? "更新する" : "記録する"} 
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * 集計情報を表示するコンポーネント
 */
function SummarySection({ user1Name, user2Name, totals, settlement, budgetComparison }) { 
    const totalSpent = totals.totalExpense;
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-4 sm:space-y-6">
            <div> 
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-sky-700 flex items-center">
                    <Wallet size={20} className="mr-2"/>
                    今月の支出
                </h3> 
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm font-medium text-red-700">合計支出:</span>
                        <span className="text-lg font-bold text-red-700">{totalSpent.toLocaleString()} 円</span>
                    </div>
                    {budgetComparison.totalBudget > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">予算:</span>
                                <span className="text-lg font-semibold text-emerald-600">{budgetComparison.totalBudget.toLocaleString()} 円</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">残り:</span>
                                <span className={`text-lg font-semibold ${
                                    budgetComparison.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                    {budgetComparison.totalRemaining.toLocaleString()} 円
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        budgetComparison.overallPercentage > 100 ? 'bg-red-500' : 
                                        budgetComparison.overallPercentage > 80 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(budgetComparison.overallPercentage, 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-center text-sm text-slate-600">
                                {budgetComparison.overallPercentage.toFixed(1)}% 使用
                            </div>
                        </>
                    )}
                </div>
            </div> 
            <hr/>
            <div> 
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-sky-700">個人別支払額</h3> 
                <div className="space-y-2"> 
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md"> 
                        <span className="font-medium text-blue-700">{user1Name}:</span> 
                        <span className="font-bold text-lg sm:text-xl text-blue-700">{totals.user1Total.toLocaleString()} 円</span> 
                    </div> 
                    <div className="flex justify-between items-center p-3 bg-pink-50 rounded-md"> 
                        <span className="font-medium text-pink-700">{user2Name}:</span> 
                        <span className="font-bold text-lg sm:text-xl text-pink-700">{totals.user2Total.toLocaleString()} 円</span> 
                    </div> 
                </div> 
            </div> 
            <hr/>
            <div> 
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-sky-700">精算情報</h3> 
                <div 
                    className={`p-3 sm:p-4 rounded-md text-center ${ 
                        settlement.amount === 0 && totalSpent > 0 
                        ? 'bg-green-100 text-green-700'
                        : settlement.amount === 0 && totalSpent === 0 
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                > 
                    <p className="text-md sm:text-lg font-semibold">{settlement.message}</p> 
                </div> 
            </div>
        </div>
    );
}

/**
 * 設定モーダルコンポーネント
 */
function SettingsModal({ 
    isOpen, 
    onClose, 
    onExportData, 
    onImportDataTrigger, 
    currentUser1Name, 
    currentUser2Name, 
    onSaveUserNames 
}) {
    const [tempUser1, setTempUser1] = useState(currentUser1Name);
    const [tempUser2, setTempUser2] = useState(currentUser2Name);

    useEffect(() => {
        setTempUser1(currentUser1Name);
        setTempUser2(currentUser2Name);
    }, [isOpen, currentUser1Name, currentUser2Name]);

    const handleSaveClick = () => {
        if (!tempUser1.trim() || !tempUser2.trim()) {
            alert("ユーザー名は空にできません。");
            return;
        }
        onSaveUserNames(tempUser1, tempUser2);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
                >
                    <XCircle size={24} />
                </button>
                <h3 className="text-2xl font-semibold mb-6 text-sky-700 text-center flex items-center justify-center">
                    <Settings size={26} className="mr-3 text-sky-600" /> 
                    設定とデータ管理
                </h3>
                
                <div className="mb-6 pt-4 border-t border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
                        <Users size={20} className="mr-2 text-sky-600"/>
                        参加者名の設定
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label 
                                htmlFor="settings-user1Name" 
                                className="block text-sm font-medium text-slate-600"
                            >
                                ユーザー1の名前:
                            </label>
                            <input 
                                type="text" 
                                id="settings-user1Name" 
                                value={tempUser1} 
                                onChange={(e) => setTempUser1(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label 
                                htmlFor="settings-user2Name" 
                                className="block text-sm font-medium text-slate-600"
                            >
                                ユーザー2の名前:
                            </label>
                            <input 
                                type="text" 
                                id="settings-user2Name" 
                                value={tempUser2} 
                                onChange={(e) => setTempUser2(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            />
                        </div>
                        <button 
                            onClick={handleSaveClick}
                            className="w-full flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors duration-150 text-sm"
                        >
                            <Save size={18} className="mr-2"/> ユーザー名を保存
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-lg font-semibold text-slate-700 mb-3">データバックアップ</h4>
                    <div className="space-y-4">
                        <button 
                            onClick={onExportData} 
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors duration-150" 
                        >
                            <Upload size={20} className="mr-2" />
                            全データをエクスポート (.json)
                        </button>
                        <button 
                            onClick={onImportDataTrigger} 
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors duration-150" 
                        >
                            <Download size={20} className="mr-2" />
                            データをインポート (.json)
                        </button>
                        <p className="text-xs text-slate-500 mt-2">
                            <Info size={14} className="inline mr-1" />
                            インポートを行うと、現在のデータは上書きされます。事前にエクスポートをお勧めします。
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onClose} 
                    className="mt-8 w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-md shadow-md transition duration-150 ease-in-out" 
                >
                    閉じる
                </button>
            </div>
        </div>
    );
}

/**
 * 支出一覧を表示するテーブルコンポーネント
 */
function ExpenseTable({ expenses, onDeleteExpense, onEditExpense, user1Name, user2Name }) { 
    if (expenses.length === 0) { 
        return ( 
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg"> 
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-sky-700 flex items-center"> 
                    <ListChecks size={24} className="mr-2"/> 
                    今月の支出一覧 
                </h3> 
                <p className="text-slate-500">まだ支出はありません。</p> 
            </div> 
        ); 
    }

    return ( 
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg"> 
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-sky-700 flex items-center"> 
                <ListChecks size={24} className="mr-2"/> 
                今月の支出一覧 
            </h3> 
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm text-left text-slate-500"> 
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50"> 
                        <tr> 
                            <th scope="col" className="px-3 py-3">日付</th> 
                            <th scope="col" className="px-3 py-3">用途</th> 
                            <th scope="col" className="px-3 py-3 text-right">金額</th> 
                            <th scope="col" className="px-3 py-3">支払者</th> 
                            <th scope="col" className="px-3 py-3">ジャンル</th> 
                            <th scope="col" className="px-3 py-3 text-center">操作</th> 
                        </tr> 
                    </thead> 
                    <tbody> 
                        {expenses.map(expense => ( 
                            <tr key={expense.id} className="bg-white border-b hover:bg-slate-50"> 
                                <td className="px-3 py-3 whitespace-nowrap"> 
                                    {new Date(expense.date).toLocaleDateString('ja-JP')} 
                                </td> 
                                <td className="px-3 py-3 font-medium text-slate-900"> 
                                    {expense.purpose} 
                                </td> 
                                <td className="px-3 py-3 text-right whitespace-nowrap"> 
                                    {expense.amount.toLocaleString()} 円 
                                </td> 
                                <td 
                                    className={`px-3 py-3 font-semibold whitespace-nowrap ${ 
                                        expense.payer === user1Name ? 'text-blue-600' : 'text-pink-600' 
                                    }`}
                                > 
                                    {expense.payer} 
                                </td> 
                                <td className="px-3 py-3 whitespace-nowrap"> 
                                    {expense.category} 
                                </td> 
                                <td className="px-3 py-3 text-center whitespace-nowrap"> 
                                    <button 
                                        onClick={() => onEditExpense(expense)} 
                                        className="text-sky-600 hover:text-sky-800 mr-2 p-1" 
                                        aria-label="編集"
                                    >
                                        <Edit3 size={18}/>
                                    </button> 
                                    <button 
                                        onClick={() => onDeleteExpense(expense.id)} 
                                        className="text-red-500 hover:text-red-700 p-1" 
                                        aria-label="削除"
                                    >
                                        <Trash2 size={18}/>
                                    </button> 
                                </td> 
                            </tr> 
                        ))} 
                    </tbody> 
                </table> 
            </div> 
        </div> 
    );
}

/**
 * ジャンル別支出の円グラフを表示するコンポーネント
 */
function CategoryPieChart({ data }) { 
    if (!data || data.length === 0) { 
        return ( 
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg"> 
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-sky-700 flex items-center"> 
                    <PieChartIcon size={24} className="mr-2"/> 
                    ジャンル別支出 
                </h3> 
                <p className="text-slate-500">支出データがありません。</p> 
            </div> 
        ); 
    }

    return ( 
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg"> 
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-sky-700 flex items-center"> 
                <PieChartIcon size={24} className="mr-2"/> 
                ジャンル別支出 
            </h3> 
            <div className="flex justify-center items-center">
                <ResponsiveContainer width="100%" height={350}> 
                <PieChart> 
                    <Pie 
                        data={data}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%)`} 
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        minAngle={1}
                    >
                        {data.map((entry, index) => ( 
                            <Cell 
                                key={`cell-${index}`} 
                                fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} 
                            /> 
                        ))} 
                    </Pie> 
                    <Tooltip formatter={(value, name, props) => [`${value.toLocaleString()} 円`, name]} /> 
                    <Legend 
                        wrapperStyle={{fontSize: "0.875rem", paddingTop: "10px" }}
                        formatter={(value, entry) => ( 
                            <span style={{ color: entry.color }}>{value}</span> 
                        )}
                    /> 
                </PieChart> 
                </ResponsiveContainer> 
            </div>
        </div> 
    );
}

/**
 * 予算設定モーダルコンポーネント
 */
function BudgetModal({ isOpen, onClose, onSaveBudgets, currentMonth, currentBudgets, monthlyBudgets, categories }) {
    const [budgets, setBudgets] = useState({});

    useEffect(() => {
        setBudgets(currentBudgets);
    }, [currentBudgets, isOpen]);

    const handleBudgetChange = (category, value) => {
        setBudgets(prev => ({
            ...prev,
            [category]: parseFloat(value) || 0
        }));
    };

    const handleSave = () => {
        const monthKey = formatMonthYear(currentMonth);
        const cleanedBudgets = {};
        Object.entries(budgets).forEach(([category, amount]) => {
            if (amount && amount > 0) {
                cleanedBudgets[category] = amount;
            }
        });
        
        const updatedBudgets = {
            ...(monthlyBudgets || {}),
            [monthKey]: cleanedBudgets
        };
        
        console.log("Saving budget data:", updatedBudgets);
        onSaveBudgets(updatedBudgets);
    };

    const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + (amount || 0), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
                >
                    <XCircle size={24} />
                </button>
                
                <h3 className="text-2xl font-semibold mb-6 text-emerald-700 text-center flex items-center justify-center">
                    <Target size={26} className="mr-3 text-emerald-600" /> 
                    {formatMonthYear(currentMonth).replace('-', '年 ')}月の予算設定
                </h3>
                
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                            <label className="text-sm font-medium text-slate-700 min-w-[80px]">
                                {category}:
                            </label>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    value={budgets[category] || ''} 
                                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                                    placeholder="0"
                                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <span className="text-sm text-slate-600">円</span>
                            </div>
                        </div>
                    ))}
                    
                    <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-md">
                            <span className="font-semibold text-emerald-700">合計予算:</span>
                            <span className="font-bold text-lg text-emerald-700">{totalBudget.toLocaleString()} 円</span>
                        </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center"
                        >
                            <Save size={18} className="mr-2"/> 
                            予算を保存
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * プライバシーポリシーモーダルコンポーネント
 */
function PrivacyPolicyModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl relative max-h-[80vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
                >
                    <XCircle size={24} />
                </button>
                
                <h3 className="text-2xl font-semibold mb-6 text-sky-700">プライバシーポリシー</h3>
                
                <div className="space-y-4 text-sm text-slate-700">
                    <section>
                        <h4 className="font-semibold text-base mb-2">1. 収集する情報</h4>
                        <p>本アプリケーションは以下の情報を収集します：</p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>支出データ（金額、カテゴリ、日付、支払者、用途）</li>
                            <li>予算設定データ</li>
                            <li>ユーザー名設定</li>
                            <li>Firebase認証による匿名ユーザーID</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">2. 情報の利用目的</h4>
                        <p>収集した情報は以下の目的で利用します：</p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>家計簿機能の提供</li>
                            <li>データの保存と同期</li>
                            <li>アプリケーションの改善</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">3. 情報の保存</h4>
                        <p>ユーザーデータはGoogle Firebase Firestoreに暗号化されて保存されます。データは各ユーザーのアカウントに紐付けられ、他のユーザーからはアクセスできません。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">4. 第三者への提供</h4>
                        <p>ユーザーの同意なしに個人情報を第三者に提供することはありません。ただし、法令に基づく場合は除きます。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">5. データの削除</h4>
                        <p>ユーザーはいつでもアプリ内のデータ削除機能を使用して、すべてのデータを削除できます。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">6. お問い合わせ</h4>
                        <p>プライバシーに関するご質問は、GitHub Issues にてお問い合わせください。</p>
                    </section>
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * 利用規約モーダルコンポーネント
 */
function TermsOfServiceModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl relative max-h-[80vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
                >
                    <XCircle size={24} />
                </button>
                
                <h3 className="text-2xl font-semibold mb-6 text-sky-700">利用規約</h3>
                
                <div className="space-y-4 text-sm text-slate-700">
                    <section>
                        <h4 className="font-semibold text-base mb-2">1. 利用条件</h4>
                        <p>本アプリケーションは無料で提供されており、個人的な家計管理の目的でのみ使用できます。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">2. 禁止事項</h4>
                        <p>以下の行為を禁止します：</p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>本アプリケーションの不正利用</li>
                            <li>他のユーザーの迷惑となる行為</li>
                            <li>法令に違反する行為</li>
                            <li>システムに過度な負荷をかける行為</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">3. 免責事項</h4>
                        <p>本アプリケーションの利用により生じた損害について、開発者は一切の責任を負いません。データのバックアップは各自で行ってください。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">4. サービスの変更・終了</h4>
                        <p>開発者は事前の通知なしに、本アプリケーションの内容を変更または終了する場合があります。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">5. 規約の変更</h4>
                        <p>本規約は必要に応じて変更される場合があります。変更後の規約は、アプリケーション上に掲示された時点で効力を生じます。</p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-base mb-2">6. 準拠法</h4>
                        <p>本規約は日本法に準拠し、日本の裁判所を専属的管轄裁判所とします。</p>
                    </section>
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;