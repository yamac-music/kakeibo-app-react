import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function PrivateRoute({ children }) {
    const { currentUser, loading, isFirebaseAvailable } = useAuth();

    // Firebase が設定されていない場合は、そのまま子コンポーネントを表示
    if (!isFirebaseAvailable) {
        return children;
    }

    // 認証状態の確認中はローディング表示
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                    <p className="mt-4 text-slate-600">認証確認中...</p>
                </div>
            </div>
        );
    }

    // 認証されている場合は子コンポーネントを表示、そうでなければログインページにリダイレクト
    return currentUser ? children : <Navigate to="/login" />;
}