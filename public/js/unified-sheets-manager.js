// 統合データ管理システム（競合解決版 + Google Sheets優先）
window.UnifiedSheetsManager = {
    isEnabled: false,
    spreadsheetId: null,
    lastSyncTime: null,
    isSyncing: false,
    syncInterval: null,
    
    // 初期化
    initialize: async function() {
        console.log('🔧 統合データ管理システム初期化開始...');
        
        try {
            // LocalStorageのデータ確認
            const localData = localStorage.getItem('rentpipe_demo_customers');
            const customers = localData ? JSON.parse(localData) : [];
            console.log('✅ LocalStorageデータ確認完了:', customers.length, '件');
            
            // Google Sheets API初期化チェック
            console.log('📊 Google Sheets API初期化チェック...');
            
            if (!window.GoogleSheetsAPI?.isInitialized) {
                console.log('⏳ Google Sheets API初期化待機中...');
                
                // 最大5秒待機
                let attempts = 0;
                while (!window.GoogleSheetsAPI?.isInitialized && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                // それでも初期化されていない場合は強制初期化
                if (!window.GoogleSheetsAPI?.isInitialized) {
                    console.log('🔧 Google Sheets API強制初期化実行中...');
                    await window.GoogleSheetsAPI.initialize();
                    console.log('✅ Google Sheets API強制初期化完了');
                }
            }
            
            // 認証状態確認とトークン設定
            const authState = window.IntegratedAuthManagerV2?.getAuthState();
            console.log('🔐 認証状態確認:', authState);
            
            // ✅ 修正: googleAuth.accessToken を使用
            if (authState?.googleAuth?.isSignedIn && authState?.googleAuth?.accessToken) {
                console.log('✅ Google認証トークン確認完了');
                console.log('🔑 アクセストークン:', authState.googleAuth.accessToken.substring(0, 20) + '...');
                
                // Google Sheets APIにトークンを設定
                console.log('🔑 Google Sheets APIにアクセストークンを設定中...');
                if (window.gapi?.client) {
                    window.gapi.client.setToken({
                        access_token: authState.googleAuth.accessToken
                    });
                    console.log('✅ アクセストークン設定完了');
                } else {
                    console.warn('⚠️ gapi.clientが利用できません');
                }
            } else {
                console.warn('⚠️ Google認証トークンが見つかりません');
                console.log('📊 認証状態の詳細:', {
                    hasAuthState: !!authState,
                    hasGoogleAuth: !!authState?.googleAuth,
                    isSignedIn: authState?.googleAuth?.isSignedIn,
                    hasAccessToken: !!authState?.googleAuth?.accessToken
                });
            }
            
            // 統合確認
            const allSystemsReady = {
                sheetsAPI: !!window.GoogleSheetsAPI,
                sheetsInitialized: !!window.GoogleSheetsAPI?.isInitialized,
                sheetsAuthenticated: !!authState?.googleAuth?.isSignedIn,
                driveAPI: !!window.GoogleDriveAPIv2,
                unifiedDataManager: !!window.UnifiedDataManager
            };
            console.log('🔍 統合確認:', allSystemsReady);
            
            // ✅ 修正: LocalStorageから直接読み込み
            this.spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
            console.log('📂 保存済みスプレッドシートID:', this.spreadsheetId);
            
            // すべてのシステムが準備完了している場合のみ有効化
            if (allSystemsReady.sheetsAPI && 
                allSystemsReady.sheetsInitialized && 
                allSystemsReady.sheetsAuthenticated && 
                allSystemsReady.driveAPI && 
                allSystemsReady.unifiedDataManager &&
                this.spreadsheetId) {
                
                this.isEnabled = true;
                console.log('✅ Google Sheets統合有効化完了');
                
                // 自動同期開始
                this.startAutoSync();
            } else {
                console.log('ℹ️ LocalStorageモードで動作（一部システムが未準備）');
                console.log('📊 未準備の項目:', {
                    sheetsAPI: !allSystemsReady.sheetsAPI,
                    sheetsInitialized: !allSystemsReady.sheetsInitialized,
                    sheetsAuthenticated: !allSystemsReady.sheetsAuthenticated,
                    driveAPI: !allSystemsReady.driveAPI,
                    unifiedDataManager: !allSystemsReady.unifiedDataManager,
                    spreadsheetId: !this.spreadsheetId
                });
            }
            
            console.log('✅ 統合データ管理システム初期化完了');
            
        } catch (error) {
            console.error('❌ 統合データ管理システム初期化エラー:', error);
            this.isEnabled = false;
        }
    },
    
    // 競合解決付き同期
    syncWithConflictResolution: async function() {
        if (this.isSyncing) {
            console.log('⏳ 既に同期処理中...');
            return;
        }
        
        if (!this.isEnabled) {
            console.log('ℹ️ Google Sheets統合が無効です');
            return;
        }
        
        this.isSyncing = true;
        console.log('🔀 === 競合解決付き同期開始 ===');
        
        try {
            // LocalStorageから読み込み
            const localData = localStorage.getItem('rentpipe_demo_customers');
            const localCustomers = localData ? JSON.parse(localData) : [];
            console.log('📂 LocalStorageデータ:', localCustomers.length, '件');
            
            // Google Sheetsから読み込み
            const sheetsCustomers = await window.GoogleSheetsAPI.readData();
            console.log('☁️ Google Sheetsデータ:', sheetsCustomers.length, '件');
            
            // マージ処理（Google Sheets優先）
            const mergedCustomers = [];
            const processedIds = new Set();
            
            // 1. Google Sheetsのデータを優先的に追加
            for (const sheetsCustomer of sheetsCustomers) {
                mergedCustomers.push(sheetsCustomer);
                processedIds.add(sheetsCustomer.id);
            }
            
            // 2. LocalStorage独自のデータを追加（Google Sheetsに存在しない場合のみ）
            for (const localCustomer of localCustomers) {
                if (!processedIds.has(localCustomer.id)) {
                    // Google Sheetsに存在しない新規データ
                    const sheetsCustomer = sheetsCustomers.find(c => c.id === localCustomer.id);
                    if (!sheetsCustomer) {
                        mergedCustomers.push(localCustomer);
                    }
                }
            }
            
            console.log('✅ マージ完了:', mergedCustomers.length, '件');
            
            // LocalStorageを更新
            localStorage.setItem('rentpipe_demo_customers', JSON.stringify(mergedCustomers));
            
            // Google Sheetsに書き込み
            await window.GoogleSheetsAPI.writeData(mergedCustomers);
            
            this.lastSyncTime = new Date();
            console.log('🔀 === 競合解決付き同期完了 ===');
            
        } catch (error) {
            console.error('❌ 競合解決付き同期エラー:', error);
        } finally {
            this.isSyncing = false;
        }
    },
    
    // 自動同期開始
    startAutoSync: function() {
        console.log('🔄 自動同期開始（5分ごと・競合解決版）');
        
        // 既存のインターバルをクリア
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // 5分ごとに同期
        this.syncInterval = setInterval(async () => {
            console.log('⏰ 定期同期実行...');
            await this.syncWithConflictResolution();
        }, 5 * 60 * 1000); // 5分
    },
    
    // 自動同期停止
    stopAutoSync: function() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ 自動同期停止');
        }
    },
    
    // 手動同期
    manualSync: async function() {
        console.log('🔄 手動同期実行');
        await this.syncWithConflictResolution();
    },
    
    // ステータス取得
    getStatus: function() {
        return {
            isEnabled: this.isEnabled,
            spreadsheetId: this.spreadsheetId,
            lastSyncTime: this.lastSyncTime,
            isSyncing: this.isSyncing
        };
    }
};

console.log('✅ 統合データ管理システム準備完了（競合解決版 + Google Sheets優先）');
