import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

/**
 * アイドル警告モーダルコンポーネント
 * @param {boolean} show - モーダルの表示状態
 * @param {number} remainingTime - 残り時間（ミリ秒）
 * @param {function} onExtend - セッション延長のコールバック
 * @param {function} onLogout - ログアウトのコールバック
 */
export default function IdleWarningModal({ show, remainingTime, onExtend, onLogout }) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (show && remainingTime > 0) {
            setTimeLeft(Math.ceil(remainingTime / 1000));
            
            const interval = setInterval(() => {
                const remaining = Math.ceil(remainingTime / 1000);
                setTimeLeft(remaining);
                
                if (remaining <= 0) {
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [show, remainingTime]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                            セッション警告
                        </h3>
                    </div>
                </div>
                
                <div className="mb-6">
                    <p className="text-sm text-gray-700 mb-3">
                        非アクティブ状態が続いているため、セキュリティのため間もなくログアウトされます。
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                        引き続きご利用になる場合は「セッション延長」をクリックしてください。
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm font-medium text-yellow-800">
                            残り時間: <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        onClick={onExtend}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        セッション延長
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        ログアウト
                    </button>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                    このメッセージは共有端末でのセキュリティ保護のために表示されています。
                </div>
            </div>
        </div>
    );
}
