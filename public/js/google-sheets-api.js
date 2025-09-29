// 📊 Google Sheets API 管理システム
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
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Sheets API 初期化開始...');
            
            // Google API Client がまだ読み込まれていない場合は待つ
            if (!window.gapi) {
                console.log('⏳ Google API Client 待機中...');
                await this.loadGAPI();
            }
            
            // gapi.client の初期化
            await new Promise((resolve, reject) => {
                window.gapi.load('client', {
                    callback: resolve,
                    onerror: reject
                });
            });
            
            // Sheets API の設定
            await window.gapi.client.init({
                apiKey: '', // APIキーは不要（OAuth認証を使用）
                discoveryDocs: this.config.discoveryDocs
            });
            
            this.isInitialized = true;
            console.log('✅ Google Sheets API 初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets API 初期化エラー:', error);
            return false;
        }
    },
    
    // Google API Client ライブラリ読み込み
    loadGAPI: function() {
        return new Promise((resolve, reject) => {
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
    
    // アクセストークン設定
    setAccessToken: function(token) {
        if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: token });
            this.isAuthenticated = true;
            console.log('✅ Sheets API アクセストークン設定完了');
        }
    },
    
    // スプレッドシート作成
    createSpreadsheet: async function(title) {
        try {
            console.log('📄 スプレッドシート作成中:', title);
            
            if (!this.isAuthenticated) {
                throw new Error('認証が必要です');
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
                    },
                    {
                        properties: {
                            title: '活動履歴'
                        }
                    }
                ]
            });
            
            this.spreadsheetId = response.result.spreadsheetId;
            console.log('✅ スプレッドシート作成完了:', this.spreadsheetId);
            console.log('🔗 URL:', `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);
            
            // 初期データの設定
            await this.initializeSheetHeaders();
            
            return this.spreadsheetId;
            
        } catch (error) {
            console.error('❌ スプレッドシート作成エラー:', error);
            throw error;
        }
    },
    
    // シートヘッダー初期化
    initializeSheetHeaders: async function() {
        try {
            console.log('📝 シートヘッダー初期化中...');
            
            // 顧客マスターのヘッダー
            const customerHeaders = [
                'ID', '名前', 'メール', '電話', 'ステータス', 
                '予算下限', '予算上限', '希望エリア', '物件タイプ', '要望',
                '備考', '作成日時', '更新日時'
            ];
            
            // パイプライン状態のヘッダー
            const pipelineHeaders = [
                '顧客ID', 'ステージ', '移動日時', 'メモ'
            ];
            
            // 活動履歴のヘッダー
            const activityHeaders = [
                '顧客ID', '活動種類', '日付', '詳細'
            ];
            
            // ヘッダーを書き込み
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: [
                        {
                            range: '顧客マスター!A1:M1',
                            values: [customerHeaders]
                        },
                        {
                            range: 'パイプライン状態!A1:D1',
                            values: [pipelineHeaders]
                        },
                        {
                            range: '活動履歴!A1:D1',
                            values: [activityHeaders]
                        }
                    ]
                }
            });
            
            console.log('✅ シートヘッダー初期化完了');
            
        } catch (error) {
            console.error('❌ シートヘッダー初期化エラー:', error);
            throw error;
        }
    },
    
    // 顧客データ読み込み
    getCustomers: async function(spreadsheetId) {
        try {
            console.log('📖 顧客データ読み込み中...');
            
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId || this.spreadsheetId,
                range: '顧客マスター!A2:M'
            });
            
            const rows = response.result.values || [];
            console.log(`✅ 顧客データ読み込み完了: ${rows.length}件`);
            
            // 行データを顧客オブジェクトに変換
            const customers = rows.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                email: row[2] || '',
                phone: row[3] || '',
                pipelineStatus: row[4] || '見込み客',
                preferences: {
                    budgetMin: parseInt(row[5]) || 0,
                    budgetMax: parseInt(row[6]) || 0,
                    areas: row[7] ? row[7].split('・') : [],
                    roomType: row[8] || '',
                    requirements: row[9] ? row[9].split('・') : []
                },
                notes: row[10] || '',
                createdAt: row[11] || new Date().toISOString(),
                updatedAt: row[12] || new Date().toISOString()
            }));
            
            return customers;
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
            throw error;
        }
    },
    
    // 顧客データ保存
    saveCustomers: async function(customers, spreadsheetId) {
        try {
            console.log('💾 顧客データ保存中:', customers.length, '件');
            
            // 顧客データを行データに変換
            const rows = customers.map(customer => [
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
                customer.pipelineStatus,
                customer.preferences?.budgetMin || 0,
                customer.preferences?.budgetMax || 0,
                (customer.preferences?.areas || []).join('・'),
                customer.preferences?.roomType || '',
                (customer.preferences?.requirements || []).join('・'),
                customer.notes || '',
                customer.createdAt,
                customer.updatedAt
            ]);
            
            // データを書き込み
            await window.gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId || this.spreadsheetId,
                range: '顧客マスター!A2:M',
                valueInputOption: 'RAW',
                resource: {
                    values: rows
                }
            });
            
            console.log('✅ 顧客データ保存完了');
            return true;
            
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
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
        const spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
        if (spreadsheetId) {
            this.spreadsheetId = spreadsheetId;
            console.log('✅ スプレッドシートID読み込み:', spreadsheetId);
        }
        return spreadsheetId;
    }
};

console.log('✅ Google Sheets API システム準備完了');
