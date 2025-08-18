// Firebase設定 - デモモード
console.log('🔧 RentPipe デモモードで起動中...');

// デモ環境用の設定
const DEMO_MODE = true;

if (DEMO_MODE) {
    console.log('📱 デモモード: Firebaseを無効化してローカルデータで動作します');
    
    // ダミーのFirebaseオブジェクトを作成（エラーを防ぐため）
    window.db = {
        collection: function(name) {
            console.log(`📊 デモ: ${name}コレクションへのアクセス（ローカルデータを使用）`);
            return {
                orderBy: function() { return this; },
                limit: function() { return this; },
                get: function() {
                    console.log('📊 デモ: Firestoreデータ取得をスキップ');
                    return Promise.resolve({
                        docs: [],
                        map: function() { return []; }
                    });
                },
                add: function(data) {
                    console.log('📊 デモ: データ追加をローカルストレージに保存', data);
                    return Promise.resolve({ id: `demo-${Date.now()}` });
                },
                doc: function(id) {
                    return {
                        update: function(data) {
                            console.log('📊 デモ: データ更新をスキップ', id, data);
                            return Promise.resolve();
                        }
                    };
                }
            };
        }
    };
    
    window.auth = {
        onAuthStateChanged: function(callback) {
            // デモ用のダミー認証状態
            setTimeout(() => callback(null), 100);
        },
        signInAnonymously: function() {
            return Promise.resolve({ user: { uid: 'demo-user' } });
        }
    };
    
    // グローバル変数として設定
    window.firebase = {
        initializeApp: function() { return {}; },
        firestore: function() { return window.db; },
        auth: function() { return window.auth; }
    };
    
    console.log('✅ デモモード初期化完了');
    
} else {
    // 本番モード（現在は使用しない）
    console.log('🔥 本番モード: Firebase接続を試行中...');
    
    const firebaseConfig = {
        apiKey: "your-real-api-key",
        authDomain: "rentpipe-ab04e.firebaseapp.com",
        projectId: "rentpipe-ab04e",
        storageBucket: "rentpipe-ab04e.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
    };

    try {
        const app = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        console.log('✅ Firebase初期化成功');
    } catch (error) {
        console.error('❌ Firebase初期化失敗:', error);
        // デモモードにフォールバック
        window.location.reload();
    }
}

// デモデータの管理機能
window.DemoDataManager = {
    // ローカルストレージキー
    CUSTOMERS_KEY: 'rentpipe_demo_customers',
    HISTORY_KEY: 'rentpipe_demo_history',
    
    // 顧客データの取得
    getCustomers: function() {
        try {
            const stored = localStorage.getItem(this.CUSTOMERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('顧客データ読み込みエラー:', error);
            return [];
        }
    },
    
    // 顧客データの保存
    saveCustomers: function(customers) {
        try {
            localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
            console.log('✅ 顧客データ保存完了:', customers.length, '件');
            return true;
        } catch (error) {
            console.error('顧客データ保存エラー:', error);
            return false;
        }
    },
    
    // 顧客追加
    addCustomer: function(customerData) {
        const customers = this.getCustomers();
        customerData.id = customerData.id || `local-${Date.now()}`;
        customerData.createdAt = customerData.createdAt || new Date();
        customerData.updatedAt = new Date();
        
        customers.push(customerData);
        this.saveCustomers(customers);
        
        console.log('✅ 新規顧客追加:', customerData.name);
        return customerData;
    },
    
    // 履歴の取得
    getHistory: function() {
        try {
            const stored = localStorage.getItem(this.HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('履歴データ読み込みエラー:', error);
            return [];
        }
    },
    
    // 履歴の追加
    addHistory: function(historyItem) {
        const history = this.getHistory();
        historyItem.id = `history-${Date.now()}`;
        historyItem.timestamp = new Date();
        
        history.unshift(historyItem);
        // 最新50件のみ保持
        const limitedHistory = history.slice(0, 50);
        
        try {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limitedHistory));
            console.log('✅ 履歴追加:', historyItem.note);
        } catch (error) {
            console.warn('履歴保存エラー:', error);
        }
    },
    
    // デモデータリセット
    resetDemoData: function() {
        localStorage.removeItem(this.CUSTOMERS_KEY);
        localStorage.removeItem(this.HISTORY_KEY);
        console.log('🔄 デモデータをリセットしました');
    },
    
    // ストレージ使用量確認
    getStorageInfo: function() {
        const customers = this.getCustomers();
        const history = this.getHistory();
        
        return {
            customers: customers.length,
            history: history.length,
            storageUsed: new Blob([JSON.stringify(customers) + JSON.stringify(history)]).size
        };
    }
};

// 初期化完了の通知
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 RentPipe デモ環境準備完了');
    
    if (DEMO_MODE) {
        const info = window.DemoDataManager.getStorageInfo();
        console.log('📊 現在のデータ:', {
            顧客数: info.customers,
            履歴数: info.history,
            使用容量: Math.round(info.storageUsed / 1024) + 'KB'
        });
    }
});
