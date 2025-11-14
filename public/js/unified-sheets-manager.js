// RentPipe 統合データ同期管理システム（可変同期間隔版）
window.UnifiedSheetsManager = {
    isEnabled: false,
    spreadsheetId: null,
    isSyncing: false,
    lastSyncTime: null,
    syncIntervalId: null,
    syncMode: 'normal', // 'after-change', 'normal', 'idle'
    lastUserActionTime: Date.now(),
    debounceTimeoutId: null,
    
    // 同期間隔設定（ミリ秒）
    SYNC_INTERVALS: {
        AFTER_CHANGE: 15000,    // 変更直後: 15秒後（デバウンス）
        NORMAL: 120000,         // 通常: 2分
        IDLE: 300000            // アイドル: 5分（10分間操作なし）
    },
    
    // アイドル判定時間（10分）
    IDLE_THRESHOLD: 600000,
    
    // 初期化
    initialize: async function() {
        console.log('🔧 統合データ管理システム初期化開始（可変同期版）...');
        
        try {
            // LocalStorageのデータ確認
            const localData = localStorage.getItem('rentpipe_demo_customers');
            const customers = localData ? JSON.parse(localData) : [];
            console.log('✅ LocalStorageデータ確認完了:', customers.length, '件');
            
            // Google Sheets API初期化チェック
            console.log('📊 Google Sheets API初期化チェック...');
            
            if (!window.GoogleSheetsAPI?.isInitialized) {
                console.log('⏳ Google Sheets API初期化待機中...');
                
                let attempts = 0;
                while (!window.GoogleSheetsAPI?.isInitialized && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.GoogleSheetsAPI?.isInitialized) {
                    console.log('🔧 Google Sheets API強制初期化実行中...');
                    await window.GoogleSheetsAPI.initialize();
                    console.log('✅ Google Sheets API強制初期化完了');
                }
            }
            
            // 認証状態確認とトークン設定
            const authState = window.IntegratedAuthManagerV2?.getAuthState();
            console.log('🔐 認証状態確認:', authState);
            
            if (authState?.googleAuth?.isSignedIn && authState?.googleAuth?.accessToken) {
                console.log('✅ Google認証トークン確認完了');
                
                // Google Sheets APIにトークンを設定
                console.log('🔑 Google Sheets APIにアクセストークンを設定中...');
                if (window.gapi?.client) {
                    window.gapi.client.setToken({
                        access_token: authState.googleAuth.accessToken
                    });
                    console.log('✅ アクセストークン設定完了');
                }
                
                // ✅ GoogleDriveAPIv2の完全初期化
                if (window.GoogleDriveAPIv2 && !window.GoogleDriveAPIv2.isInitialized) {
                    console.log('🔧 GoogleDriveAPIv2完全初期化中...');
                    await window.GoogleDriveAPIv2.initialize();
                    console.log('✅ GoogleDriveAPIv2完全初期化完了');
                }
                
                // ✅ GoogleDriveAPIv2に認証情報を設定
                if (window.GoogleDriveAPIv2) {
                    console.log('🔑 GoogleDriveAPIv2に認証情報を設定中...');
                    window.GoogleDriveAPIv2.accessToken = authState.googleAuth.accessToken;
                    window.GoogleDriveAPIv2.isAuthenticated = true;
                    console.log('✅ GoogleDriveAPIv2認証設定完了');
                }
            } else {
                console.warn('⚠️ Google認証トークンが見つかりません');
            }
            
            // 統合確認
            const allSystemsReady = {
                sheetsAPI: !!window.GoogleSheetsAPI,
                sheetsInitialized: !!window.GoogleSheetsAPI?.isInitialized,
                sheetsAuthenticated: !!authState?.googleAuth?.isSignedIn,
                driveAPI: !!window.GoogleDriveAPIv2,
                driveInitialized: !!window.GoogleDriveAPIv2?.isInitialized,
                driveAuthenticated: !!window.GoogleDriveAPIv2?.isAuthenticated,
                unifiedDataManager: !!window.UnifiedDataManager
            };
            console.log('🔍 統合確認:', allSystemsReady);
            
            // ✅ スプレッドシートIDの確認と自動検索・作成
            this.spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
            console.log('📂 保存済みスプレッドシートID:', this.spreadsheetId);
            
            // ✅ IDがない場合は既存スプレッドシートを検索または新規作成
            if (!this.spreadsheetId && 
                allSystemsReady.sheetsAuthenticated && 
                allSystemsReady.driveAPI && 
                allSystemsReady.driveInitialized &&
                allSystemsReady.driveAuthenticated) {
                
                console.log('🔍 スプレッドシートIDがありません。既存スプレッドシートを検索します...');
                
                try {
                    // Google Driveで「RentPipe_Customers」を検索
                    const searchResult = await window.GoogleDriveAPIv2.searchSpreadsheets('RentPipe_Customers');
                    
                    if (searchResult && searchResult.length > 0) {
                        // 既存のスプレッドシートが見つかった
                        this.spreadsheetId = searchResult[0].id;
                        console.log('✅ 既存のRentPipe_Customersスプレッドシートを発見:', this.spreadsheetId);
                        console.log('📊 スプレッドシート名:', searchResult[0].name);
                        
                        // LocalStorageに保存
                        localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                        console.log('💾 スプレッドシートIDをLocalStorageに保存しました');
                        
                    } else {
                        // 既存のスプレッドシートが見つからない → 新規作成
                        console.log('📝 既存スプレッドシートが見つかりません。新規作成します...');
                        
                        const newSpreadsheet = await window.GoogleSheetsAPI.createSpreadsheet('RentPipe_Customers');
                        
                        if (newSpreadsheet && newSpreadsheet.spreadsheetId) {
                            this.spreadsheetId = newSpreadsheet.spreadsheetId;
                            console.log('✅ 新規スプレッドシート作成成功:', this.spreadsheetId);
                            console.log('📊 スプレッドシートURL:', newSpreadsheet.spreadsheetUrl);
                            
                            // LocalStorageに保存
                            localStorage.setItem('rentpipe_spreadsheet_id', this.spreadsheetId);
                            console.log('💾 スプレッドシートIDをLocalStorageに保存しました');
                            
                            // ヘッダー行を作成
                            console.log('📋 ヘッダー行を作成中...');
                            const headers = [
                                ['id', 'name', 'email', 'phone', 'pipelineStatus', 'preferences', 'notes', 'createdAt', 'updatedAt']
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
                
                // ユーザーアクション監視開始
                this.setupUserActionTracking();
                
                // 可変同期開始
                this.startAdaptiveSync();
                
            } else {
                console.log('ℹ️ LocalStorageモードで動作（一部システムが未準備）');
            }
            
            console.log('✅ 統合データ管理システム初期化完了');
            
        } catch (error) {
            console.error('❌ 統合データ管理システム初期化エラー:', error);
            this.isEnabled = false;
        }
    },
    
    // ユーザーアクション監視
    setupUserActionTracking: function() {
        const events = ['click', 'keydown', 'scroll', 'mousemove'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.lastUserActionTime = Date.now();
            }, { passive: true });
        });
        
        console.log('👀 ユーザーアクション監視開始');
    },
    
    // 同期モード判定
    determineSyncMode: function() {
        const timeSinceLastAction = Date.now() - this.lastUserActionTime;
        
        if (timeSinceLastAction > this.IDLE_THRESHOLD) {
            return 'idle';
        } else {
            return 'normal';
        }
    },
    
    // 可変同期開始
    startAdaptiveSync: function() {
        console.log('🔄 可変同期システム開始');
        
        // 初回同期実行
        this.syncFromSheetsToLocal();
        
        // 定期的にモード判定して同期
        this.syncIntervalId = setInterval(() => {
            const newMode = this.determineSyncMode();
            
            if (newMode !== this.syncMode) {
                console.log(`🔄 同期モード変更: ${this.syncMode} → ${newMode}`);
                this.syncMode = newMode;
            }
            
            // 現在のモードに応じた間隔で同期
            const currentInterval = this.SYNC_INTERVALS[this.syncMode.toUpperCase().replace('-', '_')];
            
            if (this.lastSyncTime === null || (Date.now() - this.lastSyncTime >= currentInterval)) {
                this.syncFromSheetsToLocal();
            }
            
        }, 10000); // 10秒ごとにチェック
        
        console.log('✅ 可変同期システム起動完了');
    },
    
    // 変更通知受信（UnifiedDataManagerから呼ばれる）
    notifyDataChanged: function() {
        console.log('📢 データ変更通知受信 - デバウンス同期スケジュール');
        
        // 既存のデバウンスタイマーをクリア
        if (this.debounceTimeoutId) {
            clearTimeout(this.debounceTimeoutId);
        }
        
        // 15秒後に同期実行
        this.debounceTimeoutId = setTimeout(() => {
            console.log('⏰ デバウンス時間経過 - 同期実行');
            this.syncFromSheetsToLocal();
        }, this.SYNC_INTERVALS.AFTER_CHANGE);
        
        console.log(`⏳ ${this.SYNC_INTERVALS.AFTER_CHANGE / 1000}秒後に同期実行予定`);
    },
    
    // Google Sheets → LocalStorage 同期
    syncFromSheetsToLocal: async function() {
        if (!this.isEnabled || this.isSyncing) {
            return;
        }
        
        this.isSyncing = true;
        console.log('📥 Google Sheets → LocalStorage 同期開始...');
        
        try {
            // Google Sheetsからデータ読み込み
            const sheetData = await window.GoogleSheetsAPI.readData('A2:I');
            
            if (!sheetData || sheetData.length === 0) {
                console.log('ℹ️ Google Sheetsにデータがありません');
                this.lastSyncTime = Date.now();
                return;
            }
            
            // データ変換
            const customers = sheetData.map(row => {
                try {
                    return {
                        id: row[0],
                        name: row[1],
                        email: row[2],
                        phone: row[3],
                        pipelineStatus: row[4],
                        preferences: row[5] ? JSON.parse(row[5]) : {},
                        notes: row[6] || '',
                        createdAt: row[7],
                        updatedAt: row[8]
                    };
                } catch (error) {
                    console.error('❌ 行データ変換エラー:', error, row);
                    return null;
                }
            }).filter(c => c !== null);
            
            // LocalStorageに保存
            localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
            console.log(`✅ 同期完了: ${customers.length}件の顧客データ`);
            
            // 同期時刻を記録
            this.lastSyncTime = Date.now();
            
            // データ更新イベントを発火
            window.dispatchEvent(new CustomEvent('rentpipe-data-updated', { 
                detail: { source: 'sheets-sync', count: customers.length }
            }));
            
        } catch (error) {
            console.error('❌ 同期エラー:', error);
        } finally {
            this.isSyncing = false;
        }
    },
    
    // 状態取得
    getStatus: function() {
        return {
            isEnabled: this.isEnabled,
            spreadsheetId: this.spreadsheetId,
            lastSyncTime: this.lastSyncTime,
            isSyncing: this.isSyncing,
            syncMode: this.syncMode,
            timeSinceLastAction: Date.now() - this.lastUserActionTime
        };
    },
    
    // 手動同期
    manualSync: async function() {
        console.log('🔄 手動同期実行');
        await this.syncFromSheetsToLocal();
    }
};

console.log('✅ 統合データ同期管理システム（可変同期版）準備完了');
