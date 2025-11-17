// 統一データ管理システム（アクティブ/非アクティブ管理対応版）
window.UnifiedDataManager = {
    STORAGE_KEY: 'rentpipe_demo_customers',
    
    // 初期化
    initialize: function() {
        console.log('✅ 統一データ管理システム初期化（アクティブ管理対応版）');
        
        // 既存データの確認
        const existingData = localStorage.getItem(this.STORAGE_KEY);
        if (existingData) {
            const customers = JSON.parse(existingData);
            console.log('✅ 既存データ確認完了:', customers.length, '件');
        } else {
            console.log('ℹ️ 既存データなし');
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },
    
    // 全顧客取得
    getCustomers: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    // アクティブ顧客のみ取得
    getActiveCustomers: function() {
        const customers = this.getCustomers();
        return customers.filter(c => c.isActive !== false);
    },
    
    // 非アクティブ顧客のみ取得
    getInactiveCustomers: function() {
        const customers = this.getCustomers();
        return customers.filter(c => c.isActive === false);
    },
    
    // 顧客をIDで取得
    getCustomerById: function(customerId) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === customerId);
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
        
        // デフォルトでアクティブ
        if (customer.isActive === undefined) {
            customer.isActive = true;
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
        console.log('🔄 顧客更新開始:', updatedCustomer.id);
        
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === updatedCustomer.id);
        
        if (index !== -1) {
            console.log('✅ 顧客発見:', index, '番目');
            updatedCustomer.updatedAt = new Date().toISOString();
            
            // 完了ステータスの場合、自動的に非アクティブ化
            if (updatedCustomer.pipelineStatus === '完了' && updatedCustomer.isActive !== false) {
                console.log('🎯 完了ステータス検知 - 自動非アクティブ化');
                updatedCustomer.isActive = false;
                updatedCustomer.inactiveReason = 'completed';
                updatedCustomer.inactiveDate = new Date().toISOString();
                updatedCustomer.inactiveNote = updatedCustomer.inactiveNote || '成約完了';
            }
            
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
            throw new Error('顧客が見つかりません');
        }
    },
    
    // 顧客を非アクティブ化
    deactivateCustomer: async function(customerId, reason, note) {
        console.log('🔄 非アクティブ化開始:', customerId, reason);
        
        const customer = this.getCustomerById(customerId);
        if (!customer) {
            throw new Error('顧客が見つかりません');
        }
        
        customer.isActive = false;
        customer.inactiveReason = reason;
        customer.inactiveDate = new Date().toISOString();
        customer.inactiveNote = note || '';
        customer.updatedAt = new Date().toISOString();
        
        // 理由に応じてステータスも更新
        if (reason === 'completed') {
            customer.pipelineStatus = '完了';
        }
        
        await this.updateCustomer(customer);
        
        console.log('✅ 非アクティブ化完了:', customerId);
        return customer;
    },
    
    // 顧客を再アクティブ化
    reactivateCustomer: async function(customerId, newStatus) {
        console.log('🔄 再アクティブ化開始:', customerId);
        
        const customer = this.getCustomerById(customerId);
        if (!customer) {
            throw new Error('顧客が見つかりません');
        }
        
        customer.isActive = true;
        customer.inactiveReason = null;
        customer.inactiveDate = null;
        customer.inactiveNote = null;
        customer.updatedAt = new Date().toISOString();
        
        // 新しいステータスを設定（指定があれば）
        if (newStatus) {
            customer.pipelineStatus = newStatus;
        }
        
        await this.updateCustomer(customer);
        
        console.log('✅ 再アクティブ化完了:', customerId);
        return customer;
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
    },
    
    // 統計情報取得
    getStats: function() {
        const customers = this.getCustomers();
        const active = customers.filter(c => c.isActive !== false);
        const inactive = customers.filter(c => c.isActive === false);
        
        return {
            total: customers.length,
            active: active.length,
            inactive: inactive.length,
            completed: inactive.filter(c => c.inactiveReason === 'completed').length,
            lost: inactive.filter(c => c.inactiveReason === 'lost').length,
            onHold: inactive.filter(c => c.inactiveReason === 'on-hold').length
        };
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

console.log('✅ 統一データ管理システム準備完了（アクティブ管理対応版）');
