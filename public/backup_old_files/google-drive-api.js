// 💾 Google Drive API Manager
console.log('💾 Google Drive API初期化中...');

window.GoogleDriveAPI = {
    isInitialized: false,
    folderId: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Drive API初期化開始...');
            
            // Google認証チェック
            if (!window.auth || !window.auth.currentUser) {
                throw new Error('Google認証が必要です');
            }
            
            // gapi client 初期化
            if (!window.gapi) {
                await this.loadGAPI();
            }
            
            await new Promise((resolve) => {
                window.gapi.load('client', resolve);
            });
            
            await window.gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });
            
            // アクセストークン設定
            const user = window.auth.currentUser;
            const token = await user.getIdToken();
            
            window.gapi.client.setToken({
                access_token: token
            });
            
            this.isInitialized = true;
            console.log('✅ Google Drive API初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Drive API初期化エラー:', error);
            return false;
        }
    },
    
    // gapi ライブラリ読み込み
    loadGAPI: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // RentPipeフォルダー作成・取得
    ensureRentPipeFolder: async function() {
        try {
            // 既存フォルダー検索
            const response = await window.gapi.client.drive.files.list({
                q: "name='RentPipe' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                spaces: 'drive'
            });
            
            if (response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                console.log('📁 既存RentPipeフォルダー使用:', this.folderId);
                return this.folderId;
            }
            
            // 新規フォルダー作成
            const createResponse = await window.gapi.client.drive.files.create({
                resource: {
                    name: 'RentPipe',
                    mimeType: 'application/vnd.google-apps.folder'
                }
            });
            
            this.folderId = createResponse.result.id;
            console.log('✅ RentPipeフォルダー作成完了:', this.folderId);
            return this.folderId;
            
        } catch (error) {
            console.error('❌ RentPipeフォルダー作成エラー:', error);
            throw error;
        }
    }
};

console.log('✅ Google Drive API準備完了');
