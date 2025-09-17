// 顧客管理Firebase統合アドオン
console.log('🔥 顧客管理Firebase統合アドオン読み込み中...');

// 既存のcustomer-unified-firebase.jsが存在する場合は何もしない
if (window.customerManager || document.querySelector('script[src*="customer-unified-firebase.js"]')) {
    console.log('✅ メイン顧客管理システムが既に読み込まれています');
} else {
    console.log('⚠️ メイン顧客管理システムが見つかりません');
}

// Firebase統合状況を表示
function updateCustomerFirebaseStatus() {
    const isFirebase = window.auth && window.auth.currentUser && !window.location.search.includes('fallback=demo');
    const currentUser = window.auth ? window.auth.currentUser : null;
    
    console.log(`📊 顧客管理Firebase統合状況: ${isFirebase ? 'Firebase接続' : 'ローカルモード'}`);
    
    if (currentUser) {
        console.log(`👤 現在のユーザー: ${currentUser.uid.substring(0, 8)}... (${currentUser.isAnonymous ? 'ゲスト' : 'ユーザー'})`);
    }
}

// 認証状態変更時の処理
if (window.auth) {
    window.auth.onAuthStateChanged(function(user) {
        console.log(`👤 顧客管理認証状態変更: ${user ? user.uid.substring(0, 8) + '...' : '未認証'}`);
        updateCustomerFirebaseStatus();
        
        // データ再読み込み
        setTimeout(() => {
            if (window.customerManager) {
                window.customerManager.loadCustomers();
            }
        }, 500);
    });
}

console.log('✅ 顧客管理Firebase統合アドオン準備完了');
