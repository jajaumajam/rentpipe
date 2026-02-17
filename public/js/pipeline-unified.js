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

        // ステータスカラーマップ
        const statusColors = {
            '初回相談':  { dot: 'bg-blue-400',   header: 'bg-blue-50 border-blue-100',   count: 'bg-blue-500',   border: 'border-l-blue-400'   },
            '物件紹介':  { dot: 'bg-purple-400',  header: 'bg-purple-50 border-purple-100', count: 'bg-purple-500', border: 'border-l-purple-400' },
            '内見調整':  { dot: 'bg-cyan-400',    header: 'bg-cyan-50 border-cyan-100',   count: 'bg-cyan-500',   border: 'border-l-cyan-400'   },
            '申込準備':  { dot: 'bg-amber-400',   header: 'bg-amber-50 border-amber-100', count: 'bg-amber-500',  border: 'border-l-amber-400'  },
            '審査中':    { dot: 'bg-orange-400',  header: 'bg-orange-50 border-orange-100', count: 'bg-orange-500', border: 'border-l-orange-400' },
            '契約手続き': { dot: 'bg-green-400',  header: 'bg-green-50 border-green-100', count: 'bg-green-500',  border: 'border-l-green-400'  },
        };

        // 各ステータスごとにカラムを作成
        this.statuses.forEach(status => {
            const statusCustomers = customers.filter(c => c.pipelineStatus === status);
            const colors = statusColors[status] || { dot: 'bg-gray-400', header: 'bg-gray-50 border-gray-100', count: 'bg-gray-500', border: 'border-l-gray-400' };

            const column = document.createElement('div');
            column.className = 'bg-gray-50 rounded-2xl p-3 min-h-80 flex flex-col border border-gray-100';
            column.innerHTML = `
                <div class="${colors.header} border rounded-xl px-3 py-2.5 mb-3 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${colors.dot} flex-shrink-0"></span>
                        <h3 class="font-semibold text-sm text-gray-700">${status}</h3>
                    </div>
                    <span class="${colors.count} text-white text-xs font-bold px-2.5 py-0.5 rounded-full">${statusCustomers.length}</span>
                </div>
                <div class="flex flex-col gap-2 flex-1" data-status="${status}">
                    ${statusCustomers.length === 0
                        ? '<div class="flex-1 flex items-center justify-center text-gray-400 text-xs py-8">顧客なし</div>'
                        : statusCustomers.map(customer => this.createCustomerCard(customer, colors.border)).join('')
                    }
                </div>
            `;

            container.appendChild(column);
        });
        
        console.log('✅ パイプライン描画完了');
    }

    createCustomerCard(customer, borderColorClass = 'border-l-blue-400') {
        // 新しいデータ構造に対応（旧データ構造との後方互換性も維持）
        const name = customer.basicInfo?.name || customer.name || '名前未設定';
        const email = customer.basicInfo?.email || customer.email || '-';
        const phone = customer.basicInfo?.phone || customer.phone || '-';
        const budgetMin = customer.preferences?.budget?.min || customer.preferences?.budgetMin || 0;

        return `
            <div class="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 border-l-4 ${borderColorClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                 data-customer-id="${customer.id}">
                <h4 class="font-semibold text-sm text-gray-900 mb-2">${name}</h4>
                <div class="space-y-1 mb-3">
                    <div class="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>📧</span>
                        <span class="truncate">${email}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>📱</span>
                        <span>${phone}</span>
                    </div>
                    ${budgetMin ? `
                        <div class="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>💰</span>
                            <span>${budgetMin.toLocaleString()}円〜</span>
                        </div>
                    ` : ''}
                </div>
                <div class="border-t border-gray-100 pt-2.5 flex flex-col gap-1.5">
                    <div class="flex gap-1.5">
                        <button
                            onclick="window.pipelineManager.changeStatus('${customer.id}', '${customer.pipelineStatus}')"
                            class="flex-1 py-1.5 text-xs font-medium bg-rentpipe-primary hover:bg-indigo-600 text-white rounded-lg transition-colors border-0 cursor-pointer">
                            ステータス変更
                        </button>
                        <button
                            onclick="window.pipelineManager.openArchiveModal('${customer.id}')"
                            class="flex-1 py-1.5 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors border-0 cursor-pointer">
                            案内中止
                        </button>
                    </div>
                    <a href="customer-form.html?edit=${customer.id}&from=pipeline"
                       class="block text-center py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors no-underline">
                        ✏️ 編集
                    </a>
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
                    <button class="status-option w-full text-left px-4 py-2.5 border-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${isCurrent ? 'current border-green-400 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-700'}"
                            onclick="window.pipelineManager.selectStatus('${status}')">
                        ${status}${isCurrent ? ' ✓' : ''}
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
