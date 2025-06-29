import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * アイドル時間検出とセッション管理のカスタムフック
 * @param {number} timeout - タイムアウト時間（ミリ秒）デフォルト: 30分
 * @param {number} warningTime - 警告表示時間（ミリ秒）デフォルト: 5分前
 * @param {function} onIdle - アイドル時のコールバック
 * @param {function} onWarning - 警告時のコールバック
 * @param {boolean} enabled - フックの有効/無効
 */
export function useIdleTimer({
    timeout = 30 * 60 * 1000, // 30分
    warningTime = 5 * 60 * 1000, // 5分前に警告
    onIdle = () => {},
    onWarning = () => {},
    enabled = true
} = {}) {
    const [isIdle, setIsIdle] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(timeout);
    
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // アクティビティリセット関数
    const resetTimer = useCallback(() => {
        if (!enabled) return;
        
        lastActivityRef.current = Date.now();
        setIsIdle(false);
        setShowWarning(false);
        setRemainingTime(timeout);

        // 既存のタイマーをクリア
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // 警告タイマーを設定
        warningTimeoutRef.current = setTimeout(() => {
            if (enabled) {
                setShowWarning(true);
                onWarning();
                
                // 残り時間カウントダウン開始
                intervalRef.current = setInterval(() => {
                    const elapsed = Date.now() - lastActivityRef.current;
                    const remaining = timeout - elapsed;
                    
                    if (remaining <= 0) {
                        clearInterval(intervalRef.current);
                        setIsIdle(true);
                        setShowWarning(false);
                        onIdle();
                    } else {
                        setRemainingTime(remaining);
                    }
                }, 1000);
            }
        }, timeout - warningTime);

        // メインタイマーを設定
        timeoutRef.current = setTimeout(() => {
            if (enabled) {
                setIsIdle(true);
                setShowWarning(false);
                onIdle();
            }
        }, timeout);
    }, [enabled, timeout, warningTime, onIdle, onWarning]);

    // アクティビティイベントのリスナー
    const handleActivity = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    // イベントリスナーの設定
    useEffect(() => {
        if (!enabled) return;

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // アクティビティイベントを追加
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // 初期タイマー設定
        resetTimer();

        // クリーンアップ
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled, handleActivity, resetTimer]);

    // セッション延長関数
    const extendSession = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    return {
        isIdle,
        showWarning,
        remainingTime,
        extendSession,
        resetTimer
    };
}