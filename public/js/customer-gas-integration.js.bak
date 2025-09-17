// 👥 顧客管理画面 - Google Apps Script統合
console.log('👥 顧客管理画面 - Google Apps Script統合初期化中...');

// Google Form作成（Google Apps Script版）
window.createGoogleFormGAS = async function(customerId) {
    try {
        console.log('📝 Google Apps Script版 Google Form作成開始:', customerId);
        
        // 顧客データ取得
        const customers = window.CustomerDataLoader.loadCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            alert('❌ 顧客データが見つかりません');
            return;
        }
        
        // Google Apps Script Forms が初期化されているかチェック
        if (!window.GoogleAppsScriptForms) {
            alert('❌ Google Apps Script Formsが読み込まれていません');
            return;
        }
        
        // Script URLが設定されているかチェック
        const debugInfo = window.GoogleAppsScriptForms.getDebugInfo();
        if (!debugInfo.hasValidUrl) {
            const url = prompt('Google Apps ScriptのウェブアプリURLを入力してください:\n\n例: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
            if (url) {
                window.GoogleAppsScriptForms.setScriptUrl(url);
            } else {
                alert('❌ URLの設定がキャンセルされました');
                return;
            }
        }
        
        // ローディング表示
        if (window.showLoading) {
            window.showLoading(`${customer.name}様専用フォーム作成中...`, 'Google Apps Script経由で作成しています');
        }
        
        // Google Apps Script経由でフォーム作成
        const result = await window.GoogleAppsScriptForms.createCustomerForm(customer);
        
        if (result.success) {
            if (window.hideLoading) window.hideLoading();
            
            alert(`✅ ${customer.name}様専用フォームが作成されました！\n\nフォームタイトル: ${result.form.title}\nフォームID: ${result.form.id}\nフォームURL: ${result.form.url}\n\n🎉 質問項目も自動で追加されています！`);
            
            // 顧客リストを更新
            setTimeout(() => {
                if (window.loadAndDisplayCustomers) {
                    window.loadAndDisplayCustomers();
                }
            }, 500);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        if (window.hideLoading) window.hideLoading();
        console.error('❌ Google Apps Script版フォーム作成エラー:', error);
        
        // エラーの種類に応じたメッセージ
        let errorMessage = 'フォーム作成に失敗しました: ' + error.message;
        
        if (error.message.includes('fetch')) {
            errorMessage += '\n\n💡 ヒント:\n• Google Apps ScriptのURLが正しく設定されているか確認\n• Google Apps Scriptが正しくデプロイされているか確認';
        }
        
        alert('❌ ' + errorMessage + '\n\n詳細はブラウザコンソール（F12）で確認してください。');
    }
};

// 既存の createGoogleForm 関数を Google Apps Script版に置き換え
window.createGoogleForm = window.createGoogleFormGAS;

console.log('✅ 顧客管理画面 - Google Apps Script統合準備完了');
