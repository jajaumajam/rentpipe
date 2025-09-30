// customer.htmlの新規スプレッドシート作成部分の修正内容

// 新規スプレッドシート作成関数を以下に置き換える：
async function createNewSpreadsheet() {
    const btn = document.getElementById('btn-sheets-create');
    const originalText = btn.textContent;
    
    try {
        btn.textContent = '作成中...';
        btn.disabled = true;
        
        updateSheetsStatus('📄 RentPipeデータベース作成中...', 'syncing');
        
        // 統一された命名規則: RentPipe_データベース_タイムスタンプ
        const timestamp = new Date().toLocaleString('ja-JP').replace(/\//g, '-').replace(/:/g, '-').replace(/\s/g, '_');
        const title = `RentPipe_データベース_${timestamp}`;
        
        const spreadsheetId = await window.GoogleSheetsAPI.createSpreadsheet(title);
        
        await window.UnifiedSheetsManager.enableSheetsIntegration(spreadsheetId);
        
        updateSheetsStatus('✅ RentPipeデータベース作成完了 - 自動同期有効', 'connected');
        showSheetsInfo(spreadsheetId);
        
        btn.style.display = 'none';
        document.getElementById('btn-sheets-sync').style.display = 'inline-block';
        
        await loadCustomers();
        
        console.log('✅ 新規RentPipeデータベース作成完了:', title);
        
    } catch (error) {
        console.error('❌ RentPipeデータベース作成エラー:', error);
        updateSheetsStatus('❌ 作成エラー: ' + error.message, 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
