import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, isFirebaseAvailable } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
    function login(email, password) {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        return signInWithEmailAndPassword(auth, email, password);
    }

    // ログアウト
    function logout() {
        if (!isFirebaseAvailable) {
            throw new Error('Firebase が設定されていません。');
        }
        return signOut(auth);
    }

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

    useEffect(() => {
        if (!isFirebaseAvailable) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
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
        isFirebaseAvailable
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}