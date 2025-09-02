// RentPipe データ移行ツール（ローカル → Firebase）
console.log('📦 データ移行ツール初期化中...');

window.DataMigration = {
    // ローカルデータをFirebaseに移行
    migrateToFirebase: async function() {
        console.log('🔄 データ移行開始...');
        
        if (!window.auth || !window.db || !window.currentUser) {
            throw new Error('Firebase認証が必要です');
        }
        
        const results = {
            customers: 0,
            errors: []
        };
        
        try {
            // 1. 顧客データの移行
            await this.migrateCustomers(results);
            
            console.log('✅ データ移行完了:', results);
            return results;
            
        } catch (error) {
            console.error('❌ データ移行エラー:', error);
            results.errors.push(error.message);
            throw error;
        }
    },
    
    // 顧客データ移行
    migrateCustomers: async function(results) {
        console.log('👥 顧客データ移行開始...');
        
        // ローカルストレージから顧客データを取得
        const possibleKeys = [
            'rentpipe_demo_customers',
            'rentpipe_customers',
            'customers',
            'demo_customers'
        ];
        
        let localCustomers = null;
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        localCustomers = parsed;
                        console.log(`📋 ローカルデータ発見: ${key} (${parsed.length}件)`);
                        break;
                    }
                } catch (e) {
                    console.warn(`キー ${key} のパースエラー:`, e);
                }
            }
        }
        
        if (!localCustomers || localCustomers.length === 0) {
            console.log('📭 移行対象の顧客データがありません');
            return;
        }
        
        // Firestoreのユーザー専用コレクション
        const userCollection = window.db.collection('users').doc(window.currentUser.uid).collection('customers');
        
        // 既存データをチェック
        const existingDocs = await userCollection.get();
        const existingIds = new Set(existingDocs.docs.map(doc => doc.id));
        
        console.log(`🔍 既存Firebase顧客数: ${existingIds.size}件`);
        
        // 各顧客データを移行
        for (const customer of localCustomers) {
            try {
                // IDが重複している場合はスキップまたは更新
                if (existingIds.has(customer.id)) {
                    console.log(`⏭️  スキップ（既存）: ${customer.name} (${customer.id})`);
                    continue;
                }
                
                // Firestore用にデータを調整
                const firestoreCustomer = {
                    ...customer,
                    createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
                    updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
                    migratedAt: new Date(),
                    source: customer.source || 'migration'
                };
                
                // Firestoreに保存
                await userCollection.doc(customer.id).set(firestoreCustomer);
                
                results.customers++;
                console.log(`✅ 移行完了: ${customer.name} (${customer.id})`);
                
            } catch (error) {
                console.error(`❌ 移行エラー: ${customer.name}`, error);
                results.errors.push(`${customer.name}: ${error.message}`);
            }
        }
        
        console.log(`📊 顧客データ移行結果: ${results.customers}件成功`);
    },
    
    // Firebase → ローカル（バックアップ用）
    backupFromFirebase: async function() {
        console.log('💾 Firebaseデータをローカルにバックアップ...');
        
        if (!window.auth || !window.db || !window.currentUser) {
            throw new Error('Firebase認証が必要です');
        }
        
        const userCollection = window.db.collection('users').doc(window.currentUser.uid).collection('customers');
        const snapshot = await userCollection.get();
        
        const customers = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Firestore Timestampを文字列に変換
            customers.push({
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            });
        });
        
        // ローカルストレージに保存
        localStorage.setItem('rentpipe_firebase_backup', JSON.stringify(customers));
        localStorage.setItem('rentpipe_backup_date', new Date().toISOString());
        
        console.log(`✅ バックアップ完了: ${customers.length}件`);
        return customers;
    },
    
    // 移行状況の確認
    checkMigrationStatus: async function() {
        console.log('🔍 移行状況確認中...');
        
        const status = {
            local: 0,
            firebase: 0,
            needsMigration: false
        };
        
        // ローカルデータ数
        const possibleKeys = ['rentpipe_demo_customers', 'rentpipe_customers', 'customers'];
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        status.local = Math.max(status.local, parsed.length);
                    }
                } catch (e) {
                    // パースエラーは無視
                }
            }
        }
        
        // Firebaseデータ数
        if (window.auth && window.db && window.currentUser) {
            try {
                const userCollection = window.db.collection('users').doc(window.currentUser.uid).collection('customers');
                const snapshot = await userCollection.get();
                status.firebase = snapshot.size;
            } catch (error) {
                console.warn('Firebase データ取得エラー:', error);
            }
        }
        
        status.needsMigration = status.local > 0 && status.firebase === 0;
        
        console.log('📊 移行状況:', status);
        return status;
    }
};

console.log('✅ データ移行ツール準備完了');
