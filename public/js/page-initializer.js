/**
 * RentPipe ページ共通初期化モジュール
 * 各ページで重複していた処理を共通化
 */

const PageInitializer = {
    // 初期化済みフラグ
    isInitialized: false,

    // 設定
    config: {
        authStatusElementId: 'auth-sync-status',
        loadingOverlayId: 'loading-overlay',
        autoUpdateInterval: 5000, // 認証ステータス自動更新間隔（ms）
    },

    /**
     * ページを初期化
     * @param {Object} options - オプション
     * @param {Function} options.onDataUpdated - データ更新時のコールバック
     * @param {Function} options.onInitialized - 初期化完了時のコールバック
     * @param {boolean} options.autoUpdateAuthStatus - 認証ステータスを自動更新するか
     */
    async initialize(options = {}) {
        if (this.isInitialized) {
            console.log('📄 PageInitializer: 既に初期化済み');
            return;
        }

        console.log('📄 PageInitializer: 初期化開始...');

        try {
            // AppInitializerの初期化完了を待つ
            if (window.AppInitializer && window.AppInitializer.initializationPromise) {
                await window.AppInitializer.initializationPromise;
            }

            // 認証ステータス表示を更新
            this.updateAuthStatusDisplay();

            // 自動更新設定
            if (options.autoUpdateAuthStatus !== false) {
                setInterval(() => this.updateAuthStatusDisplay(), this.config.autoUpdateInterval);
            }

            // データ更新イベントリスナーを設定
            window.addEventListener('rentpipe-data-updated', (event) => {
                console.log('🔔 データ更新通知受信');
                this.updateAuthStatusDisplay();

                // コールバックがあれば実行
                if (typeof options.onDataUpdated === 'function') {
                    options.onDataUpdated(event.detail);
                }
            });

            this.isInitialized = true;
            console.log('📄 PageInitializer: 初期化完了');

            // 初期化完了コールバック
            if (typeof options.onInitialized === 'function') {
                options.onInitialized();
            }

        } catch (error) {
            console.error('📄 PageInitializer: 初期化エラー', error);
            throw error;
        }
    },

    /**
     * 認証ステータス表示を更新
     */
    updateAuthStatusDisplay() {
        const statusElement = document.getElementById(this.config.authStatusElementId);
        if (!statusElement) return;

        const status = window.AppInitializer ?
            window.AppInitializer.getInitializationStatus() :
            { isInitialized: false, isAuthenticated: false };

        if (status.isInitialized && status.isAuthenticated) {
            statusElement.innerHTML = '✅ 同期済み';
            statusElement.className = 'auth-status synced';
        } else if (status.isAuthenticated) {
            statusElement.innerHTML = '⏳ 同期中...';
            statusElement.className = 'auth-status syncing';
        } else {
            statusElement.innerHTML = '⚠️ 未同期';
            statusElement.className = 'auth-status not-synced';
        }
    },

    /**
     * ローディングオーバーレイを表示
     * @param {string} message - 表示メッセージ（オプション）
     */
    showLoading(message = '処理中...') {
        let overlay = document.getElementById(this.config.loadingOverlayId);

        // オーバーレイがなければ作成
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = this.config.loadingOverlayId;
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            // メッセージを更新
            const textElement = overlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }

        overlay.classList.add('active');
    },

    /**
     * ローディングオーバーレイを非表示
     */
    hideLoading() {
        const overlay = document.getElementById(this.config.loadingOverlayId);
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * 通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - 表示時間（ms）
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 既存の通知を削除
        const existingNotifications = document.querySelectorAll('.page-notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `page-notification ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // スタイルを追加（インラインスタイル）
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
            color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#1e40af'};
            border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    },

    /**
     * 確認ダイアログを表示
     * @param {string} message - メッセージ
     * @returns {Promise<boolean>}
     */
    confirm(message) {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    },

    /**
     * 顧客カードを作成（共通コンポーネント）
     * @param {Object} customer - 顧客データ
     * @param {Object} options - オプション
     * @returns {HTMLElement}
     */
    createCustomerCard(customer, options = {}) {
        const card = document.createElement('div');
        const isInactive = customer.isActive === false;
        card.className = 'customer-card' + (isInactive ? ' inactive' : '');
        card.dataset.customerId = customer.id;

        const statusColors = {
            '初回相談': '#fef3c7',
            '物件紹介': '#dbeafe',
            '内見': '#e0e7ff',
            '申込': '#fce7f3',
            '審査': '#fed7aa',
            '契約': '#d1fae5',
            '完了': '#d1fae5'
        };

        // 新しいデータ構造に対応
        const name = customer.basicInfo?.name || customer.name || '名前未設定';
        const email = customer.basicInfo?.email || customer.email || 'メールなし';
        const phone = customer.basicInfo?.phone || customer.phone || '電話番号なし';
        const budgetMin = customer.preferences?.budget?.min || 0;
        const budgetMax = customer.preferences?.budget?.max || 0;
        const areas = customer.preferences?.areas || '';

        const activeBadge = isInactive
            ? '<span class="active-badge inactive">⏸️ 非アクティブ</span>'
            : '';

        card.innerHTML = `
            <div class="customer-header">
                <div>
                    <div class="customer-name">${name} ${activeBadge}</div>
                </div>
                <div class="customer-status" style="background: ${statusColors[customer.pipelineStatus] || '#f3f4f6'}">
                    ${customer.pipelineStatus || '未設定'}
                </div>
            </div>
            <div class="customer-info">📧 ${email}</div>
            <div class="customer-info">📱 ${phone}</div>
            ${budgetMin ? `
                <div class="customer-info">💰 ${budgetMin.toLocaleString()}円 〜 ${budgetMax ? budgetMax.toLocaleString() + '円' : ''}</div>
            ` : ''}
            ${areas ? `
                <div class="customer-info">📍 ${areas}</div>
            ` : ''}
            ${options.showActions !== false ? `
                <div class="customer-actions">
                    <button class="btn-edit" data-action="edit" data-id="${customer.id}">
                        編集
                    </button>
                    ${isInactive
                        ? `<button class="btn-activate" data-action="activate" data-id="${customer.id}">▶️ 再アクティブ化</button>`
                        : `<button class="btn-deactivate" data-action="deactivate" data-id="${customer.id}">⏸️ 非アクティブ化</button>`
                    }
                </div>
            ` : ''}
        `;

        return card;
    },

    /**
     * 統計情報を取得
     * @returns {Object}
     */
    getCustomerStats() {
        if (!window.UnifiedDataManager) {
            return { total: 0, active: 0, inactive: 0, newThisMonth: 0 };
        }

        const customers = window.UnifiedDataManager.getCustomers();
        const activeCount = customers.filter(c => c.isActive !== false).length;
        const inactiveCount = customers.filter(c => c.isActive === false).length;

        // 今月の新規
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newThisMonth = customers.filter(c => {
            const created = new Date(c.createdAt);
            return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
        }).length;

        return {
            total: customers.length,
            active: activeCount,
            inactive: inactiveCount,
            newThisMonth: newThisMonth
        };
    }
};

// グローバルに公開
window.PageInitializer = PageInitializer;

console.log('✅ PageInitializer loaded');
