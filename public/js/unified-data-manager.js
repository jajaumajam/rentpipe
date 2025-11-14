// 統一データ管理システム（Google Sheets統合版 + 即座同期 + 変更通知）
window.UnifiedDataManager = {
    STORAGE_KEY: 'rentpipe_demo_customers',
    
    // 初期化
    initialize: function() {
        console.log('✅ 統一データ管理システム初期化（Google Sheets統合版）');
        
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
    
    // 顧客をIDで取得
    getCustomerById: function(customerId) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === customerId);
    },
    
    // 顧客保存
    saveCustomers: function(customers) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customers));
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
        // UnifiedSheetsManagerに変更を通知（デバウンス同期トリガー）
        if (window.UnifiedSheetsManager && window.UnifiedSheetsManager.onDataChanged) {
            window.UnifiedSheetsManager.onDataChanged();
        }
    },
    
    // 新規顧客追加
    addCustomer: async function(customer) {
        const customers = this.getCustomers();
        
        // IDが未設定の場合は生成
        if (!customer.id) {
            customer.id = 'unified-demo-' + Date.now();
        }
        
        // タイムスタンプ設定
        customer.createdAt = customer.createdAt || new Date().toISOString();
        customer.updatedAt = new Date().toISOString();
        
        customers.push(customer);
        this.saveCustomers(customers);
        
        console.log('✅ 顧客追加完了:', customer.id);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(customers);
        
        // 変更通知（デバウンス同期）
        this.notifyDataChanged();
        
        return customer;
    },
    
    // 顧客更新
    updateCustomer: async function(updatedCustomer) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === updatedCustomer.id);
        
        if (index === -1) {
            console.error('❌ 顧客が見つかりません:', updatedCustomer.id);
            throw new Error('顧客が見つかりません');
        }
        
        // タイムスタンプ更新
        updatedCustomer.updatedAt = new Date().toISOString();
        
        customers[index] = updatedCustomer;
        this.saveCustomers(customers);
        
        console.log('✅ 顧客更新完了:', updatedCustomer.id);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(customers);
        
        // 変更通知（デバウンス同期）
        this.notifyDataChanged();
        
        return updatedCustomer;
    },
    
    // 顧客削除
    deleteCustomer: async function(customerId) {
        const customers = this.getCustomers();
        const filtered = customers.filter(c => c.id !== customerId);
        
        if (customers.length === filtered.length) {
            console.error('❌ 顧客が見つかりません:', customerId);
            throw new Error('顧客が見つかりません');
        }
        
        this.saveCustomers(filtered);
        
        console.log('✅ 顧客削除完了:', customerId);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(filtered);
        
        // 変更通知（デバウンス同期）
        this.notifyDataChanged();
        
        return true;
    },
    
    // ステータス別顧客取得
    getCustomersByStatus: function(status) {
        const customers = this.getCustomers();
        return customers.filter(c => c.pipelineStatus === status);
    },
    
    // 検索
    searchCustomers: function(searchTerm) {
        const customers = this.getCustomers();
        const term = searchTerm.toLowerCase();
        
        return customers.filter(c => {
            return (c.name && c.name.toLowerCase().includes(term)) ||
                   (c.email && c.email.toLowerCase().includes(term)) ||
                   (c.phone && c.phone.includes(term));
        });
    },
    
    // 統計取得
    getStats: function() {
        const customers = this.getCustomers();
        
        // 今月の新規
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newThisMonth = customers.filter(c => {
            const created = new Date(c.createdAt);
            return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
        }).length;
        
        return {
            total: customers.length,
            newThisMonth: newThisMonth,
            completed: customers.filter(c => c.pipelineStatus === '完了').length,
            active: customers.filter(c => c.pipelineStatus !== '完了').length
        };
    }
};

// 初期化実行
window.UnifiedDataManager.initialize();

console.log('✅ 統一データ管理システム準備完了（Google Sheets統合版 + 即座同期 + 変更通知）');
