// RentPipe パイプライン管理機能（統一データ管理対応版）
class PipelineManager {
    constructor() {
        this.dataManager = null;
        this.draggedCustomer = null;
        this.touchStartTime = 0;
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
                 data-customer-id="${customer.id}"
                 ontouchstart="handleTouchStart(event)"
                 ontouchend="handleTouchEnd(event)">
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

    moveCustomer(customerId, newStatus) {
        try {
            const customer = this.dataManager.getCustomerById(customerId);
            if (!customer) {
                console.error('❌ 顧客が見つかりません:', customerId);
                return;
            }

            const oldStatus = customer.pipelineStatus;
            
            // ステータス更新
            if (this.dataManager.updateCustomer(customerId, { pipelineStatus: newStatus })) {
                console.log(`📈 顧客ステータス更新: ${customer.name} ${oldStatus} → ${newStatus}`);
                
                // パイプラインを再読み込み
                this.loadPipeline();
                
                // 成功メッセージ
                this.showMessage(`${customer.name} を ${newStatus} に移動しました`, 'success');
            } else {
                this.showMessage('ステータス更新に失敗しました', 'error');
            }
            
        } catch (error) {
            console.error('❌ 顧客移動エラー:', error);
            this.showMessage('顧客移動中にエラーが発生しました', 'error');
        }
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
        this.touchStartTime = Date.now();
        this.touchCustomerId = customerId;
    }

    handleTouchEnd(event) {
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (touchDuration >= this.touchThreshold && this.touchCustomerId) {
            event.preventDefault();
            this.showMobileStatusMenu(this.touchCustomerId);
        }
        
        this.touchStartTime = 0;
        this.touchCustomerId = null;
    }

    showMobileStatusMenu(customerId) {
        const customer = this.dataManager.getCustomerById(customerId);
        if (!customer) return;

        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const currentStatus = customer.pipelineStatus;

        const options = statuses.map(status => 
            status === currentStatus ? `${status} (現在)` : status
        );

        // モバイル用選択ダイアログ
        const selectedIndex = this.showMobileDialog(
            `${customer.name} のステータスを選択`,
            options
        );

        if (selectedIndex !== null && selectedIndex !== -1) {
            const newStatus = statuses[selectedIndex];
            if (newStatus !== currentStatus) {
                this.moveCustomer(customerId, newStatus);
            }
        }
    }

    showMobileDialog(title, options) {
        // 簡易的な選択ダイアログ（実際のプロジェクトではより洗練されたUIを使用）
        let message = title + '\n\n';
        options.forEach((option, index) => {
            message += `${index + 1}. ${option}\n`;
        });
        
        const input = prompt(message + '\n番号を選択してください (1-' + options.length + ')');
        
        if (input) {
            const num = parseInt(input) - 1;
            if (num >= 0 && num < options.length) {
                return num;
            }
        }
        
        return null;
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
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
            border: 1px solid ${type === 'success' ? '#10b981' : '#ef4444'};
            color: ${type === 'success' ? '#065f46' : '#991b1b'};
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }
}

// グローバル関数（HTMLから呼び出される）
function handleTouchStart(event) {
    const card = event.currentTarget;
    const customerId = card.dataset.customerId;
    if (window.pipelineManager) {
        window.pipelineManager.handleTouchStart(event, customerId);
    }
}

function handleTouchEnd(event) {
    if (window.pipelineManager) {
        window.pipelineManager.handleTouchEnd(event);
    }
}

function refreshPipeline() {
    if (window.pipelineManager) {
        window.pipelineManager.loadPipeline();
    }
}

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

console.log('✅ 統一対応パイプライン管理スクリプト準備完了');
