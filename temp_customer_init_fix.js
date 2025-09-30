// customer.htmlのメイン初期化部分を以下に置き換える

// メイン初期化（修正版）
async function initialize() {
    try {
        console.log('🚀 Customer Google Sheets完全統合システム初期化開始...');
        
        // ステップ1: 認証システム初期化
        const authReady = await initializeAuthenticationSystem();
        if (!authReady) {
            return; // ログインページにリダイレクトされる
        }
        
        // ステップ2: Google Sheets API強制初期化
        console.log('📊 Google Sheets API強制初期化実行中...');
        if (window.GoogleSheetsAPI && !window.GoogleSheetsAPI.isInitialized) {
            const sheetsReady = await window.GoogleSheetsAPI.initialize();
            if (sheetsReady) {
                console.log('✅ Google Sheets API強制初期化完了');
            } else {
                console.log('⚠️ Google Sheets API初期化失敗 - LocalStorageモードで継続');
            }
        }
        
        // ステップ3: 統合データ管理システム初期化
        if (window.UnifiedSheetsManager) {
            await window.UnifiedSheetsManager.initialize();
        }
        
        // ステップ4: Google Sheets統合設定
        const integrationResult = await setupGoogleSheetsIntegration();
        console.log('📊 Google Sheets統合結果:', integrationResult);
        
        // ステップ5: 顧客データ読み込み
        await loadCustomers();
        
        systemInitialized = true;
        console.log('✅ Customer Google Sheets完全統合システム初期化完了');
        
    } catch (error) {
        console.error('❌ Customer Google Sheets完全統合システム初期化エラー:', error);
        showAuthStatus(`初期化失敗: ${error.message}`, 'error');
        
        // エラーでもLocalStorageモードで動作
        console.log('ℹ️ エラー発生によりLocalStorageモードで継続');
        await loadCustomers();
    }
}
