// データソース診断・統一ツール
console.log('🔍 データソース診断ツール初期化...');

// デバッグ用データ表示関数
window.debugDataSources = async function() {
    console.log('\n=== 📊 RentPipe データソース診断 ===');
    
    // 1. Firebase接続状況
    const firebaseConnected = !!(window.auth && window.auth.currentUser);
    console.log(`🔥 Firebase接続: ${firebaseConnected ? 'はい' : 'いいえ'}`);
    if (firebaseConnected) {
        console.log(`👤 ユーザーID: ${window.auth.currentUser.uid}`);
    }
    
    // 2. ローカルストレージデータ
    const localCustomers = localStorage.getItem('rentpipe_demo_customers');
    const localCount = localCustomers ? JSON.parse(localCustomers).length : 0;
    console.log(`💾 ローカルストレージ顧客数: ${localCount}件`);
    
    // 3. FirebaseDataManager経由データ
    if (window.FirebaseDataManager) {
        try {
            const firebaseCustomers = await window.FirebaseDataManager.getCustomers();
            console.log(`🔥 Firebase顧客数: ${firebaseCustomers.length}件`);
            
            if (firebaseCustomers.length > 0) {
                console.log('Firebase顧客サンプル:', firebaseCustomers[0]);
            }
        } catch (error) {
            console.error('Firebase顧客取得エラー:', error);
        }
    }
    
    // 4. UnifiedDataManager経由データ
    if (window.UnifiedDataManager) {
        try {
            const unifiedCustomers = await window.UnifiedDataManager.getCustomers();
            console.log(`🔗 UnifiedDataManager顧客数: ${unifiedCustomers.length}件`);
            
            if (unifiedCustomers.length > 0) {
                console.log('UnifiedDataManager顧客サンプル:', unifiedCustomers[0]);
            }
        } catch (error) {
            console.error('UnifiedDataManager顧客取得エラー:', error);
        }
    }
    
    // 5. 現在のページでの表示状況
    const pageType = window.location.pathname.includes('pipeline') ? 'パイプライン' : '顧客管理';
    console.log(`📄 現在のページ: ${pageType}`);
    
    if (pageType === 'パイプライン' && window.pipelineManager) {
        console.log(`📈 パイプライン表示顧客数: ${window.pipelineManager.customers ? window.pipelineManager.customers.length : 0}件`);
    }
    
    if (pageType === '顧客管理' && window.customerManager) {
        console.log(`👥 顧客管理表示顧客数: ${window.customerManager.customers ? window.customerManager.customers.length : 0}件`);
    }
    
    console.log('=== 診断完了 ===\n');
    
    // 画面にも表示
    const debugInfo = `
📊 データソース診断結果:
- Firebase接続: ${firebaseConnected ? 'はい' : 'いいえ'}
- ローカル顧客数: ${localCount}件
- Firebase顧客数: ${window.FirebaseDataManager ? '取得中...' : 'N/A'}
- 現在のページ: ${pageType}
    `;
    
    alert(debugInfo);
};

// データ統一機能
window.unifyDataSources = async function() {
    if (!confirm('データソースを統一しますか？\n\n⚠️ この操作により、全画面で同じデータが表示されるようになります。')) {
        return;
    }
    
    try {
        console.log('🔄 データソース統一開始...');
        
        // Firebase接続確認
        if (!window.auth.currentUser) {
            console.log('🔐 Firebase接続開始...');
            await window.auth.signInAnonymously();
        }
        
        // ローカルデータをFirebaseに移行
        const localCustomers = localStorage.getItem('rentpipe_demo_customers');
        if (localCustomers && window.FirebaseDataManager) {
            const customers = JSON.parse(localCustomers);
            console.log(`📦 ${customers.length}件のローカルデータをFirebaseに移行中...`);
            
            for (const customer of customers) {
                // IDとタイムスタンプを調整
                customer.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                customer.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                await window.FirebaseDataManager.saveCustomer(customer);
            }
            
            console.log('✅ データ移行完了');
        }
        
        // 両画面を更新
        if (window.customerManager) {
            await window.customerManager.loadCustomers();
        }
        
        if (window.pipelineManager) {
            await window.pipelineManager.loadPipeline();
        }
        
        alert('✅ データソース統一完了！\n\n両画面で同じデータが表示されるようになりました。');
        
    } catch (error) {
        console.error('データ統一エラー:', error);
        alert(`データ統一エラー: ${error.message}`);
    }
};

// デバッグボタンを画面に追加
function addDebugButtons() {
    if (document.getElementById('debugButtons')) return;
    
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debugButtons';
    debugContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    
    const debugButton = document.createElement('button');
    debugButton.textContent = '🔍 データ診断';
    debugButton.onclick = window.debugDataSources;
    debugButton.style.cssText = `
        padding: 8px 12px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
    `;
    
    const unifyButton = document.createElement('button');
    unifyButton.textContent = '🔗 データ統一';
    unifyButton.onclick = window.unifyDataSources;
    unifyButton.style.cssText = `
        padding: 8px 12px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
    `;
    
    debugContainer.appendChild(debugButton);
    debugContainer.appendChild(unifyButton);
    document.body.appendChild(debugContainer);
}

// ページ読み込み後にデバッグボタンを追加
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addDebugButtons, 2000);
});

console.log('✅ データソース診断ツール準備完了');
