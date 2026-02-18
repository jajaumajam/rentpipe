// 🔐 統合認証マネージャー v2（修正版）
console.log('🔐 統合認証マネージャー v2 初期化中...');

window.IntegratedAuthManagerV2 = {
    // 認証状態
    authState: {
        isAuthenticated: false,
        rentpipeAuth: {
            isLoggedIn: false,
            user: null
        },
        googleAuth: {
            isSignedIn: false,
            user: null,
            accessToken: null,
            tokenExpiry: null
        }
    },
    
    // 初期化状態
    isInitialized: false,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 統合認証マネージャー初期化開始...');
            
            // 保存された認証情報を復元
            await this.restoreAuthState();
            
            this.isInitialized = true;
            console.log('✅ 統合認証マネージャー初期化完了');
            
            return true;
            
        } catch (error) {
            console.error('❌ 統合認証マネージャー初期化エラー:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    // 認証状態復元
    restoreAuthState: async function() {
        try {
            console.log('🔄 認証状態復元中...');

            // LocalStorage から JSON をパースするユーティリティ（破損データ対策）
            const safeParse = (key) => {
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                try {
                    return JSON.parse(raw);
                } catch (e) {
                    console.warn(`⚠️ LocalStorage "${key}" のJSONが破損しています。削除します。`, e);
                    localStorage.removeItem(key);
                    return null;
                }
            };

            // RentPipe認証状態復元
            const authData = safeParse('rentpipe_auth');
            if (authData) {
                // ダミーフォールバックは使わない: user が存在する場合のみ復元
                if (authData.user && authData.user.email) {
                    this.authState.rentpipeAuth = {
                        isLoggedIn: true,
                        user: authData.user
                    };
                    this.authState.isAuthenticated = true;
                    console.log('✅ RentPipe認証状態復元完了:', authData.user.email);
                } else {
                    console.warn('⚠️ rentpipe_auth にユーザー情報がありません。ログアウト状態として扱います。');
                    localStorage.removeItem('rentpipe_auth');
                }
            }

            // 簡易認証状態も確認
            const simpleAuth = localStorage.getItem('rentpipe_auth_simple');
            if (simpleAuth === 'logged_in') {
                const userData = safeParse('rentpipe_user_info');
                if (userData && userData.email) {
                    this.authState.rentpipeAuth = {
                        isLoggedIn: true,
                        user: userData
                    };
                    this.authState.isAuthenticated = true;
                    console.log('✅ 簡易認証状態復元完了:', userData.email);
                }
            }

            // Google認証状態復元
            const googleAuthRaw = localStorage.getItem('google_auth_data');
            if (googleAuthRaw) {
                const googleAuthData = (() => {
                    try { return JSON.parse(googleAuthRaw); }
                    catch (e) {
                        console.warn('⚠️ google_auth_data のJSONが破損しています。削除します。', e);
                        localStorage.removeItem('google_auth_data');
                        return null;
                    }
                })();
                if (!googleAuthData) return;
                // 変数名を authData → googleAuthData に統一（以降の処理で使用）
                const authData = googleAuthData;

                // accessTokenがない場合は個別保存から取得（後方互換性）
                let accessToken = authData.accessToken;
                let tokenExpiry = authData.tokenExpiry;

                if (!accessToken) {
                    console.log('⚠️ google_auth_dataにaccessTokenがありません - 個別保存から復元を試みます');
                    accessToken = localStorage.getItem('google_access_token');
                    const expiryStr = localStorage.getItem('google_token_expiry');
                    tokenExpiry = expiryStr ? parseInt(expiryStr) : null;
                }

                // トークンの有効期限確認
                const isTokenValid = accessToken && tokenExpiry && new Date().getTime() < tokenExpiry;

                if (isTokenValid) {
                    this.authState.googleAuth = {
                        isSignedIn: true,
                        user: authData.user,
                        accessToken: accessToken,
                        tokenExpiry: tokenExpiry
                    };
                    console.log('✅ Google認証状態復元完了:', authData.user?.email);

                    // 古いデータを新しい形式で上書き保存
                    if (!authData.accessToken) {
                        console.log('🔄 古いデータを新形式に更新中...');
                        localStorage.setItem('google_auth_data', JSON.stringify({
                            isSignedIn: true,
                            user: authData.user,
                            accessToken: accessToken,
                            tokenExpiry: tokenExpiry
                        }));
                    }
                } else {
                    console.log('⚠️ Googleトークンが期限切れまたは存在しません');
                    this.clearGoogleAuth();
                }
            }
            
            console.log('🔍 復元後の認証状態:', this.authState);

        } catch (error) {
            // 予期しないエラー時は安全のため認証状態をリセット（不整合な半端な状態を残さない）
            console.error('❌ 認証状態復元エラー:', error);
            this.authState.isAuthenticated = false;
            this.authState.rentpipeAuth = { isLoggedIn: false, user: null };
            this.authState.googleAuth = { isSignedIn: false, user: null, accessToken: null, tokenExpiry: null };
        }
    },
    
    // Google認証情報保存
    saveGoogleAuth: function(accessToken, user, tokenExpiry) {
        try {
            this.authState.googleAuth = {
                isSignedIn: true,
                user: user,
                accessToken: accessToken,
                tokenExpiry: tokenExpiry
            };
            
            const authData = {
                isSignedIn: true,
                user: user,
                accessToken: accessToken,
                tokenExpiry: tokenExpiry
            };
            
            localStorage.setItem('google_auth_data', JSON.stringify(authData));
            
            // 個別トークン保存（互換性のため）
            localStorage.setItem('google_access_token', accessToken);
            localStorage.setItem('google_token_expiry', tokenExpiry.toString());
            
            console.log('💾 Google認証情報保存完了');
            
        } catch (error) {
            console.error('❌ Google認証情報保存エラー:', error);
        }
    },
    
    // Google認証状態更新
    updateGoogleAuth: async function(googleAuthInfo) {
        try {
            console.log('🔄 Google認証状態更新中...', googleAuthInfo.user?.email);
            
            this.authState.googleAuth = {
                isSignedIn: googleAuthInfo.isSignedIn,
                user: googleAuthInfo.user,
                accessToken: googleAuthInfo.accessToken,
                tokenExpiry: googleAuthInfo.tokenExpiry
            };
            
            // LocalStorageに保存
            const authData = {
                isSignedIn: googleAuthInfo.isSignedIn,
                user: googleAuthInfo.user,
                accessToken: googleAuthInfo.accessToken,
                tokenExpiry: googleAuthInfo.tokenExpiry
            };
            
            localStorage.setItem('google_auth_data', JSON.stringify(authData));
            
            // トークン情報も個別保存（Google Drive API V2との互換性）
            if (googleAuthInfo.accessToken) {
                localStorage.setItem('google_access_token', googleAuthInfo.accessToken);
                localStorage.setItem('google_token_expiry', googleAuthInfo.tokenExpiry.toString());
            }
            
            console.log('✅ Google認証状態更新完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google認証状態更新エラー:', error);
            return false;
        }
    },
    
    // Google認証情報クリア
    clearGoogleAuth: function() {
        this.authState.googleAuth = {
            isSignedIn: false,
            user: null,
            accessToken: null,
            tokenExpiry: null
        };
        
        localStorage.removeItem('google_auth_data');
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        console.log('🗑️ Google認証情報クリア完了');
    },
    
    // RentPipe認証情報クリア
    clearRentPipeAuth: function() {
        this.authState.rentpipeAuth = {
            isLoggedIn: false,
            user: null
        };
        this.authState.isAuthenticated = false;
        
        localStorage.removeItem('rentpipe_auth');
        localStorage.removeItem('rentpipe_auth_simple');
        localStorage.removeItem('rentpipe_user_info');
        console.log('🗑️ RentPipe認証情報クリア完了');
    },
    
    // 認証状態取得
    getAuthState: function() {
        return { ...this.authState };
    },
    
    // Google Forms使用可能性確認
    canUseGoogleForms: function() {
        return this.authState.googleAuth.isSignedIn && 
               this.authState.googleAuth.accessToken &&
               this.authState.googleAuth.tokenExpiry > new Date().getTime();
    },
    
    // 完全認証状態確認
    isFullyAuthenticated: function() {
        return this.authState.isAuthenticated && this.authState.googleAuth.isSignedIn;
    },
    
    // 完全ログアウト
    performFullLogout: function() {
        console.log('🚪 完全ログアウト実行中...');
        
        // 認証状態クリア
        this.clearGoogleAuth();
        this.clearRentPipeAuth();
        
        console.log('✅ 完全ログアウト完了');
        
        // ログインページにリダイレクト
        window.location.href = 'login.html';
    },
    
    // デバッグ情報取得
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            authState: this.authState,
            localStorage: {
                rentpipeAuth: !!localStorage.getItem('rentpipe_auth'),
                rentpipeAuthSimple: !!localStorage.getItem('rentpipe_auth_simple'),
                googleAuth: !!localStorage.getItem('google_auth_data'),
                googleAccessToken: !!localStorage.getItem('google_access_token')
            },
            canUseGoogleForms: this.canUseGoogleForms(),
            isFullyAuthenticated: this.isFullyAuthenticated()
        };
    }
};

// グローバルログアウト関数
window.performFullLogout = function() {
    if (window.IntegratedAuthManagerV2) {
        window.IntegratedAuthManagerV2.performFullLogout();
    } else {
        console.warn('⚠️ 統合認証マネージャーが利用できません');
        localStorage.clear();
        window.location.href = 'login.html';
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', async function() {
    if (window.IntegratedAuthManagerV2 && !window.IntegratedAuthManagerV2.isInitialized) {
        await window.IntegratedAuthManagerV2.initialize();
    }
});

console.log('✅ 統合認証マネージャー v2 準備完了');

// ========================================
// app-initializer.js 互換性のための追加関数
// ========================================

// 認証状態をチェック（app-initializer互換）
window.IntegratedAuthManagerV2.checkAuthStatus = async function() {
    if (!this.isInitialized) {
        await this.initialize();
    }
    return this.authState.isAuthenticated;
};

// ユーザーメールアドレスを取得（app-initializer互換）
window.IntegratedAuthManagerV2.getUserEmail = function() {
    if (this.authState.rentpipeAuth.isLoggedIn && this.authState.rentpipeAuth.user) {
        return this.authState.rentpipeAuth.user.email;
    }
    if (this.authState.googleAuth.isSignedIn && this.authState.googleAuth.user) {
        return this.authState.googleAuth.user.email;
    }
    return null;
};

// 認証状態の簡易チェック
window.IntegratedAuthManagerV2.isAuthenticated = function() {
    return this.authState.isAuthenticated;
};

// 後方互換性のため、IntegratedAuthManager としても公開
window.IntegratedAuthManager = window.IntegratedAuthManagerV2;

console.log('✅ IntegratedAuthManager 互換性レイヤー追加完了');
