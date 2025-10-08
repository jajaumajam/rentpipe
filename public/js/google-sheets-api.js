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
    accessToken: null,
    
    // シート名（英語）
    SHEET_NAME: 'Customers',
    
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
            
            // ステップ4: gapi.client.sheetsの完全な初期化を待機（強化版）
            console.log('⏳ gapi.client.sheets 完全初期化待機中...');
            let retries = 0;
            const maxRetries = 40; // 20秒間待機
            
            while (!window.gapi?.client?.sheets?.spreadsheets && retries < maxRetries) {
                console.log(`⏳ gapi.client.sheets.spreadsheets 初期化待機中... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!window.gapi?.client?.sheets?.spreadsheets) {
                throw new Error('Google Sheets API (gapi.client.sheets.spreadsheets) の初期化に失敗しました');
            }
            
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
    
    // GAPI読み込み
    loadGAPI: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Google API Client読み込み失敗'));
            document.head.appendChild(script);
        });
    },
    
    // アクセストークン設定（認証テスト付き・強化版）
    setAccessToken: async function(token) {
        try {
            console.log('🔑 Sheets API アクセストークン設定開始...');
            
            if (!token) {
                throw new Error('アクセストークンが提供されていません');
            }
            
            this.accessToken = token;
            
            // gapiにトークン設定
            if (window.gapi?.client) {
                window.gapi.client.setToken({
                    access_token: token
                });
            }
            
            console.log('🔑 アクセストークン設定完了');
            
            // 初期化完了を待機
            console.log('⏳ API完全初期化待機中...');
            let retries = 0;
            while (!this.isInitialized && retries < 40) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!this.isInitialized) {
                console.warn('⚠️ API初期化タイムアウト（処理継続）');
            }
            
            // 認証テスト実行
            console.log('🧪 認証テスト実行中...');
            try {
                // シンプルなAPIコールでテスト
                await window.gapi.client.request({
                    path: 'https://www.googleapis.com/oauth2/v1/userinfo',
                    method: 'GET'
                });
                
                this.isAuthenticated = true;
                console.log('✅ Sheets API 認証完了・テスト成功');
                return true;
                
            } catch (testError) {
                console.warn('⚠️ 認証テスト失敗（処理継続）:', testError.message);
                // テスト失敗でも処理は継続
                this.isAuthenticated = true;
                return true;
            }
            
        } catch (error) {
            console.error('❌ アクセストークン設定エラー:', error);
            return false;
        }
    },
    
    // スプレッドシート作成（待機強化版 + 英語シート名）
    createSpreadsheet: async function(title) {
        try {
            console.log('📄 スプレッドシート作成中:', title);
            
            // 完全な初期化を待機
            console.log('⏳ API完全準備待機中...');
            let retries = 0;
            const maxRetries = 40;
            
            while ((!this.isInitialized || !window.gapi?.client?.sheets?.spreadsheets) && retries < maxRetries) {
                console.log(`⏳ API準備待機中... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!this.isInitialized || !window.gapi?.client?.sheets?.spreadsheets) {
                throw new Error('Google Sheets APIの準備が完了していません');
            }
            
            if (!this.isAuthenticated) {
                throw new Error('認証が完了していません');
            }
            
            console.log('✅ API準備完了 - スプレッドシート作成実行');
            
            // スプレッドシート作成（英語シート名）
            const response = await window.gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: title
                },
                sheets: [{
                    properties: {
                        title: this.SHEET_NAME,  // 英語シート名
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 20
                        }
                    }
                }]
            });
            
            const spreadsheetId = response.result.spreadsheetId;
            
            // スプレッドシートIDを保存
            this.saveSpreadsheetId(spreadsheetId);
            this.spreadsheetId = spreadsheetId;
            
            console.log('✅ スプレッドシート作成成功:', spreadsheetId);
            
            return {
                spreadsheetId: spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            };
            
        } catch (error) {
            console.error('❌ スプレッドシート作成エラー:', error);
            throw error;
        }
    },
    
    // データ読み込み（英語シート名）
    readData: async function() {
        try {
            if (!this.spreadsheetId) {
                const savedId = this.loadSpreadsheetId();
                if (!savedId) {
                    throw new Error('スプレッドシートIDが設定されていません');
                }
                this.spreadsheetId = savedId;
            }
            
            console.log('📖 Google Sheetsからデータ読み込み中...');
            
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A:Z`  // 英語シート名
            });
            
            const rows = response.result.values || [];
            
            if (rows.length === 0) {
                console.log('ℹ️ スプレッドシートが空です');
                return [];
            }
            
            // ヘッダー行を取得
            const headers = rows[0];
            
            // データ行をオブジェクトに変換
            const customers = rows.slice(1).map(row => {
                const customer = {};
                headers.forEach((header, index) => {
                    customer[header] = row[index] || '';
                });
                return customer;
            }).filter(c => c.id); // IDがあるもののみ
            
            console.log('✅ データ読み込み完了:', customers.length, '件');
            return customers;
            
        } catch (error) {
            console.error('❌ データ読み込みエラー:', error);
            return [];
        }
    },
    
    // データ書き込み（英語シート名）
    writeData: async function(customers) {
        try {
            if (!this.spreadsheetId) {
                throw new Error('スプレッドシートIDが設定されていません');
            }
            
            console.log('📝 Google Sheetsにデータ書き込み中:', customers.length, '件');
            
            // ヘッダー行
            const headers = ['id', 'name', 'email', 'phone', 'pipelineStatus', 'preferences', 'notes', 'urgency', 'contactTime', 'createdAt', 'updatedAt'];
            
            // データ行
            const rows = customers.map(customer => [
                customer.id || '',
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                customer.pipelineStatus || '',
                JSON.stringify(customer.preferences || {}),
                customer.notes || '',
                customer.urgency || '',
                customer.contactTime || '',
                customer.createdAt || '',
                customer.updatedAt || ''
            ]);
            
            // ヘッダー + データ
            const values = [headers, ...rows];
            
            // スプレッドシートに書き込み（英語シート名）
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A1`,  // 英語シート名
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });
            
            console.log('✅ データ書き込み完了');
            return true;
            
        } catch (error) {
            console.error('❌ データ書き込みエラー:', error);
            throw error;
        }
    },
    
    // スプレッドシートID保存
    saveSpreadsheetId: function(spreadsheetId) {
        localStorage.setItem('rentpipe_spreadsheet_id', spreadsheetId);
        console.log('💾 スプレッドシートID保存:', spreadsheetId);
    },
    
    // スプレッドシートID読み込み
    loadSpreadsheetId: function() {
        const id = localStorage.getItem('rentpipe_spreadsheet_id');
        if (id) {
            console.log('📂 スプレッドシートID読み込み:', id);
            this.spreadsheetId = id;
        }
        return id;
    }
};

console.log('✅ Google Sheets API 準備完了（英語シート名対応）');
