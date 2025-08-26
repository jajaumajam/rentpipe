// 緊急データ復旧・統一スクリプト
console.log('🚨 緊急データ復旧スクリプト開始...');

// デモデータ復旧
window.restoreDefaultData = function() {
    console.log('📦 デフォルトデモデータを復旧中...');
    
    const defaultCustomers = [
        {
            id: 'demo-customer-001',
            name: '田中太郎',
            email: 'tanaka@example.com',
            phone: '090-1234-5678',
            status: '初回相談',
            pipelineStatus: '初回相談',
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-20T10:30:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-002',
            name: '佐藤花子',
            email: 'sato@example.com',
            phone: '090-2345-6789',
            status: '物件紹介',
            pipelineStatus: '物件紹介',
            createdAt: '2024-01-16T10:00:00Z',
            updatedAt: '2024-01-21T14:00:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-003',
            name: '鈴木一郎',
            email: 'suzuki@example.com',
            phone: '090-3456-7890',
            status: '内見',
            pipelineStatus: '内見',
            createdAt: '2024-01-17T11:00:00Z',
            updatedAt: '2024-01-22T16:00:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-004',
            name: '高橋美咲',
            email: 'takahashi@example.com',
            phone: '090-4567-8901',
            status: '申込',
            pipelineStatus: '申込',
            createdAt: '2024-01-18T12:00:00Z',
            updatedAt: '2024-01-23T09:00:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-005',
            name: '山田健太',
            email: 'yamada@example.com',
            phone: '090-5678-9012',
            status: '審査',
            pipelineStatus: '審査',
            createdAt: '2024-01-19T13:00:00Z',
            updatedAt: '2024-01-24T11:00:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-006',
            name: '渡辺直子',
            email: 'watanabe@example.com',
            phone: '090-6789-0123',
            status: '契約',
            pipelineStatus: '契約',
            createdAt: '2024-01-20T14:00:00Z',
            updatedAt: '2024-01-25T15:00:00Z',
            source: 'demo'
        },
        {
            id: 'demo-customer-007',
            name: '伊藤雅子',
            email: 'ito@example.com',
            phone: '090-7890-1234',
            status: '完了',
            pipelineStatus: '完了',
            createdAt: '2024-01-21T15:00:00Z',
            updatedAt: '2024-01-26T10:00:00Z',
            source: 'demo'
        }
    ];
    
    // 複数のキーに保存（互換性のため）
    localStorage.setItem('rentpipe_demo_customers', JSON.stringify(defaultCustomers));
    localStorage.setItem('rentpipe_customers', JSON.stringify(defaultCustomers));
    localStorage.setItem('customers', JSON.stringify(defaultCustomers));
    
    console.log(`✅ ${defaultCustomers.length}件のデモデータを復旧しました`);
    
    // 画面更新
    if (window.customerManager) {
        window.customerManager.loadCustomers();
    }
    if (window.pipelineManager) {
        window.pipelineManager.loadPipeline();
    }
    
    alert('📦 デモデータを復旧しました！\n\n7件の顧客データが利用可能です。');
};

// Firebase強制統一
window.forceFirebaseSync = async function() {
    console.log('🔥 Firebase強制同期開始...');
    
    try {
        // Firebase接続確認
        if (!window.auth.currentUser) {
            await window.auth.signInAnonymously();
        }
        
        // ローカルデータ取得（複数キーチェック）
        let localCustomers = null;
        const possibleKeys = ['rentpipe_demo_customers', 'rentpipe_customers', 'customers'];
        
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                localCustomers = JSON.parse(data);
                console.log(`✅ ${key}からデータ取得: ${localCustomers.length}件`);
                break;
            }
        }
        
        if (!localCustomers || localCustomers.length === 0) {
            throw new Error('同期するローカルデータがありません');
        }
        
        // Firebase同期
        const tenantId = window.auth.currentUser.uid;
        const batch = window.db.batch();
        
        for (const customer of localCustomers) {
            const docRef = window.db.collection(`tenants/${tenantId}/customers`).doc(customer.id);
            const syncData = {
                ...customer,
                tenantId: tenantId,
                syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            batch.set(docRef, syncData, { merge: true });
        }
        
        await batch.commit();
        console.log(`✅ ${localCustomers.length}件をFirebaseに同期完了`);
        
        alert(`🔥 Firebase同期完了！\n\n${localCustomers.length}件の顧客データをFirestoreに保存しました。`);
        
        // 画面更新
        if (window.customerManager) {
            await window.customerManager.loadCustomers();
        }
        if (window.pipelineManager) {
            await window.pipelineManager.loadPipeline();
        }
        
    } catch (error) {
        console.error('Firebase同期エラー:', error);
        alert(`Firebase同期エラー: ${error.message}`);
    }
};

// 完全リセット
window.completeReset = function() {
    if (!confirm('⚠️ 完全リセットを実行しますか？\n\n・全ローカルデータ削除\n・デモデータ復旧\n・Firebase再接続')) {
        return;
    }
    
    console.log('🔄 完全リセット実行中...');
    
    // ローカルストレージクリア
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('rentpipe') || key.includes('customers')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // デモデータ復旧
    window.restoreDefaultData();
    
    // ページリロード
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

console.log('✅ 緊急データ復旧スクリプト準備完了');
