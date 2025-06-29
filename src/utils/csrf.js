/**
 * CSRF（Cross-Site Request Forgery）対策ユーティリティ
 * Firebase Authenticationに加えて追加のセキュリティ層を提供
 */

// CSRFトークンの生成
let csrfToken = null;

/**
 * CSRFトークンを生成
 * @returns {string} CSRFトークン
 */
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRFトークンを初期化
 * @returns {string} 生成されたCSRFトークン
 */
export function initializeCSRFToken() {
    if (!csrfToken) {
        csrfToken = generateCSRFToken();
        
        // セッションストレージに保存（ページリロード時の持続性）
        try {
            sessionStorage.setItem('csrf_token', csrfToken);
        } catch (error) {
            if (!import.meta.env.PROD) {
                console.warn('セッションストレージにCSRFトークンを保存できませんでした:', error);
            }
        }
    }
    return csrfToken;
}

/**
 * 現在のCSRFトークンを取得
 * @returns {string|null} CSRFトークン
 */
export function getCSRFToken() {
    if (!csrfToken) {
        // セッションストレージから復元を試行
        try {
            csrfToken = sessionStorage.getItem('csrf_token');
        } catch (error) {
            if (!import.meta.env.PROD) {
                console.warn('セッションストレージからCSRFトークンを取得できませんでした:', error);
            }
        }
        
        // 復元できない場合は新規作成
        if (!csrfToken) {
            csrfToken = generateCSRFToken();
        }
    }
    return csrfToken;
}

/**
 * CSRFトークンをリセット（ログアウト時等）
 */
export function resetCSRFToken() {
    csrfToken = null;
    try {
        sessionStorage.removeItem('csrf_token');
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.warn('セッションストレージからCSRFトークンを削除できませんでした:', error);
        }
    }
}

/**
 * リファラーチェック
 * @param {string} expectedOrigin - 期待されるオリジン
 * @returns {boolean} リファラーが有効かどうか
 */
export function validateReferrer(expectedOrigin = window.location.origin) {
    try {
        const referrer = document.referrer;
        
        // リファラーが空の場合（直接アクセス）は許可
        if (!referrer) {
            return true;
        }
        
        const referrerOrigin = new URL(referrer).origin;
        return referrerOrigin === expectedOrigin;
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.warn('リファラー検証エラー:', error);
        }
        // エラーが発生した場合は安全側に倒して拒否
        return false;
    }
}

/**
 * オリジンチェック
 * @param {string} expectedOrigin - 期待されるオリジン
 * @returns {boolean} オリジンが有効かどうか
 */
export function validateOrigin(expectedOrigin = window.location.origin) {
    return window.location.origin === expectedOrigin;
}

/**
 * タイムスタンプベースのノンス生成（リプレイ攻撃対策）
 * @param {number} windowSeconds - 有効期間（秒）
 * @returns {string} タイムスタンプノンス
 */
export function generateTimestampNonce(windowSeconds = 300) { // 5分間有効
    const timestamp = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(timestamp / windowSeconds) * windowSeconds;
    return windowStart.toString();
}

/**
 * タイムスタンプノンスの検証
 * @param {string} nonce - 検証するノンス
 * @param {number} windowSeconds - 有効期間（秒）
 * @returns {boolean} ノンスが有効かどうか
 */
export function validateTimestampNonce(nonce, windowSeconds = 300) {
    try {
        const nonceTimestamp = parseInt(nonce, 10);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const windowStart = Math.floor(currentTimestamp / windowSeconds) * windowSeconds;
        
        // 現在の時間窓と1つ前の時間窓を許可（時間窓の境界での問題を避けるため）
        const validWindows = [windowStart, windowStart - windowSeconds];
        
        return validWindows.includes(nonceTimestamp);
    } catch (error) {
        if (!import.meta.env.PROD) {
            console.warn('タイムスタンプノンス検証エラー:', error);
        }
        return false;
    }
}

/**
 * 包括的なCSRF保護チェック
 * @param {object} options - オプション
 * @returns {boolean} すべてのチェックが通ったかどうか
 */
export function validateCSRFProtection(options = {}) {
    const {
        checkReferrer = true,
        checkOrigin = true,
        expectedOrigin = window.location.origin
    } = options;
    
    const checks = [];
    
    if (checkOrigin) {
        checks.push(validateOrigin(expectedOrigin));
    }
    
    if (checkReferrer) {
        checks.push(validateReferrer(expectedOrigin));
    }
    
    // すべてのチェックが通る必要がある
    return checks.every(check => check === true);
}

/**
 * セキュリティコンテキストの生成
 * @returns {object} セキュリティコンテキスト
 */
export function generateSecurityContext() {
    return {
        csrfToken: getCSRFToken(),
        timestamp: Date.now(),
        nonce: generateTimestampNonce(),
        origin: window.location.origin,
        userAgent: navigator.userAgent.substring(0, 100) // 最初の100文字のみ
    };
}

/**
 * セキュリティコンテキストの検証
 * @param {object} context - 検証するコンテキスト
 * @returns {boolean} コンテキストが有効かどうか
 */
export function validateSecurityContext(context) {
    if (!context || typeof context !== 'object') {
        return false;
    }
    
    // 必須フィールドの存在確認
    const requiredFields = ['csrfToken', 'timestamp', 'nonce', 'origin'];
    const hasAllFields = requiredFields.every(field => context[field] != null);
    
    if (!hasAllFields) {
        return false;
    }
    
    // タイムスタンプの検証（1時間以内）
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1時間
    const isTimestampValid = (now - context.timestamp) <= maxAge;
    
    if (!isTimestampValid) {
        return false;
    }
    
    // ノンスの検証
    const isNonceValid = validateTimestampNonce(context.nonce);
    
    if (!isNonceValid) {
        return false;
    }
    
    // オリジンの検証
    const isOriginValid = context.origin === window.location.origin;
    
    return isOriginValid;
}

/**
 * Firebase認証状態とCSRF保護の統合チェック
 * @param {object} currentUser - Firebase認証ユーザー
 * @param {object} options - オプション
 * @returns {boolean} 統合セキュリティチェックの結果
 */
export function validateIntegratedSecurity(currentUser, options = {}) {
    // Firebase認証の確認
    if (!currentUser) {
        return false;
    }
    
    // CSRF保護の確認
    const csrfValid = validateCSRFProtection(options);
    
    return csrfValid;
}