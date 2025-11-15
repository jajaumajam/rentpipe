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
        if (window.UnifiedSheetsManager && window.UnifiedSheetsManager.notifyDataChanged) {
            window.UnifiedSheetsManager.notifyDataChanged();
        }
    },
    
    // ✅ 本番環境対応の顧客ID生成
    generateCustomerId: function() {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        return `customer_${timestamp}_${randomStr}`;
    },
    
    // 新規顧客追加
    addCustomer: async function(customer) {
        const customers = this.getCustomers();
        
        // ✅ IDが未設定の場合は本番環境対応のIDを生成
        if (!customer.id) {
            customer.id = this.generateCustomerId();
            console.log('✅ 顧客ID生成:', customer.id);
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
    updateCustomer: async function(customerId, updatedData) {
        console.log('🔄 顧客更新開始:', customerId);
        
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === customerId);
        
        if (index === -1) {
            console.error('❌ 顧客が見つかりません:', customerId);
            console.log('📋 既存の顧客ID一覧:', customers.map(c => c.id));
            return false;
        }
        
        // 既存データを保持しつつ、更新データをマージ
        const existingCustomer = customers[index];
        const updatedCustomer = {
            ...existingCustomer,
            ...updatedData,
            id: customerId, // IDは変更しない
            createdAt: existingCustomer.createdAt, // 作成日時は変更しない
            updatedAt: new Date().toISOString() // 更新日時のみ更新
        };
        
        customers[index] = updatedCustomer;
        this.saveCustomers(customers);
        
        console.log('✅ 顧客更新完了:', customerId);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(customers);
        
        // 変更通知（デバウンス同期）
        this.notifyDataChanged();
        
        return true;
    },
    
    // 顧客削除
    deleteCustomer: async function(customerId) {
        const customers = this.getCustomers();
        const filtered = customers.filter(c => c.id !== customerId);
        
        if (customers.length === filtered.length) {
            console.error('❌ 顧客が見つかりません:', customerId);
            return false;
        }
        
        this.saveCustomers(filtered);
        
        console.log('✅ 顧客削除完了:', customerId);
        
        // Google Sheetsへ即座同期
        await this.syncToSheetsImmediately(filtered);
        
        // 変更通知（デバウンス同期）
        this.notifyDataChanged();
        
        return true;
    },
    
    // パイプラインステータス更新
    updateCustomerStatus: async function(customerId, newStatus) {
        return await this.updateCustomer(customerId, { pipelineStatus: newStatus });
    }
};

// 初期化実行
window.UnifiedDataManager.initialize();

console.log('✅ 統一データ管理システム準備完了（Google Sheets統合版 + 即座同期 + 変更通知）');
