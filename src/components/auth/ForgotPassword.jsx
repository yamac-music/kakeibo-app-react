import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth.jsx';
import { AlertCircle, ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email) {
            return setError('メールアドレスを入力してください。');
        }

        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('パスワードリセットのメールを送信しました。メールボックスをご確認ください。');
        } catch (error) {
            console.error('パスワードリセットエラー:', error);
            
            // Firebase Auth エラーメッセージの日本語化
            let errorMessage = 'パスワードリセットに失敗しました。';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'このメールアドレスは登録されていません。';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'メールアドレスの形式が正しくありません。';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'ネットワークエラーが発生しました。';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
                    break;
                default:
                    errorMessage = `パスワードリセットに失敗しました: ${error.message}`;
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
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-amber-600">
                        <Mail className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-slate-900">
                        パスワードリセット
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        登録したメールアドレスを入力してください。<br />
                        パスワードリセット用のリンクをお送りします。
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    
                    {message && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center">
                            <CheckCircle size={18} className="mr-2 flex-shrink-0" />
                            <span className="text-sm">{message}</span>
                        </div>
                    )}
                    
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
                                className="pl-10 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                                placeholder="example@email.com"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    送信中...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <Send className="h-4 w-4 mr-2" />
                                    リセットメールを送信
                                </div>
                            )}
                        </button>
                    </div>
                    
                    <div className="text-center">
                        <Link 
                            to="/login" 
                            className="flex items-center justify-center text-sm text-sky-600 hover:text-sky-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            ログインページに戻る
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
