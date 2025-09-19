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
            
            // Google Identity Services初期化
            if (window.GoogleIdentity && !window.GoogleIdentity.isInitialized) {
                await window.GoogleIdentity.initialize();
            }
            
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
                console.log('✅ RentPipe認証状態復元完了');
            }
            
            // Google認証状態復元
            const googleAuth = localStorage.getItem('google_auth_data');
            if (googleAuth) {
                const authData = JSON.parse(googleAuth);
                
                // トークンの有効期限確認
                const now = new Date().getTime();
                const expiry = authData.tokenExpiry;
                
                if (expiry && now < expiry) {
                    this.authState.googleAuth = {
                        isSignedIn: true,
                        user: authData.user,
                        accessToken: authData.accessToken,
                        tokenExpiry: authData.tokenExpiry
                    };
                    console.log('✅ Google認証状態復元完了:', authData.user.email);
                } else {
                    console.log('⚠️ Googleアクセストークンが期限切れです');
                    this.clearGoogleAuth();
                }
            }
            
        } catch (error) {
            console.error('❌ 認証状態復元エラー:', error);
        }
    },
    
    // Google認証（サインイン）
    signInWithGoogle: async function() {
        try {
            console.log('🚀 Google認証開始...');
            
            // Google Identity Services初期化確認
            if (!window.GoogleIdentity || !window.GoogleIdentity.isInitialized) {
                throw new Error('Google Identity Servicesが初期化されていません');
            }
            
            // Google認証実行
            const authResult = await window.GoogleIdentity.signIn();
            
            if (authResult.success) {
                // 認証状態更新
                const tokenExpiry = new Date().getTime() + (authResult.expiresIn * 1000);
                
                this.authState.googleAuth = {
                    isSignedIn: true,
                    user: authResult.user,
                    accessToken: authResult.accessToken,
                    tokenExpiry: tokenExpiry
                };
                
                // ローカルストレージに保存
                this.saveGoogleAuth();
                
                console.log('✅ Google認証成功:', authResult.user.email);
                
                return {
                    success: true,
                    user: authResult.user
                };
                
            } else {
                throw new Error('Google認証に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ Google認証エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // サインアウト
    signOut: async function() {
        try {
            console.log('👋 サインアウト処理中...');
            
            // Google認証クリア
            if (this.authState.googleAuth.isSignedIn) {
                await window.GoogleIdentity.signOut();
                this.clearGoogleAuth();
            }
            
            // RentPipe認証クリア（オプション）
            // this.clearRentPipeAuth();
            
            console.log('✅ サインアウト完了');
            
            return true;
            
        } catch (error) {
            console.error('❌ サインアウトエラー:', error);
            return false;
        }
    },
    
    // Google認証情報保存
    saveGoogleAuth: function() {
        try {
            const authData = {
                user: this.authState.googleAuth.user,
                accessToken: this.authState.googleAuth.accessToken,
                tokenExpiry: this.authState.googleAuth.tokenExpiry
            };
            
            localStorage.setItem('google_auth_data', JSON.stringify(authData));
            console.log('💾 Google認証情報保存完了');
            
        } catch (error) {
            console.error('❌ Google認証情報保存エラー:', error);
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
    
    // 認証状態確認
    isFullyAuthenticated: function() {
        return this.authState.isAuthenticated && this.authState.googleAuth.isSignedIn;
    },
    
    // デバッグ情報取得
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            authState: this.authState,
            localStorage: {
                rentpipeAuth: !!localStorage.getItem('rentpipe_auth'),
                googleAuth: !!localStorage.getItem('google_auth_data')
            },
            canUseGoogleForms: this.canUseGoogleForms()
        };
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', async function() {
    await window.IntegratedAuthManagerV2.initialize();
});

console.log('✅ 統合認証マネージャー v2 準備完了');

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

    // 完全ログアウト
    performFullLogout: function() {
        console.log('🚪 完全ログアウト実行中...');
        
        // 認証状態クリア
        this.clearGoogleAuth();
        this.clearRentPipeAuth();
        
        // 個別トークンもクリア
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        
        console.log('✅ 完全ログアウト完了');
        
        // ログインページにリダイレクト
        window.location.href = 'login.html';
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
