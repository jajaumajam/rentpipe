// 🔍 リアルタイム統合状況デバッグ
console.log('🔍 リアルタイム統合デバッグ開始...');

window.DebugIntegrationStatus = {
    // 統合状況を詳細チェック
    checkIntegrationStatus: function() {
        console.log('='.repeat(50));
        console.log('📊 Google Forms統合状況デバッグ');
        console.log('='.repeat(50));
        
        // 1. 現在のURL確認
        console.log('📄 現在のページ:', window.location.pathname);
        
        // 2. 読み込まれたスクリプトの確認
        const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
        console.log('📚 読み込まれたスクリプト:');
        scripts.forEach(src => {
            if (src.includes('google') || src.includes('customer') || src.includes('auth')) {
                console.log('  ✅', src);
            }
        });
        
        // 3. 統合機能オブジェクトの確認
        console.log('🔧 統合機能オブジェクト:');
        console.log('  IntegratedAuthManagerV2:', !!window.IntegratedAuthManagerV2);
        console.log('  GoogleFormsAPIv2:', !!window.GoogleFormsAPIv2);
        console.log('  CustomerGoogleFormsIntegrationV2:', !!window.CustomerGoogleFormsIntegrationV2);
        console.log('  CustomerIntegrationDebug:', !!window.CustomerIntegrationDebug);
        
        // 4. Google認証状態の確認
        if (window.IntegratedAuthManagerV2) {
            const authState = window.IntegratedAuthManagerV2.getAuthState();
            console.log('🔐 Google認証状態:');
            console.log('  認証済み:', authState.isAuthenticated);
            console.log('  認証方法:', authState.method);
            console.log('  Googleサインイン:', authState.googleAuth.isSignedIn);
            console.log('  Googleユーザー:', authState.googleAuth.user?.email);
            console.log('  アクセストークン:', authState.googleAuth.accessToken ? 'あり' : 'なし');
        } else {
            console.log('❌ IntegratedAuthManagerV2が見つかりません');
        }
        
        // 5. 顧客データの確認
        console.log('👥 顧客データ:');
        console.log('  window.customers:', window.customers ? window.customers.length + '件' : 'なし');
        console.log('  FirebaseDataManager:', !!window.FirebaseDataManager);
        
        // 6. DOM要素の確認
        const customerCards = document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]');
        console.log('📋 DOM要素:');
        console.log('  顧客カード:', customerCards.length, '個');
        console.log('  Google Formsセクション:', !!document.querySelector('#google-forms-section'));
        console.log('  Google Formsボタン:', document.querySelectorAll('.google-forms-btn-v2').length, '個');
        
        // 7. 統合機能のメソッド確認
        if (window.CustomerGoogleFormsIntegrationV2) {
            console.log('🛠️ 統合機能メソッド:');
            console.log('  initialize:', typeof window.CustomerGoogleFormsIntegrationV2.initialize);
            console.log('  addGoogleFormsFeatures:', typeof window.CustomerGoogleFormsIntegrationV2.addGoogleFormsFeatures);
        }
        
        console.log('='.repeat(50));
        
        return {
            hasIntegratedAuth: !!window.IntegratedAuthManagerV2,
            hasGoogleFormsAPI: !!window.GoogleFormsAPIv2,
            hasIntegration: !!window.CustomerGoogleFormsIntegrationV2,
            isAuthenticated: window.IntegratedAuthManagerV2?.getAuthState()?.isAuthenticated || false,
            hasGoogleAuth: window.IntegratedAuthManagerV2?.getAuthState()?.googleAuth?.isSignedIn || false,
            customerCardsCount: document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]').length,
            hasGoogleFormsSection: !!document.querySelector('#google-forms-section')
        };
    },
    
    // 強制的に統合機能を実行
    forceIntegration: function() {
        console.log('🚀 統合機能を強制実行...');
        
        if (window.CustomerGoogleFormsIntegrationV2) {
            try {
                window.CustomerGoogleFormsIntegrationV2.addGoogleFormsFeatures();
                console.log('✅ 統合機能強制実行完了');
            } catch (error) {
                console.error('❌ 統合機能強制実行エラー:', error);
            }
        } else {
            console.error('❌ CustomerGoogleFormsIntegrationV2が見つかりません');
        }
    }
};

// 自動実行
setTimeout(() => {
    window.DebugIntegrationStatus.checkIntegrationStatus();
}, 3000);

// グローバルアクセス用
window.checkStatus = () => window.DebugIntegrationStatus.checkIntegrationStatus();
window.forceIntegration = () => window.DebugIntegrationStatus.forceIntegration();

console.log('✅ リアルタイム統合デバッグ準備完了');
console.log('💡 ブラウザコンソールで checkStatus() または forceIntegration() を実行できます');
