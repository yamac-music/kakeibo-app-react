import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// エラーバウンダリー
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        if (!import.meta.env.PROD) {
            console.error('App Error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                    <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">
                            アプリケーションエラー
                        </h1>
                        <p className="text-slate-600 mb-4">
                            申し訳ございません。予期しないエラーが発生しました。
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            ページを再読み込み
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// 認証関連コンポーネント
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import PrivateRoute from './components/auth/PrivateRoute';

// アプリケーション本体
import Home from './components/Home';
import LandingPage from './components/LandingPage';

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

// ローディング表示コンポーネント
function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                <p className="mt-4 text-slate-600">初期化中...</p>
            </div>
        </div>
    );
}

function AppComponent() {
    const { isFirebaseAvailable, loading } = useAuth();
    const location = useLocation();
    
    // URLパラメータからデモモードを確認
    const searchParams = new URLSearchParams(location.search);
    const isDemoMode = searchParams.get('demo') === 'true';

    // Firebase初期化中はローディング表示
    if (loading) {
        return <LoadingSpinner />;
    }

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
            {/* ランディングページ */}
            <Route path="/landing" element={<LandingPage />} />
            
            {/* 認証関連のルート */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* アプリケーション */}
            <Route path="/app" element={
                isDemoMode ? (
                    <DemoModeWrapper>
                        <Home isDemoMode={true} />
                    </DemoModeWrapper>
                ) : (
                    <PrivateRoute>
                        <Home isDemoMode={false} />
                    </PrivateRoute>
                )
            } />
            
            {/* ルートアクセス - ランディングページにリダイレクト */}
            <Route path="/" element={<LandingPage />} />
        </Routes>
    );
}

function App() {
    return <AppComponent />;
}

// エラーバウンダリーでラップしたAppコンポーネントをエクスポート
export default function AppWithErrorBoundary() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}