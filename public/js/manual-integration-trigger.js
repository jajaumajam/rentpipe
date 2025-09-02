// 🔧 手動統合機能トリガー
console.log('🔧 手動統合機能トリガー準備中...');

window.ManualIntegrationTrigger = {
    // デバッグ用のボタンを画面に追加
    addDebugButtons: function() {
        // 既存のデバッグボタンを削除
        const existing = document.querySelector('#debug-buttons-container');
        if (existing) existing.remove();
        
        // デバッグボタンコンテナを作成
        const container = document.createElement('div');
        container.id = 'debug-buttons-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            max-width: 300px;
        `;
        
        container.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #1e40af;">
                🔧 Google Forms統合デバッグ
            </div>
            
            <div style="margin-bottom: 8px; display: flex; gap: 5px;">
                <button onclick="window.checkStatus()" style="flex: 1; padding: 5px; font-size: 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    📊 状況確認
                </button>
                <button onclick="window.forceIntegration()" style="flex: 1; padding: 5px; font-size: 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🚀 強制実行
                </button>
            </div>
            
            <div style="margin-bottom: 8px;">
                <button onclick="window.ManualIntegrationTrigger.testGoogleAuth()" style="width: 100%; padding: 5px; font-size: 12px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔐 Google認証テスト
                </button>
            </div>
            
            <div style="margin-bottom: 8px;">
                <button onclick="window.ManualIntegrationTrigger.addTestSection()" style="width: 100%; padding: 5px; font-size: 12px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ✨ テストセクション追加
                </button>
            </div>
            
            <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">
                F12でコンソールを開いてデバッグ情報を確認してください
            </div>
        `;
        
        document.body.appendChild(container);
        console.log('✅ デバッグボタン追加完了');
    },
    
    // Google認証状態をテスト
    testGoogleAuth: function() {
        if (window.IntegratedAuthManagerV2) {
            const authState = window.IntegratedAuthManagerV2.getAuthState();
            alert(`🔐 Google認証状態\n\n認証済み: ${authState.isAuthenticated}\nGoogle認証: ${authState.googleAuth.isSignedIn}\nユーザー: ${authState.googleAuth.user?.email || '未認証'}`);
        } else {
            alert('❌ IntegratedAuthManagerV2が見つかりません');
        }
    },
    
    // テスト用のセクションを追加
    addTestSection: function() {
        // 既存のテストセクションを削除
        const existing = document.querySelector('#manual-test-section');
        if (existing) existing.remove();
        
        // テストセクションを作成
        const section = document.createElement('div');
        section.id = 'manual-test-section';
        section.style.cssText = `
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1rem;
            text-align: center;
        `;
        
        section.innerHTML = `
            <h3 style="margin: 0 0 1rem 0;">✨ Google Forms連携テスト</h3>
            <p style="margin: 0 0 1rem 0;">手動でテスト機能を追加しました</p>
            <button onclick="alert('テストボタンが動作しています！')" style="background: white; color: #059669; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                🧪 テストボタン
            </button>
        `;
        
        // メインコンテンツの先頭に挿入
        const main = document.querySelector('main, .main-content, .container') || document.body;
        main.insertBefore(section, main.firstChild);
        
        console.log('✅ テストセクション追加完了');
        alert('✅ テストセクションを追加しました！');
    }
};

// 自動でデバッグボタンを追加
setTimeout(() => {
    window.ManualIntegrationTrigger.addDebugButtons();
}, 2000);

console.log('✅ 手動統合機能トリガー準備完了');
