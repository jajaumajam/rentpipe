// RentPipe パイプライン管理機能（統一データ管理対応版・修正版）
class PipelineManager {
    constructor() {
        this.dataManager = null;
        this.draggedCustomer = null;
        this.touchStartTime = 0;
        this.longPressTimeout = null;
        this.touchThreshold = 500; // 500ms
        this.init();
    }

    async init() {
        console.log('📈 統一パイプライン管理システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // パイプラインの表示
        this.loadPipeline();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        console.log('✅ 統一対応パイプライン管理システム準備完了');
    }

    async waitForDataManager() {
        return new Promise((resolve) => {
            if (window.UnifiedDataManager) {
                this.dataManager = window.UnifiedDataManager;
                resolve();
            } else {
                setTimeout(() => {
                    this.dataManager = window.UnifiedDataManager;
                    resolve();
                }, 500);
            }
        });
    }

    loadPipeline() {
        if (!this.dataManager) {
            console.error('❌ 統一データ管理システムが利用できません');
            return;
        }

        try {
            const customers = this.dataManager.getCustomers();
            console.log(`📊 パイプラインデータ読み込み: ${customers.length}件`);
            
            this.renderPipeline(customers);
            this.updateStats(customers);
            
        } catch (error) {
            console.error('❌ パイプラインデータ読み込みエラー:', error);
        }
    }

    renderPipeline(customers) {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        
        statuses.forEach(status => {
            const statusCustomers = customers.filter(c => c.pipelineStatus === status);
            this.renderStatusColumn(status, statusCustomers);
        });
    }

    renderStatusColumn(status, customers) {
        const columnElement = document.querySelector(`[data-column="${status}"]`);
        const countElement = document.querySelector(`[data-count="${status}"]`);
        
        if (!columnElement) return;
        
        // カウント更新
        if (countElement) {
            countElement.textContent = customers.length;
        }
        
        // 顧客カードの表示
        if (customers.length === 0) {
            columnElement.innerHTML = `
                <div class="empty-column">
                    <p>顧客がいません</p>
                </div>
            `;
        } else {
            columnElement.innerHTML = customers.map(customer => 
                this.createCustomerCard(customer)
            ).join('');
        }
        
        // ドラッグ&ドロップイベントの再設定
        this.setupDragAndDrop(columnElement);
    }

    createCustomerCard(customer) {
        const urgencyIcons = {
            '高': '🔴',
            '中': '🟡',
            '低': '🟢'
        };

        const budgetText = customer.preferences?.budgetMin && customer.preferences?.budgetMax ? 
            `${Math.floor(customer.preferences.budgetMin / 10000)}万〜${Math.floor(customer.preferences.budgetMax / 10000)}万円` : 
            '予算未設定';

        const areas = customer.preferences?.areas?.slice(0, 2).join(', ') || 'エリア未設定';

        return `
            <div class="pipeline-card" 
                 draggable="true" 
                 data-customer-id="${customer.id}">
                <div class="card-header">
                    <div class="customer-name">
                        ${urgencyIcons[customer.urgency] || '⚪'} ${customer.name}
                    </div>
                </div>
                
                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-icon">💰</span>
                        <span class="detail-text">${budgetText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span class="detail-text">${areas}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">📱</span>
                        <span class="detail-text">${customer.phone || '未登録'}</span>
                    </div>
                </div>
                
                ${customer.notes ? `
                    <div class="card-notes">
                        ${customer.notes.length > 50 ? customer.notes.substring(0, 50) + '...' : customer.notes}
                    </div>
                ` : ''}
                
                <div class="card-footer">
                    <span class="update-time">
                        ${new Date(customer.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // リフレッシュボタン
        const refreshBtn = document.getElementById('refreshPipeline');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPipeline());
        }
    }

    setupDragAndDrop(container) {
        // カードのドラッグイベント
        const cards = container.querySelectorAll('.pipeline-card');
        cards.forEach(card => {
            // PC版：ドラッグ&ドロップ
            card.addEventListener('dragstart', (e) => {
                this.draggedCustomer = {
                    id: card.dataset.customerId,
                    element: card
                };
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                if (this.draggedCustomer) {
                    this.draggedCustomer.element.classList.remove('dragging');
                    this.draggedCustomer = null;
                }
            });

            // スマホ版：長押し処理
            card.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, card.dataset.customerId);
            });

            card.addEventListener('touchend', (e) => {
                this.handleTouchEnd(e);
            });

            card.addEventListener('touchcancel', () => {
                this.clearLongPress();
            });

            card.addEventListener('touchmove', () => {
                this.clearLongPress();
            });
        });

        // カラムのドロップイベント
        const columns = document.querySelectorAll('.pipeline-cards');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                if (this.draggedCustomer) {
                    const targetStatus = column.dataset.column;
                    this.moveCustomer(this.draggedCustomer.id, targetStatus);
                }
            });
        });
    }

    async moveCustomer(customerId, newStatus) {
        try {
            const customer = this.dataManager.getCustomerById(customerId);
            if (!customer) {
                console.error('❌ 顧客が見つかりません:', customerId);
                return;
            }

            const oldStatus = customer.pipelineStatus;
            
            if (oldStatus === newStatus) {
                console.log('📈 ステータス変更なし');
                return;
            }
            
            console.log(`📈 顧客ステータス更新開始: ${customer.name} ${oldStatus} → ${newStatus}`);
            
            // ステータス更新（統一データ管理システム使用）
            const updateSuccess = this.dataManager.updateCustomer(customerId, { 
                pipelineStatus: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            if (updateSuccess) {
                console.log(`✅ 顧客ステータス更新成功: ${customer.name}`);
                
                // パイプラインを即座に再読み込み
                this.loadPipeline();
                
                // 成功メッセージ
                this.showMessage(`${customer.name} を ${newStatus} に移動しました`, 'success');
                
                // ダッシュボードのリロード通知（他画面との同期）
                this.notifyDataChange();
                
            } else {
                console.error('❌ ステータス更新失敗');
                this.showMessage('ステータス更新に失敗しました', 'error');
            }
            
        } catch (error) {
            console.error('❌ 顧客移動エラー:', error);
            this.showMessage('顧客移動中にエラーが発生しました', 'error');
        }
    }

    // 他画面への変更通知
    notifyDataChange() {
        // カスタムイベントを発火して他画面に変更を通知
        const event = new CustomEvent('dataChanged', {
            detail: { source: 'pipeline', timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
        console.log('📡 データ変更イベント送信');
    }

    updateStats(customers) {
        const stats = this.dataManager.getDataStatistics();
        
        // 基本統計の更新
        this.updateStatElement('totalCustomers', stats.totalCustomers);
        this.updateStatElement('thisMonthNew', stats.thisMonthNew);
        this.updateStatElement('thisMonthCompleted', stats.thisMonthCompleted);
        this.updateStatElement('conversionRate', `${stats.conversionRate}%`);

        // 平均滞在期間の計算
        const avgDuration = this.calculateAverageDuration(customers);
        this.updateStatElement('avgDuration', avgDuration);
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    calculateAverageDuration(customers) {
        const completedCustomers = customers.filter(c => c.pipelineStatus === '完了');
        if (completedCustomers.length === 0) return '-';

        let totalDays = 0;
        completedCustomers.forEach(customer => {
            const created = new Date(customer.createdAt);
            const updated = new Date(customer.updatedAt);
            const diffTime = Math.abs(updated - created);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
        });

        const avgDays = Math.round(totalDays / completedCustomers.length);
        return `${avgDays}日`;
    }

    // タッチイベント処理（スマートフォン対応）
    handleTouchStart(event, customerId) {
        this.touchCustomerId = customerId;
        
        // 長押し判定用タイマーを開始
        this.longPressTimeout = setTimeout(() => {
            // 長押し成功：ハプティクスフィードバック
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            this.showMobileStatusMenu(customerId);
        }, this.touchThreshold);
        
        console.log(`👆 長押し開始: ${customerId}`);
    }

    handleTouchEnd(event) {
        this.clearLongPress();
    }

    clearLongPress() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        this.touchCustomerId = null;
    }

    showMobileStatusMenu(customerId) {
        const customer = this.dataManager.getCustomerById(customerId);
        if (!customer) return;

        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const currentStatus = customer.pipelineStatus;

        // モバイル用ステータス選択メニューを作成
        this.createMobileStatusDialog(customer, statuses, currentStatus);
    }

    createMobileStatusDialog(customer, statuses, currentStatus) {
        // 既存のダイアログを削除
        const existingDialog = document.getElementById('mobileStatusDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // オーバーレイとダイアログを作成
        const overlay = document.createElement('div');
        overlay.id = 'mobileStatusDialog';
        overlay.className = 'mobile-status-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'mobile-status-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 320px;
            width: 100%;
            animation: slideUp 0.3s ease;
        `;

        // ダイアログ内容
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3 style="margin: 0 0 1rem 0; color: #1e3a8a; text-align: center;">
                    📈 ${customer.name}
                </h3>
                <p style="margin: 0 0 1.5rem 0; color: #6b7280; text-align: center; font-size: 0.9rem;">
                    移動先のステータスを選択してください
                </p>
            </div>
            
            <div class="status-options">
                ${statuses.map(status => `
                    <button class="status-option ${status === currentStatus ? 'current' : ''}" 
                            onclick="selectMobileStatus('${customer.id}', '${status}')"
                            style="
                                display: block;
                                width: 100%;
                                padding: 0.75rem;
                                margin-bottom: 0.5rem;
                                border: 2px solid ${status === currentStatus ? '#3b82f6' : '#e5e7eb'};
                                background: ${status === currentStatus ? '#eff6ff' : 'white'};
                                color: ${status === currentStatus ? '#1e40af' : '#374151'};
                                border-radius: 8px;
                                font-weight: ${status === currentStatus ? '600' : '400'};
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">
                        ${status === currentStatus ? '✓ ' : ''}${status}
                        ${status === currentStatus ? ' (現在)' : ''}
                    </button>
                `).join('')}
            </div>
            
            <div class="dialog-footer" style="margin-top: 1rem;">
                <button onclick="closeMobileStatusDialog()" 
                        style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #d1d5db;
                            background: white;
                            color: #374151;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                        ">
                    キャンセル
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeMobileStatusDialog();
            }
        });

        console.log('📱 モバイルステータスメニュー表示');
    }

    closeMobileStatusDialog() {
        const dialog = document.getElementById('mobileStatusDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    selectMobileStatus(customerId, newStatus) {
        this.closeMobileStatusDialog();
        
        const customer = this.dataManager.getCustomerById(customerId);
        if (customer && customer.pipelineStatus !== newStatus) {
            this.moveCustomer(customerId, newStatus);
        }
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.floating-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `floating-message message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
            border: 1px solid ${type === 'success' ? '#10b981' : '#ef4444'};
            color: ${type === 'success' ? '#065f46' : '#991b1b'};
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }
}

// グローバル関数（HTMLとモバイルダイアログから呼び出される）
function refreshPipeline() {
    if (window.pipelineManager) {
        window.pipelineManager.loadPipeline();
    }
}

function selectMobileStatus(customerId, newStatus) {
    if (window.pipelineManager) {
        window.pipelineManager.selectMobileStatus(customerId, newStatus);
    }
}

function closeMobileStatusDialog() {
    if (window.pipelineManager) {
        window.pipelineManager.closeMobileStatusDialog();
    }
}

// CSS アニメーション追加
const animationCSS = `
<style>
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.status-option:hover {
    background: #f3f4f6 !important;
    border-color: #9ca3af !important;
}

.status-option.current:hover {
    background: #dbeafe !important;
    border-color: #2563eb !important;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', animationCSS);

// パイプライン管理システムのインスタンス作成
let pipelineManager = null;

// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pipelineManager = new PipelineManager();
        window.pipelineManager = pipelineManager;
    });
} else {
    pipelineManager = new PipelineManager();
    window.pipelineManager = pipelineManager;
}

console.log('✅ 統一対応パイプライン管理スクリプト準備完了（修正版）');
