// 🔄 統一データ管理システム（Google Sheets統合版）
class UnifiedDataManager {
    constructor() {
        this.CUSTOMERS_KEY = 'rentpipe_customers';
        this.HISTORY_KEY = 'rentpipe_history';
        console.log('✅ 統一データ管理システム初期化（Google Sheets統合版）');
        this.ensureDataExists();
    }

    // 初期データ確認・生成
    ensureDataExists() {
        const existingData = localStorage.getItem(this.CUSTOMERS_KEY);
        
        if (!existingData || existingData === '[]') {
            console.log('ℹ️ 初期データが存在しないため、デモデータを生成します');
            const demoCustomers = this.generateDemoCustomers();
            this.saveCustomers(demoCustomers);
        } else {
            console.log('✅ 既存データ確認完了');
        }
    }

    // デモデータ生成
    generateDemoCustomers() {
        const now = new Date();
        const today = now.toISOString();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        return [
            {
                id: 'demo-tanaka-001',
                name: '田中 太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                age: 28,
                occupation: 'ITエンジニア',
                annualIncome: 5000000,
                pipelineStatus: '内見',
                preferences: {
                    budgetMin: 70000,
                    budgetMax: 90000,
                    areas: ['渋谷', '新宿', '池袋'],
                    roomType: '1K',
                    requirements: ['駅近', 'オートロック', '2階以上']
                },
                notes: '週末の内見を希望。ペット不可物件を探している。',
                urgency: '高',
                contactTime: '平日夜・土日',
                createdAt: lastMonth,
                updatedAt: today,
                source: 'web'
            },
            {
                id: 'demo-sato-002',
                name: '佐藤 花子',
                email: 'sato@example.com',
                phone: '080-9876-5432',
                age: 32,
                occupation: '会社員',
                annualIncome: 4500000,
                pipelineStatus: '申込',
                preferences: {
                    budgetMin: 80000,
                    budgetMax: 100000,
                    areas: ['品川', '目黒', '恵比寿'],
                    roomType: '1LDK',
                    requirements: ['駅近', 'バストイレ別', '南向き']
                },
                notes: '4月入居希望。静かな環境を求めている。',
                urgency: '中',
                contactTime: '平日日中',
                createdAt: lastWeek,
                updatedAt: today,
                source: 'referral'
            },
            {
                id: 'demo-yamada-003',
                name: '山田 次郎',
                email: 'yamada@example.com',
                phone: '070-5555-6666',
                age: 25,
                occupation: '学生',
                annualIncome: 0,
                pipelineStatus: '初回相談',
                preferences: {
                    budgetMin: 50000,
                    budgetMax: 70000,
                    areas: ['中野', '高円寺', '吉祥寺'],
                    roomType: '1K',
                    requirements: ['駅近', '安い', 'インターネット無料']
                },
                notes: '大学の近くで予算重視。初めての一人暮らし。',
                urgency: '低',
                contactTime: 'いつでも',
                createdAt: today,
                updatedAt: today,
                source: 'phone'
            }
        ];
    }

    // 顧客データ取得
    getCustomers() {
        try {
            const data = localStorage.getItem(this.CUSTOMERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ 顧客データ取得エラー:', error);
            return [];
        }
    }

    // 顧客データ保存（Google Sheets統合版）★重要な修正★
    saveCustomers(customers) {
        try {
            // 1. LocalStorageに即座に保存（既存機能）
            localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
            console.log('💾 LocalStorageに保存:', customers.length, '件');
            
            // 2. Google Sheets統合が有効な場合は同期（新機能）
            if (window.UnifiedSheetsManager && window.UnifiedSheetsManager.isSheetsEnabled) {
                console.log('📊 Google Sheets同期を実行中...');
                // 非同期で同期（エラーが出てもLocalStorageは保存済み）
                window.UnifiedSheetsManager.syncToSheets(customers)
                    .then(() => {
                        console.log('✅ Google Sheets同期完了');
                    })
                    .catch(error => {
                        console.warn('⚠️ Google Sheets同期エラー（LocalStorageには保存済み）:', error);
                    });
            } else {
                console.log('ℹ️ Google Sheets統合は無効（LocalStorageのみ）');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
            return false;
        }
    }

    // IDで顧客取得
    getCustomerById(customerId) {
        const customers = this.getCustomers();
        return customers.find(customer => customer.id === customerId);
    }

    // 顧客データ更新
    updateCustomer(customerId, updateData) {
        const customers = this.getCustomers();
        const index = customers.findIndex(customer => customer.id === customerId);
        
        if (index === -1) {
            console.error('❌ 更新対象の顧客が見つかりません:', customerId);
            return false;
        }
        
        const oldStatus = customers[index].pipelineStatus;
        
        // 更新データをマージ
        customers[index] = {
            ...customers[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        // ステータスが更新された場合は履歴を記録
        if (updateData.pipelineStatus && updateData.pipelineStatus !== oldStatus) {
            this.addHistoryEntry(customerId, oldStatus, updateData.pipelineStatus);
        }
        
        const success = this.saveCustomers(customers);
        if (success) {
            console.log(`✅ 顧客データ更新完了: ${customerId}`);
        }
        return success;
    }

    // 新規顧客の追加
    addCustomer(customerData) {
        const customers = this.getCustomers();
        
        const newCustomer = {
            id: customerData.id || `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: customerData.name || '',
            email: customerData.email || '',
            phone: customerData.phone || '',
            age: customerData.age || null,
            occupation: customerData.occupation || '',
            annualIncome: customerData.annualIncome || null,
            pipelineStatus: customerData.pipelineStatus || '初回相談',
            preferences: customerData.preferences || {},
            notes: customerData.notes || '',
            urgency: customerData.urgency || '中',
            contactTime: customerData.contactTime || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: customerData.source || '',
            ...customerData
        };
        
        customers.push(newCustomer);
        const success = this.saveCustomers(customers);
        
        if (success) {
            // 履歴エントリを追加
            this.addHistoryEntry(newCustomer.id, '', newCustomer.pipelineStatus, '新規顧客登録');
            
            console.log(`✅ 新規顧客追加: ${newCustomer.name}(${newCustomer.id})`);
            
            // データ変更イベントを発火
            const event = new CustomEvent('dataChanged', {
                detail: { source: 'addCustomer', customerId: newCustomer.id }
            });
            window.dispatchEvent(event);
            
            return newCustomer;
        } else {
            console.error('❌ 顧客追加に失敗');
            return null;
        }
    }

    // 顧客の削除
    deleteCustomer(customerId) {
        const customers = this.getCustomers();
        const index = customers.findIndex(customer => customer.id === customerId);
        
        if (index === -1) {
            console.error('❌ 削除対象の顧客が見つかりません:', customerId);
            return false;
        }
        
        const deletedCustomer = customers[index];
        customers.splice(index, 1);
        const success = this.saveCustomers(customers);
        
        if (success) {
            // 削除履歴を記録
            this.addHistoryEntry(customerId, deletedCustomer.pipelineStatus, '削除', '顧客データ削除');
            
            console.log(`🗑️ 顧客削除完了: ${deletedCustomer.name}(${customerId})`);
        }
        
        return success;
    }

    // 履歴エントリ追加
    addHistoryEntry(customerId, fromStatus, toStatus, note = '') {
        try {
            const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
            
            const entry = {
                id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                customerId: customerId,
                fromStatus: fromStatus,
                toStatus: toStatus,
                note: note,
                timestamp: new Date().toISOString()
            };
            
            history.push(entry);
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            
            console.log(`📝 履歴追加: ${customerId} ${fromStatus} → ${toStatus}`);
            
        } catch (error) {
            console.error('❌ 履歴追加エラー:', error);
        }
    }

    // 履歴取得
    getHistory(customerId = null) {
        try {
            const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
            
            if (customerId) {
                return history.filter(entry => entry.customerId === customerId);
            }
            
            return history;
            
        } catch (error) {
            console.error('❌ 履歴取得エラー:', error);
            return [];
        }
    }

    // データ統計の取得
    getDataStatistics() {
        const customers = this.getCustomers();
        const history = this.getHistory();
        
        // ステータス別集計
        const statusCounts = {};
        const validStatuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        
        validStatuses.forEach(status => {
            statusCounts[status] = customers.filter(c => c.pipelineStatus === status).length;
        });
        
        // 月別集計
        const thisMonth = new Date().toISOString().slice(0, 7);
        const thisMonthCustomers = customers.filter(c => 
            c.createdAt && c.createdAt.startsWith(thisMonth)
        ).length;
        
        const thisMonthCompleted = customers.filter(c => 
            c.pipelineStatus === '完了' && 
            c.updatedAt && c.updatedAt.startsWith(thisMonth)
        ).length;
        
        return {
            totalCustomers: customers.length,
            statusCounts: statusCounts,
            thisMonthNew: thisMonthCustomers,
            thisMonthCompleted: thisMonthCompleted,
            historyEntries: history.length,
            conversionRate: customers.length > 0 ?
                Math.round((statusCounts['完了'] / customers.length) * 100) : 0
        };
    }

    // データの完全リセット（開発用）
    resetAllData() {
        if (confirm('全てのデータをリセットしますか？この操作は取り消しできません。')) {
            localStorage.removeItem(this.CUSTOMERS_KEY);
            localStorage.removeItem(this.HISTORY_KEY);
            
            // 新しいデモデータを生成
            this.ensureDataExists();
            
            console.log('🔄 全データリセット・再生成完了');
            return true;
        }
        return false;
    }

    // データの健全性チェック
    validateDataIntegrity() {
        const issues = [];
        const customers = this.getCustomers();
        
        customers.forEach((customer, index) => {
            if (!customer.id) {
                issues.push(`顧客#${index}: IDが未設定`);
            }
            if (!customer.name) {
                issues.push(`顧客#${index}: 名前が未設定`);
            }
            if (!customer.pipelineStatus) {
                issues.push(`顧客#${index}: ステータスが未設定`);
            }
        });
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            totalCustomers: customers.length
        };
    }
}

// グローバルインスタンス
window.UnifiedDataManager = new UnifiedDataManager();

// 既存システムとの互換性のためのヘルパー関数
window.getCustomers = () => window.UnifiedDataManager.getCustomers();
window.saveCustomers = (customers) => window.UnifiedDataManager.saveCustomers(customers);

console.log('✅ 統一データ管理システム準備完了（Google Sheets統合版）');
