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

// デモモード表示コンポーネント
function DemoModeWrapper({ children }) {
    return (
        <div className="min-h-screen bg-slate-100">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>デモモード:</strong> Firebase設定が無効のため、デモモードで動作しています。データは保存されません。
                        </p>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}

function App() {
    const { isFirebaseAvailable } = useAuth();

    // Firebase が設定されていない場合は制限付きデモモードで表示
    if (!isFirebaseAvailable) {
        return (
            <DemoModeWrapper>
                <Home isDemoMode={true} />
            </DemoModeWrapper>
        );
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
                    <Home isDemoMode={false} />
                </PrivateRoute>
            } />
        </Routes>
    );
}

export default App;