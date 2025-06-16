import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定の検証
const validateFirebaseConfig = (config) => {
    console.log('🔍 Firebase設定を検証中...', {
        hasApiKey: !!config.apiKey,
        hasAuthDomain: !!config.authDomain,
        hasProjectId: !!config.projectId,
        hasStorageBucket: !!config.storageBucket,
        hasMessagingSenderId: !!config.messagingSenderId,
        hasAppId: !!config.appId,
        projectId: config.projectId || 'undefined'
    });

    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !config[field] || config[field] === 'undefined');
    
    if (missingFields.length > 0) {
        console.warn('⚠️ Firebase設定が不完全です。以下のフィールドが不足しています:', missingFields);
        console.warn('環境変数を確認してください:', missingFields.map(field => `VITE_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`));
        return false;
    }
    console.log('✅ Firebase設定が正常です');
    return true;
};

// Firebase設定
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase設定の検証とアプリの初期化
const isFirebaseConfigured = validateFirebaseConfig(firebaseConfig);
const appId = 'default-kakeibo-app-id';

// Firebaseアプリの初期化
let firebaseApp, auth, db;
let isFirebaseAvailable = false;

if (isFirebaseConfigured) {
    try {
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        db = getFirestore(firebaseApp);
        isFirebaseAvailable = true;
        console.log('Firebase初期化が完了しました');
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
        isFirebaseAvailable = false;
    }
} else {
    console.warn('Firebase設定がないため、ローカルストレージモードで動作します');
}

export { auth, db, isFirebaseAvailable, appId };