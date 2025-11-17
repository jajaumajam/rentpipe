// パイプライン管理システム（統合版 + アクティブ顧客のみ表示）
class PipelineManager {
    constructor() {
        console.log('🎯 パイプライン管理システム初期化開始（アクティブのみ表示）');
        
        this.statuses = [
            '初回相談',
            '物件紹介',
            '内見',
            '申込',
            '審査中',
            '契約手続き',
            '完了'
        ];
        
        this.dataManager = null;
        this.isUpdating = false;
        
        this.initialize();
    }

    async initialize() {
        console.log('⚙️ 初期化処理開始...');
        
        try {
            // 認証確認
            await this.checkAuth();
            
            // データマネージャーの準備待機
            await this.waitForDataManager();
            
            // パイプライン描画
            this.renderPipeline();
            
            // データ変更イベントのリスナー登録
            window.addEventListener('rentpipe-data-updated', () => {
                if (!this.isUpdating) {
                    console.log('📢 データ更新検知 - パイプライン再描画');
                    this.renderPipeline();
                }
            });
            
            console.log('✅ パイプライン管理システム初期化完了');
            
        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            this.showError(error.message);
        }
    }

    async checkAuth() {
        const authData = localStorage.getItem('rentpipe_auth');
        const statusDiv = document.getElementById('auth-sync-status');
        
        if (!authData) {
            statusDiv.className = 'auth-status error';
            statusDiv.textContent = '❌ 未認証 - ログインしてください';
            throw new Error('認証が必要です');
        }
        
        statusDiv.className = 'auth-status success';
        statusDiv.textContent = '✅ 認証済み';
    }

    async waitForDataManager() {
        console.log('⏳ データマネージャーの準備を待機中...');
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.UnifiedDataManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.UnifiedDataManager) {
            throw new Error('データ管理システムが利用できません');
        }
        
        this.dataManager = window.UnifiedDataManager;
        console.log('✅ データマネージャー準備完了');
    }

    showError(message) {
        const statusDiv = document.getElementById('auth-sync-status');
        if (statusDiv) {
            statusDiv.className = 'auth-status error';
            statusDiv.textContent = '❌ ' + message;
        }
    }

    renderPipeline() {
        console.log('🎨 パイプライン描画開始（アクティブ顧客のみ）');
        
        if (!this.dataManager) {
            console.error('❌ データ管理システムが利用できません');
            return;
        }

        // アクティブ顧客のみ取得
        const customers = this.dataManager.getActiveCustomers();
        console.log('📊 アクティブ顧客データ取得:', customers.length, '件');
        
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
        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="card-header">
                    <h4>${customer.name || '名前未設定'}</h4>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <span>📧</span>
                        <span>${customer.email || '-'}</span>
                    </div>
                    <div class="card-info">
                        <span>📱</span>
                        <span>${customer.phone || '-'}</span>
                    </div>
                    ${customer.preferences?.budgetMin ? `
                        <div class="card-info">
                            <span>💰</span>
                            <span>${customer.preferences.budgetMin.toLocaleString()}円〜</span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    <button class="card-button" onclick="window.pipelineManager.changeStatus('${customer.id}', '${customer.pipelineStatus}')">
                        ステータス変更
                    </button>
                    <a href="customer-detail.html?id=${customer.id}" class="card-button" style="text-decoration: none; text-align: center;">
                        詳細
                    </a>
                </div>
            </div>
        `;
    }

    async changeStatus(customerId, currentStatus) {
        console.log('🔄 ステータス変更開始:', customerId, currentStatus);
        
        // ステータス選択ダイアログ
        const newStatus = prompt(
            `新しいステータスを選択してください:\n\n` +
            this.statuses.map((s, i) => `${i + 1}. ${s}${s === currentStatus ? ' (現在)' : ''}`).join('\n') +
            `\n\n番号を入力してください (1-${this.statuses.length}):`,
            this.statuses.indexOf(currentStatus) + 1
        );

        if (!newStatus) {
            console.log('ℹ️ ステータス変更キャンセル');
            return;
        }

        const statusIndex = parseInt(newStatus) - 1;
        
        if (statusIndex < 0 || statusIndex >= this.statuses.length) {
            alert('無効な番号です');
            return;
        }

        const selectedStatus = this.statuses[statusIndex];
        
        if (selectedStatus === currentStatus) {
            alert('同じステータスです');
            return;
        }

        try {
            // 更新中フラグを立てる
            this.isUpdating = true;
            
            const customer = this.dataManager.getCustomerById(customerId);
            
            if (!customer) {
                throw new Error('顧客が見つかりません');
            }

            // ステータス更新
            customer.pipelineStatus = selectedStatus;
            
            await this.dataManager.updateCustomer(customer);
            
            console.log('✅ ステータス変更成功:', customerId, '→', selectedStatus);
            
            // 完了ステータスに変更された場合の通知
            if (selectedStatus === '完了') {
                alert(`✅ ステータスを「完了」に変更しました\n自動的に非アクティブ化されました`);
            } else {
                alert(`✅ ステータスを「${selectedStatus}」に変更しました`);
            }
            
            // パイプライン再描画
            this.renderPipeline();
            
        } catch (error) {
            console.error('❌ ステータス変更エラー:', error);
            alert('ステータス変更に失敗しました: ' + error.message);
        } finally {
            // 更新中フラグを解除
            this.isUpdating = false;
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

console.log('✅ パイプライン管理システム準備完了（アクティブのみ表示版）');
