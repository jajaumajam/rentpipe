// 統一データ管理システム（Google Sheets統合版 + 即座同期 + 変更通知 + アクティブ/非アクティブ管理）
window.UnifiedDataManager = {
    STORAGE_KEY: 'rentpipe_demo_customers',
    
    // 初期化
    initialize: function() {
        console.log('✅ 統一データ管理システム初期化（Google Sheets統合版 + アクティブ/非アクティブ管理）');
        
        // 既存データの確認とマイグレーション
        const existingData = localStorage.getItem(this.STORAGE_KEY);
        if (existingData) {
            const customers = JSON.parse(existingData);
            console.log('✅ 既存データ確認完了:', customers.length, '件');
            
            // 🆕 既存データにisActive/archivedAtがない場合は追加
            let migrated = false;
            const migratedCustomers = customers.map(customer => {
                if (customer.isActive === undefined) {
                    customer.isActive = true;  // デフォルト: アクティブ
                    migrated = true;
                }
                if (customer.archivedAt === undefined) {
                    customer.archivedAt = null;  // デフォルト: null
                    migrated = true;
                }
                return customer;
            });
            
            if (migrated) {
                console.log('🔄 既存データをマイグレーション');
                this.saveCustomers(migratedCustomers);
            }
        } else {
            console.log('ℹ️ 既存データなし');
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },
    
    // 全顧客取得（自動マイグレーション付き）
    getCustomers: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return [];
        
        const customers = JSON.parse(data);
        
        // 🆕 取得時に必ずisActive/archivedAtをチェック・補完
        let needsSave = false;
        const migratedCustomers = customers.map(customer => {
            if (customer.isActive === undefined) {
                customer.isActive = true;  // デフォルト: アクティブ
                needsSave = true;
                console.log('🔄 顧客にisActiveフィールドを追加:', customer.id || customer.name);
            }
            if (customer.archivedAt === undefined) {
                customer.archivedAt = null;  // デフォルト: null
                needsSave = true;
            }
            return customer;
        });
        
        // マイグレーションが発生した場合は保存
        if (needsSave) {
            console.log('💾 マイグレーション後のデータを保存');
            this.saveCustomers(migratedCustomers);
        }
        
        return migratedCustomers;
    },
    
    // 顧客をIDで取得
    getCustomerById: function(customerId) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === customerId);
    },
    
    // 🆕 アクティブ顧客のみ取得
    getActiveCustomers: function() {
        // isActiveがundefinedまたはtrueの顧客をアクティブとして扱う
        return this.getCustomers().filter(c => c.isActive !== false);
    },
    
    // 🆕 非アクティブ顧客のみ取得
    getInactiveCustomers: function() {
        return this.getCustomers().filter(c => c.isActive === false);
    },
    
    // 顧客保存
    saveCustomers: function(customers) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customers));
    },
    
    // 顧客追加
    addCustomer: async function(customer) {
        const customers = this.getCustomers();
        customer.id = customer.id || this.generateCustomerId();
        customer.createdAt = customer.createdAt || new Date().toISOString();
        customer.updatedAt = new Date().toISOString();
        
        // 🆕 アクティブ/非アクティブ管理フィールドを初期化
        if (customer.isActive === undefined) {
            customer.isActive = true;  // デフォルト: アクティブ
        }
        if (customer.archivedAt === undefined) {
            customer.archivedAt = null;  // デフォルト: null
        }
        
        customers.push(customer);
        this.saveCustomers(customers);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(customers);
        
        // 変更通知
        this.notifyDataChanged();
        
        console.log('✅ 顧客追加完了:', customer.id);
        return customer;
    },
    
    // 顧客更新
    updateCustomer: async function(updatedCustomer) {
        console.log('🔄 顧客更新開始:', updatedCustomer.id, updatedCustomer);
        
        const customers = this.getCustomers();
        console.log('📋 全顧客データ:', customers.length, '件');
        console.log('📋 既存の顧客ID一覧:', customers.map(c => c.id));
        
        const index = customers.findIndex(c => {
            console.log('🔍 比較中:', c.id, '===', updatedCustomer.id, '結果:', c.id === updatedCustomer.id);
            return c.id === updatedCustomer.id;
        });
        
        if (index !== -1) {
            console.log('✅ 顧客発見:', index, '番目');
            updatedCustomer.updatedAt = new Date().toISOString();
            customers[index] = { ...customers[index], ...updatedCustomer };
            this.saveCustomers(customers);
            
            console.log('💾 LocalStorage保存完了');
            
            // Google Sheetsへ即座同期
            await this.syncToSheetsImmediately(customers);
            
            // 変更通知
            this.notifyDataChanged();
            
            console.log('✅ 顧客更新完了:', updatedCustomer.id);
            return customers[index];
        } else {
            console.error('❌ 顧客が見つかりません:', updatedCustomer);
            console.log('📋 全顧客一覧:', JSON.stringify(customers, null, 2));
            throw new Error('顧客が見つかりません');
        }
    },
    
    // 顧客削除
    deleteCustomer: async function(customerId) {
        const customers = this.getCustomers();
        const filteredCustomers = customers.filter(c => c.id !== customerId);
        
        if (customers.length === filteredCustomers.length) {
            throw new Error('削除する顧客が見つかりません');
        }
        
        this.saveCustomers(filteredCustomers);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(filteredCustomers);
        
        // 変更通知
        this.notifyDataChanged();
        
        console.log('✅ 顧客削除完了:', customerId);
        return true;
    },
    
    // 🆕 顧客を非アクティブ化
    deactivateCustomer: async function(customerId, reason = '') {
        console.log('⏸️ 顧客非アクティブ化開始:', customerId);
        
        const customer = this.getCustomerById(customerId);
        
        if (!customer) {
            throw new Error('顧客が見つかりません');
        }
        
        // 非アクティブ化
        customer.isActive = false;
        customer.archivedAt = new Date().toISOString();
        customer.updatedAt = new Date().toISOString();
        
        // エージェントメモに理由を追記（notesフィールドに記録）
        if (reason) {
            const dateStr = new Date().toLocaleDateString('ja-JP');
            const reasonText = `\n\n【非アクティブ化】${dateStr}\n理由: ${reason}`;
            customer.notes = (customer.notes || '') + reasonText;
        }
        
        await this.updateCustomer(customer);
        
        console.log('✅ 顧客非アクティブ化完了:', customerId);
        return customer;
    },
    
    // 🆕 顧客を再アクティブ化
    activateCustomer: async function(customerId) {
        console.log('▶️ 顧客再アクティブ化開始:', customerId);
        
        const customer = this.getCustomerById(customerId);
        
        if (!customer) {
            throw new Error('顧客が見つかりません');
        }
        
        // 再アクティブ化
        customer.isActive = true;
        customer.archivedAt = null;
        customer.updatedAt = new Date().toISOString();
        
        // エージェントメモに記録
        const dateStr = new Date().toLocaleDateString('ja-JP');
        const reactivateText = `\n\n【再アクティブ化】${dateStr}`;
        customer.notes = (customer.notes || '') + reactivateText;
        
        await this.updateCustomer(customer);
        
        console.log('✅ 顧客再アクティブ化完了:', customerId);
        return customer;
    },
    
    // Google Sheetsへ即座同期
    syncToSheetsImmediately: async function(customers) {
        // Google Sheets統合が有効か確認
        if (window.UnifiedSheetsManager && window.UnifiedSheetsManager.isEnabled) {
            try {
                console.log('☁️ Google Sheetsへ即座同期中...');
                await window.GoogleSheetsAPI.writeData(customers);
                console.log('✅ Google Sheets同期完了');
            } catch (error) {
                console.error('❌ Google Sheets同期エラー:', error);
            }
        } else {
            console.log('ℹ️ LocalStorageモード（Google Sheets同期スキップ）');
        }
    },
    
    // データ変更通知
    notifyDataChanged: function() {
        // カスタムイベントを発行
        const event = new CustomEvent('rentpipe-data-updated', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
        
        console.log('📢 データ変更通知を発行');
    },
    
    // 顧客ID生成
    generateCustomerId: function() {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        return `customer_${timestamp}_${randomStr}`;
    }
};

// 初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.UnifiedDataManager.initialize();
    });
} else {
    window.UnifiedDataManager.initialize();
}

console.log('✅ 統一データ管理システム準備完了（アクティブ/非アクティブ管理対応）');
