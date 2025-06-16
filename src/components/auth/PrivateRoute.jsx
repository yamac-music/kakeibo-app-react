import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function PrivateRoute({ children }) {
    const { currentUser, isFirebaseAvailable } = useAuth();

    // Firebase が設定されていない場合は、そのまま子コンポーネントを表示
    if (!isFirebaseAvailable) {
        return children;
    }

    // 認証されている場合は子コンポーネントを表示、そうでなければログインページにリダイレクト
    return currentUser ? children : <Navigate to="/login" />;
}