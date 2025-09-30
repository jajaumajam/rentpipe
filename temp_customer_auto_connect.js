// customer.htmlのsetupGoogleSheetsIntegration関数を以下に置き換える

// Google Sheets統合の完全自動設定（強化版）
async function setupGoogleSheetsIntegration() {
    try {
        console.log('📊 Google Sheets統合の完全自動設定開始...');
        
        // ステップ1: Google Sheets API完全初期化
        console.log('🔧 Google Sheets API完全初期化実行中...');
        updateSheetsStatus('🔧 Google Sheets API初期化中...', 'syncing');
        
        const sheetsInitialized = await window.GoogleSheetsAPI.initialize();
        if (!sheetsInitialized) {
            throw new Error('Google Sheets API初期化に失敗しました');
        }
        
        // ステップ2: 認証情報設定
        console.log('🔑 認証情報設定中...');
        updateSheetsStatus('🔑 認証情報設定中...', 'syncing');
        
        if (currentAuthState?.googleAuth?.isSignedIn && currentAuthState?.googleAuth?.accessToken) {
            console.log('✅ 既存のGoogle認証を使用');
            
            // アクセストークン設定（強化版）
            const tokenSet = await window.GoogleSheetsAPI.setAccessToken(currentAuthState.googleAuth.accessToken);
            if (!tokenSet) {
                throw new Error('アクセストークン設定に失敗しました');
            }
            
            // ステップ3: 既存スプレッドシート確認・接続
            console.log('🔍 既存スプレッドシート確認中...');
            updateSheetsStatus('🔍 既存スプレッドシート確認中...', 'syncing');
            
            const savedId = localStorage.getItem('rentpipe_spreadsheet_id');
            
            if (savedId) {
                console.log('💾 LocalStorageから既存スプレッドシートID検出:', savedId);
                
                try {
                    // スプレッドシート名を取得してテスト
                    const sheetInfo = await gapi.client.request({
                        path: `https://www.googleapis.com/drive/v3/files/${savedId}`,
                        params: { fields: 'id,name' }
                    });
                    
                    // UnifiedSheetsManagerで統合
                    await window.UnifiedSheetsManager.enableSheetsIntegration(savedId);
                    
                    // UI更新
                    showSheetsInfo(savedId, sheetInfo.result.name);
                    document.getElementById('btn-sheets-sync').style.display = 'inline-block';
                    updateSheetsStatus(`✅ 「${sheetInfo.result.name}」に自動接続完了`, 'connected');
                    
                    // データ読み込み
                    await loadCustomers();
                    
                    console.log('✅ 既存スプレッドシート自動接続完了');
                    return 'existing_connected';
                    
                } catch (error) {
                    console.warn('⚠️ 保存されたスプレッドシートIDが無効:', error);
                    localStorage.removeItem('rentpipe_spreadsheet_id');
                }
            }
            
            // ステップ4: Googleドライブで検索
            console.log('🔍 Googleドライブでスプレッドシート検索中...');
            updateSheetsStatus('🔍 Googleドライブでスプレッドシート検索中...', 'syncing');
            
            try {
                const query = "name contains 'RentPipe_データベース' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
                
                const response = await gapi.client.request({
                    path: 'https://www.googleapis.com/drive/v3/files',
                    params: {
                        q: query,
                        fields: 'files(id,name,createdTime,modifiedTime)',
                        orderBy: 'modifiedTime desc'
                    }
                });
                
                const foundSpreadsheets = response.result.files || [];
                
                if (foundSpreadsheets.length > 0) {
                    console.log('🔍 既存スプレッドシート発見:', foundSpreadsheets.length, '件');
                    
                    // 最新のスプレッドシートに自動接続
                    const latestSheet = foundSpreadsheets[0];
                    
                    // LocalStorageに保存
                    localStorage.setItem('rentpipe_spreadsheet_id', latestSheet.id);
                    
                    // UnifiedSheetsManagerで統合
                    await window.UnifiedSheetsManager.enableSheetsIntegration(latestSheet.id);
                    
                    // UI更新
                    showSheetsInfo(latestSheet.id, latestSheet.name);
                    document.getElementById('btn-sheets-sync').style.display = 'inline-block';
                    updateSheetsStatus(`✅ 「${latestSheet.name}」に自動接続完了`, 'connected');
                    
                    // データ読み込み
                    await loadCustomers();
                    
                    console.log('✅ Googleドライブ検索による自動接続完了');
                    return 'drive_connected';
                    
                } else {
                    console.log('ℹ️ 既存スプレッドシートが見つかりません');
                    document.getElementById('btn-sheets-create').style.display = 'inline-block';
                    updateSheetsStatus('✅ Google Sheets準備完了 - 新規スプレッドシートを作成してください', 'connected');
                    
                    return 'ready_for_creation';
                }
                
            } catch (searchError) {
                console.warn('⚠️ Googleドライブ検索エラー:', searchError);
                document.getElementById('btn-sheets-create').style.display = 'inline-block';
                updateSheetsStatus('✅ Google Sheets準備完了 - 新規スプレッドシートを作成してください', 'connected');
                
                return 'search_failed_ready_for_creation';
            }
            
        } else {
            console.warn('⚠️ Google認証情報が不完全');
            document.getElementById('btn-sheets-connect').style.display = 'inline-block';
            updateSheetsStatus('⚠️ Google認証が必要です', 'disconnected');
            
            return 'auth_required';
        }
        
    } catch (error) {
        console.error('❌ Google Sheets統合エラー:', error);
        updateSheetsStatus('❌ 統合エラー: ' + error.message, 'error');
        document.getElementById('btn-sheets-connect').style.display = 'inline-block';
        
        return 'error';
    }
}
