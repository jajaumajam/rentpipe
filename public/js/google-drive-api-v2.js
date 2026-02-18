// 🚀 Google Drive API v2 - Google Sheets対応版
console.log('🚀 Google Drive API v2 初期化中...');

window.GoogleDriveAPIv2 = {
    // 最新設定（Google Sheets対応）
    config: {
        clientId: '586040985916-r5v9q1242tiplplj0p5p9f664c70ipjj.apps.googleusercontent.com',
        projectId: 'rentpipe',
        scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/forms.responses.readonly',
            'https://www.googleapis.com/auth/calendar'
        ],
        discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
        ]
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
            console.log(`🔑 スコープ: ${this.config.scopes.join(', ')}`);
            
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
    
    // Token Client 初期化（Redirect Flow）
    initializeTokenClient: function() {
        try {
            console.log('🔧 Token Client 初期化中（Redirect Flow）...');

            if (!window.google?.accounts?.oauth2) {
                throw new Error('Google Identity Services が利用できません');
            }

            // リダイレクト先URL（現在のオリジン + /login.html）
            const redirectUri = window.location.origin + '/login.html';

            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.config.clientId,
                scope: this.config.scopes.join(' '),
                // ux_mode: 'redirect' でポップアップなしのリダイレクト型フローを使用
                ux_mode: 'redirect',
                redirect_uri: redirectUri,
                // redirect後はlogin.htmlのhandleRedirectToken()がコールバックを担当
                callback: () => {},
            });

            console.log('✅ Token Client 初期化完了（redirect_uri:', redirectUri, '）');

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
                apiKey: '',
                discoveryDocs: this.config.discoveryDocs
            });
            
            console.log('✅ Google API Client 初期化完了');
            
        } catch (error) {
            console.error('❌ Google API Client 初期化エラー:', error);
            throw error;
        }
    },
    
    // 認証実行（Redirect Flow）
    // requestAccessToken() を呼ぶとGoogleの認可ページへリダイレクトされる。
    // 認可後は login.html#access_token=... に戻ってくるため、
    // この関数はリダイレクトを開始するだけ（戻り値なし）。
    authenticate: function() {
        console.log('🔐 Google認証開始（Redirect Flow）...');

        if (!this.isInitialized) {
            throw new Error('Google Drive API が初期化されていません');
        }

        // Googleの認可ページへリダイレクト（ポップアップなし）
        this.tokenClient.requestAccessToken({ prompt: '' });
        // ↑ この行の実行後、ブラウザはGoogleへ遷移するため以降は実行されない
    },

    // アクセストークンをセットアップ（リダイレクト後にlogin.htmlから呼ばれる）
    setupWithToken: async function(accessToken) {
        console.log('🔑 トークンからセットアップ開始...');

        this.accessToken = accessToken;
        this.isAuthenticated = true;

        // gapi.client にもトークンをセット
        if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: accessToken });
        }

        // localStorage に保存
        localStorage.setItem('google_access_token', accessToken);
        localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

        // ユーザー情報を取得して返す
        const userInfo = await this.getUserInfo();
        this.userInfo = userInfo;
        console.log('✅ セットアップ完了:', userInfo.email);
        return userInfo;
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
            
            return {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            };
            
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            throw error;
        }
    },
    
    // 🔍 スプレッドシート検索（新規追加）
    searchSpreadsheets: async function(nameQuery) {
        try {
            console.log('🔍 スプレッドシート検索開始:', nameQuery);
            
            if (!this.isAuthenticated || !this.accessToken) {
                throw new Error('認証が完了していません');
            }
            
            if (!window.gapi?.client?.drive) {
                throw new Error('Google Drive APIが初期化されていません');
            }
            
            // Google Drive APIでスプレッドシートを検索
            const response = await window.gapi.client.drive.files.list({
                q: `name contains '${nameQuery}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
                fields: 'files(id, name, createdTime, modifiedTime)',
                orderBy: 'modifiedTime desc',
                pageSize: 10
            });
            
            const files = response.result.files || [];
            console.log(`✅ ${files.length}件のスプレッドシートを発見`);
            
            return files;
            
        } catch (error) {
            console.error('❌ スプレッドシート検索エラー:', error);
            throw error;
        }
    }
};

console.log('✅ Google Drive API v2 準備完了（Google Sheets対応 + searchSpreadsheets）');
