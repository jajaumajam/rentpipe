/**
 * RentPipe エラーハンドリングシステム
 * Phase2対応：ユーザーフレンドリーなエラー管理
 */

class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // グローバルエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.handleError('JavaScript Error', event.error?.message || 'Unknown error');
        });

        // Promise rejection をキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Promise Error', event.reason?.message || 'Promise rejected');
        });

        // エラー表示用のDOMを作成
        this.createErrorDisplay();
    }

    createErrorDisplay() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.innerHTML = `
            <div id="error-toast" class="error-toast hidden">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">
                        <div class="error-title"></div>
                        <div class="error-message"></div>
                    </div>
                    <button class="error-close" onclick="errorHandler.hideError()">×</button>
                </div>
            </div>
            <div id="loading-overlay" class="loading-overlay hidden">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">処理中...</div>
                </div>
            </div>
        `;
        document.body.appendChild(errorContainer);
    }

    // エラー表示
    showError(title, message, type = 'error') {
        const toast = document.getElementById('error-toast');
        const titleEl = toast.querySelector('.error-title');
        const messageEl = toast.querySelector('.error-message');

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        toast.className = `error-toast ${type}`;
        
        // 自動で隠す（成功メッセージは短く、エラーは長く）
        const hideDelay = type === 'success' ? 3000 : 8000;
        setTimeout(() => this.hideError(), hideDelay);
    }

    // エラーを隠す
    hideError() {
        const toast = document.getElementById('error-toast');
        toast.classList.add('hidden');
    }

    // 成功メッセージ
    showSuccess(title, message = '') {
        this.showError(title, message, 'success');
    }

    // 警告メッセージ
    showWarning(title, message = '') {
        this.showError(title, message, 'warning');
    }

    // ローディング表示
    showLoading(text = '処理中...') {
        const overlay = document.getElementById('loading-overlay');
        const textEl = overlay.querySelector('.loading-text');
        textEl.textContent = text;
        overlay.classList.remove('hidden');
    }

    // ローディング非表示
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
    }

    // エラーハンドリング（内部使用）
    handleError(title, message) {
        console.error(`${title}: ${message}`);
        this.showError(title, message);
    }

    // データ保存エラーの処理
    handleSaveError(operation, data = null) {
        console.error(`Save error in ${operation}:`, data);
        this.showError(
            'データ保存に失敗しました',
            `${operation}の処理中にエラーが発生しました。もう一度お試しください。`
        );
    }

    // ネットワークエラーの処理
    handleNetworkError() {
        this.showError(
            'ネットワークエラー', 
            'インターネット接続を確認して、もう一度お試しください。'
        );
    }

    // バリデーションエラーの処理
    handleValidationError(field, message) {
        this.showWarning(`入力エラー: ${field}`, message);
    }
}

// グローバルに初期化
const errorHandler = new ErrorHandler();

// 便利な関数をグローバルに提供
window.showError = (title, message) => errorHandler.showError(title, message);
window.showSuccess = (title, message) => errorHandler.showSuccess(title, message);
window.showWarning = (title, message) => errorHandler.showWarning(title, message);
window.showLoading = (text) => errorHandler.showLoading(text);
window.hideLoading = () => errorHandler.hideLoading();
