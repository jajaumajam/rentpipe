// 🔍 顧客管理画面統合デバッグスクリプト
console.log('🔍 顧客管理画面統合デバッグ開始...');

window.CustomerIntegrationDebug = {
    // デバッグ情報を表示
    analyzeCustomerPage: function() {
        console.log('📊 顧客管理画面解析開始...');
        
        // 既存の要素を確認
        const customerCards = document.querySelectorAll('.customer-card, [class*="customer"], [data-customer-id]');
        console.log('🔍 顧客カード要素:', customerCards.length, '個発見');
        
        customerCards.forEach((card, index) => {
            console.log(`📋 カード${index + 1}:`, {
                className: card.className,
                id: card.id,
                dataCustomerId: card.dataset.customerId,
                innerHTML: card.innerHTML.substring(0, 100) + '...'
            });
        });
        
        // 顧客データを確認
        if (window.customers) {
            console.log('👥 グローバル顧客データ:', window.customers.length, '件');
        }
        
        if (window.FirebaseDataManager) {
            console.log('🔥 FirebaseDataManager:', 'Available');
        }
        
        // DOMの構造を確認
        const customerList = document.querySelector('#customerList, .customer-list, .customers-container');
        if (customerList) {
            console.log('📝 顧客リストコンテナ発見:', customerList.className);
        } else {
            console.log('❌ 顧客リストコンテナが見つかりません');
        }
        
        return {
            customerCards: customerCards.length,
            hasCustomerData: !!window.customers,
            hasFirebaseManager: !!window.FirebaseDataManager,
            hasListContainer: !!customerList
        };
    },
    
    // 顧客カードに手動でボタンを追加（テスト用）
    addTestButtons: function() {
        console.log('🧪 テスト用ボタン追加開始...');
        
        const customerCards = document.querySelectorAll('.customer-card, [class*="customer"]');
        
        customerCards.forEach((card, index) => {
            // 既存のテストボタンを削除
            const existingTestBtn = card.querySelector('.test-google-forms-btn');
            if (existingTestBtn) existingTestBtn.remove();
            
            // テスト用ボタンを作成
            const testBtn = document.createElement('button');
            testBtn.className = 'btn btn-primary btn-sm test-google-forms-btn';
            testBtn.innerHTML = '🧪 テスト: Google Forms';
            testBtn.style.margin = '5px';
            testBtn.onclick = () => {
                alert(`テストボタンクリック: カード${index + 1}\nClassName: ${card.className}`);
                console.log('🧪 テストボタンクリック:', card);
            };
            
            // ボタンを追加（カードの最後に）
            card.appendChild(testBtn);
            
            console.log(`✅ テストボタンをカード${index + 1}に追加`);
        });
        
        console.log('✅ テスト用ボタン追加完了');
    }
};

// 自動実行
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.CustomerIntegrationDebug.analyzeCustomerPage();
    }, 2000); // 2秒後に実行
});

console.log('✅ 顧客管理画面統合デバッグ準備完了');
