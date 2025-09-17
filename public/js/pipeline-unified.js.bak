// RentPipe パイプライン管理機能（スマホメニュー改良版）
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
        
        console.log('✅ 統一対応パイプライン管理システム準備完了（スマホメニュー改良版）');
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

        const urgencyClasses = {
            '高': 'urgency-high',
            '中': 'urgency-medium', 
            '低': 'urgency-low'
        };

        // デバイス判定
        const isMobile = window.innerWidth <= 768;

        // 予算テキスト（モバイルでは短縮表示）
        let budgetText = '予算未設定';
        if (customer.preferences?.budgetMin && customer.preferences?.budgetMax) {
            const minBudget = Math.floor(customer.preferences.budgetMin / 10000);
            const maxBudget = Math.floor(customer.preferences.budgetMax / 10000);
            budgetText = isMobile ? 
                `${minBudget}～${maxBudget}万` : 
                `${minBudget}万〜${maxBudget}万円`;
        }

        // エリアテキスト（モバイルでは最初の1つのみ）
        let areasText = 'エリア未設定';
        if (customer.preferences?.areas && customer.preferences.areas.length > 0) {
            areasText = isMobile ? 
                customer.preferences.areas[0] : 
                customer.preferences.areas.slice(0, 2).join('、');
        }

        // 最終更新日
        const lastUpdated = new Date(customer.updatedAt).toLocaleDateString('ja-JP', 
            isMobile ? { month: 'numeric', day: 'numeric' } : 
            { year: 'numeric', month: 'numeric', day: 'numeric' }
        );

        if (isMobile) {
            // モバイル用：よりコンパクトなカード
            return `
                <div class="pipeline-card" 
                     draggable="true" 
                     data-customer-id="${customer.id}">
                    <div class="card-header">
                        <div class="customer-name">
                            ${urgencyIcons[customer.urgency] || '⚪'} ${customer.name}
                            <span class="urgency-indicator ${urgencyClasses[customer.urgency] || 'urgency-medium'}"></span>
                        </div>
                    </div>
                    
                    <div class="card-details">
                        <div class="detail-row">
                            <span class="detail-icon">💰</span>
                            <span class="detail-text">${budgetText}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-icon">📍</span>
                            <span class="detail-text">${areasText}</span>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <span class="update-time">${lastUpdated}</span>
                    </div>
                </div>
            `;
        } else {
            // デスクトップ用：詳細表示
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
                            <span class="detail-text">${areasText}</span>
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
                        <span class="update-time">${lastUpdated}</span>
                    </div>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // リフレッシュボタン
        const refreshBtn = document.getElementById('refreshPipeline');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPipeline());
        }

        // リサイズイベント：画面サイズ変更時にカード再生成
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.loadPipeline(); // カードを再生成
            }, 250);
        });
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
                this.handleTouchStart(e, card.dataset.customerId, card);
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

    // タッチイベント処理（スマートフォン対応・改良版）
    handleTouchStart(event, customerId, cardElement) {
        this.touchCustomerId = customerId;
        this.touchCardElement = cardElement;
        
        // 長押し判定用タイマーを開始
        this.longPressTimeout = setTimeout(() => {
            // 長押し成功：ハプティクスフィードバック
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // 視覚的フィードバック
            cardElement.classList.add('long-press');
            setTimeout(() => {
                cardElement.classList.remove('long-press');
            }, 300);
            
            this.showMobileStatusMenuSide(customerId, cardElement);
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
        this.touchCardElement = null;
    }

    showMobileStatusMenuSide(customerId, cardElement) {
        const customer = this.dataManager.getCustomerById(customerId);
        if (!customer) return;

        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const currentStatus = customer.pipelineStatus;

        // カードの位置を取得
        const cardRect = cardElement.getBoundingClientRect();
        
        // メニューを作成
        this.createMobileStatusMenuSide(customer, statuses, currentStatus, cardRect);
    }

    createMobileStatusMenuSide(customer, statuses, currentStatus, cardRect) {
        // 既存のメニューを削除
        const existingMenu = document.getElementById('mobileStatusMenuSide');
        if (existingMenu) {
            existingMenu.remove();
        }

        // サイドメニューを作成
        const menu = document.createElement('div');
        menu.id = 'mobileStatusMenuSide';
        menu.style.cssText = `
            position: fixed;
            left: ${cardRect.right + 10}px;
            top: ${cardRect.top}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 140px;
            max-width: 160px;
            animation: slideInLeft 0.2s ease;
            border: 1px solid #e2e8f0;
        `;

        // 画面端での位置調整
        if (cardRect.right + 170 > window.innerWidth) {
            menu.style.left = `${cardRect.left - 170}px`;
        }
        if (cardRect.top + 200 > window.innerHeight) {
            menu.style.top = `${window.innerHeight - 220}px`;
        }

        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 0.75rem;
            background: #1e3a8a;
            color: white;
            border-radius: 8px 8px 0 0;
            font-size: 0.8rem;
            font-weight: 600;
            text-align: center;
        `;
        header.textContent = customer.name;

        menu.appendChild(header);

        // ステータスボタン
        statuses.forEach(status => {
            const button = document.createElement('button');
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 0.5rem;
                border: none;
                background: ${status === currentStatus ? '#eff6ff' : 'white'};
                color: ${status === currentStatus ? '#1e40af' : '#374151'};
                text-align: left;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: ${status === currentStatus ? '600' : '400'};
                border-bottom: 1px solid #f1f5f9;
                transition: background 0.2s ease;
            `;
            
            button.textContent = status === currentStatus ? `✓ ${status}` : status;
            
            button.addEventListener('click', () => {
                this.selectMobileStatusSide(customer.id, status);
            });
            
            button.addEventListener('mouseover', () => {
                if (status !== currentStatus) {
                    button.style.background = '#f9fafb';
                }
            });
            
            button.addEventListener('mouseout', () => {
                if (status !== currentStatus) {
                    button.style.background = 'white';
                }
            });

            menu.appendChild(button);
        });

        // 閉じるボタン
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            display: block;
            width: 100%;
            padding: 0.5rem;
            border: none;
            background: #f9fafb;
            color: #6b7280;
            text-align: center;
            cursor: pointer;
            font-size: 0.75rem;
            border-radius: 0 0 8px 8px;
        `;
        closeButton.textContent = '閉じる';
        closeButton.addEventListener('click', () => {
            this.closeMobileStatusMenuSide();
        });

        menu.appendChild(closeButton);

        // 背景オーバーレイ
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
            z-index: 999;
        `;
        overlay.addEventListener('click', () => {
            this.closeMobileStatusMenuSide();
        });

        document.body.appendChild(overlay);
        document.body.appendChild(menu);

        console.log('📱 サイドメニュー表示');
    }

    closeMobileStatusMenuSide() {
        const menu = document.getElementById('mobileStatusMenuSide');
        const overlay = document.querySelector('div[style*="rgba(0, 0, 0, 0.1)"]');
        
        if (menu) menu.remove();
        if (overlay) overlay.remove();
    }

    selectMobileStatusSide(customerId, newStatus) {
        this.closeMobileStatusMenuSide();
        
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
            font-size: 0.9rem;
            max-width: 300px;
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
function refreshPipeline() {
    if (window.pipelineManager) {
        window.pipelineManager.loadPipeline();
    }
}

// CSS アニメーション追加
const animationCSS = `
<style>
@keyframes slideInLeft {
    from { transform: translateX(-10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
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

console.log('✅ 統一対応パイプライン管理スクリプト準備完了（サイドメニュー版）');
