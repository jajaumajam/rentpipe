// 📊 Google Sheets API 管理システム（完全初期化対応版 + isActive/archivedAt対応 + 修正版）
console.log('📊 Google Sheets API 初期化中...');

window.GoogleSheetsAPI = {
    // 設定
    config: {
        clientId: '586040985916-r5v9q1242tiplplj0p5p9f664c70ipjj.apps.googleusercontent.com',
        scopes: [
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
    OLD_SHEET_NAME: '顧客データ',  // 旧シート名
    
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
                apiKey: '',
                discoveryDocs: this.config.discoveryDocs
            });
            
            // ステップ4: gapi.client.sheetsの完全な初期化を待機（強化版）
            console.log('⏳ gapi.client.sheets 完全初期化待機中...');
            let retries = 0;
            const maxRetries = 40;
            
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
                await window.gapi.client.request({
                    path: 'https://www.googleapis.com/oauth2/v1/userinfo',
                    method: 'GET'
                });
                
                this.isAuthenticated = true;
                console.log('✅ Sheets API 認証完了・テスト成功');
                return true;
                
            } catch (testError) {
                console.warn('⚠️ 認証テスト失敗（処理継続）:', testError.message);
                this.isAuthenticated = true;
                return true;
            }
            
        } catch (error) {
            console.error('❌ アクセストークン設定エラー:', error);
            return false;
        }
    },
    
    // シート名修正（旧シート名を新シート名に変更）
    fixSheetName: async function(spreadsheetId) {
        try {
            console.log('🔧 シート名確認・修正中...');
            
            // スプレッドシート情報取得
            const response = await window.gapi.client.sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId
            });
            
            const sheets = response.result.sheets || [];
            console.log('📋 既存シート:', sheets.map(s => s.properties.title));
            
            // 旧シート名（顧客データ）を探す
            const oldSheet = sheets.find(s => s.properties.title === this.OLD_SHEET_NAME);
            
            if (oldSheet) {
                console.log('🔄 旧シート名を発見 - 修正します:', this.OLD_SHEET_NAME);
                
                // シート名を変更
                await window.gapi.client.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: spreadsheetId,
                    resource: {
                        requests: [{
                            updateSheetProperties: {
                                properties: {
                                    sheetId: oldSheet.properties.sheetId,
                                    title: this.SHEET_NAME
                                },
                                fields: 'title'
                            }
                        }]
                    }
                });
                
                console.log('✅ シート名を修正しました:', this.OLD_SHEET_NAME, '→', this.SHEET_NAME);
                return true;
            }
            
            // 新シート名が既に存在するか確認
            const newSheet = sheets.find(s => s.properties.title === this.SHEET_NAME);
            if (newSheet) {
                console.log('✅ 正しいシート名が既に存在します:', this.SHEET_NAME);
                return true;
            }
            
            console.log('ℹ️ シート名修正不要');
            return true;
            
        } catch (error) {
            console.error('❌ シート名修正エラー:', error);
            return false;
        }
    },
    
    // スプレッドシート作成（待機強化版 + 英語シート名 + isActive/archivedAt対応）
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
                        title: this.SHEET_NAME,
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
            
            // 🔧 ヘッダー行を作成（isActive, archivedAt対応）
            console.log('📋 ヘッダー行を作成中...');
            const headers = [
                ['id', 'name', 'email', 'phone', 'pipelineStatus', 'preferences', 'notes', 'isActive', 'archivedAt', 'createdAt', 'updatedAt']
            ];
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${this.SHEET_NAME}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: headers
                }
            });
            console.log('✅ ヘッダー行作成完了');
            
            return {
                spreadsheetId: spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            };
            
        } catch (error) {
            console.error('❌ スプレッドシート作成エラー:', error);
            throw error;
        }
    },
    
    // 🔧 データ読み込み（修正版 - 範囲指定対応）
    readData: async function(range = 'A:K') {
        try {
            if (!this.spreadsheetId) {
                const savedId = this.loadSpreadsheetId();
                if (!savedId) {
                    throw new Error('スプレッドシートIDが設定されていません');
                }
                this.spreadsheetId = savedId;
            }
            
            // シート名を修正（旧シート名があれば）
            await this.fixSheetName(this.spreadsheetId);
            
            console.log('📖 Google Sheetsからデータ読み込み中...', `${this.SHEET_NAME}!${range}`);
            
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!${range}`
            });
            
            const rows = response.result.values || [];
            
            console.log('✅ データ読み込み完了:', rows.length, '行（ヘッダー含む）');
            
            // 🔧 生データをそのまま返す（配列の配列）
            return rows;
            
        } catch (error) {
            console.error('❌ データ読み込みエラー:', error);
            return [];
        }
    },
    
    // データ書き込み（シート名自動修正付き + isActive/archivedAt対応）
    writeData: async function(customers) {
        try {
            if (!this.spreadsheetId) {
                throw new Error('スプレッドシートIDが設定されていません');
            }
            
            // シート名を修正（旧シート名があれば）
            await this.fixSheetName(this.spreadsheetId);
            
            console.log('📝 Google Sheetsにデータ書き込み中:', customers.length, '件');
            
            // 🔧 ヘッダー行（isActive, archivedAt対応）
            const headers = ['id', 'name', 'email', 'phone', 'pipelineStatus', 'preferences', 'notes', 'isActive', 'archivedAt', 'createdAt', 'updatedAt'];
            
            // 🔧 データ行（isActive, archivedAt対応）
            const rows = customers.map(customer => [
                customer.id || '',
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                customer.pipelineStatus || '',
                JSON.stringify(customer.preferences || {}),
                customer.notes || '',
                customer.isActive !== false ? 'TRUE' : 'FALSE', // 🔧 Boolean → 文字列
                customer.archivedAt || '', // 🔧 日時またはnull
                customer.createdAt || '',
                customer.updatedAt || ''
            ]);
            
            // ヘッダー + データ
            const values = [headers, ...rows];
            
            // スプレッドシートに書き込み
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A1`,
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

console.log('✅ Google Sheets API 準備完了（シート名自動修正機能 + isActive/archivedAt対応）');
