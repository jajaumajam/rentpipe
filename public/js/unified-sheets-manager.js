// 🔄 統合データ管理システム（競合解決版 + Google Sheets優先）
console.log('🔄 統合データ管理システム初期化中（競合解決版）...');

window.UnifiedSheetsManager = {
    // 状態管理
    isEnabled: false,
    spreadsheetId: null,
    lastSyncTime: null,
    syncInterval: null,
    isSyncing: false,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 統合データ管理システム初期化開始...');
            
            // LocalStorageからデータ確認
            const localData = localStorage.getItem('rentpipe_demo_customers');
            if (localData) {
                const customers = JSON.parse(localData);
                console.log('✅ LocalStorageデータ確認完了:', customers.length, '件');
            }
            
            // Google Sheets API初期化チェック
            console.log('📊 Google Sheets API初期化チェック...');
            if (window.GoogleSheetsAPI) {
                if (!window.GoogleSheetsAPI.isInitialized) {
                    console.log('⏳ Google Sheets API初期化待機中...');
                    // 既に初期化プロセスが進行中の可能性があるため待機
                    let retries = 0;
                    while (!window.GoogleSheetsAPI.isInitialized && retries < 20) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries++;
                    }
                    
                    if (!window.GoogleSheetsAPI.isInitialized) {
                        console.log('🔧 Google Sheets API強制初期化実行中...');
                        await window.GoogleSheetsAPI.initialize();
                        console.log('✅ Google Sheets API強制初期化完了');
                    }
                }
                
                // 統合確認
                console.log('🔍 統合確認:', {
                    sheetsAPI: !!window.GoogleSheetsAPI,
                    sheetsInitialized: window.GoogleSheetsAPI?.isInitialized,
                    sheetsAuthenticated: window.GoogleSheetsAPI?.isAuthenticated,
                    driveAPI: !!window.GoogleDriveAPIv2,
                    unifiedDataManager: !!window.UnifiedDataManager
                });
                
                // スプレッドシートIDの確認
                const savedId = window.GoogleSheetsAPI.loadSpreadsheetId();
                if (savedId) {
                    console.log('📂 保存済みスプレッドシートID:', savedId);
                    this.spreadsheetId = savedId;
                } else {
                    console.log('ℹ️ Google Sheets未設定または未認証 - LocalStorageモード');
                }
            } else {
                console.log('⚠️ Google Sheets API利用不可 - LocalStorageモードで動作');
            }
            
            console.log('✅ 統合データ管理システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 統合データ管理システム初期化エラー:', error);
            return false;
        }
    },
    
    // 🆕 Google Sheets統合有効化（初回同期でGoogle Sheets優先）
    enableSheetsIntegration: async function(spreadsheetId) {
        try {
            console.log('📊 === Google Sheets統合有効化開始 ===');
            console.log('   スプレッドシートID:', spreadsheetId);
            
            if (!window.GoogleSheetsAPI) {
                throw new Error('Google Sheets APIが利用できません');
            }
            
            if (!window.GoogleSheetsAPI.isInitialized) {
                throw new Error('Google Sheets APIが初期化されていません');
            }
            
            if (!window.GoogleSheetsAPI.isAuthenticated) {
                throw new Error('Google Sheets認証が完了していません');
            }
            
            // スプレッドシートIDを設定
            window.GoogleSheetsAPI.spreadsheetId = spreadsheetId;
            window.GoogleSheetsAPI.saveSpreadsheetId(spreadsheetId);
            this.spreadsheetId = spreadsheetId;
            
            console.log('✅ スプレッドシートID設定完了');
            
            // 🆕 CRITICAL: 初回同期 - Google Sheetsを優先
            console.log('🔄 初回同期開始（Google Sheets優先モード）...');
            await this.initialSyncFromGoogleSheets();
            
            this.isEnabled = true;
            
            // 自動同期開始（5分ごと）
            this.startAutoSync();
            
            console.log('✅ Google Sheets統合有効化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets統合有効化エラー:', error);
            throw error;
        }
    },
    
    // 🆕 初回同期：Google Sheetsからデータを読み込んでLocalStorageを上書き
    initialSyncFromGoogleSheets: async function() {
        try {
            console.log('📥 === Google Sheetsからデータ読み込み開始 ===');
            
            // Google Sheetsからデータ読み込み
            const sheetsData = await window.GoogleSheetsAPI.readData();
            console.log('📊 Google Sheetsデータ:', sheetsData.length, '件');
            
            // LocalStorageのデータ確認
            const localData = window.UnifiedDataManager?.getCustomers() || [];
            console.log('📱 LocalStorageデータ:', localData.length, '件');
            
            if (sheetsData.length > 0) {
                // 🆕 Google Sheetsにデータがある場合：LocalStorageを完全上書き
                console.log('✅ Google Sheetsのデータを優先してLocalStorageを上書きします');
                
                // データをパース（preferencesがJSON文字列の場合）
                const parsedData = sheetsData.map(customer => {
                    if (typeof customer.preferences === 'string') {
                        try {
                            customer.preferences = JSON.parse(customer.preferences);
                        } catch (e) {
                            customer.preferences = {};
                        }
                    }
                    return customer;
                });
                
                // LocalStorageを完全上書き
                localStorage.setItem('rentpipe_demo_customers', JSON.stringify(parsedData));
                console.log('💾 LocalStorageを上書き完了:', parsedData.length, '件');
                
                this.lastSyncTime = new Date();
                
            } else if (localData.length > 0) {
                // Google Sheetsが空でLocalStorageにデータがある場合：LocalStorage → Google Sheets
                console.log('📤 LocalStorageのデータをGoogle Sheetsに書き込みます');
                await window.GoogleSheetsAPI.writeData(localData);
                console.log('✅ Google Sheetsへの書き込み完了');
                
                this.lastSyncTime = new Date();
                
            } else {
                // 両方空の場合
                console.log('ℹ️ 両方のストレージが空です');
            }
            
            console.log('📥 === 初回同期完了 ===');
            
        } catch (error) {
            console.error('❌ 初回同期エラー:', error);
            // エラーでも処理は継続（LocalStorageで動作可能）
        }
    },
    
    // タイムスタンプベースの競合解決付き同期（定期同期用）
    syncWithConflictResolution: async function() {
        if (this.isSyncing) {
            console.log('⏳ 同期処理実行中のためスキップ');
            return;
        }
        
        try {
            this.isSyncing = true;
            console.log('🔀 === 競合解決付き同期開始 ===');
            
            if (!this.isEnabled || !this.spreadsheetId) {
                console.log('ℹ️ Google Sheets統合が無効です');
                return;
            }
            
            // LocalStorageとGoogle Sheetsの両方からデータ取得
            const localCustomers = window.UnifiedDataManager?.getCustomers() || [];
            const sheetsCustomers = await window.GoogleSheetsAPI.readData();
            
            console.log('🔀 タイムスタンプによるマージ開始...');
            console.log('📱 LocalStorage:', localCustomers.length, '件');
            console.log('📊 Google Sheets:', sheetsCustomers.length, '件');
            
            // データをパース
            const parsedSheetsData = sheetsCustomers.map(customer => {
                if (typeof customer.preferences === 'string') {
                    try {
                        customer.preferences = JSON.parse(customer.preferences);
                    } catch (e) {
                        customer.preferences = {};
                    }
                }
                return customer;
            });
            
            // IDでマッピング
            const localMap = new Map(localCustomers.map(c => [c.id, c]));
            const sheetsMap = new Map(parsedSheetsData.map(c => [c.id, c]));
            
            // すべてのIDを取得
            const allIds = new Set([...localMap.keys(), ...sheetsMap.keys()]);
            
            const mergedCustomers = [];
            
            // タイムスタンプベースでマージ
            for (const id of allIds) {
                const localCustomer = localMap.get(id);
                const sheetsCustomer = sheetsMap.get(id);
                
                if (!localCustomer && sheetsCustomer) {
                    // Google Sheetsのみに存在 → 追加
                    mergedCustomers.push(sheetsCustomer);
                } else if (localCustomer && !sheetsCustomer) {
                    // LocalStorageのみに存在 → 追加
                    mergedCustomers.push(localCustomer);
                } else if (localCustomer && sheetsCustomer) {
                    // 両方に存在 → タイムスタンプで比較
                    const localTime = new Date(localCustomer.updatedAt || localCustomer.createdAt).getTime();
                    const sheetsTime = new Date(sheetsCustomer.updatedAt || sheetsCustomer.createdAt).getTime();
                    
                    if (localTime > sheetsTime) {
                        mergedCustomers.push(localCustomer);
                    } else {
                        mergedCustomers.push(sheetsCustomer);
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
