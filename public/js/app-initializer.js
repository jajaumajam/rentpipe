/**
 * RentPipe アプリケーション初期化マネージャー
 * 認証とデータ同期を統合管理
 */

const AppInitializer = {
    isInitialized: false,
    initializationPromise: null,

    /**
     * アプリケーションを初期化
     */
    initialize: async function(options = {}) {
        // 既に初期化中または完了している場合は、そのPromiseを返す
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        console.log('🚀 RentPipe アプリケーション初期化開始...');

        this.initializationPromise = this._doInitialize(options);
        return this.initializationPromise;
    },

    /**
     * 実際の初期化処理
     */
    _doInitialize: async function(options = {}) {
        try {
            // 1. Google API の読み込みを待機
            await this.waitForGoogleAPI();
            console.log('✅ Google API 準備完了');

            // 2. 認証状態を確認
            const authResult = await this.checkAuthentication();
            
            if (!authResult.isAuthenticated) {
                console.log('⚠️ 未認証: ログインページにリダイレクト');
                if (options.requireAuth !== false) {
                    window.location.href = 'login.html';
                    throw new Error('認証が必要です');
                }
                return { success: false, error: '認証が必要です' };
            }

            console.log('✅ 認証確認完了');

            // 3. Google Sheets を初期化
            const sheetsResult = await this.initializeSheets();
            if (!sheetsResult.success) {
                console.warn('⚠️ Google Sheets 初期化に失敗:', sheetsResult.error);
            } else {
                console.log('✅ Google Sheets 初期化完了');
            }

            // 4. データを同期
            const syncResult = await this.syncData();
            if (!syncResult.success) {
                console.warn('⚠️ データ同期に失敗:', syncResult.error);
            } else {
                console.log('✅ データ同期完了');
            }

            this.isInitialized = true;
            console.log('🎉 RentPipe アプリケーション初期化完了!');

            return { 
                success: true, 
                user: authResult.user,
                syncStatus: syncResult
            };

        } catch (error) {
            console.error('❌ RentPipe アプリケーション初期化エラー:', error);
            this.initializationPromise = null;
            throw error;
        }
    },

    /**
     * Google API の読み込みを待機（延長版）
     */
    waitForGoogleAPI: function() {
        return new Promise((resolve, reject) => {
            // Google Sheets API が既に初期化されているかチェック
            if (window.GoogleSheetsAPI && window.GoogleSheetsAPI.isInitialized) {
                console.log('✅ Google Sheets API は既に初期化済み');
                resolve();
                return;
            }

            let attempts = 0;
            const maxAttempts = 100; // 50秒に延長（500ms × 100）

            const checkAPI = () => {
                attempts++;

                // Google Sheets API の初期化完了をチェック
                if (window.GoogleSheetsAPI && window.GoogleSheetsAPI.isInitialized) {
                    console.log('✅ Google Sheets API 初期化確認（試行回数: ' + attempts + '）');
                    resolve();
                    return;
                }

                // 基本的な gapi チェック
                if (typeof gapi !== 'undefined' && gapi.client && gapi.client.sheets) {
                    console.log('✅ gapi.client.sheets 確認（試行回数: ' + attempts + '）');
                    resolve();
                    return;
                }

                if (attempts >= maxAttempts) {
                    reject(new Error('Google API の読み込みがタイムアウトしました（50秒経過）'));
                } else {
                    setTimeout(checkAPI, 500);
                }
            };

            checkAPI();
        });
    },

    /**
     * 認証状態を確認
     */
    checkAuthentication: async function() {
        if (!window.IntegratedAuthManager) {
            return { isAuthenticated: false, error: 'AuthManager not available' };
        }

        try {
            const isAuthenticated = await IntegratedAuthManager.checkAuthStatus();
            
            if (isAuthenticated) {
                const userEmail = IntegratedAuthManager.getUserEmail();
                return { 
                    isAuthenticated: true, 
                    user: { email: userEmail }
                };
            } else {
                return { isAuthenticated: false };
            }
        } catch (error) {
            console.error('認証確認エラー:', error);
            return { isAuthenticated: false, error: error.message };
        }
    },

    /**
     * Google Sheets を初期化
     */
    initializeSheets: async function() {
        if (!window.UnifiedSheetsManager) {
            return { success: false, error: 'SheetsManager not available' };
        }

        try {
            const result = await UnifiedSheetsManager.initSpreadsheet();
            return result;
        } catch (error) {
            console.error('Sheets初期化エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * データを同期（Sheets → Local）
     */
    syncData: async function() {
        if (!window.UnifiedDataManager) {
            return { success: false, error: 'DataManager not available' };
        }

        try {
            // Google Sheets からデータを読み込み
            const result = await UnifiedDataManager.syncFromSheetsImmediately();
            
            if (result.success) {
                console.log(`📥 ${result.customers?.length || 0}件のデータを同期しました`);
            }
            
            return result;
        } catch (error) {
            console.error('データ同期エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ユーザー情報を表示
     */
    displayUserInfo: function() {
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement && window.IntegratedAuthManager) {
            const email = IntegratedAuthManager.getUserEmail();
            if (email) {
                userEmailElement.textContent = email;
            }
        }
    },

    /**
     * 初期化状態を取得
     */
    getInitializationStatus: function() {
        return {
            isInitialized: this.isInitialized,
            hasDataManager: typeof window.UnifiedDataManager !== 'undefined',
            hasSheetsManager: typeof window.UnifiedSheetsManager !== 'undefined',
            hasAuthManager: typeof window.IntegratedAuthManager !== 'undefined',
            isAuthenticated: window.IntegratedAuthManager ? 
                IntegratedAuthManager.isAuthenticated : false
        };
    }
};

// グローバルに公開
window.AppInitializer = AppInitializer;

// ページ読み込み時に自動初期化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 認証が必要なページかどうかを判定
        const requireAuth = !window.location.pathname.includes('login.html');
        
        const result = await AppInitializer.initialize({ requireAuth });
        
        if (result.success) {
            // ユーザー情報を表示
            AppInitializer.displayUserInfo();
            
            // 認証ステータス表示を更新
            if (typeof updateAuthStatusDisplay === 'function') {
                updateAuthStatusDisplay();
            }
        }
    } catch (error) {
        console.error('初期化エラー:', error);
        
        // login.html以外でエラーが発生した場合はログインページへ
        if (!window.location.pathname.includes('login.html')) {
            console.log('ログインページにリダイレクトします...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000); // 2秒に延長してエラーログを確認できるように
        }
    }
});

console.log('✅ AppInitializer loaded');
