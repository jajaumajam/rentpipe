// Google Sheets統合管理（可変同期間隔 + 完全連携 + アクティブ/非アクティブ対応 + 修正版）
window.UnifiedSheetsManager = {
    isEnabled: false,
    spreadsheetId: null,
    sheetName: 'Customers',
    lastSyncTime: null,
    syncTimer: null,
    debounceTimer: null,
    currentSyncInterval: 120000, // 2分
    
    // ステータス取得関数
    getStatus: function() {
        return {
            isEnabled: this.isEnabled,
            spreadsheetId: this.spreadsheetId,
            lastSyncTime: this.lastSyncTime,
            currentSyncInterval: this.currentSyncInterval
        };
    },
    
    async initialize() {
        console.log('🔧 Google Sheets統合マネージャー初期化開始...');
        
        const checkInterval = setInterval(async () => {
            const allSystemsReady = {
                sheetsAPI: window.GoogleSheetsAPI !== undefined,
                sheetsInitialized: window.GoogleSheetsAPI?.isInitialized === true,
                sheetsAuthenticated: window.GoogleSheetsAPI?.isAuthenticated === true,
                driveAPI: window.GoogleDriveAPIv2 !== undefined,
                driveInitialized: window.GoogleDriveAPIv2?.isInitialized === true,
                driveAuthenticated: window.GoogleDriveAPIv2?.isAuthenticated === true,
                unifiedDataManager: window.UnifiedDataManager !== undefined
            };
            
            console.log('🔍 システム準備状態:', allSystemsReady);
            
            if (Object.values(allSystemsReady).every(v => v === true)) {
                clearInterval(checkInterval);
                console.log('✅ すべてのシステム準備完了');
                
                this.spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
                
                if (!this.spreadsheetId) {
                    console.log('⚠️ スプレッドシートIDが見つかりません。検索または作成します...');
                    
                    try {
                        const spreadsheets = await window.GoogleDriveAPIv2.searchSpreadsheets('RentPipe_Customers');
                        
                        if (spreadsheets && spreadsheets.length > 0) {
                            this.spreadsheetId = spreadsheets[0].id;
                            console.log('✅ 既存スプレッドシート発見:', this.spreadsheetId);
                            localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                        } else {
                            console.log('ℹ️ 既存スプレッドシートが見つかりません。新規作成します...');
                            const newSpreadsheet = await window.GoogleSheetsAPI.createSpreadsheet('RentPipe_Customers');
                            
                            if (newSpreadsheet && newSpreadsheet.spreadsheetId) {
                                this.spreadsheetId = newSpreadsheet.spreadsheetId;
                                console.log('✅ 新規スプレッドシート作成成功:', this.spreadsheetId);
                                localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                            }
                        }
                    } catch (error) {
                        console.error('❌ スプレッドシート検索・作成エラー:', error);
                    }
                }
                
                if (allSystemsReady.sheetsAPI && 
                    allSystemsReady.sheetsInitialized && 
                    allSystemsReady.sheetsAuthenticated && 
                    allSystemsReady.driveAPI && 
                    allSystemsReady.driveInitialized &&
                    allSystemsReady.driveAuthenticated &&
                    allSystemsReady.unifiedDataManager &&
                    this.spreadsheetId) {
                    
                    this.isEnabled = true;
                    console.log('✅ Google Sheets統合有効化完了');
                    
                    this.startPeriodicSync();
                    await this.syncFromSheetsToLocal();
                } else {
                    console.log('⚠️ 一部システムが準備できていないため、LocalStorageモードで動作します');
                }
            }
        }, 500);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!this.isEnabled) {
                console.log('⏱️ 初期化タイムアウト - LocalStorageモードで動作します');
            }
        }, 30000);
    },
    
    // 🔧 Google Sheetsからデータ読み込み（修正版）
    async syncFromSheetsToLocal() {
        if (!this.isEnabled) {
            console.log('ℹ️ Google Sheets統合が無効です');
            return;
        }
        
        try {
            console.log('☁️ Google Sheetsからデータ読み込み中...');
            
            // データを読み込み（A1:K を指定して全データ取得）
            const rows = await window.GoogleSheetsAPI.readData('A1:K');
            
            if (!rows || rows.length === 0) {
                console.log('ℹ️ Google Sheetsにデータがありません');
                return;
            }
            
            console.log('📥 Google Sheetsから', rows.length, '行取得（ヘッダー含む）');
            
            // 🔧 ヘッダー行を取得（1行目）
            const headers = rows[0];
            console.log('📋 ヘッダー:', headers);
            
            // 🔧 データ行（2行目以降）をオブジェクトに変換
            const customers = rows.slice(1).map((row, index) => {
                try {
                    // preferences のパース
                    let preferences = {};
                    if (row[5]) {
                        try {
                            preferences = JSON.parse(row[5]);
                        } catch (e) {
                            console.warn('preferences パースエラー:', row[5]);
                        }
                    }
                    
                    // isActiveの変換
                    let isActive = true;
                    if (row[7] === 'FALSE' || row[7] === false) {
                        isActive = false;
                    }
                    
                    const customer = {
                        id: row[0] || '',
                        name: row[1] || '',
                        email: row[2] || '',
                        phone: row[3] || '',
                        pipelineStatus: row[4] || '初回相談',
                        preferences: preferences,
                        notes: row[6] || '',
                        isActive: isActive,
                        archivedAt: row[8] || null,
                        createdAt: row[9] || '',
                        updatedAt: row[10] || ''
                    };
                    
                    console.log(`🔍 顧客データ変換 [${index + 1}]:`, {
                        id: customer.id,
                        name: customer.name,
                        isActive: customer.isActive
                    });
                    
                    return customer;
                } catch (error) {
                    console.error('❌ データ変換エラー:', error, row);
                    return null;
                }
            }).filter(c => c !== null && c.id); // idが存在するもののみ
            
            console.log('✅ 変換完了:', customers.length, '件');
            
            // LocalStorageに保存
            window.UnifiedDataManager.saveCustomers(customers);
            
            this.lastSyncTime = new Date();
            console.log('✅ Google Sheets → LocalStorage 同期完了:', customers.length, '件');
            
            // データ更新イベント発火
            window.UnifiedDataManager.notifyDataChanged();
            
        } catch (error) {
            console.error('❌ Google Sheets読み込みエラー:', error);
        }
    },
    
    // 定期同期開始
    startPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        console.log(`⏰ 定期同期開始（${this.currentSyncInterval / 1000}秒間隔）`);
        
        this.syncTimer = setInterval(async () => {
            console.log('🔄 定期同期実行');
            await this.syncFromSheetsToLocal();
        }, this.currentSyncInterval);
    },
    
    // デバウンス同期スケジュール
    scheduleDebouncedSync() {
        if (!this.isEnabled) return;
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        console.log('📅 15秒後に逆同期をスケジュール');
        
        this.debounceTimer = setTimeout(async () => {
            console.log('🔄 デバウンス同期実行（Google Sheets → LocalStorage）');
            await this.syncFromSheetsToLocal();
        }, 15000);
    }
};

// 初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.UnifiedSheetsManager.initialize();
    });
} else {
    window.UnifiedSheetsManager.initialize();
}

console.log('✅ Google Sheets統合マネージャー準備完了');
