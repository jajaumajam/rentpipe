// 🔑 Google OAuth 2.0設定
console.log('🔑 Google OAuth設定を初期化中...');

window.GoogleOAuth = {
    // Google OAuth 2.0設定
    config: {
        clientId: '134830384107-bk1amp8ho2q0pdj2vu6faqf9d6giajjo.apps.googleusercontent.com', // Google Cloud Consoleで取得したクライアントID
        redirectUri: window.location.origin + '/oauth-callback.html',
        scope: [
            'https://www.googleapis.com/auth/forms',
            'https://www.googleapis.com/auth/script.projects', 
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' '),
        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/forms/v1/rest'
    },
    
    // 初期化フラグ
    isInitialized: false,
    isSignedIn: false,
    currentUser: null,
    
    // Google APIライブラリの初期化
    initialize: async function() {
        try {
            console.log('📚 Google API Client Library読み込み中...');
            
            // Google API Client Library読み込み待機
            if (!window.gapi) {
                throw new Error('Google API Client Libraryが読み込まれていません');
            }
            
            await new Promise((resolve) => {
                window.gapi.load('auth2', resolve);
            });
            
            console.log('🔐 Google Auth2初期化中...');
            
            // Google Auth2初期化
            this.auth2 = await window.gapi.auth2.init({
                client_id: this.config.clientId,
                scope: this.config.scope,
                redirect_uri: this.config.redirectUri
            });
            
            this.isInitialized = true;
            
            // 現在のサインイン状態をチェック
            this.isSignedIn = this.auth2.isSignedIn.get();
            if (this.isSignedIn) {
                this.currentUser = this.auth2.currentUser.get();
                console.log('✅ 既存のGoogleアカウントでサインイン中:', this.getUserEmail());
            }
            
            console.log('✅ Google OAuth初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google OAuth初期化エラー:', error);
            return false;
        }
    },
    
    // Googleアカウントでサインイン
    signIn: async function() {
        try {
            if (!this.isInitialized) {
                throw new Error('Google OAuthが初期化されていません');
            }
            
            console.log('🔑 Googleアカウントサインイン開始...');
            
            const user = await this.auth2.signIn({
                scope: this.config.scope,
                prompt: 'consent' // 権限の再確認
            });
            
            this.isSignedIn = true;
            this.currentUser = user;
            
            console.log('✅ Googleサインイン成功:', this.getUserEmail());
            
            // アクセストークン取得
            const authResponse = user.getAuthResponse(true);
            
            return {
                success: true,
                user: {
                    email: this.getUserEmail(),
                    name: this.getUserName(),
                    accessToken: authResponse.access_token,
                    refreshToken: authResponse.refresh_token,
                    expiresAt: new Date(authResponse.expires_at).toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Googleサインインエラー:', error);
            return {
                success: false,
                error: 'Googleアカウントでのサインインに失敗しました: ' + error.message
            };
        }
    },
    
    // Googleアカウントからサインアウト
    signOut: async function() {
        try {
            if (!this.isInitialized || !this.isSignedIn) {
                console.log('👋 Google OAuth: 既にサインアウト済み');
                return;
            }
            
            await this.auth2.signOut();
            
            this.isSignedIn = false;
            this.currentUser = null;
            
            console.log('✅ Googleサインアウト完了');
            
        } catch (error) {
            console.error('❌ Googleサインアウトエラー:', error);
        }
    },
    
    // ユーザー情報取得
    getUserEmail: function() {
        if (!this.currentUser) return null;
        return this.currentUser.getBasicProfile().getEmail();
    },
    
    getUserName: function() {
        if (!this.currentUser) return null;
        return this.currentUser.getBasicProfile().getName();
    },
    
    // アクセストークン取得
    getAccessToken: function() {
        if (!this.currentUser) return null;
        return this.currentUser.getAuthResponse(true).access_token;
    },
    
    // 認証状態チェック
    checkAuthStatus: function() {
        return {
            isInitialized: this.isInitialized,
            isSignedIn: this.isSignedIn,
            userEmail: this.getUserEmail(),
            userName: this.getUserName()
        };
    }
};

console.log('✅ Google OAuth設定準備完了');
