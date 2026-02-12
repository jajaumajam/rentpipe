// RentPipe パイプライン管理機能（完全版 + データ更新対応 + 新データ構造対応）
class PipelineManager {
    constructor() {
        this.dataManager = null;
        // 「完了」を削除（成約時は自動でアーカイブ）
        this.statuses = ['初回相談', '物件紹介', '内見調整', '申込準備', '審査中', '契約手続き'];
        this.isUpdating = false; // 自分自身の更新中フラグ
        this.init();
    }

    async init() {
        console.log('📈 統一パイプライン管理システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // パイプラインの表示
        this.renderPipeline();
        
        // 認証状態の更新（初回）
        this.updateAuthStatus();
        
        // 少し遅延して再度認証状態を更新（UnifiedSheetsManager.isEnabledが確実に設定されるまで待つ）
        setTimeout(() => {
            this.updateAuthStatus();
        }, 1000);
        
        // データ更新イベントをリッスン
        window.addEventListener('rentpipe-data-updated', () => {
            // 自分自身の更新中は再描画しない（無限ループ防止）
            if (!this.isUpdating) {
                console.log('🔔 データ更新通知受信 - パイプライン再描画');
                this.renderPipeline();
                this.updateAuthStatus();
            }
        });
        
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
        
        const authState = window.IntegratedAuthManager?.getAuthState();
        
        if (authState?.isAuthenticated) {
            const email = authState.email || 'ユーザー';
            const sheetsEnabled = window.UnifiedSheetsManager?.isEnabled;
            
            if (sheetsEnabled) {
                statusDiv.className = 'auth-status success';
                statusDiv.textContent = `✅ Google Sheets連携中 (${email})`;
            } else {
                statusDiv.className = 'auth-status warning';
                statusDiv.textContent = `⚠️ ローカルモード (${email}) - Google Sheets未接続`;
            }
        } else {
            statusDiv.className = 'auth-status error';
            statusDiv.textContent = '❌ 未認証 - ログインしてください';
        }
    }

    renderPipeline() {
        console.log('🎨 パイプライン描画開始');
        
        if (!this.dataManager) {
            console.error('❌ データ管理システムが利用できません');
            return;
        }

        // アクティブ顧客のみ取得
        const allCustomers = this.dataManager.getCustomers();
        const customers = allCustomers.filter(c => c.isActive !== false);
        console.log('📊 顧客データ取得:', customers.length, '件（アクティブのみ）');
        
        const container = document.getElementById('pipeline-container');
        if (!container) {
            console.error('❌ pipeline-container が見つかりません');
            return;
        }

        container.innerHTML = '';

        // 各ステータスごとにカラムを作成
        this.statuses.forEach(status => {
            const statusCustomers = customers.filter(c => c.pipelineStatus === status);
            
            const column = document.createElement('div');
            column.className = 'pipeline-column';
            column.innerHTML = `
                <div class="column-header">
                    <h3>${status}</h3>
                    <span class="count">${statusCustomers.length}</span>
                </div>
                <div class="column-content" data-status="${status}">
                    ${statusCustomers.length === 0 
                        ? '<div class="empty-state">顧客なし</div>'
                        : statusCustomers.map(customer => this.createCustomerCard(customer)).join('')
                    }
                </div>
            `;
            
            container.appendChild(column);
        });
        
        console.log('✅ パイプライン描画完了');
    }

    createCustomerCard(customer) {
        // 新しいデータ構造に対応（旧データ構造との後方互換性も維持）
        const name = customer.basicInfo?.name || customer.name || '名前未設定';
        const email = customer.basicInfo?.email || customer.email || '-';
        const phone = customer.basicInfo?.phone || customer.phone || '-';
        const budgetMin = customer.preferences?.budget?.min || customer.preferences?.budgetMin || 0;

        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="card-header">
                    <h4>${name}</h4>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <span>📧</span>
                        <span>${email}</span>
                    </div>
                    <div class="card-info">
                        <span>📱</span>
                        <span>${phone}</span>
                    </div>
                    ${budgetMin ? `
                        <div class="card-info">
                            <span>💰</span>
                            <span>${budgetMin.toLocaleString()}円〜</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    <div class="card-actions-row">
                        <button class="card-button" onclick="window.pipelineManager.changeStatus('${customer.id}', '${customer.pipelineStatus}')">
                            ステータス変更
                        </button>
                        <button class="card-button btn-archive" onclick="window.pipelineManager.openArchiveModal('${customer.id}')">
                            案内中止
                        </button>
                    </div>
                    <div class="card-actions-row">
                        <a href="customer-form.html?edit=${customer.id}&from=pipeline" class="card-button" style="text-decoration: none; text-align: center; flex: 1;">
                            編集
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // ステータス変更モーダルを開く
    changeStatus(customerId, currentStatus) {
        console.log('🔄 ステータス変更モーダル表示:', customerId, currentStatus);

        this.pendingStatusChange = { customerId, currentStatus };

        const customer = this.dataManager.getCustomerById(customerId);
        const customerName = customer?.basicInfo?.name || customer?.name || '顧客';

        // モーダルタイトルを設定
        const titleEl = document.getElementById('status-modal-title');
        if (titleEl) {
            titleEl.textContent = `${customerName}さんのステータス`;
        }

        // ステータスオプションを生成（アーカイブは別ボタンに分離）
        const optionsContainer = document.getElementById('status-options');
        if (optionsContainer) {
            let html = '';

            // パイプラインステータスのみ
            this.statuses.forEach(status => {
                const isCurrent = status === currentStatus;
                html += `
                    <button class="status-option ${isCurrent ? 'current' : ''}"
                            onclick="window.pipelineManager.selectStatus('${status}')">
                        ${status}${isCurrent ? ' （現在）' : ''}
                    </button>
                `;
            });

            optionsContainer.innerHTML = html;
        }

        // モーダルを表示
        document.getElementById('status-modal').classList.add('active');
    }

    // 失注アーカイブモーダルを開く（ArchiveManagerを使用）
    openArchiveModal(customerId) {
        console.log('📦 失注アーカイブモーダル表示:', customerId);
        window.ArchiveManager.openModal(customerId);
    }

    // ステータスを選択
    async selectStatus(newStatus) {
        const { customerId, currentStatus } = this.pendingStatusChange || {};
        if (!customerId) return;

        // モーダルを閉じる
        document.getElementById('status-modal').classList.remove('active');

        if (newStatus === currentStatus) {
            return; // 同じステータスなので何もしない
        }

        try {
            this.isUpdating = true;

            const customer = this.dataManager.getCustomerById(customerId);
            if (!customer) {
                throw new Error('顧客が見つかりません');
            }

            customer.pipelineStatus = newStatus;
            await this.dataManager.updateCustomer(customer);

            console.log('✅ ステータス変更成功:', customerId, '→', newStatus);
            this.renderPipeline();

        } catch (error) {
            console.error('❌ ステータス変更エラー:', error);
            alert('ステータス変更に失敗しました: ' + error.message);
        } finally {
            this.isUpdating = false;
            this.pendingStatusChange = null;
        }
    }

}

// グローバルインスタンス作成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pipelineManager = new PipelineManager();
    });
} else {
    window.pipelineManager = new PipelineManager();
}

console.log('✅ パイプライン管理システム準備完了');
