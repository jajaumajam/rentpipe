// 統合データ管理システム（可変同期間隔版）
window.UnifiedSheetsManager = {
    isEnabled: false,
    spreadsheetId: null,
    lastSyncTime: null,
    isSyncing: false,
    syncInterval: null,
    
    // 可変同期間隔の設定
    syncMode: 'normal', // 'after-change', 'normal', 'idle'
    lastChangeTime: null,
    lastUserActionTime: Date.now(),
    debounceTimer: null,
    
    // 同期間隔（ミリ秒）
    INTERVALS: {
        afterChange: 15000,    // 15秒（変更後）
        normal: 120000,        // 2分（通常）
        idle: 300000          // 5分（アイドル）
    },
    IDLE_THRESHOLD: 600000,   // 10分（アイドル判定）
    
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
            } else {
                console.warn('⚠️ Google認証トークンが見つかりません');
            }
            
            // 統合確認
            const allSystemsReady = {
                sheetsAPI: !!window.GoogleSheetsAPI,
                sheetsInitialized: !!window.GoogleSheetsAPI?.isInitialized,
                sheetsAuthenticated: !!authState?.googleAuth?.isSignedIn,
                driveAPI: !!window.GoogleDriveAPIv2,
                unifiedDataManager: !!window.UnifiedDataManager
            };
            console.log('🔍 統合確認:', allSystemsReady);
            
            // スプレッドシートIDの確認
            this.spreadsheetId = localStorage.getItem('rentpipe_spreadsheet_id');
            console.log('📂 保存済みスプレッドシートID:', this.spreadsheetId);
            
            // すべてのシステムが準備完了している場合のみ有効化
            if (allSystemsReady.sheetsAPI && 
                allSystemsReady.sheetsInitialized && 
                allSystemsReady.sheetsAuthenticated && 
                allSystemsReady.driveAPI && 
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
        const updateUserAction = () => {
            this.lastUserActionTime = Date.now();
            this.updateSyncMode();
        };
        
        document.addEventListener('click', updateUserAction);
        document.addEventListener('scroll', updateUserAction);
        document.addEventListener('keypress', updateUserAction);
        document.addEventListener('touchstart', updateUserAction);
        
        console.log('👆 ユーザーアクション監視開始');
    },
    
    // 同期モードの更新
    updateSyncMode: function() {
        const now = Date.now();
        const timeSinceUserAction = now - this.lastUserActionTime;
        const timeSinceChange = this.lastChangeTime ? now - this.lastChangeTime : Infinity;
        
        let newMode = this.syncMode;
        
        // アイドル判定
        if (timeSinceUserAction > this.IDLE_THRESHOLD) {
            newMode = 'idle';
        }
        // 変更直後判定（最後の変更から1分以内）
        else if (timeSinceChange < 60000) {
            newMode = 'after-change';
        }
        // 通常モード
        else {
            newMode = 'normal';
        }
        
        // モード変更時のログ
        if (newMode !== this.syncMode) {
            console.log(`🔄 同期モード変更: ${this.syncMode} → ${newMode}`);
            this.syncMode = newMode;
            
            // 同期間隔を再設定
            this.restartSync();
        }
    },
    
    // データ変更時の呼び出し（デバウンス同期）
    onDataChanged: function() {
        console.log('📝 データ変更検知 - デバウンス同期スケジュール');
        
        this.lastChangeTime = Date.now();
        this.syncMode = 'after-change';
        
        // 既存のデバウンスタイマーをクリア
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // 15秒後に同期（デバウンス）
        this.debounceTimer = setTimeout(async () => {
            console.log('⏰ デバウンス同期実行');
            await this.syncFromSheetsToLocal();
            this.debounceTimer = null;
            
            // 通常モードに戻る
            this.updateSyncMode();
        }, this.INTERVALS.afterChange);
    },
    
    // 可変同期開始
    startAdaptiveSync: function() {
        console.log('🔄 可変同期システム開始');
        
        // 初回同期
        this.syncFromSheetsToLocal();
        
        // 定期同期開始
        this.restartSync();
        
        // 5秒ごとにモードチェック
        setInterval(() => {
            this.updateSyncMode();
        }, 5000);
    },
    
    // 同期再開
    restartSync: function() {
        // 既存のインターバルをクリア
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        const interval = this.INTERVALS[this.syncMode];
        console.log(`⏱️ 同期間隔設定: ${interval / 1000}秒（${this.syncMode}モード）`);
        
        this.syncInterval = setInterval(async () => {
            console.log(`⏰ 定期同期実行（${this.syncMode}モード）`);
            await this.syncFromSheetsToLocal();
        }, interval);
    },
    
    // Google Sheets → LocalStorage 同期
    syncFromSheetsToLocal: async function() {
        if (this.isSyncing) {
            console.log('⏳ 既に同期処理中...');
            return;
        }
        
        if (!this.isEnabled) {
            console.log('ℹ️ Google Sheets統合が無効です');
            return;
        }
        
        this.isSyncing = true;
        console.log('🔽 Google Sheets → LocalStorage 同期開始');
        
        try {
            // LocalStorageから読み込み
            const localData = localStorage.getItem('rentpipe_demo_customers');
            const localCustomers = localData ? JSON.parse(localData) : [];
            console.log('📂 LocalStorageデータ:', localCustomers.length, '件');
            
            // Google Sheetsから読み込み
            const sheetsCustomers = await window.GoogleSheetsAPI.readData();
            console.log('☁️ Google Sheetsデータ:', sheetsCustomers.length, '件');
            
            // Google Sheets優先でマージ
            const mergedCustomers = [];
            const processedIds = new Set();
            
            // 1. Google Sheetsのデータを優先
            for (const sheetsCustomer of sheetsCustomers) {
                mergedCustomers.push(sheetsCustomer);
                processedIds.add(sheetsCustomer.id);
            }
            
            // 2. LocalStorage独自のデータを追加
            for (const localCustomer of localCustomers) {
                if (!processedIds.has(localCustomer.id)) {
                    mergedCustomers.push(localCustomer);
                }
            }
            
            console.log('✅ マージ完了:', mergedCustomers.length, '件');
            
            // LocalStorageを更新
            localStorage.setItem('rentpipe_demo_customers', JSON.stringify(mergedCustomers));
            
            this.lastSyncTime = new Date();
            console.log('✅ 同期完了');
            
            // ページに変更を通知
            window.dispatchEvent(new CustomEvent('rentpipe-data-updated'));
            
        } catch (error) {
            console.error('❌ 同期エラー:', error);
        } finally {
            this.isSyncing = false;
        }
    },
    
    // 自動同期停止
    stopAutoSync: function() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        console.log('⏹️ 自動同期停止');
    },
    
    // 手動同期
    manualSync: async function() {
        console.log('🔄 手動同期実行');
        await this.syncFromSheetsToLocal();
    },
    
    // ステータス取得
    getStatus: function() {
        return {
            isEnabled: this.isEnabled,
            spreadsheetId: this.spreadsheetId,
            lastSyncTime: this.lastSyncTime,
            isSyncing: this.isSyncing,
            syncMode: this.syncMode,
            nextSyncIn: this.getNextSyncTime()
        };
    },
    
    // 次回同期までの時間
    getNextSyncTime: function() {
        if (!this.isEnabled) return null;
        
        const interval = this.INTERVALS[this.syncMode];
        const elapsed = Date.now() - (this.lastSyncTime?.getTime() || Date.now());
        const remaining = Math.max(0, interval - elapsed);
        
        return Math.round(remaining / 1000); // 秒単位
    }
};

console.log('✅ 統合データ管理システム準備完了（可変同期版）');
