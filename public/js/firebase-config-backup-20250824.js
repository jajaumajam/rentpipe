// Firebase設定 - マルチテナント対応版
console.log('🔧 RentPipe マルチテナント対応版起動中...');

// デモ環境用の設定
const DEMO_MODE = true;

if (DEMO_MODE) {
    console.log('📱 デモモード: マルチテナント対応のローカルデータで動作します');
    
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
                        },
                        delete: function() {
                            console.log('📊 デモ: データ削除をスキップ', id);
                            return Promise.resolve();
                        },
                        get: function() {
                            console.log('📊 デモ: データ取得をスキップ', id);
                            return Promise.resolve({ exists: false, data: () => null });
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
    // 本番モード（Phase2で使用）
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

// マルチテナント対応データマネージャー
window.DemoDataManager = {
    // テナントマネージャーの参照
    getTenant: function() {
        return window.TenantManager ? window.TenantManager.currentTenant : null;
    },
    
    // 顧客データの取得（テナント対応）
    getCustomers: function() {
        if (!window.TenantManager) {
            // 後方互換性のため従来の方法にフォールバック
            try {
                const stored = localStorage.getItem('rentpipe_demo_customers');
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.warn('顧客データ読み込みエラー:', error);
                return [];
            }
        }
        
        const customers = window.TenantManager.getTenantData('customers');
        return customers || [];
    },
    
    // 顧客データの保存（テナント対応）
    saveCustomers: function(customers) {
        if (!window.TenantManager) {
            // 後方互換性のため従来の方法にフォールバック
            try {
                localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
                return true;
            } catch (error) {
                console.error('顧客データ保存エラー:', error);
                return false;
            }
        }
        
        return window.TenantManager.setTenantData('customers', customers);
    },
    
    // 顧客追加（制限チェック付き）
    addCustomer: function(customerData) {
        // テナントの顧客数制限をチェック
        if (window.TenantManager && !window.TenantManager.canAddCustomer()) {
            const stats = window.TenantManager.getUsageStats();
            
            if (window.ErrorHandler) {
                ErrorHandler.showError(
                    '顧客数の上限に達しています',
                    `現在のプラン（${stats.plan}）では最大${stats.customersLimit}名まで登録可能です`
                );
            } else {
                alert(`顧客数の上限（${stats.customersLimit}名）に達しています。プランをアップグレードしてください。`);
            }
            
            return null;
        }
        
        const customers = this.getCustomers();
        customerData.id = customerData.id || `customer_${Date.now()}`;
        customerData.tenantId = window.TenantManager ? window.TenantManager.currentTenant.id : 'default';
        customerData.createdAt = customerData.createdAt || new Date().toISOString();
        customerData.updatedAt = new Date().toISOString();
        
        customers.push(customerData);
        this.saveCustomers(customers);
        
        // 履歴に追加
        this.addHistory({
            type: 'customer_added',
            customerId: customerData.id,
            customerName: customerData.name,
            note: `新規顧客「${customerData.name}」を追加しました`
        });
        
        console.log('✅ 新規顧客追加:', customerData.name);
        return customerData;
    },
    
    // 顧客更新
    updateCustomer: function(customerId, updates) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === customerId);
        
        if (index === -1) {
            console.error('顧客が見つかりません:', customerId);
            return null;
        }
        
        customers[index] = {
            ...customers[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveCustomers(customers);
        
        // 履歴に追加
        this.addHistory({
            type: 'customer_updated',
            customerId: customerId,
            customerName: customers[index].name,
            note: `顧客「${customers[index].name}」の情報を更新しました`,
            changes: updates
        });
        
        console.log('✅ 顧客更新:', customers[index].name);
        return customers[index];
    },
    
    // 顧客削除
    deleteCustomer: function(customerId) {
        const customers = this.getCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            console.error('顧客が見つかりません:', customerId);
            return false;
        }
        
        const filteredCustomers = customers.filter(c => c.id !== customerId);
        this.saveCustomers(filteredCustomers);
        
        // 履歴に追加
        this.addHistory({
            type: 'customer_deleted',
            customerId: customerId,
            customerName: customer.name,
            note: `顧客「${customer.name}」を削除しました`
        });
        
        console.log('✅ 顧客削除:', customer.name);
        return true;
    },
    
    // 履歴の取得（テナント対応）
    getHistory: function() {
        if (!window.TenantManager) {
            // 後方互換性
            try {
                const stored = localStorage.getItem('rentpipe_demo_history');
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.warn('履歴データ読み込みエラー:', error);
                return [];
            }
        }
        
        const history = window.TenantManager.getTenantData('history');
        return history || [];
    },
    
    // 履歴の追加（テナント対応）
    addHistory: function(historyItem) {
        const history = this.getHistory();
        
        historyItem.id = `history_${Date.now()}`;
        historyItem.timestamp = new Date().toISOString();
        historyItem.tenantId = window.TenantManager ? window.TenantManager.currentTenant.id : 'default';
        
        history.unshift(historyItem);
        
        // 最新100件のみ保持
        const limitedHistory = history.slice(0, 100);
        
        if (window.TenantManager) {
            window.TenantManager.setTenantData('history', limitedHistory);
        } else {
            // 後方互換性
            try {
                localStorage.setItem('rentpipe_demo_history', JSON.stringify(limitedHistory));
            } catch (error) {
                console.warn('履歴保存エラー:', error);
            }
        }
        
        console.log('✅ 履歴追加:', historyItem.note);
    },
    
    // データのエクスポート（テナント単位）
    exportData: function(format = 'json') {
        const tenant = window.TenantManager ? window.TenantManager.currentTenant : null;
        
        // エクスポート機能の使用権限チェック
        if (tenant && !tenant.settings.features.export) {
            if (window.ErrorHandler) {
                ErrorHandler.showError(
                    'エクスポート機能は利用できません',
                    'この機能を使用するにはスタンダードプラン以上が必要です'
                );
            } else {
                alert('エクスポート機能はスタンダードプラン以上で利用可能です');
            }
            return null;
        }
        
        const data = {
            exportDate: new Date().toISOString(),
            tenantInfo: tenant ? {
                id: tenant.id,
                name: tenant.name,
                companyName: tenant.settings.companyName
            } : null,
            customers: this.getCustomers(),
            history: this.getHistory()
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data.customers);
        }
        
        return data;
    },
    
    // CSV変換
    convertToCSV: function(customers) {
        if (!customers || customers.length === 0) {
            return 'データがありません';
        }
        
        // ヘッダー行
        const headers = [
            '顧客ID', '名前', 'メール', '電話番号', '年齢', '職業', 
            '年収', '予算（最低）', '予算（最高）', 'ステータス', 
            '登録日', '更新日', '備考'
        ];
        
        // データ行
        const rows = customers.map(c => [
            c.id,
            c.name,
            c.email,
            c.phone,
            c.age || '',
            c.occupation || '',
            c.annualIncome || '',
            c.preferences?.budgetMin || '',
            c.preferences?.budgetMax || '',
            c.pipelineStatus || '',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('ja-JP') : '',
            c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ja-JP') : '',
            c.notes || ''
        ]);
        
        // CSV形式に変換
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    },
    
    // データ移行（旧形式→マルチテナント形式）
    migrateToMultiTenant: function() {
        console.log('🔄 データ移行開始...');
        
        // 旧形式のデータを取得
        const oldCustomers = localStorage.getItem('rentpipe_demo_customers');
        const oldHistory = localStorage.getItem('rentpipe_demo_history');
        
        if (!oldCustomers && !oldHistory) {
            console.log('移行するデータがありません');
            return true;
        }
        
        // テナントマネージャーが初期化されていることを確認
        if (!window.TenantManager || !window.TenantManager.currentTenant) {
            console.error('テナントマネージャーが初期化されていません');
            return false;
        }
        
        try {
            // 顧客データの移行
            if (oldCustomers) {
                const customers = JSON.parse(oldCustomers);
                window.TenantManager.setTenantData('customers', customers);
                console.log(`✅ ${customers.length}件の顧客データを移行しました`);
            }
            
            // 履歴データの移行
            if (oldHistory) {
                const history = JSON.parse(oldHistory);
                window.TenantManager.setTenantData('history', history);
                console.log(`✅ ${history.length}件の履歴データを移行しました`);
            }
            
            // 旧データを削除（オプション）
            // localStorage.removeItem('rentpipe_demo_customers');
            // localStorage.removeItem('rentpipe_demo_history');
            
            console.log('✅ データ移行完了');
            
            if (window.ErrorHandler) {
                ErrorHandler.showSuccess('データ移行が完了しました');
            }
            
            return true;
            
        } catch (error) {
            console.error('データ移行エラー:', error);
            
            if (window.ErrorHandler) {
                ErrorHandler.showError('データ移行に失敗しました', error.message);
            }
            
            return false;
        }
    },
    
    // ストレージ使用量確認（テナント単位）
    getStorageInfo: function() {
        const customers = this.getCustomers();
        const history = this.getHistory();
        const tenant = window.TenantManager ? window.TenantManager.currentTenant : null;
        
        const storageUsed = new Blob([
            JSON.stringify(customers),
            JSON.stringify(history),
            JSON.stringify(tenant)
        ]).size;
        
        return {
            tenantId: tenant?.id || 'default',
            tenantName: tenant?.name || 'デフォルト',
            plan: tenant?.plan || 'free',
            customers: customers.length,
            customersLimit: tenant?.settings.maxCustomers || 10,
            history: history.length,
            storageUsed: storageUsed,
            storageUsedMB: (storageUsed / 1024 / 1024).toFixed(2)
        };
    }
};

// 初期化完了の通知
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 RentPipe マルチテナント対応環境準備完了');
    
    // テナントマネージャーが初期化されるまで待つ
    setTimeout(() => {
        // データ移行チェック
        const needsMigration = localStorage.getItem('rentpipe_demo_customers') !== null;
        if (needsMigration && !localStorage.getItem('rentpipe_migration_complete')) {
            console.log('📦 旧データを検出しました。移行を開始します...');
            if (window.DemoDataManager.migrateToMultiTenant()) {
                localStorage.setItem('rentpipe_migration_complete', 'true');
            }
        }
        
        // ストレージ情報を表示
        const info = window.DemoDataManager.getStorageInfo();
        console.log('📊 ストレージ使用状況:', {
            テナント: info.tenantName,
            プラン: info.plan,
            顧客数: `${info.customers} / ${info.customersLimit === -1 ? '無制限' : info.customersLimit}`,
            履歴数: info.history,
            使用容量: `${info.storageUsedMB} MB`
        });
    }, 500);
});

console.log('✅ マルチテナント対応データマネージャー準備完了');
