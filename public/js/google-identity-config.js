// 🔑 Google Identity Services設定（ローカル開発環境対応）
console.log('🔑 Google Identity Services設定初期化中...');

window.GoogleIdentity = {
    // 設定（ローカル開発環境用）
    config: {
        // 開発用Client ID（あなた自身のものに置き換えてください）
        clientId: '134830384107-bk1amp8ho2q0pdj2vu6faqf9d6giajjo.apps.googleusercontent.com',
        
        // スコープ設定
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/forms',
            'https://www.googleapis.com/auth/drive.file'
        ].join(' '),
        
        // ローカル開発環境の場合はリダイレクトURIは不要
        // Google Identity Services のポップアップモードを使用
    },
    
    // 初期化状態
    isInitialized: false,
    tokenClient: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Identity Services初期化開始...');
            
            // Google Identity Services ライブラリの読み込み確認
            await this.ensureGoogleIdentityLibrary();
            
            // OAuth 2.0 Token Client初期化
            this.initializeTokenClient();
            
            this.isInitialized = true;
            console.log('✅ Google Identity Services初期化完了');
            
            return true;
            
        } catch (error) {
            console.error('❌ Google Identity Services初期化エラー:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    // Google Identity Services ライブラリの確保
    ensureGoogleIdentityLibrary: function() {
        return new Promise((resolve, reject) => {
            // 既に読み込み済みの場合
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                console.log('✅ Google Identity Services ライブラリ読み込み済み');
                resolve();
                return;
            }
            
            console.log('📚 Google Identity Services ライブラリ読み込み中...');
            
            // ライブラリを動的読み込み
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // 読み込み後、少し待ってからresolve
                setTimeout(() => {
                    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                        console.log('✅ Google Identity Services ライブラリ読み込み完了');
                        resolve();
                    } else {
                        reject(new Error('Google Identity Services オブジェクトが見つかりません'));
                    }
                }, 500);
            };
            
            script.onerror = (error) => {
                console.error('❌ Google Identity Services ライブラリ読み込み失敗:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    },
    
    // Token Client初期化
    initializeTokenClient: function() {
        try {
            console.log('🔧 Token Client初期化中...');
            
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: this.config.scope,
                callback: '', // 後で設定
            });
            
            console.log('✅ Token Client初期化完了');
            
        } catch (error) {
            console.error('❌ Token Client初期化エラー:', error);
            throw error;
        }
    },
    
    // 認証開始
    signIn: function() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🚀 Google認証開始...');
                
                if (!this.isInitialized) {
                    throw new Error('Google Identity Servicesが初期化されていません');
                }
                
                if (!this.tokenClient) {
                    throw new Error('Token Clientが初期化されていません');
                }
                
                // コールバック設定
                this.tokenClient.callback = async (tokenResponse) => {
                    try {
                        if (tokenResponse.error !== undefined) {
                            console.error('❌ 認証エラー:', tokenResponse.error);
                            reject(new Error(tokenResponse.error));
                            return;
                        }
                        
                        console.log('✅ トークン取得成功');
                        
                        // ユーザー情報を取得
                        const userInfo = await this.getUserInfo(tokenResponse.access_token);
                        
                        const authResult = {
                            success: true,
                            user: userInfo,
                            accessToken: tokenResponse.access_token,
                            tokenType: 'Bearer',
                            expiresIn: tokenResponse.expires_in,
                            scope: tokenResponse.scope
                        };
                        
                        console.log('✅ 認証成功:', userInfo.email);
                        resolve(authResult);
                        
                    } catch (error) {
                        console.error('❌ トークン処理エラー:', error);
                        reject(error);
                    }
                };
                
                // 認証フロー開始
                console.log('📱 認証ポップアップを表示中...');
                this.tokenClient.requestAccessToken({prompt: 'consent'});
                
            } catch (error) {
                console.error('❌ 認証開始エラー:', error);
                reject(error);
            }
        });
    },
    
    // ユーザー情報取得
    getUserInfo: async function(accessToken) {
        try {
            console.log('👤 ユーザー情報取得中...');
            
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ユーザー情報取得エラー: ${response.status} ${response.statusText}`);
            }
            
            const userInfo = await response.json();
            console.log('✅ ユーザー情報取得完了:', userInfo.email);
            
            return userInfo;
            
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            throw error;
        }
    },
    
    // サインアウト
    signOut: async function() {
        try {
            console.log('👋 サインアウト処理中...');
            
            // トークンを取り消し（Google側）
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                window.google.accounts.oauth2.revoke('', () => {
                    console.log('✅ Google側トークン取り消し完了');
                });
            }
            
            console.log('✅ サインアウト完了');
            return true;
            
        } catch (error) {
            console.error('❌ サインアウトエラー:', error);
            return false;
        }
    },
    
    // デバッグ情報取得
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            hasTokenClient: !!this.tokenClient,
            hasGoogleLibrary: !!(window.google && window.google.accounts && window.google.accounts.oauth2),
            config: this.config
        };
    }
};

console.log('✅ Google Identity Services設定準備完了');
