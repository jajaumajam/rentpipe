// RentPipe 統合アプリケーション初期化システム
// すべてのページで使用する統一初期化処理

window.RentPipeApp = {
    isInitialized: false,
    currentPage: null,
    
    // 初期化
    initialize: async function(pageName) {
        console.log(`🚀 RentPipe アプリケーション初期化開始: ${pageName}`);
        this.currentPage = pageName;
        
        try {
            // ステップ1: 統合認証マネージャーの初期化
            await this.initializeAuth();
            
            // ステップ2: Google APIs の初期化
            await this.initializeGoogleAPIs();
            
            // ステップ3: データ管理システムの初期化
            await this.initializeDataManagement();
            
            // ステップ4: Google Sheets統合の初期化
            await this.initializeSheetsIntegration();
            
            // ステップ5: ページ固有の初期化
            await this.initializePageSpecific(pageName);
            
            this.isInitialized = true;
            console.log(`✅ RentPipe アプリケーション初期化完了: ${pageName}`);
            
            return {
                success: true,
                page: pageName
            };
            
        } catch (error) {
            console.error('❌ RentPipe アプリケーション初期化エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ステップ1: 認証初期化
    initializeAuth: async function() {
        console.log('🔐 認証システム初期化中...');
        
        if (!window.IntegratedAuthManagerV2) {
            throw new Error('IntegratedAuthManagerV2が見つかりません');
        }
        
        await window.IntegratedAuthManagerV2.initialize();
        console.log('✅ 認証システム初期化完了');
    },
    
    // ステップ2: Google APIs 初期化
    initializeGoogleAPIs: async function() {
        console.log('📊 Google APIs 初期化中...');
        
        // Google Sheets API の初期化
        if (window.GoogleSheetsAPI && !window.GoogleSheetsAPI.isInitialized) {
            console.log('⏳ Google Sheets API 初期化待機中...');
            
            let attempts = 0;
            while (!window.GoogleSheetsAPI.isInitialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.GoogleSheetsAPI.isInitialized) {
                console.log('🔧 Google Sheets API 強制初期化...');
                await window.GoogleSheetsAPI.initialize();
            }
        }
        
        console.log('✅ Google APIs 初期化完了');
    },
    
    // ステップ3: データ管理システム初期化
    initializeDataManagement: async function() {
        console.log('💾 データ管理システム初期化中...');
        
        if (!window.UnifiedDataManager) {
            throw new Error('UnifiedDataManager が見つかりません');
        }
        
        // データマネージャーは自動初期化されているので確認のみ
        console.log('✅ データ管理システム初期化完了');
    },
    
    // ステップ4: Google Sheets統合初期化
    initializeSheetsIntegration: async function() {
        console.log('☁️ Google Sheets統合初期化中...');
        
        if (!window.UnifiedSheetsManager) {
            throw new Error('UnifiedSheetsManager が見つかりません');
        }
        
        // 認証トークンを取得
        const authState = window.IntegratedAuthManagerV2.getAuthState();
        
        if (authState?.googleAuth?.isSignedIn && authState?.googleAuth?.accessToken) {
            console.log('🔑 アクセストークン設定中...');
            
            // Google Sheets APIにトークンを設定
            if (window.gapi?.client) {
                window.gapi.client.setToken({
                    access_token: authState.googleAuth.accessToken
                });
                console.log('✅ アクセストークン設定完了');
            }
            
            // UnifiedSheetsManager の初期化
            await window.UnifiedSheetsManager.initialize();
            
            const status = window.UnifiedSheetsManager.getStatus();
            console.log('📊 Google Sheets統合状態:', status);
            
            if (status.isEnabled) {
                console.log('✅ Google Sheets統合有効');
            } else {
                console.log('ℹ️ LocalStorageモードで動作');
            }
        } else {
            console.log('⚠️ Google認証なし - LocalStorageモードで動作');
        }
        
        console.log('✅ Google Sheets統合初期化完了');
    },
    
    // ステップ5: ページ固有の初期化
    initializePageSpecific: async function(pageName) {
        console.log(`📄 ページ固有の初期化: ${pageName}`);
        
        switch(pageName) {
            case 'customer':
                await this.initializeCustomerPage();
                break;
            case 'pipeline':
                await this.initializePipelinePage();
                break;
            case 'customer-form':
                await this.initializeCustomerFormPage();
                break;
            default:
                console.log('ℹ️ ページ固有の初期化なし');
        }
    },
    
    // customer.html 固有の初期化
    initializeCustomerPage: async function() {
        console.log('👥 顧客管理ページ初期化中...');
        
        // 顧客リストの表示
        if (typeof displayCustomers === 'function') {
            displayCustomers();
        }
        
        // 統計の更新
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        console.log('✅ 顧客管理ページ初期化完了');
    },
    
    // pipeline.html 固有の初期化
    initializePipelinePage: async function() {
        console.log('📈 パイプラインページ初期化中...');
        
        // パイプラインマネージャーの初期化は既に完了しているはず
        if (window.pipelineManager) {
            console.log('✅ パイプラインマネージャー準備完了');
        }
        
        console.log('✅ パイプラインページ初期化完了');
    },
    
    // customer-form.html 固有の初期化
    initializeCustomerFormPage: async function() {
        console.log('📝 顧客フォームページ初期化中...');
        
        // URLパラメータから編集モードを判定
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId && typeof loadCustomerForEdit === 'function') {
            loadCustomerForEdit(editId);
        }
        
        console.log('✅ 顧客フォームページ初期化完了');
    },
    
    // 認証状態の取得
    getAuthState: function() {
        return window.IntegratedAuthManagerV2?.getAuthState();
    },
    
    // Google Sheets統合状態の取得
    getSheetsStatus: function() {
        return window.UnifiedSheetsManager?.getStatus();
    },
    
    // 認証ステータス表示の更新
    updateAuthStatusDisplay: function(elementId = 'auth-sync-status') {
        const statusDiv = document.getElementById(elementId);
        if (!statusDiv) return;
        
        const authState = this.getAuthState();
        const sheetsStatus = this.getSheetsStatus();
        
        if (sheetsStatus?.isEnabled) {
            statusDiv.className = 'auth-status success';
            statusDiv.textContent = `✅ Google Sheets統合有効 - ${authState?.googleAuth?.user?.email || '認証済み'}`;
        } else if (authState?.googleAuth?.isSignedIn) {
            statusDiv.className = 'auth-status warning';
            statusDiv.textContent = `⚠️ Google認証済み（Sheets未連携） - ${authState.googleAuth.user.email}`;
        } else {
            statusDiv.className = 'auth-status warning';
            statusDiv.textContent = '📂 LocalStorageモード（未認証）';
        }
    }
};

console.log('✅ RentPipe 統合初期化システム準備完了');
