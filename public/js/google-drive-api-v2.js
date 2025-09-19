// 🚀 Google Drive API v2 - 新クライアントID対応版
console.log('🚀 Google Drive API v2 初期化中...');

window.GoogleDriveAPIv2 = {
    // 最新設定（2025年9月版）
    config: {
        clientId: '586040985916-r5v9q1242tiplplj0p5p9f664c70ipjj.apps.googleusercontent.com',
        projectId: 'rentpipe',
        scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    },
    
    // 状態管理
    isInitialized: false,
    isAuthenticated: false,
    tokenClient: null,
    accessToken: null,
    userInfo: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Drive API v2 初期化開始...');
            console.log(`📝 Client ID: ${this.config.clientId.substring(0, 20)}...`);
            
            // Google Identity Services 読み込み
            await this.loadGoogleIdentityServices();
            
            // Google API Client Library 読み込み
            await this.loadGoogleAPIClient();
            
            // Token Client 初期化
            this.initializeTokenClient();
            
            // Google API Client 初期化
            await this.initializeGAPIClient();
            
            this.isInitialized = true;
            console.log('✅ Google Drive API v2 初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Drive API v2 初期化エラー:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    // Google Identity Services 読み込み
    loadGoogleIdentityServices: function() {
        return new Promise((resolve, reject) => {
            if (window.google?.accounts?.oauth2) {
                console.log('✅ Google Identity Services 既に読み込み済み');
                resolve();
                return;
            }
            
            console.log('📚 Google Identity Services 読み込み中...');
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                setTimeout(() => {
                    if (window.google?.accounts?.oauth2) {
                        console.log('✅ Google Identity Services 読み込み完了');
                        resolve();
                    } else {
                        reject(new Error('Google Identity Services 初期化失敗'));
                    }
                }, 1000);
            };
            
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Google API Client Library 読み込み
    loadGoogleAPIClient: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                console.log('✅ Google API Client Library 既に読み込み済み');
                resolve();
                return;
            }
            
            console.log('📚 Google API Client Library 読み込み中...');
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('✅ Google API Client Library 読み込み完了');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Token Client 初期化
    initializeTokenClient: function() {
        console.log('🔧 Token Client 初期化中...');
        
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.config.clientId,
            scope: this.config.scopes.join(' '),
            callback: this.handleTokenResponse.bind(this)
        });
        
        console.log('✅ Token Client 初期化完了');
    },
    
    // Google API Client 初期化
    initializeGAPIClient: async function() {
        console.log('🔧 Google API Client 初期化中...');
        
        await new Promise((resolve, reject) => {
            window.gapi.load('client', {
                callback: resolve,
                onerror: reject
            });
        });
        
        await window.gapi.client.init({
            discoveryDocs: this.config.discoveryDocs
        });
        
        console.log('✅ Google API Client 初期化完了');
    },
    
    // 認証開始
    authenticate: function() {
        console.log('🔑 Google認証開始...');
        
        if (!this.tokenClient) {
            throw new Error('Token Client が初期化されていません');
        }
        
        return new Promise((resolve, reject) => {
            this.authResolve = resolve;
            this.authReject = reject;
            
            this.tokenClient.requestAccessToken({
                prompt: 'consent'
            });
        });
    },
    
    // トークンレスポンス処理
    handleTokenResponse: async function(response) {
        try {
            if (response.error) {
                console.error('❌ 認証エラー:', response.error);
                if (this.authReject) this.authReject(new Error(response.error));
                return;
            }
            
            this.accessToken = response.access_token;
            console.log('✅ アクセストークン取得成功');
            
            // Google API Client にトークン設定
            window.gapi.client.setToken({
                access_token: this.accessToken
            });
            
            // ユーザー情報取得
            await this.fetchUserInfo();
            
            this.isAuthenticated = true;
            console.log(`✅ 認証完了: ${this.userInfo?.email}`);
            
            if (this.authResolve) this.authResolve(this.userInfo);
            
        } catch (error) {
            console.error('❌ トークン処理エラー:', error);
            if (this.authReject) this.authReject(error);
        }
    },
    
    // ユーザー情報取得
    fetchUserInfo: async function() {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ユーザー情報取得エラー: ${response.status}`);
            }
            
            this.userInfo = await response.json();
            console.log('✅ ユーザー情報取得成功:', this.userInfo.email);
            
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            throw error;
        }
    },
    
    // フォルダ作成
    createFolder: async function(folderName, parentFolderId = null) {
        if (!this.isAuthenticated) {
            throw new Error('認証が必要です');
        }
        
        try {
            console.log(`📁 フォルダ作成開始: ${folderName}`);
            
            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }
            
            const response = await window.gapi.client.drive.files.create({
                resource: metadata
            });
            
            console.log('✅ フォルダ作成成功:', response.result.id);
            return response.result;
            
        } catch (error) {
            console.error('❌ フォルダ作成エラー:', error);
            throw error;
        }
    },
    
    // ファイル一覧取得
    listFiles: async function(folderId = null, pageSize = 10) {
        if (!this.isAuthenticated) {
            throw new Error('認証が必要です');
        }
        
        try {
            console.log('📋 ファイル一覧取得開始...');
            
            let query = '';
            if (folderId) {
                query = `'${folderId}' in parents`;
            }
            
            const response = await window.gapi.client.drive.files.list({
                q: query,
                pageSize: pageSize,
                fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)'
            });
            
            console.log(`✅ ファイル一覧取得成功: ${response.result.files.length}件`);
            return response.result.files;
            
        } catch (error) {
            console.error('❌ ファイル一覧取得エラー:', error);
            throw error;
        }
    },
    
    // RentPipe専用フォルダ作成
    createRentPipeFolder: async function() {
        try {
            console.log('🏠 RentPipe専用フォルダ作成開始...');
            
            // 既存のRentPipeフォルダを検索
            const existingFolders = await this.searchFolders('RentPipe');
            if (existingFolders.length > 0) {
                console.log('✅ RentPipeフォルダ既存:', existingFolders[0].id);
                return existingFolders[0];
            }
            
            // 新規作成
            const folder = await this.createFolder('RentPipe');
            console.log('✅ RentPipeフォルダ作成完了:', folder.id);
            return folder;
            
        } catch (error) {
            console.error('❌ RentPipeフォルダ作成エラー:', error);
            throw error;
        }
    },
    
    // フォルダ検索
    searchFolders: async function(folderName) {
        try {
            const response = await window.gapi.client.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
                fields: 'files(id, name)'
            });
            
            return response.result.files || [];
            
        } catch (error) {
            console.error('❌ フォルダ検索エラー:', error);
            throw error;
        }
    },
    
    // デバッグ情報
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            isAuthenticated: this.isAuthenticated,
            hasTokenClient: !!this.tokenClient,
            hasAccessToken: !!this.accessToken,
            userEmail: this.userInfo?.email,
            config: {
                clientId: this.config.clientId.substring(0, 20) + '...',
                scopes: this.config.scopes
            }
        };
    }
};

console.log('✅ Google Drive API v2 準備完了');

    // 静かな認証（ポップアップなし）
    authenticateSilent: async function() {
        try {
            console.log('🔄 Google静寂認証を試行中...');
            
            if (!this.isInitialized) {
                throw new Error('Google Drive API が初期化されていません');
            }
            
            // 既存のトークンがある場合はそれを使用
            const existingToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');
            
            if (existingToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
                console.log('✅ 既存トークンが有効');
                this.accessToken = existingToken;
                this.isAuthenticated = true;
                
                // ユーザー情報を取得
                const userInfo = await this.getUserInfo();
                this.userInfo = userInfo;
                
                return userInfo;
            }
            
            // 静寂な再認証を試行（Google Identity Servicesの場合）
            if (window.google?.accounts?.oauth2) {
                return null; // 静寂認証は初回認証後のみ可能
            }
            
            return null; // 静寂認証が利用できない
            
        } catch (error) {
            console.log('ℹ️ 静寂認証は利用できません:', error.message);
            return null;
        }
    },

    // ユーザー情報取得
    getUserInfo: async function() {
        try {
            if (!this.accessToken) {
                throw new Error('アクセストークンがありません');
            }
            
            const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${this.accessToken}`);
            
            if (!response.ok) {
                throw new Error(`ユーザー情報取得失敗: ${response.status}`);
            }
            
            const userInfo = await response.json();
            console.log('✅ ユーザー情報取得成功:', userInfo.email);
            
            return userInfo;
            
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            throw error;
        }
    }
};
