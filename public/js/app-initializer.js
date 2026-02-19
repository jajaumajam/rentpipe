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
            // 1. 認証状態を確認
            const authResult = await this.checkAuthentication();
            
            if (!authResult.isAuthenticated) {
                console.log('⚠️ 未認証: ログインページにリダイレクト');
                if (options.requireAuth !== false) {
                    window.location.href = 'login.html';
                    // throw ではなく return — リダイレクト後に throw しても無意味かつコンソールにエラーが残る
                    return { success: false, error: '認証が必要です' };
                }
                return { success: false, error: '認証が必要です' };
            }

            console.log('✅ 認証確認完了');

            // 2. Google APIs を初期化
            await this.initializeGoogleAPIs();
            console.log('✅ Google APIs 初期化完了');

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
     * Google APIs を初期化
     */
    initializeGoogleAPIs: async function() {
        const authState = window.IntegratedAuthManager.getAuthState();
        const accessToken = authState?.googleAuth?.accessToken;

        // Google Drive API を初期化（トークンがなくても gapi.client をロード）
        if (window.GoogleDriveAPIv2) {
            if (!window.GoogleDriveAPIv2.isInitialized) {
                console.log('⏳ Google Drive API 初期化中...');
                await window.GoogleDriveAPIv2.initialize();
            }

            if (accessToken) {
                if (!window.GoogleDriveAPIv2.isAuthenticated) {
                    console.log('🔑 Google Drive API にトークンを設定中...');
                    window.GoogleDriveAPIv2.accessToken = accessToken;
                    window.GoogleDriveAPIv2.isAuthenticated = true;
                }
            } else {
                console.warn('⚠️ アクセストークンがありません - API初期化のみ実行');
            }

            console.log('✅ Google Drive API 準備完了');
        }

        // gapi.client にトークンを設定（Calendar API等で使用）
        // ※ GoogleDriveAPIv2の初期化後に実行（discovery docsが読み込まれた後）
        if (accessToken && window.gapi?.client) {
            window.gapi.client.setToken({
                access_token: accessToken
            });
            console.log('✅ gapi.client にトークン設定完了');
        }

        // Google Sheets API を初期化
        if (window.GoogleSheetsAPI) {
            if (!window.GoogleSheetsAPI.isInitialized) {
                console.log('⏳ Google Sheets API 初期化中...');
                const result = await window.GoogleSheetsAPI.initialize();

                if (!result) {
                    throw new Error('Google Sheets API の初期化に失敗しました');
                }
            }

            if (accessToken) {
                if (!window.GoogleSheetsAPI.isAuthenticated) {
                    console.log('🔑 Google Sheets API にトークンを設定中...');
                    await window.GoogleSheetsAPI.setAccessToken(accessToken);
                }
            } else {
                console.warn('⚠️ アクセストークンがありません - Sheets API認証をスキップ');
            }

            console.log('✅ Google Sheets API 準備完了');
        }
    },

    /**
     * 認証状態を確認
     */
    checkAuthentication: async function() {
        if (!window.IntegratedAuthManager) {
            return { isAuthenticated: false, error: 'AuthManager not available' };
        }

        try {
            const isAuthenticated = await window.IntegratedAuthManager.checkAuthStatus();

            if (isAuthenticated) {
                const userEmail = window.IntegratedAuthManager.getUserEmail();
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
            const result = await window.UnifiedSheetsManager.initSpreadsheet();
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
            const result = await window.UnifiedDataManager.syncFromSheetsImmediately();
            
            if (result.success) {
                console.log(`📥 ${result.customers?.length || 0}件のデータを同期しました`);
                
                // 🆕 データ更新イベントを発火
                window.dispatchEvent(new CustomEvent('rentpipe-data-updated', {
                    detail: { source: 'initial-sync', count: result.customers?.length || 0 }
                }));
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
            const email = window.IntegratedAuthManager.getUserEmail();
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
                window.IntegratedAuthManager.isAuthenticated() : false
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
            }, 2000);
        }
    }
});

console.log('✅ AppInitializer loaded');
