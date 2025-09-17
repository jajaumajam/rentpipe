// データキー統一スクリプト
console.log('🔗 データキー統一スクリプト開始...');

// 統一データマネージャー修正
if (window.UnifiedDataManager) {
    console.log('📊 UnifiedDataManagerのキー統一を実行中...');
    
    // 元のgetCustomers関数を保存
    const originalGetCustomers = window.UnifiedDataManager.getCustomers;
    
    // 統一されたgetCustomers関数
    window.UnifiedDataManager.getCustomers = function() {
        console.log('🔍 統一顧客データ取得開始...');
        
        // 優先順位でキーをチェック
        const possibleKeys = ['rentpipe_customers', 'rentpipe_demo_customers', 'customers'];
        
        for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const customers = JSON.parse(stored);
                    if (customers && customers.length > 0) {
                        console.log(`✅ ${key}から${customers.length}件の顧客データを取得`);
                        return customers;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${key}の解析エラー:`, error);
                }
            }
        }
        
        console.log('📦 データが見つかりません。空配列を返します。');
        return [];
    };
    
    // 統一されたsaveCustomers関数
    const originalSaveCustomers = window.UnifiedDataManager.saveCustomers;
    
    window.UnifiedDataManager.saveCustomers = function(customers) {
        console.log(`💾 統一顧客データ保存: ${customers.length}件`);
        
        try {
            const dataString = JSON.stringify(customers);
            
            // 複数のキーに保存（互換性確保）
            localStorage.setItem('rentpipe_customers', dataString);
            localStorage.setItem('rentpipe_demo_customers', dataString);
            localStorage.setItem('customers', dataString);
            
            console.log('✅ 複数キーへの保存完了');
            return true;
            
        } catch (error) {
            console.error('❌ データ保存エラー:', error);
            return false;
        }
    };
    
    console.log('✅ UnifiedDataManagerのキー統一完了');
} else {
    console.warn('⚠️ UnifiedDataManagerが見つかりません');
}

// Firebase統合アドオンの修正
if (window.FirebaseDataManager) {
    console.log('🔥 FirebaseDataManagerのキー統一を実行中...');
    
    // 元のgetCustomers関数を保存
    const originalFirebaseGetCustomers = window.FirebaseDataManager.getCustomers;
    
    // 統一されたgetCustomers関数
    window.FirebaseDataManager.getCustomers = async function() {
        console.log('🔍 Firebase統合顧客データ取得開始...');
        
        // Firebase接続時の処理
        if (window.auth && window.auth.currentUser && !window.location.search.includes('fallback=demo')) {
            try {
                const tenantId = window.auth.currentUser.uid;
                const snapshot = await window.db
                    .collection(`tenants/${tenantId}/customers`)
                    .orderBy('updatedAt', 'desc')
                    .get();
                
                const customers = [];
                snapshot.forEach(doc => {
                    customers.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log(`✅ Firebase顧客データ取得: ${customers.length}件`);
                return customers;
                
            } catch (error) {
                console.error('❌ Firebase顧客データ取得エラー:', error);
                console.log('🔄 ローカルデータにフォールバック');
            }
        }
        
        // ローカルデータフォールバック（統一キー使用）
        const possibleKeys = ['rentpipe_customers', 'rentpipe_demo_customers', 'customers'];
        
        for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const customers = JSON.parse(stored);
                    if (customers && customers.length > 0) {
                        console.log(`✅ ローカル${key}から${customers.length}件の顧客データを取得`);
                        return customers;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${key}の解析エラー:`, error);
                }
            }
        }
        
        console.log('📦 データが見つかりません。空配列を返します。');
        return [];
    };
    
    console.log('✅ FirebaseDataManagerのキー統一完了');
} else {
    console.warn('⚠️ FirebaseDataManagerが見つかりません');
}

// パイプライン・顧客管理の強制リロード
window.forceReloadAllData = async function() {
    console.log('🔄 全画面データ強制リロード開始...');
    
    try {
        // 顧客管理画面のリロード
        if (window.customerManager) {
            console.log('👥 顧客管理データリロード...');
            await window.customerManager.loadCustomers();
        }
        
        // パイプライン画面のリロード
        if (window.pipelineManager) {
            console.log('📈 パイプラインデータリロード...');
            await window.pipelineManager.loadPipeline();
        }
        
        console.log('✅ 全画面データリロード完了');
        alert('🔄 データリロード完了！\n\n両画面で同じデータが表示されるようになりました。');
        
    } catch (error) {
        console.error('❌ データリロードエラー:', error);
        alert(`データリロードエラー: ${error.message}`);
    }
};

console.log('✅ データキー統一スクリプト準備完了');
