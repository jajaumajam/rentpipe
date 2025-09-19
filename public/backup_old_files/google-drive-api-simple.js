// 🚀 シンプルで確実なGoogle Drive API
console.log('🚀 Google Drive API初期化中...');

window.GoogleDriveAPISimple = {
    // 設定
    config: {
        clientId: '134830384107-bk1amp8ho2q0pdj2vu6faqf9d6giajjo.apps.googleusercontent.com',
        scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' ')
    },
    
    // 初期化状態
    isInitialized: false,
    tokenClient: null,
    accessToken: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Drive API 初期化開始...');
            
            // Google Identity Services ライブラリ読み込み確認
            await this.loadGoogleIdentityServices();
            
            // Token Client 初期化
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: this.config.scopes,
                callback: this.handleTokenResponse.bind(this)
            });
            
            this.isInitialized = true;
            console.log('✅ Google Drive API 初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Drive API 初期化エラー:', error);
            return false;
        }
    },
    
    // Google Identity Services ライブラリ読み込み
    loadGoogleIdentityServices: function() {
        return new Promise((resolve, reject) => {
            // 既に読み込み済みか確認
            if (window.google?.accounts?.oauth2) {
                console.log('✅ Google Identity Services 読み込み済み');
                resolve();
                return;
            }
            
            console.log('📚 Google Identity Services 読み込み中...');
            
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // 少し待ってからチェック
                setTimeout(() => {
                    if (window.google?.accounts?.oauth2) {
                        console.log('✅ Google Identity Services 読み込み完了');
                        resolve();
                    } else {
                        reject(new Error('Google Identity Services オブジェクト未確認'));
                    }
                }, 500);
            };
            
            script.onerror = (error) => {
                console.error('❌ Google Identity Services 読み込み失敗:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    },
    
    // アクセストークン要求
    requestAccessToken: function() {
        console.log('🔑 アクセストークン要求中...');
        
        if (!this.tokenClient) {
            throw new Error('Token Client が初期化されていません');
        }
        
        this.tokenClient.requestAccessToken({prompt: 'consent'});
    },
    
    // トークンレスポンス処理
    handleTokenResponse: function(response) {
        if (response.error) {
            console.error('❌ トークン取得エラー:', response.error);
            return;
        }
        
        this.accessToken = response.access_token;
        console.log('✅ アクセストークン取得成功');
        
        // 成功通知
        if (typeof this.onTokenReceived === 'function') {
            this.onTokenReceived(this.accessToken);
        }
    },
    
    // フォルダ作成テスト
    createFolder: async function(folderName) {
        if (!this.accessToken) {
            throw new Error('アクセストークンが必要です');
        }
        
        try {
            console.log(`📁 フォルダ「${folderName}」作成中...`);
            
            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            
            if (!response.ok) {
                throw new Error(`フォルダ作成エラー: ${response.status} ${response.statusText}`);
            }
            
            const folder = await response.json();
            console.log('✅ フォルダ作成成功:', folder.id);
            return folder;
            
        } catch (error) {
            console.error('❌ フォルダ作成エラー:', error);
            throw error;
        }
    },
    
    // デバッグ情報
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            hasTokenClient: !!this.tokenClient,
            hasAccessToken: !!this.accessToken,
            hasGoogleLibrary: !!(window.google?.accounts?.oauth2)
        };
    }
};

console.log('✅ Google Drive API Simple 準備完了');
