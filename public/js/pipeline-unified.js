// RentPipe パイプライン管理機能（完全版）
class PipelineManager {
    constructor() {
        this.dataManager = null;
        this.statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        this.init();
    }

    async init() {
        console.log('📈 統一パイプライン管理システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // パイプラインの表示
        this.renderPipeline();
        
        // 認証状態の更新
        this.updateAuthStatus();
        
        console.log('✅ 統一対応パイプライン管理システム準備完了');
    }

    async waitForDataManager() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.UnifiedDataManager) {
                    this.dataManager = window.UnifiedDataManager;
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // タイムアウト（5秒）
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!this.dataManager) {
                    console.error('❌ 統一データ管理システムが利用できません');
                }
                resolve();
            }, 5000);
        });
    }

    updateAuthStatus() {
        const statusDiv = document.getElementById('auth-sync-status');
        if (!statusDiv) return;
        
        const authState = window.IntegratedAuthManagerV2?.getAuthState();
        
        if (authState?.isAuthenticated && authState?.google?.isAuthenticated) {
            statusDiv.className = 'auth-status success';
            statusDiv.textContent = `✅ Google Sheets連携有効 - ${authState.google.email}`;
        } else {
            statusDiv.className = 'auth-status warning';
            statusDiv.textContent = 'ℹ️ LocalStorageモード（Google Sheets未連携）';
        }
    }

    renderPipeline() {
        console.log('🎨 パイプライン描画開始...');
        
        if (!this.dataManager) {
            console.error('❌ データマネージャーが利用できません');
            return;
        }

        const customers = this.dataManager.getCustomers();
        console.log(`📊 パイプラインデータ読み込み: ${customers.length}件`);
        
        const container = document.getElementById('pipeline-container');
        if (!container) {
            console.error('❌ pipeline-containerが見つかりません');
            return;
        }
        
        // コンテナをクリア
        container.innerHTML = '';
        
        // 各ステータスごとにカラムを作成
        this.statuses.forEach(status => {
            const column = this.createColumn(status, customers);
            container.appendChild(column);
        });
        
        console.log('✅ パイプライン描画完了');
    }

    createColumn(status, allCustomers) {
        const column = document.createElement('div');
        column.className = 'pipeline-column';
        column.dataset.status = status;
        
        // ヘッダー
        const header = document.createElement('div');
        header.className = 'pipeline-header';
        
        // このステータスの顧客をフィルター
        const statusCustomers = allCustomers.filter(c => c.pipelineStatus === status);
        
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${status}</span>
                <span style="background: rgba(59, 130, 246, 0.1); padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                    ${statusCustomers.length}
                </span>
            </div>
        `;
        
        column.appendChild(header);
        
        // カードコンテナ
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'pipeline-cards';
        
        if (statusCustomers.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '顧客なし';
            cardsContainer.appendChild(emptyState);
        } else {
            statusCustomers.forEach(customer => {
                const card = this.createCard(customer);
                cardsContainer.appendChild(card);
            });
        }
        
        column.appendChild(cardsContainer);
        
        return column;
    }

    createCard(customer) {
        const card = document.createElement('div');
        card.className = 'pipeline-card';
        card.dataset.customerId = customer.id;
        
        card.innerHTML = `
            <div class="card-name">${customer.name || '名前未設定'}</div>
            <div class="card-info">📧 ${customer.email || 'メールなし'}</div>
            <div class="card-info">📱 ${customer.phone || '電話番号なし'}</div>
            ${customer.preferences?.budgetMin ? `
                <div class="card-info">💰 ${customer.preferences.budgetMin.toLocaleString()}円 〜 ${customer.preferences.budgetMax?.toLocaleString() || ''}円</div>
            ` : ''}
            ${customer.preferences?.areas ? `
                <div class="card-info">📍 ${customer.preferences.areas.join(', ')}</div>
            ` : ''}
            <div class="card-actions">
                <button class="card-button" onclick="window.location.href='customer-form.html?edit=${customer.id}'">
                    編集
                </button>
            </div>
        `;
        
        // クリックイベント：ステータス変更メニュー表示
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('card-button')) {
                this.showStatusChangeMenu(customer);
            }
        });
        
        return card;
    }

    showStatusChangeMenu(customer) {
        // 既存のメニューを削除
        const existingMenu = document.querySelector('.status-change-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'status-change-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 400px;
            width: 90%;
        `;
        
        menu.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 16px;">ステータス変更: ${customer.name}</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${this.statuses.map(status => `
                    <button 
                        onclick="pipelineManager.changeStatus('${customer.id}', '${status}')"
                        style="
                            padding: 12px;
                            border: 2px solid ${customer.pipelineStatus === status ? '#3b82f6' : '#e5e7eb'};
                            background: ${customer.pipelineStatus === status ? '#dbeafe' : 'white'};
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: ${customer.pipelineStatus === status ? '600' : '400'};
                            transition: all 0.2s;
                        "
                        onmouseover="this.style.background='#f3f4f6'"
                        onmouseout="this.style.background='${customer.pipelineStatus === status ? '#dbeafe' : 'white'}'"
                    >
                        ${status} ${customer.pipelineStatus === status ? '✓' : ''}
                    </button>
                `).join('')}
            </div>
            <button 
                onclick="document.querySelector('.status-change-menu').remove(); document.querySelector('.status-menu-overlay').remove();"
                style="
                    margin-top: 15px;
                    padding: 10px;
                    width: 100%;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                "
            >
                キャンセル
            </button>
        `;
        
        // オーバーレイ
        const overlay = document.createElement('div');
        overlay.className = 'status-menu-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;
        
        overlay.addEventListener('click', () => {
            menu.remove();
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(menu);
    }

    async changeStatus(customerId, newStatus) {
        console.log(`🔄 ステータス変更: ${customerId} → ${newStatus}`);
        
        try {
            // 顧客データを取得
            const customer = this.dataManager.getCustomerById(customerId);
            if (!customer) {
                console.error('❌ 顧客が見つかりません');
                return;
            }
            
            // ステータスを更新
            customer.pipelineStatus = newStatus;
            customer.updatedAt = new Date().toISOString();
            
            // データマネージャーで更新（即座にGoogle Sheetsに同期）
            await this.dataManager.updateCustomer(customer);
            
            // メニューとオーバーレイを閉じる
            const menu = document.querySelector('.status-change-menu');
            const overlay = document.querySelector('.status-menu-overlay');
            if (menu) menu.remove();
            if (overlay) overlay.remove();
            
            // パイプラインを再描画
            this.renderPipeline();
            
            // 成功メッセージ
            this.showMessage(`✅ ${customer.name}のステータスを「${newStatus}」に変更しました`, 'success');
            
            console.log('✅ ステータス変更完了');
            
        } catch (error) {
            console.error('❌ ステータス変更エラー:', error);
            this.showMessage('❌ ステータス変更に失敗しました', 'error');
        }
    }

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

// グローバル関数
function refreshPipeline() {
    if (window.pipelineManager) {
        window.pipelineManager.renderPipeline();
    }
}

// アニメーションCSS
const animationCSS = document.createElement('style');
animationCSS.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;
document.head.appendChild(animationCSS);

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
