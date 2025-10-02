// 🔄 統合データ管理システム（LocalStorage + Google Sheets）（競合解決版）
console.log('🔄 統合データ管理システム初期化中（競合解決版）...');

window.UnifiedSheetsManager = {
    // 設定
    config: {
        autoSyncInterval: 300000, // 5分ごとに自動同期
        localStorageKey: 'rentpipe_customers'
    },
    
    // 状態
    isInitialized: false,
    isSheetsEnabled: false,
    autoSyncTimer: null,
    lastSyncTime: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 統合データ管理システム初期化開始...');
            
            // LocalStorageの確認
            this.ensureLocalStorage();
            
            // Google Sheets API の初期化チェック
            console.log('📊 Google Sheets API初期化チェック...');
            
            if (!window.GoogleSheetsAPI) {
                console.log('⚠️ GoogleSheetsAPIスクリプトが読み込まれていません');
                console.log('ℹ️ LocalStorageモードで継続');
                this.isInitialized = true;
                return true;
            }
            
            // Google Sheets APIが未初期化の場合は強制初期化
            if (!window.GoogleSheetsAPI.isInitialized) {
                console.log('🔧 Google Sheets API強制初期化実行中...');
                
                const sheetsInitialized = await window.GoogleSheetsAPI.initialize();
                
                if (!sheetsInitialized) {
                    console.log('⚠️ Google Sheets API初期化失敗 - LocalStorageモードで継続');
                    this.isInitialized = true;
                    return true;
                }
                
                console.log('✅ Google Sheets API強制初期化完了');
            } else {
                console.log('✅ Google Sheets API 既に初期化済み');
            }
            
            // 保存されたスプレッドシートIDと認証状態を確認
            const spreadsheetId = window.GoogleSheetsAPI.loadSpreadsheetId();
            const hasValidAuth = this.checkAuthenticationState();
            
            console.log('🔍 統合確認:', {
                'spreadsheetId': spreadsheetId,
                'hasValidAuth': hasValidAuth,
                'isAuthenticated': window.GoogleSheetsAPI.isAuthenticated
            });
            
            if (spreadsheetId && hasValidAuth) {
                this.isSheetsEnabled = true;
                console.log('✅ Google Sheets統合モード有効');
                
                // 初回同期（競合解決版）
                try {
                    await this.syncWithConflictResolution();
                } catch (syncError) {
                    console.warn('⚠️ 初回同期に失敗しましたが、統合モードを継続:', syncError.message);
                }
                
                // 自動同期開始
                this.startAutoSync();
            } else {
                console.log('ℹ️ Google Sheets未設定または未認証 - LocalStorageモード');
            }
            
            this.isInitialized = true;
            console.log('✅ 統合データ管理システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 統合データ管理システム初期化エラー:', error);
            console.log('ℹ️ エラー発生によりLocalStorageモードで継続');
            this.isInitialized = true;
            return true;
        }
    },
    
    // LocalStorage確認
    ensureLocalStorage: function() {
        const data = localStorage.getItem(this.config.localStorageKey);
        if (!data || data === '[]') {
            console.log('ℹ️ LocalStorageが空です');
        } else {
            console.log('✅ LocalStorageデータ確認完了');
        }
    },
    
    // 認証状態チェック
    checkAuthenticationState: function() {
        if (window.IntegratedAuthManagerV2) {
            const authState = window.IntegratedAuthManagerV2.getAuthState();
            return authState?.googleAuth?.isAuthenticated || false;
        }
        return false;
    },
    
    // 顧客データ取得（LocalStorageから）
    getCustomers: function() {
        try {
            const data = localStorage.getItem(this.config.localStorageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ 顧客データ取得エラー:', error);
            return [];
        }
    },
    
    // 顧客データ保存（LocalStorage + Google Sheets）
    saveCustomers: async function(customers) {
        try {
            // LocalStorageに即座に保存
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(customers));
            console.log('💾 LocalStorageに保存:', customers.length, '件');
            
            // Google Sheetsが有効な場合は同期
            if (this.isSheetsEnabled) {
                await this.syncToSheets(customers);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
            return false;
        }
    },
    
    // 🆕 タイムスタンプによるマージ（競合解決の中核）
    mergeByTimestamp: function(localCustomers, sheetsCustomers) {
        console.log('🔀 タイムスタンプによるマージ開始...');
        console.log('📱 LocalStorage:', localCustomers.length, '件');
        console.log('📊 Google Sheets:', sheetsCustomers.length, '件');
        
        // IDをキーにしたマップを作成
        const customerMap = new Map();
        
        // LocalStorageのデータを追加
        localCustomers.forEach(customer => {
            customerMap.set(customer.id, customer);
        });
        
        // Google Sheetsのデータをマージ（新しい方を優先）
        sheetsCustomers.forEach(sheetsCustomer => {
            const localCustomer = customerMap.get(sheetsCustomer.id);
            
            if (!localCustomer) {
                // Google Sheetsにのみ存在 → 追加
                customerMap.set(sheetsCustomer.id, sheetsCustomer);
                console.log('➕ Google Sheetsから追加:', sheetsCustomer.name);
            } else {
                // 両方に存在 → updatedAtを比較
                const localTime = new Date(localCustomer.updatedAt || localCustomer.createdAt || 0);
                const sheetsTime = new Date(sheetsCustomer.updatedAt || sheetsCustomer.createdAt || 0);
                
                if (sheetsTime > localTime) {
                    // Google Sheetsの方が新しい → 置き換え
                    customerMap.set(sheetsCustomer.id, sheetsCustomer);
                    console.log('🔄 Google Sheetsの方が新しい:', sheetsCustomer.name);
                } else {
                    // LocalStorageの方が新しいか同じ → そのまま
                    console.log('✅ LocalStorageを保持:', localCustomer.name);
                }
            }
        });
        
        // Map → 配列に変換
        const mergedCustomers = Array.from(customerMap.values());
        console.log('✅ マージ完了:', mergedCustomers.length, '件');
        
        return mergedCustomers;
    },
    
    // 🆕 競合解決付き同期
    syncWithConflictResolution: async function() {
        try {
            if (!this.isSheetsEnabled) {
                console.log('ℹ️ Google Sheets統合が無効です');
                return false;
            }
            
            console.log('🔄 競合解決付き同期開始...');
            
            // LocalStorageとGoogle Sheetsの両方からデータ取得
            const localCustomers = this.getCustomers();
            const sheetsCustomers = await window.GoogleSheetsAPI.readData();
            
            // タイムスタンプでマージ
            const mergedCustomers = this.mergeByTimestamp(
                localCustomers, 
                sheetsCustomers || []
            );
            
            // 両方に保存（同期）
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(mergedCustomers));
            await window.GoogleSheetsAPI.writeData(mergedCustomers);
            
            this.lastSyncTime = new Date();
            console.log('✅ 競合解決付き同期完了:', mergedCustomers.length, '件');
            
            return true;
            
        } catch (error) {
            console.error('❌ 競合解決付き同期エラー:', error);
            return false;
        }
    },
    
    // Google Sheets → LocalStorage 同期
    syncFromSheets: async function() {
        try {
            if (!this.isSheetsEnabled) {
                console.log('ℹ️ Google Sheets統合が無効です');
                return false;
            }
            
            console.log('🔄 Google Sheets → LocalStorage 同期開始...');
            
            const customers = await window.GoogleSheetsAPI.readData();
            
            if (customers && customers.length > 0) {
                localStorage.setItem(this.config.localStorageKey, JSON.stringify(customers));
                console.log('✅ 同期完了:', customers.length, '件');
                this.lastSyncTime = new Date();
                return true;
            } else {
                console.log('ℹ️ Google Sheetsにデータがありません');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Google Sheets同期エラー:', error);
            return false;
        }
    },
    
    // LocalStorage → Google Sheets 同期
    syncToSheets: async function(customers = null) {
        try {
            if (!this.isSheetsEnabled) {
                console.log('ℹ️ Google Sheets統合が無効です');
                return false;
            }
            
            console.log('🔄 LocalStorage → Google Sheets 同期開始...');
            
            const data = customers || this.getCustomers();
            
            await window.GoogleSheetsAPI.writeData(data);
            
            console.log('✅ Google Sheets同期完了:', data.length, '件');
            this.lastSyncTime = new Date();
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets同期エラー:', error);
            return false;
        }
    },
    
    // Google Sheets統合を有効化
    enableSheetsIntegration: async function(spreadsheetId) {
        try {
            console.log('🔧 Google Sheets統合を有効化中...');
            
            // Google Sheets APIの初期化確認
            if (!window.GoogleSheetsAPI?.isInitialized) {
                console.log('🔧 Google Sheets API再初期化中...');
                const initialized = await window.GoogleSheetsAPI.initialize();
                if (!initialized) {
                    throw new Error('Google Sheets API初期化に失敗しました');
                }
            }
            
            // 認証状態確認と設定
            const authState = window.IntegratedAuthManagerV2?.getAuthState();
            if (authState?.googleAuth?.accessToken) {
                console.log('🔑 アクセストークン設定中...');
                const tokenSet = await window.GoogleSheetsAPI.setAccessToken(authState.googleAuth.accessToken);
                if (!tokenSet) {
                    throw new Error('アクセストークン設定に失敗しました');
                }
            } else {
                throw new Error('有効な認証情報がありません');
            }
            
            // スプレッドシートIDを保存
            if (spreadsheetId) {
                window.GoogleSheetsAPI.saveSpreadsheetId(spreadsheetId);
                window.GoogleSheetsAPI.spreadsheetId = spreadsheetId;
            }
            
            this.isSheetsEnabled = true;
            
            // 競合解決付き初回同期
            console.log('📤 競合解決付き初回同期中...');
            await this.syncWithConflictResolution();
            
            // 自動同期開始
            this.startAutoSync();
            
            console.log('✅ Google Sheets統合有効化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets統合有効化エラー:', error);
            return false;
        }
    },
    
    // 自動同期開始（競合解決版を使用）
    startAutoSync: function() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }
        
        this.autoSyncTimer = setInterval(async () => {
            console.log('⏰ 自動同期実行中（競合解決版）...');
            await this.syncWithConflictResolution();
        }, this.config.autoSyncInterval);
        
        console.log('🔄 自動同期開始（5分ごと・競合解決版）');
    },
    
    // 自動同期停止
    stopAutoSync: function() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
            console.log('⏸️ 自動同期停止');
        }
    },
    
    // 統合状態取得
    getStatus: function() {
        return {
            isInitialized: this.isInitialized,
            isSheetsEnabled: this.isSheetsEnabled,
            lastSyncTime: this.lastSyncTime,
            customerCount: this.getCustomers().length,
            spreadsheetId: window.GoogleSheetsAPI?.spreadsheetId || null,
            authState: this.checkAuthenticationState(),
            conflictResolution: 'timestamp-based' // 🆕 競合解決方式
        };
    }
};

console.log('✅ 統合データ管理システム準備完了（競合解決版）');
