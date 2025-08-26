// Firebase設定 - 本番モード（Phase2）
console.log('🔧 RentPipe Phase2本番モードで起動中...');

// 本番・デモ切り替えフラグ
const DEMO_MODE = false; // Phase2: 本番モードに切り替え
const DEBUG_MODE = true; // デバッグログ有効

if (!DEMO_MODE) {
    console.log('🔥 本番モード: Firebase接続開始...');
    
    // Firebase本番設定
    const firebaseConfig = {
        apiKey: "AIzaSyDB-vj9ykVqsW-Iyh-zjZ_KV3-GMaEm0Ok,
        authDomain: "rentpipe-ab04e.firebaseapp.com",
        projectId: "rentpipe-ab04e",
        storageBucket: "rentpipe-ab04e.firebasestorage.app",
        messagingSenderId: "586040985916",
        appId: "1:586040985916:web:3cdb5db072f1a6569fb639"
    };

    try {
        // Firebase初期化
        const app = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('✅ Firebase初期化成功');
        
        // Firestore接続テスト
        window.db.collection('system').doc('test').get()
            .then(() => {
                console.log('✅ Firestore接続確認完了');
            })
            .catch(error => {
                console.warn('⚠️ Firestore接続テスト:', error.message);
            });
        
    } catch (error) {
        console.error('❌ Firebase初期化失敗:', error);
        
        // 緊急時：デモモードにフォールバック
        console.log('🔄 デモモードにフォールバックします...');
        window.location.href = window.location.href + '?fallback=demo';
    }
    
} else {
    // デモモード（従来の処理）
    console.log('📱 デモモード: マルチテナント対応のローカルデータで動作します');
    
    // ダミーFirebaseオブジェクト
    window.db = {
        collection: function(name) {
            if (DEBUG_MODE) console.log(`📊 デモ: ${name}コレクションアクセス`);
            return {
                orderBy: function() { return this; },
                limit: function() { return this; },
                get: function() {
                    if (DEBUG_MODE) console.log('📊 デモ: Firestoreデータ取得スキップ');
                    return Promise.resolve({
                        docs: [],
                        map: function() { return []; },
                        forEach: function() {}
                    });
                },
                add: function(data) {
                    if (DEBUG_MODE) console.log('📊 デモ: データ追加', data);
                    return Promise.resolve({ id: `demo-${Date.now()}` });
                },
                doc: function(id) {
                    return {
                        get: function() {
                            return Promise.resolve({ 
                                exists: false, 
                                data: () => null,
                                id: id
                            });
                        },
                        set: function(data) {
                            if (DEBUG_MODE) console.log('📊 デモ: データ設定', id, data);
                            return Promise.resolve();
                        },
                        update: function(data) {
                            if (DEBUG_MODE) console.log('📊 デモ: データ更新', id, data);
                            return Promise.resolve();
                        },
                        delete: function() {
                            if (DEBUG_MODE) console.log('📊 デモ: データ削除', id);
                            return Promise.resolve();
                        }
                    };
                }
            };
        }
    };
    
    window.auth = {
        onAuthStateChanged: function(callback) {
            setTimeout(() => callback(null), 100);
        },
        signInAnonymously: function() {
            return Promise.resolve({ user: { uid: 'demo-user' } });
        }
    };
    
    window.firebase = {
        initializeApp: function() { return {}; },
        firestore: function() { return window.db; },
        auth: function() { return window.auth; }
    };
    
    console.log('✅ デモモード初期化完了');
}

// マルチテナント対応データマネージャー（Phase2拡張版）
window.FirebaseDataManager = {
    
    // 現在のテナントID取得
    getCurrentTenantId: function() {
        // Phase2: 認証実装後はauth.currentUser.uidを使用
        return 'demo-tenant-001';
    },
    
    // テナント別顧客データ取得
    getCustomers: async function() {
        if (DEMO_MODE) {
            // デモモード：ローカルストレージから取得
            try {
                const stored = localStorage.getItem('rentpipe_demo_customers');
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('デモデータ取得エラー:', error);
                return [];
            }
        }
        
        // 本番モード：Firestoreから取得
        try {
            const tenantId = this.getCurrentTenantId();
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
            
            console.log(`✅ Firestore顧客データ取得完了: ${customers.length}件`);
            return customers;
            
        } catch (error) {
            console.error('Firestore顧客データ取得エラー:', error);
            return [];
        }
    },
    
    // テナント別顧客データ保存
    saveCustomer: async function(customerData) {
        if (DEMO_MODE) {
            // デモモード：ローカルストレージに保存
            try {
                const customers = await this.getCustomers();
                const existingIndex = customers.findIndex(c => c.id === customerData.id);
                
                if (existingIndex !== -1) {
                    customers[existingIndex] = customerData;
                } else {
                    customers.push(customerData);
                }
                
                localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
                return true;
                
            } catch (error) {
                console.error('デモデータ保存エラー:', error);
                return false;
            }
        }
        
        // 本番モード：Firestoreに保存
        try {
            const tenantId = this.getCurrentTenantId();
            const docRef = customerData.id ? 
                window.db.collection(`tenants/${tenantId}/customers`).doc(customerData.id) :
                window.db.collection(`tenants/${tenantId}/customers`).doc();
            
            const saveData = {
                ...customerData,
                tenantId: tenantId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...(customerData.id ? {} : { 
                    id: docRef.id,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                })
            };
            
            await docRef.set(saveData, { merge: true });
            console.log('✅ Firestore顧客データ保存完了:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('Firestore顧客データ保存エラー:', error);
            return false;
        }
    },
    
    // 接続テスト
    testConnection: async function() {
        if (DEMO_MODE) {
            console.log('📱 デモモード：接続テストをスキップ');
            return true;
        }
        
        try {
            const testDoc = await window.db.collection('system').doc('connection-test').get();
            console.log('✅ Firebase接続テスト成功');
            return true;
        } catch (error) {
            console.error('❌ Firebase接続テスト失敗:', error);
            return false;
        }
    }
};

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 RentPipe Phase2 初期化開始...');
    
    // 接続テスト実行
    setTimeout(() => {
        window.FirebaseDataManager.testConnection();
    }, 1000);
    
    console.log('✅ RentPipe Phase2 準備完了');
});

console.log('🎉 Firebase Phase2設定ロード完了');
