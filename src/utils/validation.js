/**
 * 入力値検証とサニタイゼーションのユーティリティ
 */

// 設定値
export const VALIDATION_LIMITS = {
    MAX_AMOUNT: 10000000, // 最大金額: 1千万円
    MAX_DESCRIPTION_LENGTH: 100, // 説明文の最大文字数
    MAX_USERNAME_LENGTH: 20, // ユーザー名の最大文字数
    MIN_AMOUNT: 0.01 // 最小金額: 1銭
};

/**
 * 文字列のサニタイゼーション
 * @param {string} input - 入力文字列
 * @returns {string} サニタイズされた文字列
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .replace(/[<>"'&]/g, '') // 基本的なHTMLエスケープ対象文字を削除
        .replace(/\s+/g, ' '); // 連続する空白を単一空白に変換
}

/**
 * 金額の検証
 * @param {any} amount - 検証する金額
 * @returns {object} { isValid: boolean, error: string, sanitized: number }
 */
export function validateAmount(amount) {
    // 文字列から数値への変換を試行
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[,\s]/g, '')) : Number(amount);
    
    if (isNaN(numAmount)) {
        return {
            isValid: false,
            error: '金額は数値で入力してください。',
            sanitized: 0
        };
    }
    
    if (numAmount < VALIDATION_LIMITS.MIN_AMOUNT) {
        return {
            isValid: false,
            error: `金額は${VALIDATION_LIMITS.MIN_AMOUNT}円以上で入力してください。`,
            sanitized: 0
        };
    }
    
    if (numAmount > VALIDATION_LIMITS.MAX_AMOUNT) {
        return {
            isValid: false,
            error: `金額は${VALIDATION_LIMITS.MAX_AMOUNT.toLocaleString()}円以下で入力してください。`,
            sanitized: 0
        };
    }
    
    // 小数点以下は切り捨て（円単位）
    const sanitizedAmount = Math.floor(numAmount);
    
    return {
        isValid: true,
        error: null,
        sanitized: sanitizedAmount
    };
}

/**
 * 説明文の検証
 * @param {string} description - 検証する説明文
 * @returns {object} { isValid: boolean, error: string, sanitized: string }
 */
export function validateDescription(description) {
    if (typeof description !== 'string') {
        return {
            isValid: false,
            error: '説明文は文字列で入力してください。',
            sanitized: ''
        };
    }
    
    const sanitized = sanitizeString(description);
    
    if (sanitized.length === 0) {
        return {
            isValid: false,
            error: '説明文を入力してください。',
            sanitized: ''
        };
    }
    
    if (sanitized.length > VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH) {
        return {
            isValid: false,
            error: `説明文は${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH}文字以内で入力してください。`,
            sanitized: sanitized.substring(0, VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH)
        };
    }
    
    return {
        isValid: true,
        error: null,
        sanitized
    };
}

/**
 * ユーザー名の検証
 * @param {string} username - 検証するユーザー名
 * @returns {object} { isValid: boolean, error: string, sanitized: string }
 */
export function validateUsername(username) {
    if (typeof username !== 'string') {
        return {
            isValid: false,
            error: 'ユーザー名は文字列で入力してください。',
            sanitized: ''
        };
    }
    
    const sanitized = sanitizeString(username);
    
    if (sanitized.length === 0) {
        return {
            isValid: false,
            error: 'ユーザー名を入力してください。',
            sanitized: ''
        };
    }
    
    if (sanitized.length > VALIDATION_LIMITS.MAX_USERNAME_LENGTH) {
        return {
            isValid: false,
            error: `ユーザー名は${VALIDATION_LIMITS.MAX_USERNAME_LENGTH}文字以内で入力してください。`,
            sanitized: sanitized.substring(0, VALIDATION_LIMITS.MAX_USERNAME_LENGTH)
        };
    }
    
    return {
        isValid: true,
        error: null,
        sanitized
    };
}

/**
 * カテゴリの検証
 * @param {string} category - 検証するカテゴリ
 * @param {array} validCategories - 有効なカテゴリリスト
 * @returns {object} { isValid: boolean, error: string, sanitized: string }
 */
export function validateCategory(category, validCategories = []) {
    if (typeof category !== 'string') {
        return {
            isValid: false,
            error: 'カテゴリは文字列で入力してください。',
            sanitized: ''
        };
    }
    
    const sanitized = sanitizeString(category);
    
    if (sanitized.length === 0) {
        return {
            isValid: false,
            error: 'カテゴリを選択してください。',
            sanitized: ''
        };
    }
    
    if (validCategories.length > 0 && !validCategories.includes(sanitized)) {
        return {
            isValid: false,
            error: '有効なカテゴリを選択してください。',
            sanitized: ''
        };
    }
    
    return {
        isValid: true,
        error: null,
        sanitized
    };
}

/**
 * 日付の検証
 * @param {string} dateString - 検証する日付文字列 (YYYY-MM-DD)
 * @returns {object} { isValid: boolean, error: string, sanitized: string }
 */
export function validateDate(dateString) {
    if (typeof dateString !== 'string') {
        return {
            isValid: false,
            error: '日付は文字列で入力してください。',
            sanitized: ''
        };
    }
    
    const sanitized = dateString.trim();
    
    if (sanitized.length === 0) {
        return {
            isValid: false,
            error: '日付を入力してください。',
            sanitized: ''
        };
    }
    
    // YYYY-MM-DD形式のチェック
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(sanitized)) {
        return {
            isValid: false,
            error: '日付はYYYY-MM-DD形式で入力してください。',
            sanitized: ''
        };
    }
    
    // 実際の日付として有効かチェック
    const date = new Date(sanitized);
    if (isNaN(date.getTime()) || sanitized !== date.toISOString().split('T')[0]) {
        return {
            isValid: false,
            error: '有効な日付を入力してください。',
            sanitized: ''
        };
    }
    
    // 未来の日付チェック（1年先まで許可）
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    if (date > oneYearFromNow) {
        return {
            isValid: false,
            error: '日付は1年先までの範囲で入力してください。',
            sanitized: ''
        };
    }
    
    // 過去100年より前の日付チェック
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
    
    if (date < hundredYearsAgo) {
        return {
            isValid: false,
            error: '日付は100年前以降の範囲で入力してください。',
            sanitized: ''
        };
    }
    
    return {
        isValid: true,
        error: null,
        sanitized
    };
}

/**
 * 支出データ全体の検証
 * @param {object} expenseData - 検証する支出データ
 * @param {array} validCategories - 有効なカテゴリリスト
 * @returns {object} { isValid: boolean, errors: array, sanitized: object }
 */
export function validateExpenseData(expenseData, validCategories = []) {
    const errors = [];
    const sanitized = {};
    
    // 金額の検証
    const amountValidation = validateAmount(expenseData.amount);
    if (!amountValidation.isValid) {
        errors.push(amountValidation.error);
    }
    sanitized.amount = amountValidation.sanitized;
    
    // 説明文の検証
    const descriptionValidation = validateDescription(expenseData.description);
    if (!descriptionValidation.isValid) {
        errors.push(descriptionValidation.error);
    }
    sanitized.description = descriptionValidation.sanitized;
    
    // カテゴリの検証
    const categoryValidation = validateCategory(expenseData.category, validCategories);
    if (!categoryValidation.isValid) {
        errors.push(categoryValidation.error);
    }
    sanitized.category = categoryValidation.sanitized;
    
    // 日付の検証
    const dateValidation = validateDate(expenseData.date);
    if (!dateValidation.isValid) {
        errors.push(dateValidation.error);
    }
    sanitized.date = dateValidation.sanitized;
    
    // 支払者の検証
    if (expenseData.payer && typeof expenseData.payer === 'string') {
        const payerValidation = validateUsername(expenseData.payer);
        if (!payerValidation.isValid) {
            errors.push(`支払者: ${payerValidation.error}`);
        }
        sanitized.payer = payerValidation.sanitized;
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
}