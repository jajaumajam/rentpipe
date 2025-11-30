// Google Sheets統合管理（可変同期間隔 + 完全連携 + アクティブ/非アクティブ対応）
window.UnifiedSheetsManager = {
    isEnabled: false,
    spreadsheetId: null,
    sheetName: 'Customers', // ⚠️ 英語のみ（日本語NG）
    lastSyncTime: null,
    syncTimer: null,
    debounceTimer: null,
    currentSyncInterval: 120000, // 2分（デフォルト）
    
    // 🆕 ステータス取得関数（app-initializer.jsから呼ばれる）
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
        
        // 必要なシステムの準備状態を確認
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
                
                // スプレッドシートIDの取得または作成
                this.spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
                
                if (!this.spreadsheetId) {
                    console.log('⚠️ スプレッドシートIDが見つかりません。検索または作成します...');
                    
                    try {
                        // スプレッドシートを検索
                        const spreadsheets = await window.GoogleDriveAPIv2.searchSpreadsheets('RentPipe_Customers');
                        
                        if (spreadsheets && spreadsheets.length > 0) {
                            this.spreadsheetId = spreadsheets[0].id;
                            console.log('✅ 既存スプレッドシート発見:', this.spreadsheetId);
                            console.log('📊 スプレッドシート名:', spreadsheets[0].name);
                            
                            // LocalStorageに保存
                            localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                            console.log('💾 スプレッドシートIDをLocalStorageに保存しました');
                        } else {
                            console.log('ℹ️ 既存スプレッドシートが見つかりません。新規作成します...');
                            
                            // 新規スプレッドシート作成
                            const newSpreadsheet = await window.GoogleDriveAPIv2.createSpreadsheet('RentPipe_Customers');
                            
                            if (newSpreadsheet && newSpreadsheet.spreadsheetId) {
                                this.spreadsheetId = newSpreadsheet.spreadsheetId;
                                console.log('✅ 新規スプレッドシート作成成功:', this.spreadsheetId);
                                console.log('📊 スプレッドシートURL:', newSpreadsheet.spreadsheetUrl);
                                
                                // LocalStorageに保存
                                localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                                console.log('💾 スプレッドシートIDをLocalStorageに保存しました');
                                
                                // 🔧 ヘッダー行を作成（isActive, archivedAt追加）
                                console.log('📋 ヘッダー行を作成中...');
                                const headers = [
                                    ['id', 'name', 'email', 'phone', 'pipelineStatus', 'preferences', 'notes', 'isActive', 'archivedAt', 'createdAt', 'updatedAt']
                                ];
                                await window.GoogleSheetsAPI.writeData(headers, 'A1');
                                console.log('✅ ヘッダー行作成完了');
                            } else {
                                console.error('❌ 新規スプレッドシート作成に失敗しました');
                            }
                        }
                    } catch (error) {
                        console.error('❌ スプレッドシート検索・作成エラー:', error);
                        console.log('ℹ️ LocalStorageモードで動作を継続します');
                    }
                }
                
                // すべてのシステムが準備完了している場合のみ有効化
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
                    
                    // 定期同期開始
                    this.startPeriodicSync();
                    
                    // 初回同期
                    await this.syncFromSheetsToLocal();
                } else {
                    console.log('⚠️ 一部システムが準備できていないため、LocalStorageモードで動作します');
                }
            }
        }, 500);
        
        // タイムアウト（30秒）
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!this.isEnabled) {
                console.log('⏱️ 初期化タイムアウト - LocalStorageモードで動作します');
            }
        }, 30000);
    },
    
    // Google Sheetsからデータ読み込み（isActive/archivedAt対応）
    async syncFromSheetsToLocal() {
        if (!this.isEnabled) {
            console.log('ℹ️ Google Sheets統合が無効です');
            return;
        }
        
        try {
            console.log('☁️ Google Sheetsからデータ読み込み中...');
            
            // 🔧 isActive, archivedAtを含む範囲で読み込み（K列まで）
            const data = await window.GoogleSheetsAPI.readData('A2:K');
            
            if (!data || data.length === 0) {
                console.log('ℹ️ Google Sheetsにデータがありません');
                return;
            }
            
            console.log('📥 Google Sheetsから', data.length, '件のデータを取得');
            
            // データを顧客オブジェクトに変換
            const customers = data.map(row => {
                try {
                    // preferences のパース（JSONまたはオブジェクト）
                    let preferences = {};
                    if (row[5]) {
                        if (typeof row[5] === 'string') {
                            preferences = JSON.parse(row[5]);
                        } else if (typeof row[5] === 'object') {
                            preferences = row[5];
                        }
                    }
                    
                    // 🔧 isActiveの変換（文字列'TRUE'/'FALSE' → Boolean）
                    let isActive = true; // デフォルト
                    if (row[7] === 'FALSE' || row[7] === false) {
                        isActive = false;
                    } else if (row[7] === 'TRUE' || row[7] === true || row[7] === undefined || row[7] === '') {
                        isActive = true;
                    }
                    
                    console.log('🔍 顧客データ変換:', {
                        name: row[1],
                        isActiveRaw: row[7],
                        isActiveConverted: isActive,
                        archivedAt: row[8]
                    });
                    
                    return {
                        id: row[0],
                        name: row[1],
                        email: row[2],
                        phone: row[3],
                        pipelineStatus: row[4] || '初回相談',
                        preferences: preferences,
                        notes: row[6] || '',
                        isActive: isActive, // 🔧 Boolean型
                        archivedAt: row[8] || null, // 🔧 非アクティブ化日時
                        createdAt: row[9],
                        updatedAt: row[10]
                    };
                } catch (error) {
                    console.error('❌ データ変換エラー:', error, row);
                    return null;
                }
            }).filter(c => c !== null);
            
            // LocalStorageに保存
            window.UnifiedDataManager.saveCustomers(customers);
            
            this.lastSyncTime = new Date();
            console.log('✅ Google Sheets → LocalStorage 同期完了:', customers.length, '件');
            
            // 🔧 同期後のデータ確認
            console.log('📊 同期後のアクティブ/非アクティブ状態:');
            customers.forEach(c => {
                if (c.isActive === false) {
                    console.log(`  ⏸️ ${c.name}: isActive=${c.isActive}, archivedAt=${c.archivedAt}`);
                }
            });
            
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
    
    // デバウンス同期スケジュール（15秒後に実行）
    scheduleDebouncedSync() {
        if (!this.isEnabled) return;
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        console.log('📅 15秒後に逆同期をスケジュール');
        
        this.debounceTimer = setTimeout(async () => {
            console.log('🔄 デバウンス同期実行（Google Sheets → LocalStorage）');
            await this.syncFromSheetsToLocal();
        }, 15000); // 15秒
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
