// 🔑 Google Identity Services (GIS) 設定
console.log('🔑 Google Identity Services初期化中...');

window.GoogleIdentity = {
    // 設定
    config: {
        clientId: '134830384107-bk1amp8ho2q0pdj2vu6faqf9d6giajjo.apps.googleusercontent.com',
        scope: [
            'https://www.googleapis.com/auth/forms',
            'https://www.googleapis.com/auth/script.projects',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' ')
    },
    
    // 状態管理
    isInitialized: false,
    isSignedIn: false,
    currentUser: null,
    accessToken: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('📚 Google Identity Services読み込み中...');
            
            // Google Identity Servicesライブラリの確認
            if (!window.google?.accounts) {
                throw new Error('Google Identity Servicesが読み込まれていません');
            }
            
            console.log('✅ Google Identity Services読み込み完了');
            this.isInitialized = true;
            
            return true;
            
        } catch (error) {
            console.error('❌ Google Identity Services初期化エラー:', error);
            return false;
        }
    },
    
    // OAuth 2.0認証開始
    requestAccessToken: function() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔑 Google OAuth 2.0認証開始...');
                
                if (!this.isInitialized) {
                    throw new Error('Google Identity Servicesが初期化されていません');
                }
                
                // トークンクライアントの設定
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.config.clientId,
                    scope: this.config.scope,
                    callback: (response) => {
                        if (response.error) {
                            console.error('❌ OAuth認証エラー:', response.error);
                            reject(new Error('OAuth認証に失敗しました: ' + response.error));
                            return;
                        }
                        
                        console.log('✅ OAuth認証成功');
                        this.accessToken = response.access_token;
                        this.isSignedIn = true;
                        
                        // ユーザー情報を取得
                        this.getUserInfo().then((userInfo) => {
                            this.currentUser = {
                                email: userInfo.email,
                                name: userInfo.name,
                                picture: userInfo.picture,
                                accessToken: response.access_token,
                                expiresAt: new Date(Date.now() + (response.expires_in * 1000)).toISOString()
                            };
                            
                            resolve({
                                success: true,
                                user: this.currentUser,
                                accessToken: response.access_token
                            });
                        }).catch(reject);
                    },
                    error_callback: (error) => {
                        console.error('❌ OAuth認証エラー:', error);
                        reject(new Error('OAuth認証に失敗しました'));
                    }
                });
                
                // 認証要求を開始
                tokenClient.requestAccessToken({
                    prompt: 'consent' // 権限の再確認
                });
                
            } catch (error) {
                console.error('❌ OAuth認証開始エラー:', error);
                reject(error);
            }
        });
    },
    
    // ユーザー情報取得
    getUserInfo: async function() {
        try {
            if (!this.accessToken) {
                throw new Error('アクセストークンが必要です');
            }
            
            console.log('👤 ユーザー情報取得中...');
            
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('ユーザー情報取得に失敗しました');
            }
            
            const userInfo = await response.json();
            console.log('✅ ユーザー情報取得成功:', userInfo.email);
            
            return userInfo;
            
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            throw error;
        }
    },
    
    // サインアウト
    signOut: function() {
        try {
            console.log('👋 Google認証サインアウト...');
            
            if (this.accessToken) {
                // アクセストークンを無効化
                google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('✅ アクセストークン無効化完了');
                });
            }
            
            // 状態リセット
            this.isSignedIn = false;
            this.currentUser = null;
            this.accessToken = null;
            
            console.log('✅ Google認証サインアウト完了');
            
        } catch (error) {
            console.error('❌ Google認証サインアウトエラー:', error);
        }
    },
    
    // 認証状態確認
    checkAuthStatus: function() {
        return {
            isInitialized: this.isInitialized,
            isSignedIn: this.isSignedIn,
            userEmail: this.currentUser?.email,
            userName: this.currentUser?.name,
            hasValidToken: this.accessToken && this.currentUser?.expiresAt && new Date(this.currentUser.expiresAt) > new Date()
        };
    }
};

console.log('✅ Google Identity Services設定準備完了');
