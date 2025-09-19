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
            
            // RentPipe認証状態復元
            const rentpipeAuth = localStorage.getItem('rentpipe_auth');
            if (rentpipeAuth) {
                const authData = JSON.parse(rentpipeAuth);
                this.authState.rentpipeAuth = {
                    isLoggedIn: true,
                    user: authData.user || { email: 'user@example.com', name: 'ユーザー' }
                };
                this.authState.isAuthenticated = true;
                console.log('✅ RentPipe認証状態復元完了:', this.authState.rentpipeAuth.user.email);
            }
            
            // 簡易認証状態も確認
            const simpleAuth = localStorage.getItem('rentpipe_auth_simple');
            if (simpleAuth === 'logged_in') {
                const userInfo = localStorage.getItem('rentpipe_user_info');
                if (userInfo) {
                    const userData = JSON.parse(userInfo);
                    this.authState.rentpipeAuth = {
                        isLoggedIn: true,
                        user: userData
                    };
                    this.authState.isAuthenticated = true;
                    console.log('✅ 簡易認証状態復元完了:', userData.email);
                }
            }
            
            // Google認証状態復元
            const googleAuth = localStorage.getItem('google_auth_data');
            if (googleAuth) {
                const authData = JSON.parse(googleAuth);
                
                // トークンの有効期限確認
                const isTokenValid = authData.tokenExpiry && new Date().getTime() < authData.tokenExpiry;
                
                if (isTokenValid) {
                    this.authState.googleAuth = {
                        isSignedIn: true,
                        user: authData.user,
                        accessToken: authData.accessToken,
                        tokenExpiry: authData.tokenExpiry
                    };
                    console.log('✅ Google認証状態復元完了:', authData.user?.email);
                } else {
                    console.log('⚠️ Googleトークンが期限切れです');
                    this.clearGoogleAuth();
                }
            }
            
            console.log('🔍 復元後の認証状態:', this.authState);
            
        } catch (error) {
            console.error('❌ 認証状態復元エラー:', error);
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
