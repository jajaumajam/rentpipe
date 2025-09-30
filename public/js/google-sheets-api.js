// 📊 Google Sheets API 管理システム（完全初期化対応版）
console.log('📊 Google Sheets API 初期化中...');

window.GoogleSheetsAPI = {
    // 設定
    config: {
        clientId: '586040985916-r5v9q1242tiplplj0p5p9f664c70ipjj.apps.googleusercontent.com',
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ],
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    },
    
    // 状態
    isInitialized: false,
    isAuthenticated: false,
    spreadsheetId: null,
    
    // 完全初期化（強化版）
    initialize: async function() {
        try {
            console.log('🔧 Google Sheets API 完全初期化開始...');
            
            // ステップ1: Google API Client確認・読み込み
            if (!window.gapi) {
                console.log('⏳ Google API Client 読み込み中...');
                await this.loadGAPI();
            }
            
            // ステップ2: gapi.client初期化
            if (!window.gapi.client) {
                console.log('⏳ gapi.client 初期化中...');
                await new Promise((resolve, reject) => {
                    window.gapi.load('client', {
                        callback: resolve,
                        onerror: reject
                    });
                });
            }
            
            // ステップ3: Sheets API Discovery Document読み込み
            console.log('⏳ Google Sheets API Discovery Document 読み込み中...');
            await window.gapi.client.init({
                apiKey: '', // APIキーは不要（OAuth認証を使用）
                discoveryDocs: this.config.discoveryDocs
            });
            
            // ステップ4: gapi.client.sheetsの完全な初期化を待機
            console.log('⏳ gapi.client.sheets 完全初期化待機中...');
            let retries = 0;
            const maxRetries = 30; // 15秒間待機
            
            while (!window.gapi?.client?.sheets && retries < maxRetries) {
                console.log(`⏳ gapi.client.sheets 初期化待機中... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!window.gapi?.client?.sheets) {
                throw new Error('Google Sheets API (gapi.client.sheets) の初期化がタイムアウトしました');
            }
            
            // ステップ5: 初期化完了確認
            console.log('✅ gapi.client.sheets 初期化完了確認');
            this.isInitialized = true;
            console.log('✅ Google Sheets API 完全初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets API 初期化エラー:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    // Google API Client ライブラリ読み込み
    loadGAPI: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
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
    
    // アクセストークン設定（強化版）
    setAccessToken: async function(token) {
        try {
            console.log('🔑 Sheets API アクセストークン設定開始...');
            
            // 初期化確認
            if (!this.isInitialized) {
                console.log('⚠️ Google Sheets API未初期化 - 初期化を実行...');
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Google Sheets API初期化に失敗');
                }
            }
            
            // gapi.clientが利用可能か確認
            if (!window.gapi?.client) {
                throw new Error('gapi.client が利用できません');
            }
            
            // アクセストークン設定
            window.gapi.client.setToken({ access_token: token });
            console.log('🔑 アクセストークン設定完了');
            
            // 認証テスト（簡単なAPI呼び出しで確認）
            console.log('🧪 認証テスト実行中...');
            await this.testAuthentication();
            
            this.isAuthenticated = true;
            console.log('✅ Sheets API 認証完了・テスト成功');
            return true;
            
        } catch (error) {
            console.error('❌ Sheets API アクセストークン設定エラー:', error);
            this.isAuthenticated = false;
            return false;
        }
    },
    
    // 認証テスト
    testAuthentication: async function() {
        try {
            // 空のリクエストでテスト
            const response = await window.gapi.client.request({
                path: 'https://www.googleapis.com/drive/v3/about',
                params: { fields: 'user' }
            });
            
            if (response.status === 200) {
                console.log('✅ 認証テスト成功:', response.result.user?.emailAddress);
                return true;
            } else {
                throw new Error('認証テスト失敗');
            }
            
        } catch (error) {
            console.error('❌ 認証テストエラー:', error);
            throw error;
        }
    },
    
    // 完全な準備状態確認
    isFullyReady: function() {
        return this.isInitialized && 
               this.isAuthenticated && 
               window.gapi?.client?.sheets;
    },
    
    // スプレッドシート作成
    createSpreadsheet: async function(title) {
        try {
            console.log('📄 スプレッドシート作成中:', title);
            
            if (!this.isFullyReady()) {
                throw new Error('Google Sheets APIの準備が完了していません');
            }
            
            const response = await window.gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: title
                },
                sheets: [
                    {
                        properties: {
                            title: '顧客マスター',
                            gridProperties: {
                                frozenRowCount: 1
                            }
                        }
                    },
                    {
                        properties: {
                            title: 'パイプライン状態'
                        }
                    }
                ]
            });
            
            const spreadsheetId = response.result.spreadsheetId;
            this.spreadsheetId = spreadsheetId;
            
            // ヘッダー行作成
            await this.setupHeaders(spreadsheetId);
            
            // スプレッドシートIDを保存
            this.saveSpreadsheetId(spreadsheetId);
            
            console.log('✅ スプレッドシート作成完了:', spreadsheetId);
            return spreadsheetId;
            
        } catch (error) {
            console.error('❌ スプレッドシート作成エラー:', error);
            throw error;
        }
    },
    
    // ヘッダー行設定
    setupHeaders: async function(spreadsheetId) {
        try {
            console.log('📝 ヘッダー行設定中...');
            
            const headers = [
                ['ID', '顧客名', 'メール', '電話番号', 'パイプライン状態', '作成日', '更新日', '備考']
            ];
            
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: '顧客マスター!A1:H1',
                valueInputOption: 'RAW',
                resource: {
                    values: headers
                }
            });
            
            console.log('✅ ヘッダー行設定完了');
            
        } catch (error) {
            console.error('❌ ヘッダー行設定エラー:', error);
            throw error;
        }
    },
    
    // データ書き込み
    writeData: async function(data, range = '顧客マスター!A2:H') {
        try {
            console.log('📝 データ書き込み中...', data.length, '件');
            
            if (!this.isFullyReady()) {
                throw new Error('Google Sheets APIの準備が完了していません');
            }
            
            if (!this.spreadsheetId) {
                throw new Error('スプレッドシートIDが設定されていません');
            }
            
            const values = data.map(customer => [
                customer.id || '',
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                customer.pipelineStatus || '',
                customer.createdAt || '',
                customer.updatedAt || '',
                customer.notes || ''
            ]);
            
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });
            
            console.log('✅ データ書き込み完了');
            
        } catch (error) {
            console.error('❌ データ書き込みエラー:', error);
            throw error;
        }
    },
    
    // データ読み込み
    readData: async function(range = '顧客マスター!A2:H') {
        try {
            console.log('📖 データ読み込み中...');
            
            if (!this.isFullyReady()) {
                throw new Error('Google Sheets APIの準備が完了していません');
            }
            
            if (!this.spreadsheetId) {
                throw new Error('スプレッドシートIDが設定されていません');
            }
            
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });
            
            const rows = response.result.values || [];
            const customers = rows.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                email: row[2] || '',
                phone: row[3] || '',
                pipelineStatus: row[4] || '',
                createdAt: row[5] || '',
                updatedAt: row[6] || '',
                notes: row[7] || ''
            }));
            
            console.log('✅ データ読み込み完了:', customers.length, '件');
            return customers;
            
        } catch (error) {
            console.error('❌ データ読み込みエラー:', error);
            throw error;
        }
    },
    
    // スプレッドシートID保存
    saveSpreadsheetId: function(spreadsheetId) {
        localStorage.setItem('rentpipe_spreadsheet_id', spreadsheetId);
        this.spreadsheetId = spreadsheetId;
        console.log('💾 スプレッドシートID保存:', spreadsheetId);
    },
    
    // スプレッドシートID読み込み
    loadSpreadsheetId: function() {
        const savedId = localStorage.getItem('rentpipe_spreadsheet_id');
        if (savedId) {
            this.spreadsheetId = savedId;
            console.log('📖 スプレッドシートID読み込み:', savedId);
        }
        return savedId;
    },
    
    // デバッグ情報
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            isAuthenticated: this.isAuthenticated,
            isFullyReady: this.isFullyReady(),
            spreadsheetId: this.spreadsheetId,
            hasGAPI: !!window.gapi,
            hasGAPIClient: !!window.gapi?.client,
            hasGAPISheets: !!window.gapi?.client?.sheets
        };
    }
};

console.log('✅ Google Sheets API 準備完了');
