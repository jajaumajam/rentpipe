/**
 * 統合Google Sheetsマネージャー (拡張版)
 * 顧客入力項目拡充に対応
 */

const UnifiedSheetsManager = {
    SPREADSHEET_NAME: 'RentPipe顧客管理',
    SHEET_NAME: 'customers',
    spreadsheetId: null,

    /**
     * スプレッドシートを初期化
     */
    initSpreadsheet: async function() {
        try {
            // 既存のスプレッドシートを検索
            const response = await gapi.client.drive.files.list({
                q: `name='${this.SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                this.spreadsheetId = response.result.files[0].id;
                console.log('既存のスプレッドシートを使用:', this.spreadsheetId);
                
                // ヘッダー行を確認・更新
                await this.ensureHeaders();
                
                return { success: true, spreadsheetId: this.spreadsheetId };
            } else {
                // 新規作成
                return await this.createSpreadsheet();
            }
        } catch (error) {
            console.error('スプレッドシート初期化エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 新規スプレッドシートを作成
     */
    createSpreadsheet: async function() {
        try {
            const response = await gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: this.SPREADSHEET_NAME
                },
                sheets: [{
                    properties: {
                        title: this.SHEET_NAME
                    }
                }]
            });

            this.spreadsheetId = response.result.spreadsheetId;
            console.log('新規スプレッドシート作成:', this.spreadsheetId);

            // ヘッダー行を設定
            await this.setupHeaders();

            return { success: true, spreadsheetId: this.spreadsheetId };
        } catch (error) {
            console.error('スプレッドシート作成エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ヘッダー行を設定（新規作成時）
     */
    setupHeaders: async function() {
        const headers = [
            'id',
            'name',
            'nameKana',
            'email',
            'phone',
            'basicInfo',
            'preferences',
            'equipment',
            'additionalInfo',
            'agentMemo',
            'pipelineStatus',
            'isActive',
            'archivedAt',
            'createdAt',
            'updatedAt'
        ];

        try {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A1:O1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });

            console.log('ヘッダー行を設定しました');
            return { success: true };
        } catch (error) {
            console.error('ヘッダー設定エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ヘッダー行を確認・更新（既存シート用）
     */
    ensureHeaders: async function() {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A1:O1`
            });

            const currentHeaders = response.result.values ? response.result.values[0] : [];
            const expectedHeaders = [
                'id',
                'name',
                'nameKana',
                'email',
                'phone',
                'basicInfo',
                'preferences',
                'equipment',
                'additionalInfo',
                'agentMemo',
                'pipelineStatus',
                'isActive',
                'archivedAt',
                'createdAt',
                'updatedAt'
            ];

            // ヘッダーが古い形式の場合は更新
            if (JSON.stringify(currentHeaders) !== JSON.stringify(expectedHeaders)) {
                console.log('ヘッダー行を更新します');
                await this.setupHeaders();
            }

            return { success: true };
        } catch (error) {
            console.error('ヘッダー確認エラー:', error);
            // ヘッダーがない場合は新規作成
            await this.setupHeaders();
            return { success: true };
        }
    },

    /**
     * 顧客データをシートに同期
     */
    syncToSheets: async function(customers) {
        if (!this.spreadsheetId) {
            const initResult = await this.initSpreadsheet();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            // データマイグレーション
            if (window.DataMigration) {
                customers = DataMigration.migrateAllCustomers(customers);
            }

            // データを行形式に変換
            const rows = customers.map(customer => this.customerToRow(customer));

            // ヘッダー行 + データ行
            const values = [
                [
                    'id',
                    'name',
                    'nameKana',
                    'email',
                    'phone',
                    'basicInfo',
                    'preferences',
                    'equipment',
                    'additionalInfo',
                    'agentMemo',
                    'pipelineStatus',
                    'isActive',
                    'archivedAt',
                    'createdAt',
                    'updatedAt'
                ],
                ...rows
            ];

            // シート全体をクリアして書き込み
            await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: this.SHEET_NAME
            });

            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.SHEET_NAME}!A1`,
                valueInputOption: 'RAW',
                resource: { values }
            });

            console.log(`✅ ${customers.length}件の顧客データを同期しました`);
            return { success: true, count: customers.length };
        } catch (error) {
            console.error('同期エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * シートからデータを読み込み
     */
    loadFromSheets: async function() {
        if (!this.spreadsheetId) {
            const initResult = await this.initSpreadsheet();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.SHEET_NAME
            });

            const rows = response.result.values;
            if (!rows || rows.length <= 1) {
                console.log('データが存在しません');
                return { success: true, customers: [] };
            }

            // ヘッダー行をスキップしてデータ行を変換
            const customers = rows.slice(1).map(row => this.rowToCustomer(row));

            // データマイグレーション
            const migratedCustomers = window.DataMigration 
                ? DataMigration.migrateAllCustomers(customers)
                : customers;

            console.log(`✅ ${migratedCustomers.length}件の顧客データを読み込みました`);
            return { success: true, customers: migratedCustomers };
        } catch (error) {
            console.error('読み込みエラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 顧客オブジェクトを行データに変換
     */
    customerToRow: function(customer) {
        return [
            customer.id || '',
            customer.basicInfo?.name || '',
            customer.basicInfo?.nameKana || '',
            customer.basicInfo?.email || '',
            customer.basicInfo?.phone || '',
            JSON.stringify(customer.basicInfo || {}),
            JSON.stringify(customer.preferences || {}),
            JSON.stringify(customer.equipment || {}),
            JSON.stringify(customer.additionalInfo || {}),
            customer.agentMemo || '',
            customer.pipelineStatus || '初回相談',
            customer.isActive !== false ? 'TRUE' : 'FALSE',
            customer.archivedAt || '',
            customer.createdAt || '',
            customer.updatedAt || ''
        ];
    },

    /**
     * 行データを顧客オブジェクトに変換
     */
    rowToCustomer: function(row) {
        try {
            const customer = {
                id: row[0] || '',
                basicInfo: this.parseJSON(row[5], {
                    name: row[1] || '',
                    nameKana: row[2] || '',
                    email: row[3] || '',
                    phone: row[4] || ''
                }),
                preferences: this.parseJSON(row[6], {}),
                equipment: this.parseJSON(row[7], {}),
                additionalInfo: this.parseJSON(row[8], {}),
                agentMemo: row[9] || '',
                pipelineStatus: row[10] || '初回相談',
                isActive: row[11] !== 'FALSE',
                archivedAt: row[12] || null,
                createdAt: row[13] || new Date().toISOString(),
                updatedAt: row[14] || new Date().toISOString()
            };

            return customer;
        } catch (error) {
            console.error('行変換エラー:', error, row);
            return null;
        }
    },

    /**
     * JSON文字列を安全にパース
     */
    parseJSON: function(str, defaultValue = {}) {
        if (!str) return defaultValue;
        try {
            return JSON.parse(str);
        } catch (error) {
            console.warn('JSON parse error:', error, str);
            return defaultValue;
        }
    },

    /**
     * スプレッドシートのURLを取得
     */
    getSpreadsheetUrl: function() {
        if (!this.spreadsheetId) return null;
        return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
    }
};

// グローバルに公開
window.UnifiedSheetsManager = UnifiedSheetsManager;

console.log('✅ UnifiedSheetsManager (拡張版) loaded');
