// 🔐 統合認証マネージャー（Google OAuth + 既存システム）
console.log('🔐 統合認証マネージャー初期化中...');

window.IntegratedAuthManager = {
    // 認証状態
    isAuthenticated: false,
    currentUser: null,
    authMethod: null, // 'demo', 'firebase', 'google'
    
    // Google OAuth状態
    googleAuth: {
        isSignedIn: false,
        user: null,
        accessToken: null
    },
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔐 統合認証システム初期化開始...');
            
            // 既存認証システムの初期化
            if (window.AuthManager && window.AuthManager.initialize) {
                await window.AuthManager.initialize();
            }
            
            // セッション復旧の確認
            this.checkExistingSession();
            
            console.log('✅ 統合認証システム初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 統合認証システム初期化エラー:', error);
            return false;
        }
    },
    
    // 既存セッションの確認
    checkExistingSession: function() {
        try {
            // 既存の認証システムからの状態確認
            if (window.AuthManager) {
                const authState = window.AuthManager.getAuthState();
                if (authState.isAuthenticated) {
                    this.isAuthenticated = true;
                    this.currentUser = authState.user;
                    this.authMethod = authState.isDemoMode ? 'demo' : 'firebase';
                    console.log(`✅ 既存セッション発見: ${this.authMethod}モード`);
                }
            }
            
            // Googleサインイン状態の確認
            const googleAuthData = localStorage.getItem('google_oauth_data');
            if (googleAuthData) {
                try {
                    const data = JSON.parse(googleAuthData);
                    if (data.accessToken && new Date(data.expiresAt) > new Date()) {
                        this.googleAuth.isSignedIn = true;
                        this.googleAuth.user = data.user;
                        this.googleAuth.accessToken = data.accessToken;
                        console.log('✅ 有効なGoogle認証セッション発見');
                    } else {
                        console.log('⏰ Google認証セッション期限切れ');
                        localStorage.removeItem('google_oauth_data');
                    }
                } catch (error) {
                    console.error('❌ Google認証データ解析エラー:', error);
                    localStorage.removeItem('google_oauth_data');
                }
            }
            
        } catch (error) {
            console.error('❌ セッション確認エラー:', error);
        }
    },
    
    // Google認証の開始
    signInWithGoogle: async function() {
        try {
            console.log('🔑 Google認証を開始...');
            
            // Google OAuth設定確認
            if (!window.GoogleOAuth) {
                throw new Error('Google OAuth設定が読み込まれていません');
            }
            
            // Google OAuthライブラリ初期化
            if (!window.GoogleOAuth.isInitialized) {
                const initResult = await window.GoogleOAuth.initialize();
                if (!initResult) {
                    throw new Error('Google OAuth初期化に失敗しました');
                }
            }
            
            // Googleサインイン実行
            const result = await window.GoogleOAuth.signIn();
            
            if (result.success) {
                // Google認証成功
                this.googleAuth.isSignedIn = true;
                this.googleAuth.user = result.user;
                this.googleAuth.accessToken = result.user.accessToken;
                
                // Google認証データを保存
                localStorage.setItem('google_oauth_data', JSON.stringify({
                    user: result.user,
                    accessToken: result.user.accessToken,
                    expiresAt: result.user.expiresAt,
                    signedInAt: new Date().toISOString()
                }));
                
                // RentPipe認証と統合
                await this.integrateGoogleAuth(result.user);
                
                console.log('✅ Google認証統合完了');
                
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'Google認証が完了しました'
                };
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Google認証エラー:', error);
            return {
                success: false,
                error: 'Google認証に失敗しました: ' + error.message
            };
        }
    },
    
    // Google認証をRentPipeシステムと統合
    integrateGoogleAuth: async function(googleUser) {
        try {
            console.log('🔗 Google認証をRentPipeシステムと統合中...', googleUser.email);
            
            // RentPipeユーザーとしてサインイン/登録
            if (window.AuthManager) {
                // 既存のRentPipeアカウントがあるかチェック
                const existingAuth = localStorage.getItem(`rentpipe_user_${googleUser.email}`);
                
                if (existingAuth) {
                    // 既存アカウントでログイン
                    console.log('👤 既存のRentPipeアカウント発見');
                    const loginResult = await window.AuthManager.demoLogin(googleUser.email, 'google_oauth_user');
                    
                    if (loginResult.success) {
                        this.isAuthenticated = true;
                        this.currentUser = {
                            ...loginResult.user,
                            googleAuth: googleUser
                        };
                        this.authMethod = 'google';
                    }
                } else {
                    // 新規アカウント作成
                    console.log('📝 新規RentPipeアカウント作成');
                    const registerResult = await window.AuthManager.demoRegister(
                        googleUser.email, 
                        'google_oauth_user',
                        googleUser.name
                    );
                    
                    if (registerResult.success) {
                        this.isAuthenticated = true;
                        this.currentUser = {
                            ...registerResult.user,
                            googleAuth: googleUser
                        };
                        this.authMethod = 'google';
                        
                        // Google認証フラグを追加
                        const userData = JSON.parse(localStorage.getItem(`rentpipe_user_${googleUser.email}`));
                        userData.isGoogleUser = true;
                        userData.googleAuthData = googleUser;
                        localStorage.setItem(`rentpipe_user_${googleUser.email}`, JSON.stringify(userData));
                    }
                }
                
                // 認証状態を保存
                const authData = {
                    user: this.currentUser,
                    method: 'google',
                    signedInAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間
                };
                
                localStorage.setItem('rentpipe_auth', JSON.stringify(authData));
            }
            
        } catch (error) {
            console.error('❌ Google認証統合エラー:', error);
            throw error;
        }
    },
    
    // 通常ログイン（既存システム）
    signIn: async function(email, password) {
        try {
            if (!window.AuthManager) {
                throw new Error('既存認証システムが見つかりません');
            }
            
            const result = await window.AuthManager.login(email, password);
            
            if (result.success) {
                this.isAuthenticated = true;
                this.currentUser = result.user;
                this.authMethod = window.AuthManager.isDemoMode ? 'demo' : 'firebase';
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ 通常ログインエラー:', error);
            return {
                success: false,
                error: 'ログインに失敗しました: ' + error.message
            };
        }
    },
    
    // サインアウト
    signOut: async function() {
        try {
            console.log('👋 統合認証サインアウト開始...');
            
            // Google認証サインアウト
            if (this.googleAuth.isSignedIn && window.GoogleOAuth) {
                await window.GoogleOAuth.signOut();
                localStorage.removeItem('google_oauth_data');
                console.log('✅ Google認証サインアウト完了');
            }
            
            // 既存システムサインアウト
            if (window.AuthManager) {
                window.AuthManager.logout();
                console.log('✅ RentPipe認証サインアウト完了');
            }
            
            // 認証状態リセット
            this.isAuthenticated = false;
            this.currentUser = null;
            this.authMethod = null;
            this.googleAuth = {
                isSignedIn: false,
                user: null,
                accessToken: null
            };
            
            console.log('✅ 統合認証サインアウト完了');
            
            // ログインページにリダイレクト
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('❌ サインアウトエラー:', error);
        }
    },
    
    // 認証状態取得
    getAuthState: function() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.currentUser,
            method: this.authMethod,
            googleAuth: this.googleAuth
        };
    },
    
    // Google Forms機能が利用可能かチェック
    canUseGoogleForms: function() {
        return this.googleAuth.isSignedIn && this.googleAuth.accessToken;
    },
    
    // 認証が必要なページの保護
    requireAuth: function() {
        if (!this.isAuthenticated) {
            console.log('🔒 認証が必要です');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', async function() {
    await window.IntegratedAuthManager.initialize();
});

console.log('✅ 統合認証マネージャー準備完了');
