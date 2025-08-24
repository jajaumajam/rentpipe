// RentPipe 統一データ管理システム
class UnifiedDataManager {
    constructor() {
        // 統一データキー（全画面で共通使用）
        this.CUSTOMERS_KEY = 'rentpipe_customers';
        this.HISTORY_KEY = 'rentpipe_pipeline_history';
        this.AUTH_KEY = 'rentpipe_auth';
        this.PROFILE_KEY = 'rentpipe_user_profile';
        
        this.init();
    }

    init() {
        console.log('📊 統一データ管理システム初期化中...');
        
        // 古いデータの移行・統合
        this.migrateOldData();
        
        // 初期データの確認・生成
        this.ensureDataExists();
        
        console.log('✅ 統一データ管理システム準備完了');
    }

    // 古いデータを統一キーに移行
    migrateOldData() {
        console.log('📦 古いデータを統一形式に移行中...');
        
        // 顧客データの移行
        const oldCustomerKeys = [
            'rentpipe_stable_customers',
            'rentpipe_demo_customers', 
            'customers',
            'demo_customers'
        ];
        
        let migratedCustomers = null;
        
        for (const oldKey of oldCustomerKeys) {
            const oldData = localStorage.getItem(oldKey);
            if (oldData && !migratedCustomers) {
                try {
                    const parsedData = JSON.parse(oldData);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        migratedCustomers = parsedData;
                        console.log(`📦 ${oldKey} から顧客データを移行: ${parsedData.length}件`);
                        break;
                    }
                } catch (error) {
                    console.warn(`❌ ${oldKey} の解析に失敗:`, error);
                }
            }
        }
        
        // 統一キーに保存
        if (migratedCustomers) {
            localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(migratedCustomers));
            console.log(`✅ ${migratedCustomers.length}件の顧客データを統一キーに移行`);
        }
        
        // 古いキーをクリーンアップ
        oldCustomerKeys.forEach(key => {
            if (key !== this.CUSTOMERS_KEY && localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ 古いデータキー削除: ${key}`);
            }
        });
        
        // パイプライン履歴の確認
        const historyData = localStorage.getItem(this.HISTORY_KEY);
        if (!historyData) {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
            console.log('📈 パイプライン履歴を初期化');
        }
    }

    // データの存在確認・生成
    ensureDataExists() {
        const customersData = this.getCustomers();
        
        if (!customersData || customersData.length === 0) {
            console.log('👥 顧客データが存在しないため、デモデータを生成します...');
            const demoCustomers = this.generateUnifiedDemoData();
            this.saveCustomers(demoCustomers);
            console.log(`✅ ${demoCustomers.length}件のデモ顧客データを生成`);
        } else {
            console.log(`📊 既存の顧客データを確認: ${customersData.length}件`);
        }
    }

    // 統一デモデータの生成
    generateUnifiedDemoData() {
        const demoCustomers = [
            {
                id: 'unified-demo-1',
                name: '田中 太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                age: 28,
                occupation: 'システムエンジニア',
                annualIncome: 5200000,
                pipelineStatus: '初回相談',
                preferences: {
                    budgetMin: 80000,
                    budgetMax: 120000,
                    areas: ['渋谷区', '港区'],
                    roomType: '1LDK',
                    requirements: ['駅近', 'バストイレ別', 'オートロック']
                },
                notes: '転職に伴い引越し予定。駅から徒歩5分以内希望。',
                urgency: '高',
                contactTime: '平日18時以降',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'Web問い合わせ'
            },
            {
                id: 'unified-demo-2',
                name: '佐藤 花子',
                email: 'sato@example.com',
                phone: '080-9876-5432',
                age: 32,
                occupation: 'マーケティング',
                annualIncome: 4800000,
                pipelineStatus: '物件紹介',
                preferences: {
                    budgetMin: 100000,
                    budgetMax: 150000,
                    areas: ['目黒区', '世田谷区'],
                    roomType: '2LDK',
                    requirements: ['ファミリー向け', '南向き', '駐車場付き']
                },
                notes: '家族向けの物件を希望。小学校が近いことを重視。',
                urgency: '中',
                contactTime: '土日祝日',
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                source: '店舗来訪'
            },
            {
                id: 'unified-demo-3',
                name: '鈴木 一郎',
                email: 'suzuki@example.com',
                phone: '070-1111-2222',
                age: 24,
                occupation: '大学院生',
                annualIncome: 1200000,
                pipelineStatus: '内見',
                preferences: {
                    budgetMin: 60000,
                    budgetMax: 90000,
                    areas: ['新宿区', '中野区'],
                    roomType: '1K',
                    requirements: ['学生可', '家具付き', '初期費用安']
                },
                notes: '来春就職予定。保証人は両親。',
                urgency: '中',
                contactTime: '平日午後',
                createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                source: '紹介'
            },
            {
                id: 'unified-demo-4',
                name: '山田 美咲',
                email: 'yamada@example.com',
                phone: '090-5555-7777',
                age: 29,
                occupation: 'デザイナー',
                annualIncome: 3600000,
                pipelineStatus: '申込',
                preferences: {
                    budgetMin: 85000,
                    budgetMax: 115000,
                    areas: ['恵比寿', '代官山'],
                    roomType: '1LDK',
                    requirements: ['デザイナーズ', '築浅', 'ペット可']
                },
                notes: 'クリエイティブな環境を重視。猫を飼っている。',
                urgency: '高',
                contactTime: 'いつでも',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'SNS広告'
            },
            {
                id: 'unified-demo-5',
                name: '高橋 健太',
                email: 'takahashi@example.com',
                phone: '080-3333-4444',
                age: 35,
                occupation: '営業職',
                annualIncome: 6200000,
                pipelineStatus: '審査',
                preferences: {
                    budgetMin: 120000,
                    budgetMax: 180000,
                    areas: ['品川区', '港区'],
                    roomType: '2LDK',
                    requirements: ['高層階', '駅直結', 'コンシェルジュ']
                },
                notes: '出張が多いため利便性重視。高級志向。',
                urgency: '低',
                contactTime: '平日夜・週末',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                source: '知人紹介'
            },
            {
                id: 'unified-demo-6',
                name: '伊藤 さくら',
                email: 'ito@example.com',
                phone: '070-8888-9999',
                age: 26,
                occupation: '看護師',
                annualIncome: 4200000,
                pipelineStatus: '契約',
                preferences: {
                    budgetMin: 75000,
                    budgetMax: 105000,
                    areas: ['文京区', '台東区'],
                    roomType: '1DK',
                    requirements: ['病院近く', '24時間出入り', '宅配ボックス']
                },
                notes: '夜勤があるため24時間アクセス可能な物件希望。',
                urgency: '中',
                contactTime: '不定期',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                source: '医療系求人サイト'
            },
            {
                id: 'unified-demo-7',
                name: '中村 大輔',
                email: 'nakamura@example.com',
                phone: '090-7777-1111',
                age: 31,
                occupation: '研究職',
                annualIncome: 4500000,
                pipelineStatus: '完了',
                preferences: {
                    budgetMin: 90000,
                    budgetMax: 130000,
                    areas: ['杉並区', '練馬区'],
                    roomType: '2DK',
                    requirements: ['静かな環境', '書斎可', 'インターネット']
                },
                notes: '在宅勤務多め。静かで集中できる環境必須。',
                urgency: '低',
                contactTime: '平日日中',
                createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                source: '大学関係者紹介'
            }
        ];

        return demoCustomers;
    }

    // 顧客データの取得
    getCustomers() {
        try {
            const data = localStorage.getItem(this.CUSTOMERS_KEY);
            if (data) {
                const customers = JSON.parse(data);
                return Array.isArray(customers) ? customers : [];
            }
            return [];
        } catch (error) {
            console.error('❌ 顧客データ取得エラー:', error);
            return [];
        }
    }

    // 顧客データの保存
    saveCustomers(customers) {
        try {
            if (!Array.isArray(customers)) {
                console.error('❌ 無効な顧客データ: 配列である必要があります');
                return false;
            }
            
            localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
            console.log(`💾 顧客データ保存完了: ${customers.length}件`);
            return true;
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
            return false;
        }
    }

    // パイプライン履歴の取得
    getHistory() {
        try {
            const data = localStorage.getItem(this.HISTORY_KEY);
            if (data) {
                const history = JSON.parse(data);
                return Array.isArray(history) ? history : [];
            }
            return [];
        } catch (error) {
            console.error('❌ 履歴データ取得エラー:', error);
            return [];
        }
    }

    // パイプライン履歴の保存
    saveHistory(history) {
        try {
            if (!Array.isArray(history)) {
                console.error('❌ 無効な履歴データ: 配列である必要があります');
                return false;
            }
            
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('❌ 履歴データ保存エラー:', error);
            return false;
        }
    }

    // パイプライン履歴エントリの追加
    addHistoryEntry(customerId, fromStatus, toStatus, notes = '') {
        const history = this.getHistory();
        const entry = {
            id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            customerId: customerId,
            fromStatus: fromStatus,
            toStatus: toStatus,
            timestamp: new Date().toISOString(),
            notes: notes
        };
        
        history.push(entry);
        this.saveHistory(history);
        
        console.log(`📝 履歴エントリ追加: ${customerId} ${fromStatus} → ${toStatus}`);
        return entry;
    }

    // 特定顧客の取得
    getCustomerById(id) {
        const customers = this.getCustomers();
        return customers.find(customer => customer.id === id) || null;
    }

    // 顧客データの更新
    updateCustomer(customerId, updateData) {
        const customers = this.getCustomers();
        const index = customers.findIndex(customer => customer.id === customerId);
        
        if (index === -1) {
            console.error('❌ 顧客が見つかりません:', customerId);
            return false;
        }
        
        // 更新前のステータスを記録
        const oldStatus = customers[index].pipelineStatus;
        
        // データを更新
        customers[index] = { ...customers[index], ...updateData };
        customers[index].updatedAt = new Date().toISOString();
        
        // ステータスが変更された場合は履歴を記録
        if (updateData.pipelineStatus && updateData.pipelineStatus !== oldStatus) {
            this.addHistoryEntry(customerId, oldStatus, updateData.pipelineStatus);
        }
        
        this.saveCustomers(customers);
        console.log(`✅ 顧客データ更新完了: ${customerId}`);
        return true;
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
        this.saveCustomers(customers);
        
        // 履歴エントリを追加
        this.addHistoryEntry(newCustomer.id, '', newCustomer.pipelineStatus, '新規顧客登録');
        
        console.log(`✅ 新規顧客追加: ${newCustomer.name}(${newCustomer.id})`);
        return newCustomer;
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
        this.saveCustomers(customers);
        
        // 削除履歴を記録
        this.addHistoryEntry(customerId, deletedCustomer.pipelineStatus, '削除', '顧客データ削除');
        
        console.log(`🗑️ 顧客削除完了: ${deletedCustomer.name}(${customerId})`);
        return true;
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

console.log('✅ 統一データ管理システム準備完了');
