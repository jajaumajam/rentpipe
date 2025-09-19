// 🚀 顧客管理システム × Google Drive統合
console.log('🚀 顧客管理システム × Google Drive統合初期化中...');

window.CustomerGoogleDriveIntegration = {
    // 状態管理
    isEnabled: false,
    isInitialized: false,
    autoSyncEnabled: true,
    lastSyncTime: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Drive統合初期化開始...');
            
            // Google Drive API v2 の確認
            if (!window.GoogleDriveAPIv2) {
                console.warn('⚠️ Google Drive APIが利用できません（オフラインモード）');
                this.showCloudSyncUI(false);
                return false;
            }
            
            // UI初期化
            this.setupCloudSyncUI();
            
            this.isInitialized = true;
            console.log('✅ Google Drive統合初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Drive統合初期化エラー:', error);
            this.showCloudSyncUI(false);
            return false;
        }
    },
    
    // クラウド同期UI設定
    setupCloudSyncUI: function() {
        // 既存のGoogle Forms状況表示エリアをGoogle Drive同期に変更
        const statusDiv = document.getElementById('google-forms-status');
        if (!statusDiv) return;
        
        statusDiv.innerHTML = `
            <div id="google-drive-sync-panel">
                <h3>☁️ Google Drive 同期</h3>
                <div id="sync-status" class="sync-status-disconnected">
                    <span id="sync-status-text">未接続 - クラウド同期を開始してください</span>
                    <div id="sync-controls">
                        <button id="btn-connect-drive" onclick="CustomerGoogleDriveIntegration.connectGoogleDrive()" class="btn btn-outline">
                            🔗 Google Drive接続
                        </button>
                        <button id="btn-sync-now" onclick="CustomerGoogleDriveIntegration.syncNow()" class="btn btn-outline" disabled>
                            🔄 今すぐ同期
                        </button>
                        <button id="btn-download-backup" onclick="CustomerGoogleDriveIntegration.downloadBackup()" class="btn btn-outline">
                            💾 バックアップDL
                        </button>
                    </div>
                    <div id="last-sync-time" style="font-size: 12px; color: #666; margin-top: 8px;"></div>
                </div>
                
                <div id="sync-auto-controls" style="margin-top: 15px;">
                    <label style="display: flex; align-items: center; font-size: 14px;">
                        <input type="checkbox" id="auto-sync-checkbox" checked onchange="CustomerGoogleDriveIntegration.toggleAutoSync(this.checked)">
                        <span style="margin-left: 8px;">データ変更時に自動同期</span>
                    </label>
                </div>
            </div>
        `;
        
        // CSSスタイルを追加
        this.addSyncStyles();
    },
    
    // Google Drive接続
    connectGoogleDrive: async function() {
        try {
            console.log('🔗 Google Drive接続開始...');
            this.updateSyncStatus('Google Drive接続中...', 'connecting');
            
            // Google Drive API v2 認証
            const success = await window.GoogleDriveAPIv2.authenticate();
            if (!success) {
                throw new Error('Google認証に失敗しました');
            }
            
            // データ管理システム初期化
            if (!window.GoogleDriveDataManager) {
                throw new Error('Google Drive データ管理システムが見つかりません');
            }
            
            const initSuccess = await window.GoogleDriveDataManager.initialize();
            if (!initSuccess) {
                throw new Error('Google Drive データ管理システム初期化に失敗しました');
            }
            
            // 接続完了
            this.isEnabled = true;
            this.updateSyncStatus('接続完了 - 同期準備OK', 'connected');
            
            // ボタン状態更新
            document.getElementById('btn-connect-drive').textContent = '✅ 接続済み';
            document.getElementById('btn-connect-drive').disabled = true;
            document.getElementById('btn-sync-now').disabled = false;
            document.getElementById('sync-mode').textContent = 'クラウド同期モード';
            
            // 初回同期実行
            setTimeout(() => this.syncNow(), 1000);
            
            console.log('✅ Google Drive接続完了');
            
        } catch (error) {
            console.error('❌ Google Drive接続エラー:', error);
            this.updateSyncStatus(`接続失敗: ${error.message}`, 'error');
        }
    },
    
    // 今すぐ同期
    syncNow: async function() {
        if (!this.isEnabled || !window.GoogleDriveDataManager?.isReady) {
            console.warn('⚠️ Google Drive同期が利用できません');
            return;
        }
        
        try {
            console.log('🔄 データ同期開始...');
            this.updateSyncStatus('同期中...', 'syncing');
            
            // LocalStorage → GoogleドライブCSV同期
            const customers = await window.GoogleDriveDataManager.syncWithLocalStorage();
            
            // 同期完了
            this.lastSyncTime = new Date();
            this.updateSyncStatus(`同期完了: ${customers.length}件の顧客データ`, 'connected');
            this.updateLastSyncTime();
            
            // 顧客リスト再読み込み（既存システムとの連携）
            this.refreshCustomerList();
            
            console.log(`✅ データ同期完了: ${customers.length}件`);
            
        } catch (error) {
            console.error('❌ データ同期エラー:', error);
            this.updateSyncStatus(`同期失敗: ${error.message}`, 'error');
        }
    },
    
    // 顧客リスト再読み込み
    refreshCustomerList: function() {
        try {
            // 複数の既存システムとの互換性
            if (window.customerManager && typeof window.customerManager.loadCustomers === 'function') {
                window.customerManager.loadCustomers();
            } else if (typeof refreshCustomers === 'function') {
                refreshCustomers();
            } else if (typeof loadCustomerData === 'function') {
                loadCustomerData();
            }
        } catch (error) {
            console.warn('⚠️ 顧客リスト再読み込み警告:', error);
        }
    },
    
    // 自動同期切り替え
    toggleAutoSync: function(enabled) {
        this.autoSyncEnabled = enabled;
        console.log(`🔄 自動同期: ${enabled ? '有効' : '無効'}`);
    },
    
    // データ変更時の自動同期（既存システムから呼び出される）
    onDataChanged: async function() {
        if (this.isEnabled && this.autoSyncEnabled) {
            console.log('📡 データ変更検出 - 自動同期開始...');
            setTimeout(() => this.syncNow(), 500); // 少し遅らせて実行
        }
    },
    
    // バックアップダウンロード
    downloadBackup: function() {
        try {
            console.log('💾 バックアップダウンロード開始...');
            
            const customers = JSON.parse(localStorage.getItem('rentpipe_customers') || '[]');
            if (customers.length === 0) {
                alert('バックアップするデータがありません');
                return;
            }
            
            // CSV形式でダウンロード
            const csvContent = this.convertToCSV(customers);
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `rentpipe_backup_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            console.log('✅ バックアップダウンロード完了');
            
        } catch (error) {
            console.error('❌ バックアップダウンロードエラー:', error);
            alert('バックアップダウンロードに失敗しました');
        }
    },
    
    // CSV変換
    convertToCSV: function(customers) {
        const headers = ['ID', '名前', 'メール', '電話', 'ステータス', '作成日', '更新日'];
        const csvRows = [headers.join(',')];
        
        customers.forEach(customer => {
            const row = [
                customer.id || '',
                `"${(customer.name || '').replace(/"/g, '""')}"`,
                customer.email || '',
                customer.phone || '',
                customer.pipelineStatus || customer.status || '',
                customer.createdAt || '',
                customer.updatedAt || ''
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    },
    
    // 同期ステータス更新
    updateSyncStatus: function(message, status) {
        const statusElement = document.getElementById('sync-status-text');
        const statusContainer = document.getElementById('sync-status');
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (statusContainer) {
            statusContainer.className = `sync-status-${status}`;
        }
    },
    
    // 最終同期時刻更新
    updateLastSyncTime: function() {
        const lastSyncElement = document.getElementById('last-sync-time');
        if (lastSyncElement && this.lastSyncTime) {
            lastSyncElement.textContent = `最終同期: ${this.lastSyncTime.toLocaleString()}`;
        }
    },
    
    // クラウド同期UI表示制御
    showCloudSyncUI: function(show) {
        const statusDiv = document.getElementById('google-forms-status');
        if (statusDiv) {
            if (show) {
                this.setupCloudSyncUI();
            } else {
                statusDiv.innerHTML = `
                    <div style="padding: 15px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px;">
                        <h3>☁️ Google Drive 同期</h3>
                        <p style="margin: 0; color: #666;">オフラインモード - Google Drive同期は利用できません</p>
                    </div>
                `;
            }
        }
    },
    
    // CSSスタイル追加
    addSyncStyles: function() {
        if (document.getElementById('sync-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'sync-styles';
        style.textContent = `
            .sync-status-disconnected {
                padding: 15px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
            }
            
            .sync-status-connecting {
                padding: 15px;
                background: #cce5ff;
                border: 1px solid #66b3ff;
                border-radius: 6px;
            }
            
            .sync-status-connected {
                padding: 15px;
                background: #d1fae5;
                border: 1px solid #10b981;
                border-radius: 6px;
            }
            
            .sync-status-syncing {
                padding: 15px;
                background: #e0e7ff;
                border: 1px solid #8b5cf6;
                border-radius: 6px;
            }
            
            .sync-status-error {
                padding: 15px;
                background: #fee2e2;
                border: 1px solid #f87171;
                border-radius: 6px;
            }
            
            #sync-controls button {
                margin-right: 8px;
                margin-bottom: 8px;
            }
            
            @media (max-width: 768px) {
                #sync-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                #sync-controls button {
                    margin: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// 既存システムとの統合 - データ変更検出
// LocalStorageの変更を監視
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    // 顧客データの変更を検出
    if (key === 'rentpipe_customers' && window.CustomerGoogleDriveIntegration) {
        window.CustomerGoogleDriveIntegration.onDataChanged();
    }
};

console.log('✅ 顧客管理システム × Google Drive統合準備完了');
