// ✅ 統一データ管理システム初期化（Google Sheets統合版 + 即座同期）
console.log('✅ 統一データ管理システム初期化（Google Sheets統合版）');

window.UnifiedDataManager = {
    // LocalStorageキー
    STORAGE_KEY: 'rentpipe_demo_customers',
    
    // 既存データ確認
    initialize: function() {
        const existingData = localStorage.getItem(this.STORAGE_KEY);
        if (!existingData) {
            console.log('ℹ️ 既存データなし - 空配列で初期化');
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        } else {
            const customers = JSON.parse(existingData);
            console.log('✅ 既存データ確認完了:', customers.length, '件');
        }
    },
    
    // 顧客データ取得
    getCustomers: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ データ取得エラー:', error);
            return [];
        }
    },
    
    // 顧客データ保存
    saveCustomers: function(customers) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customers));
            console.log('💾 データ保存完了:', customers.length, '件');
            return true;
        } catch (error) {
            console.error('❌ データ保存エラー:', error);
            return false;
        }
    },
    
    // 🆕 Google Sheetsに即座同期（デバッグ強化版）
    syncToSheetsImmediately: async function() {
        try {
            console.log('📤 === Google Sheets即座同期開始 ===');
            
            // Google Sheets統合が有効か確認
            if (!window.UnifiedSheetsManager) {
                console.log('❌ UnifiedSheetsManagerが存在しません');
                return false;
            }
            
            console.log('✅ UnifiedSheetsManager存在確認');
            console.log('   isEnabled:', window.UnifiedSheetsManager.isEnabled);
            
            if (!window.UnifiedSheetsManager.isEnabled) {
                console.log('ℹ️ Google Sheets統合が無効 - 同期スキップ');
                return false;
            }
            
            if (!window.GoogleSheetsAPI) {
                console.log('❌ GoogleSheetsAPIが存在しません');
                return false;
            }
            
            console.log('✅ GoogleSheetsAPI存在確認');
            console.log('   isAuthenticated:', window.GoogleSheetsAPI.isAuthenticated);
            console.log('   spreadsheetId:', window.GoogleSheetsAPI.spreadsheetId);
            
            if (!window.GoogleSheetsAPI.isAuthenticated) {
                console.log('ℹ️ Google Sheets未認証 - 同期スキップ');
                return false;
            }
            
            console.log('📊 顧客データ取得中...');
            const customers = this.getCustomers();
            console.log('✅ 顧客データ取得完了:', customers.length, '件');
            
            console.log('📤 Google Sheetsに書き込み開始...');
            await window.GoogleSheetsAPI.writeData(customers);
            
            console.log('✅ === Google Sheets即座同期完了 ===');
            return true;
            
        } catch (error) {
            console.error('❌ Google Sheets即座同期エラー:', error);
            console.error('   エラー詳細:', error.message);
            console.error('   スタック:', error.stack);
            // エラーでもLocalStorageの変更は成功しているので処理継続
            return false;
        }
    },
    
    // 🆕 新規顧客追加（非同期版）
    addCustomer: async function(customerData) {
        try {
            console.log('➕ 新規顧客追加処理開始...');
            const customers = this.getCustomers();
            
            // 新規顧客データ作成
            const newCustomer = {
                id: 'customer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                pipelineStatus: customerData.pipelineStatus || '初回相談',
                preferences: customerData.preferences || {},
                notes: customerData.notes || '',
                urgency: customerData.urgency || 'medium',
                contactTime: customerData.contactTime || 'anytime',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            customers.push(newCustomer);
            this.saveCustomers(customers);
            
            console.log('✅ LocalStorageに保存完了:', newCustomer.id);
            
            // 🆕 即座にGoogle Sheetsに同期（awaitで待機）
            console.log('📤 Google Sheets即座同期を実行...');
            await this.syncToSheetsImmediately();
            
            return newCustomer;
            
        } catch (error) {
            console.error('❌ 顧客追加エラー:', error);
            return null;
        }
    },
    
    // 🆕 顧客情報更新（非同期版）
    updateCustomer: async function(customerId, updateData) {
        try {
            console.log('✏️ 顧客情報更新処理開始:', customerId);
            const customers = this.getCustomers();
            const index = customers.findIndex(c => c.id === customerId);
            
            if (index === -1) {
                console.error('❌ 顧客が見つかりません:', customerId);
                return false;
            }
            
            // 更新データをマージ
            customers[index] = {
                ...customers[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveCustomers(customers);
            console.log('✅ LocalStorageに保存完了:', customerId);
            
            // 🆕 即座にGoogle Sheetsに同期（awaitで待機）
            console.log('📤 Google Sheets即座同期を実行...');
            await this.syncToSheetsImmediately();
            
            return true;
            
        } catch (error) {
            console.error('❌ 顧客更新エラー:', error);
            return false;
        }
    },
    
    // 🆕 顧客削除（非同期版）
    deleteCustomer: async function(customerId) {
        try {
            console.log('🗑️ 顧客削除処理開始:', customerId);
            const customers = this.getCustomers();
            const filteredCustomers = customers.filter(c => c.id !== customerId);
            
            if (customers.length === filteredCustomers.length) {
                console.error('❌ 削除対象の顧客が見つかりません:', customerId);
                return false;
            }
            
            this.saveCustomers(filteredCustomers);
            console.log('✅ LocalStorageから削除完了:', customerId);
            
            // 🆕 即座にGoogle Sheetsに同期（awaitで待機）
            console.log('📤 Google Sheets即座同期を実行...');
            await this.syncToSheetsImmediately();
            
            return true;
            
        } catch (error) {
            console.error('❌ 顧客削除エラー:', error);
            return false;
        }
    },
    
    // 顧客検索
    findCustomer: function(customerId) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === customerId);
    },
    
    // ステータス別顧客取得
    getCustomersByStatus: function(status) {
        const customers = this.getCustomers();
        return customers.filter(c => c.pipelineStatus === status);
    }
};

// 初期化実行
window.UnifiedDataManager.initialize();

console.log('✅ 統一データ管理システム準備完了（Google Sheets統合版 + 即座同期）');
