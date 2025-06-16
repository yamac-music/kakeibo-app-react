import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// 認証関連コンポーネント
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import PrivateRoute from './components/auth/PrivateRoute';

// アプリケーション本体
import Home from './components/Home';

function App() {
    const { isFirebaseAvailable } = useAuth();

    // Firebase が設定されていない場合はホームコンポーネントをそのまま表示
    if (!isFirebaseAvailable) {
        return <Home />;
    }

    return (
        <Routes>
            {/* 認証関連のルート */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* 保護されたルート */}
            <Route path="/" element={
                <PrivateRoute>
                    <Home />
                </PrivateRoute>
            } />
        </Routes>
    );
}

export default App;