// 🔄 統合データ管理システム（LocalStorage + Google Sheets）（強化版）
console.log('🔄 統合データ管理システム初期化中...');

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
    
    // 初期化（強化版）
    initialize: async function() {
        try {
            console.log('🔧 統合データ管理システム初期化開始...');
            
            // LocalStorageの確認
            this.ensureLocalStorage();
            
            // Google Sheets API の強制初期化
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
                
                // 初回同期（Google Sheets → LocalStorage）
                try {
                    await this.syncFromSheets();
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
            return true; // エラーでも継続
        }
    },
    
    // 認証状態確認
    checkAuthenticationState: function() {
        try {
            // IntegratedAuthManagerV2から認証状態を確認
            if (window.IntegratedAuthManagerV2) {
                const authState = window.IntegratedAuthManagerV2.getAuthState();
                return authState?.googleAuth?.isSignedIn && 
                       authState?.googleAuth?.accessToken;
            }
            
            // フォールバック: LocalStorageから直接確認
            const googleAuthData = localStorage.getItem('google_auth_data');
            if (googleAuthData) {
                const authData = JSON.parse(googleAuthData);
                return authData.isSignedIn && 
                       authData.accessToken && 
                       authData.tokenExpiry > Date.now();
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 認証状態確認エラー:', error);
            return false;
        }
    },
    
    // LocalStorageの確保
    ensureLocalStorage: function() {
        const data = localStorage.getItem(this.config.localStorageKey);
        if (!data) {
            localStorage.setItem(this.config.localStorageKey, JSON.stringify([]));
            console.log('📦 LocalStorage初期化完了');
        }
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
    
    // Google Sheets統合を有効化（強化版）
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
            
            // LocalStorageのデータをGoogle Sheetsに同期
            const localCustomers = this.getCustomers();
            if (localCustomers.length > 0) {
                console.log('📤 既存データをGoogle Sheetsに同期中...');
                await this.syncToSheets(localCustomers);
            }
            
            // 自動同期開始
            this.startAutoSync();
            
            console.log('✅ Google Sheets統合有効化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets統合有効化エラー:', error);
            return false;
        }
    },
    
    // 自動同期開始
    startAutoSync: function() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }
        
        this.autoSyncTimer = setInterval(async () => {
            console.log('⏰ 自動同期実行中...');
            await this.syncToSheets();
        }, this.config.autoSyncInterval);
        
        console.log('🔄 自動同期開始（5分ごと）');
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
            authState: this.checkAuthenticationState()
        };
    }
};

console.log('✅ 統合データ管理システム準備完了');
