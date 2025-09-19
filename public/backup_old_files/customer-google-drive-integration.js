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
            
            // Google Drive API v2 と データ管理システムの準備確認
            if (!window.GoogleDriveAPIv2 || !window.GoogleDriveDataManager) {
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
        // Google Forms連携状況の代わりに、Google Drive同期UI を表示
        const statusDiv = document.getElementById('google-forms-status');
        if (!statusDiv) return;
        
        statusDiv.innerHTML = `
            <div id="google-drive-sync-panel">
                <h3>☁️ Google Drive 同期</h3>
                <div id="sync-status" class="sync-status-disconnected">
                    <span id="sync-status-text">未接続 - クラウド同期を開始してください</span>
                    <div id="sync-controls">
                        <button id="btn-connect-drive" onclick="CustomerGoogleDriveIntegration.connectToDrive()" class="btn btn-primary">
                            🔗 Google Drive接続
                        </button>
                        <button id="btn-sync-now" onclick="CustomerGoogleDriveIntegration.syncNow()" disabled class="btn btn-success">
                            🔄 今すぐ同期
                        </button>
                        <button id="btn-download-backup" onclick="CustomerGoogleDriveIntegration.downloadBackup()" class="btn btn-outline">
                            💾 バックアップDL
                        </button>
                    </div>
                    <div id="sync-info" style="margin-top: 10px; font-size: 14px; color: #666;">
                        <span id="last-sync-time">未同期</span> • 
                        <span id="sync-mode">オフラインモード</span>
                    </div>
                </div>
                
                <!-- 同期設定 -->
                <div id="sync-settings" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; display: none;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="auto-sync-checkbox" onchange="CustomerGoogleDriveIntegration.toggleAutoSync(this.checked)" checked>
                        自動同期を有効にする（データ変更時に自動でGoogle Driveに保存）
                    </label>
                </div>
            </div>
        `;
        
        this.showCloudSyncUI(true);
    },
    
    // クラウド同期UI表示切り替え
    showCloudSyncUI: function(show) {
        const statusDiv = document.getElementById('google-forms-status');
        if (!statusDiv) return;
        
        if (!show) {
            statusDiv.innerHTML = `
                <div style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
                    <h4 style="margin: 0 0 8px 0; color: #856404;">📱 オフラインモード</h4>
                    <p style="margin: 0; color: #856404;">
                        データはローカル（このブラウザ）にのみ保存されます。
                        Google Drive同期を利用するには、ページを再読み込みしてください。
                    </p>
                </div>
            `;
        }
    },
    
    // Google Drive接続
    connectToDrive: async function() {
        try {
            console.log('🔗 Google Drive接続開始...');
            this.updateSyncStatus('接続中...', 'connecting');
            
            // Google Drive API v2 初期化
            const apiInitialized = await window.GoogleDriveAPIv2.initialize();
            if (!apiInitialized) {
                throw new Error('Google Drive API初期化失敗');
            }
            
            // 認証実行
            const userInfo = await window.GoogleDriveAPIv2.authenticate();
            
            // データ管理システム初期化
            const dataManagerReady = await window.GoogleDriveDataManager.initialize();
            if (!dataManagerReady) {
                throw new Error('データ管理システム初期化失敗');
            }
            
            this.isEnabled = true;
            
            // UI更新
            this.updateSyncStatus(`接続完了: ${userInfo.email}`, 'connected');
            document.getElementById('btn-connect-drive').disabled = true;
            document.getElementById('btn-sync-now').disabled = false;
            document.getElementById('sync-settings').style.display = 'block';
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
        if (!this.isEnabled) return;
        
        try {
            console.log('🔄 データ同期開始...');
            this.updateSyncStatus('同期中...', 'syncing');
            
            // データ同期実行
            const customers = await window.GoogleDriveDataManager.syncWithLocalStorage();
            
            // 同期完了
            this.lastSyncTime = new Date();
            this.updateSyncStatus(`同期完了: ${customers.length}件`, 'connected');
            this.updateLastSyncTime();
            
            // 顧客リスト再読み込み（既存システムとの連携）
            if (window.customerManager && typeof window.customerManager.loadCustomers === 'function') {
                window.customerManager.loadCustomers();
            } else if (typeof refreshCustomers === 'function') {
                refreshCustomers();
            }
            
            console.log(`✅ データ同期完了: ${customers.length}件`);
            
        } catch (error) {
            console.error('❌ データ同期エラー:', error);
            this.updateSyncStatus(`同期失敗: ${error.message}`, 'error');
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
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
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
        
        return '\ufeff' + csvRows.join('\n'); // BOM付きUTF-8
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
            lastSyncElement.textContent = `最終同期: ${this.lastSyncTime.toLocaleTimeString()}`;
        }
    }
};

// CSS追加
const style = document.createElement('style');
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
