import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, isFirebaseAvailable } from '../firebase';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { initializeCSRFToken, resetCSRFToken, validateIntegratedSecurity } from '../utils/csrf';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showIdleWarning, setShowIdleWarning] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000); // デフォルト30分

    // サインアップ
    async function signup(email, password, displayName) {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // ユーザー名を設定
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        
        return userCredential;
    }

    // ログイン
    async function login(email, password) {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        
        // CSRF保護の初期化
        initializeCSRFToken();
        
        return signInWithEmailAndPassword(auth, email, password);
    }

    // ログアウト
    async function logout() {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        
        // CSRF保護のリセット
        resetCSRFToken();
        
        return signOut(auth);
    }

    // 自動ログアウトハンドラー
    const handleIdleLogout = useCallback(async () => {
        if (currentUser && isFirebaseAvailable) {
            try {
                await logout();
                alert('セッションがタイムアウトしました。再度ログインしてください。');
            } catch (error) {
                if (!import.meta.env.PROD) {
                    console.error('自動ログアウトエラー:', error);
                }
            }
        }
        setShowIdleWarning(false);
    }, [currentUser]);

    // アイドル警告ハンドラー
    const handleIdleWarning = useCallback(() => {
        setShowIdleWarning(true);
    }, []);

    // セッション延長
    const extendSession = useCallback(() => {
        setShowIdleWarning(false);
    }, []);

    // セッションタイムアウト設定の更新
    const updateSessionTimeout = useCallback((newTimeout) => {
        setSessionTimeout(newTimeout);
    }, []);

    // セキュリティ検証
    const validateSecurity = useCallback(() => {
        return validateIntegratedSecurity(currentUser);
    }, [currentUser]);

    // パスワードリセット
    function resetPassword(email) {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        return sendPasswordResetEmail(auth, email);
    }

    // プロフィール更新
    function updateUserProfile(updates) {
        if (!isFirebaseAvailable || !currentUser) {
            throw new Error('ユーザーが認証されていません。');
        }
        return updateProfile(currentUser, updates);
    }

    // アイドルタイマーの設定
    const { showWarning, remainingTime, extendSession: extendIdleSession } = useIdleTimer({
        timeout: sessionTimeout,
        warningTime: 5 * 60 * 1000, // 5分前に警告
        onIdle: handleIdleLogout,
        onWarning: handleIdleWarning,
        enabled: !!currentUser && isFirebaseAvailable
    });

    // 警告状態の同期
    useEffect(() => {
        setShowIdleWarning(showWarning);
    }, [showWarning]);

    useEffect(() => {
        if (!isFirebaseAvailable) {
            setLoading(false);
            return;
        }

        // CSRF保護の初期化
        initializeCSRFToken();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            // ログイン状態の変更時にCSRF保護を再初期化
            if (user) {
                initializeCSRFToken();
            } else {
                resetCSRFToken();
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword,
        updateUserProfile,
        isFirebaseAvailable,
        showIdleWarning,
        remainingTime,
        extendSession: () => {
            extendSession();
            extendIdleSession();
        },
        sessionTimeout,
        updateSessionTimeout,
        validateSecurity
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}