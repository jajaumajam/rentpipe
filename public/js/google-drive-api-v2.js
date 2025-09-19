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
            
            console.log('📥 Google Identity Services 読み込み中...');
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                console.log('✅ Google Identity Services 読み込み完了');
                // 読み込み後少し待つ
                setTimeout(resolve, 500);
            };
            script.onerror = () => reject(new Error('Google Identity Services 読み込み失敗'));
            document.head.appendChild(script);
        });
    },
    
    // Google API Client Library 読み込み
    loadGoogleAPIClient: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                console.log('✅ Google API Client 既に読み込み済み');
                resolve();
                return;
            }
            
            console.log('📥 Google API Client 読み込み中...');
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('✅ Google API Client 読み込み完了');
                resolve();
            };
            script.onerror = () => reject(new Error('Google API Client 読み込み失敗'));
            document.head.appendChild(script);
        });
    },
    
    // Token Client 初期化
    initializeTokenClient: function() {
        try {
            console.log('🔧 Token Client 初期化中...');
            
            if (!window.google?.accounts?.oauth2) {
                throw new Error('Google Identity Services が利用できません');
            }
            
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: this.config.scopes.join(' '),
                callback: (response) => {
                    console.log('✅ Token取得:', response);
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        this.isAuthenticated = true;
                        
                        // トークンをLocalStorageに保存
                        localStorage.setItem('google_access_token', response.access_token);
                        localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());
                    }
                }
            });
            
            console.log('✅ Token Client 初期化完了');
            
        } catch (error) {
            console.error('❌ Token Client 初期化エラー:', error);
            throw error;
        }
    },
    
    // Google API Client 初期化
    initializeGAPIClient: async function() {
        try {
            console.log('🔧 Google API Client 初期化中...');
            
            if (!window.gapi) {
                throw new Error('Google API Client が利用できません');
            }
            
            await new Promise((resolve, reject) => {
                window.gapi.load('client', {
                    callback: resolve,
                    onerror: reject
                });
            });
            
            await window.gapi.client.init({
                apiKey: '', // 公開APIキーは不要（OAuth使用）
                discoveryDocs: this.config.discoveryDocs
            });
            
            console.log('✅ Google API Client 初期化完了');
            
        } catch (error) {
            console.error('❌ Google API Client 初期化エラー:', error);
            throw error;
        }
    },
    
    // 認証実行
    authenticate: async function() {
        try {
            console.log('🔐 Google認証開始...');
            
            if (!this.isInitialized) {
                throw new Error('Google Drive API が初期化されていません');
            }
            
            return new Promise((resolve, reject) => {
                try {
                    this.tokenClient.callback = async (response) => {
                        try {
                            if (response.error) {
                                reject(new Error(`認証エラー: ${response.error}`));
                                return;
                            }
                            
                            if (!response.access_token) {
                                reject(new Error('アクセストークンが取得できませんでした'));
                                return;
                            }
                            
                            console.log('✅ アクセストークン取得成功');
                            this.accessToken = response.access_token;
                            this.isAuthenticated = true;
                            
                            // トークンを保存
                            localStorage.setItem('google_access_token', response.access_token);
                            localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());
                            
                            // ユーザー情報を取得
                            const userInfo = await this.getUserInfo();
                            this.userInfo = userInfo;
                            
                            console.log('✅ Google認証完了:', userInfo.email);
                            resolve(userInfo);
                            
                        } catch (error) {
                            console.error('❌ 認証コールバックエラー:', error);
                            reject(error);
                        }
                    };
                    
                    // 認証フローを開始
                    this.tokenClient.requestAccessToken({ prompt: 'consent' });
                    
                } catch (error) {
                    console.error('❌ 認証開始エラー:', error);
                    reject(error);
                }
            });
            
        } catch (error) {
            console.error('❌ Google認証エラー:', error);
            throw error;
        }
    },
    
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
    },
    
    // Google Driveフォルダ作成
    createFolder: async function(folderName, parentFolderId = null) {
        try {
            console.log(`📁 フォルダ作成: ${folderName}`);
            
            if (!this.isAuthenticated || !this.accessToken) {
                throw new Error('Google認証が必要です');
            }
            
            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }
            
            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });
            
            if (!response.ok) {
                throw new Error(`フォルダ作成失敗: ${response.status}`);
            }
            
            const folder = await response.json();
            console.log('✅ フォルダ作成成功:', folder.name);
            return folder;
            
        } catch (error) {
            console.error('❌ フォルダ作成エラー:', error);
            throw error;
        }
    },
    
    // ファイル検索
    searchFiles: async function(query) {
        try {
            if (!this.isAuthenticated || !this.accessToken) {
                throw new Error('Google認証が必要です');
            }
            
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ファイル検索失敗: ${response.status}`);
            }
            
            const result = await response.json();
            return result.files || [];
            
        } catch (error) {
            console.error('❌ ファイル検索エラー:', error);
            throw error;
        }
    }
};

console.log('✅ Google Drive API v2 準備完了');
