// RentPipe エラーハンドリングシステム
console.log('🛡️ エラーハンドリングシステム初期化中...');

window.ErrorHandler = {
    // エラーメッセージの表示
    showError: function(message, details = null, duration = 5000) {
        console.error('❌ エラー:', message, details);
        
        // 既存のエラー表示を削除
        const existingError = document.getElementById('error-notification');
        if (existingError) {
            existingError.remove();
        }
        
        // エラー通知を作成
        const notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <div class="error-text">
                    <strong>${message}</strong>
                    ${details ? `<br><small>${details}</small>` : ''}
                </div>
                <button onclick="ErrorHandler.closeError()" class="error-close">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自動的に消える
        if (duration > 0) {
            setTimeout(() => {
                ErrorHandler.closeError();
            }, duration);
        }
    },
    
    // 成功メッセージの表示
    showSuccess: function(message, duration = 3000) {
        console.log('✅ 成功:', message);
        
        // 既存の通知を削除
        const existingNotification = document.getElementById('success-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 成功通知を作成
        const notification = document.createElement('div');
        notification.id = 'success-notification';
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <div class="success-text">${message}</div>
                <button onclick="ErrorHandler.closeSuccess()" class="success-close">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自動的に消える
        if (duration > 0) {
            setTimeout(() => {
                ErrorHandler.closeSuccess();
            }, duration);
        }
    },
    
    // エラー通知を閉じる
    closeError: function() {
        const notification = document.getElementById('error-notification');
        if (notification) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    },
    
    // 成功通知を閉じる
    closeSuccess: function() {
        const notification = document.getElementById('success-notification');
        if (notification) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    },
    
    // ネットワークエラーの処理
    handleNetworkError: function(error) {
        console.error('🌐 ネットワークエラー:', error);
        
        if (!navigator.onLine) {
            this.showError(
                'インターネット接続がありません',
                'オフラインでも基本機能は使用できます',
                0
            );
        } else {
            this.showError(
                'ネットワークエラーが発生しました',
                '通信状態を確認してください',
                5000
            );
        }
    },
    
    // データ保存エラーの処理
    handleSaveError: function(error, dataType = 'データ') {
        console.error('💾 保存エラー:', error);
        
        const isStorageFull = error.name === 'QuotaExceededError';
        
        if (isStorageFull) {
            this.showError(
                'ストレージ容量が不足しています',
                '不要なデータを削除してください',
                0
            );
        } else {
            this.showError(
                `${dataType}の保存に失敗しました`,
                'もう一度お試しください',
                5000
            );
        }
        
        return false;
    },
    
    // バリデーションエラーの処理
    handleValidationError: function(field, message) {
        console.warn('📝 バリデーションエラー:', field, message);
        
        // フィールドにエラー表示
        const inputElement = document.querySelector(`[name="${field}"]`) || 
                            document.getElementById(field);
        
        if (inputElement) {
            inputElement.classList.add('error');
            
            // エラーメッセージを表示
            const errorMsg = document.createElement('div');
            errorMsg.className = 'field-error';
            errorMsg.textContent = message;
            
            // 既存のエラーメッセージを削除
            const existingError = inputElement.parentElement.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            
            inputElement.parentElement.appendChild(errorMsg);
            
            // フォーカス時にエラーをクリア
            inputElement.addEventListener('focus', function() {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.field-error');
                if (errorMsg) errorMsg.remove();
            }, { once: true });
        }
        
        return false;
    },
    
    // ローディング表示
    showLoading: function(message = '処理中...') {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loading);
    },
    
    // ローディング非表示
    hideLoading: function() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    },
    
    // 確認ダイアログ
    confirm: function(message, onConfirm, onCancel = null) {
        const dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.className = 'confirm-dialog-overlay';
        dialog.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-message">${message}</div>
                <div class="confirm-actions">
                    <button id="confirm-cancel" class="btn btn-outline">キャンセル</button>
                    <button id="confirm-ok" class="btn btn-primary">確認</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // イベントリスナー
        document.getElementById('confirm-ok').addEventListener('click', () => {
            dialog.remove();
            if (onConfirm) onConfirm();
        });
        
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            dialog.remove();
            if (onCancel) onCancel();
        });
    }
};

// グローバルエラーハンドラー
window.addEventListener('error', function(event) {
    console.error('🔥 グローバルエラー:', event.error);
    ErrorHandler.showError(
        'エラーが発生しました',
        event.message,
        10000
    );
});

// Promise拒否ハンドラー
window.addEventListener('unhandledrejection', function(event) {
    console.error('🔥 未処理のPromise拒否:', event.reason);
    ErrorHandler.showError(
        '非同期処理でエラーが発生しました',
        event.reason?.message || '詳細不明',
        10000
    );
});

// オフライン/オンライン検知
window.addEventListener('offline', function() {
    ErrorHandler.showError(
        'オフラインになりました',
        'インターネット接続が切断されました',
        0
    );
});

window.addEventListener('online', function() {
    ErrorHandler.closeError();
    ErrorHandler.showSuccess('オンラインに復帰しました');
});

console.log('✅ エラーハンドリングシステム準備完了');
