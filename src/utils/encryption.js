/**
 * データ暗号化・復号化ユーティリティ
 * ブラウザ環境でのシンプルな暗号化を提供
 */

// 暗号化キーの生成（ブラウザセッション毎に変更）
let encryptionKey = null;

/**
 * 暗号化キーの初期化
 * @returns {string} 暗号化キー
 */
function initializeEncryptionKey() {
    if (!encryptionKey) {
        // ランダムな暗号化キーを生成（セッション毎）
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        encryptionKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return encryptionKey;
}

/**
 * 簡単なXOR暗号化
 * @param {string} text - 暗号化するテキスト
 * @param {string} key - 暗号化キー
 * @returns {string} 暗号化されたテキスト（Base64）
 */
function xorEncrypt(text, key) {
    if (!text || typeof text !== 'string') return '';
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const textChar = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(textChar ^ keyChar);
    }
    
    // Base64エンコード
    try {
        return btoa(result);
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.error('暗号化エラー:', error);
        }
        return text; // 暗号化失敗時は元のテキストを返す
    }
}

/**
 * XOR復号化
 * @param {string} encryptedText - 暗号化されたテキスト（Base64）
 * @param {string} key - 復号化キー
 * @returns {string} 復号化されたテキスト
 */
function xorDecrypt(encryptedText, key) {
    if (!encryptedText || typeof encryptedText !== 'string') return '';
    
    try {
        // Base64デコード
        const decoded = atob(encryptedText);
        
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const encryptedChar = decoded.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(encryptedChar ^ keyChar);
        }
        
        return result;
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.error('復号化エラー:', error);
        }
        return encryptedText; // 復号化失敗時は元のテキストを返す
    }
}

/**
 * データを暗号化してlocalStorageに保存
 * @param {string} key - ストレージキー
 * @param {any} data - 保存するデータ
 * @returns {boolean} 保存成功の可否
 */
export function setEncryptedStorage(key, data) {
    try {
        const encKey = initializeEncryptionKey();
        const jsonString = JSON.stringify(data);
        const encrypted = xorEncrypt(jsonString, encKey);
        
        localStorage.setItem(key, encrypted);
        return true;
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.error('暗号化ストレージ保存エラー:', error);
        }
        return false;
    }
}

/**
 * localStorageから暗号化データを取得・復号化
 * @param {string} key - ストレージキー
 * @param {any} defaultValue - デフォルト値
 * @returns {any} 復号化されたデータ
 */
export function getEncryptedStorage(key, defaultValue = null) {
    try {
        const encKey = initializeEncryptionKey();
        const encrypted = localStorage.getItem(key);
        
        if (!encrypted) {
            return defaultValue;
        }
        
        const decrypted = xorDecrypt(encrypted, encKey);
        return JSON.parse(decrypted);
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.error('暗号化ストレージ取得エラー:', error);
        }
        return defaultValue;
    }
}

/**
 * 暗号化されたlocalStorageアイテムを削除
 * @param {string} key - ストレージキー
 * @returns {boolean} 削除成功の可否
 */
export function removeEncryptedStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.error('暗号化ストレージ削除エラー:', error);
        }
        return false;
    }
}

/**
 * 通常のlocalStorageアクセスの代替（暗号化を適用）
 */
export const secureStorage = {
    /**
     * アイテムを暗号化して保存
     * @param {string} key - キー
     * @param {any} value - 値
     */
    setItem: (key, value) => {
        return setEncryptedStorage(key, value);
    },
    
    /**
     * アイテムを復号化して取得
     * @param {string} key - キー
     * @param {any} defaultValue - デフォルト値
     * @returns {any} 復号化された値
     */
    getItem: (key, defaultValue = null) => {
        return getEncryptedStorage(key, defaultValue);
    },
    
    /**
     * アイテムを削除
     * @param {string} key - キー
     */
    removeItem: (key) => {
        return removeEncryptedStorage(key);
    },
    
    /**
     * 全ての暗号化されたアイテムをクリア
     * 注意: 全てのlocalStorageがクリアされます
     */
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            if (!import.meta.env.PROD) {
                console.error('ストレージクリアエラー:', error);
            }
            return false;
        }
    }
};

/**
 * 暗号化機能が利用可能かチェック
 * @returns {boolean} 利用可能かどうか
 */
export function isEncryptionAvailable() {
    try {
        return !!(window.crypto && window.localStorage && window.btoa && window.atob);
    } catch {
        return false;
    }
}

/**
 * 暗号化キーをリセット（新しいセッション用）
 */
export function resetEncryptionKey() {
    encryptionKey = null;
    initializeEncryptionKey();
}