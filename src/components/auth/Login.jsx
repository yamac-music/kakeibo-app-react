import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AlertCircle, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email || !password) {
            return setError('メールアドレスとパスワードを入力してください。');
        }

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/app');
        } catch (error) {
            console.error('ログインエラー:', error);
            
            // Firebase Auth エラーメッセージの日本語化
            let errorMessage = 'ログインに失敗しました。';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'このメールアドレスは登録されていません。';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'パスワードが間違っています。';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'メールアドレスの形式が正しくありません。';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'このアカウントは無効化されています。';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください。';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'ネットワークエラーが発生しました。';
                    break;
                default:
                    errorMessage = `ログインに失敗しました: ${error.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-sky-600">
                        <LogIn className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
                        ログイン
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        アカウントをお持ちでない場合は{' '}
                        <Link to="/signup" className="font-medium text-sky-600 hover:text-sky-500">
                            新規登録
                        </Link>
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                メールアドレス
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    placeholder="example@email.com"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                パスワード
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    placeholder="パスワードを入力"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-sky-600 hover:text-sky-500">
                                パスワードを忘れた場合
                            </Link>
                        </div>
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ログイン中...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    ログイン
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}