// RentPipe データ検証・整合性チェックシステム
class DataValidator {
    constructor() {
        this.CUSTOMERS_KEY = 'rentpipe_stable_customers';
        this.HISTORY_KEY = 'rentpipe_pipeline_history';
        this.BACKUP_KEY = 'rentpipe_data_backup';
        this.issues = [];
        this.stats = {
            total: 0,
            valid: 0,
            invalid: 0,
            repaired: 0,
            errors: []
        };
        
        console.log('🔍 データ検証システム初期化完了');
    }

    // メイン検証プロセス
    async validateAllData() {
        console.log('🔍 データ検証を開始します...');
        this.resetStats();
        
        try {
            // 1. 顧客データの検証
            await this.validateCustomers();
            
            // 2. パイプライン履歴の検証
            await this.validateHistory();
            
            // 3. 認証データの検証
            await this.validateAuthData();
            
            // 4. 検証結果のサマリー作成
            const summary = this.generateValidationSummary();
            
            console.log('✅ データ検証完了:', summary);
            return summary;
            
        } catch (error) {
            console.error('❌ データ検証エラー:', error);
            this.stats.errors.push(`検証プロセスエラー: ${error.message}`);
            return this.generateValidationSummary();
        }
    }

    // 統計リセット
    resetStats() {
        this.issues = [];
        this.stats = {
            total: 0,
            valid: 0,
            invalid: 0,
            repaired: 0,
            errors: [],
            startTime: new Date().toISOString()
        };
    }

    // 顧客データの検証
    async validateCustomers() {
        console.log('👥 顧客データの検証中...');
        
        const customersData = localStorage.getItem(this.CUSTOMERS_KEY);
        if (!customersData) {
            this.addIssue('customers', 'データなし', '顧客データが存在しません', 'warning');
            return;
        }

        try {
            const customers = JSON.parse(customersData);
            if (!Array.isArray(customers)) {
                this.addIssue('customers', 'データ形式エラー', '顧客データが配列ではありません', 'error');
                return;
            }

            this.stats.total += customers.length;

            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i];
                const customerIssues = this.validateCustomer(customer, i);
                
                if (customerIssues.length === 0) {
                    this.stats.valid++;
                } else {
                    this.stats.invalid++;
                    this.issues.push(...customerIssues);
                }
            }

            console.log(`📊 顧客データ検証完了: ${customers.length}件中 ${this.stats.valid}件が正常`);

        } catch (error) {
            this.addIssue('customers', 'JSON解析エラー', `顧客データの解析に失敗: ${error.message}`, 'error');
        }
    }

    // 個別顧客データの検証
    validateCustomer(customer, index) {
        const issues = [];
        const customerContext = `顧客#${index}(${customer.name || 'Unknown'})`;

        // 必須フィールドの検証
        const requiredFields = ['id', 'name', 'email', 'pipelineStatus'];
        requiredFields.forEach(field => {
            if (!customer[field]) {
                issues.push({
                    category: 'customers',
                    type: '必須フィールド不足',
                    description: `${customerContext}: ${field}が存在しません`,
                    severity: 'error',
                    customer: customer,
                    field: field,
                    index: index,
                    autoFixable: field !== 'id' // IDは自動修復不可
                });
            }
        });

        // メールアドレスの形式検証
        if (customer.email && !this.isValidEmail(customer.email)) {
            issues.push({
                category: 'customers',
                type: 'データ形式エラー',
                description: `${customerContext}: 無効なメールアドレス形式`,
                severity: 'warning',
                customer: customer,
                field: 'email',
                index: index,
                autoFixable: false
            });
        }

        // パイプラインステータスの検証
        const validStatuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        if (customer.pipelineStatus && !validStatuses.includes(customer.pipelineStatus)) {
            issues.push({
                category: 'customers',
                type: 'データ値エラー',
                description: `${customerContext}: 無効なパイプラインステータス`,
                severity: 'warning',
                customer: customer,
                field: 'pipelineStatus',
                index: index,
                autoFixable: true,
                suggestedFix: '初回相談'
            });
        }

        // 作成日時の検証
        if (customer.createdAt && !this.isValidDate(customer.createdAt)) {
            issues.push({
                category: 'customers',
                type: 'データ形式エラー',
                description: `${customerContext}: 無効な作成日時`,
                severity: 'warning',
                customer: customer,
                field: 'createdAt',
                index: index,
                autoFixable: true,
                suggestedFix: new Date().toISOString()
            });
        }

        // 予算データの検証
        if (customer.preferences) {
            if (customer.preferences.budgetMin && customer.preferences.budgetMax) {
                if (customer.preferences.budgetMin > customer.preferences.budgetMax) {
                    issues.push({
                        category: 'customers',
                        type: 'データ論理エラー',
                        description: `${customerContext}: 最小予算が最大予算を上回っています`,
                        severity: 'warning',
                        customer: customer,
                        field: 'preferences.budget',
                        index: index,
                        autoFixable: true
                    });
                }
            }
        }

        return issues;
    }

    // パイプライン履歴の検証
    async validateHistory() {
        console.log('📈 パイプライン履歴の検証中...');
        
        const historyData = localStorage.getItem(this.HISTORY_KEY);
        if (!historyData) {
            this.addIssue('history', 'データなし', 'パイプライン履歴が存在しません', 'info');
            return;
        }

        try {
            const history = JSON.parse(historyData);
            if (!Array.isArray(history)) {
                this.addIssue('history', 'データ形式エラー', '履歴データが配列ではありません', 'error');
                return;
            }

            for (let i = 0; i < history.length; i++) {
                const entry = history[i];
                if (!entry.customerId || !entry.timestamp || !entry.fromStatus || !entry.toStatus) {
                    this.addIssue('history', '不完全な履歴エントリ', `履歴#${i}: 必須フィールドが不足`, 'warning');
                }
            }

            console.log(`📊 履歴データ検証完了: ${history.length}件のエントリを確認`);

        } catch (error) {
            this.addIssue('history', 'JSON解析エラー', `履歴データの解析に失敗: ${error.message}`, 'error');
        }
    }

    // 認証データの検証
    async validateAuthData() {
        console.log('🔐 認証データの検証中...');
        
        const authData = localStorage.getItem('rentpipe_auth');
        if (!authData) {
            this.addIssue('auth', 'データなし', '認証データが存在しません', 'info');
            return;
        }

        try {
            const auth = JSON.parse(authData);
            if (!auth.email) {
                this.addIssue('auth', '必須フィールド不足', '認証データにメールアドレスがありません', 'error');
            }

            if (auth.email && !this.isValidEmail(auth.email)) {
                this.addIssue('auth', 'データ形式エラー', '認証データのメールアドレスが無効です', 'warning');
            }

            console.log('📊 認証データ検証完了');

        } catch (error) {
            this.addIssue('auth', 'JSON解析エラー', `認証データの解析に失敗: ${error.message}`, 'error');
        }
    }

    // 問題の追加
    addIssue(category, type, description, severity) {
        this.issues.push({
            category,
            type,
            description,
            severity,
            timestamp: new Date().toISOString()
        });
        
        this.stats.errors.push(description);
    }

    // データ自動修復
    async repairData() {
        console.log('🛠️ データ自動修復を開始します...');
        let repairedCount = 0;

        const customersData = localStorage.getItem(this.CUSTOMERS_KEY);
        if (customersData) {
            try {
                const customers = JSON.parse(customersData);
                let modified = false;

                for (let i = 0; i < customers.length; i++) {
                    const customer = customers[i];
                    
                    // 自動修復可能な問題を修復
                    if (this.repairCustomer(customer)) {
                        modified = true;
                        repairedCount++;
                    }
                }

                if (modified) {
                    localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
                    console.log(`✅ ${repairedCount}件の顧客データを修復しました`);
                }

            } catch (error) {
                console.error('❌ データ修復エラー:', error);
            }
        }

        this.stats.repaired = repairedCount;
        return repairedCount;
    }

    // 個別顧客データの修復
    repairCustomer(customer) {
        let modified = false;

        // 作成日時の補完
        if (!customer.createdAt) {
            customer.createdAt = new Date().toISOString();
            modified = true;
        }

        // 更新日時の補完
        if (!customer.updatedAt) {
            customer.updatedAt = new Date().toISOString();
            modified = true;
        }

        // パイプラインステータスの正規化
        const validStatuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        if (customer.pipelineStatus && !validStatuses.includes(customer.pipelineStatus)) {
            customer.pipelineStatus = '初回相談';
            modified = true;
        }

        // 予算の論理エラー修復
        if (customer.preferences && customer.preferences.budgetMin && customer.preferences.budgetMax) {
            if (customer.preferences.budgetMin > customer.preferences.budgetMax) {
                // 値を交換
                const temp = customer.preferences.budgetMin;
                customer.preferences.budgetMin = customer.preferences.budgetMax;
                customer.preferences.budgetMax = temp;
                modified = true;
            }
        }

        // preferencesオブジェクトの補完
        if (!customer.preferences) {
            customer.preferences = {
                budgetMin: 50000,
                budgetMax: 100000,
                areas: [],
                roomType: '1K',
                requirements: []
            };
            modified = true;
        }

        return modified;
    }

    // バックアップ作成
    createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                customers: localStorage.getItem(this.CUSTOMERS_KEY),
                history: localStorage.getItem(this.HISTORY_KEY),
                auth: localStorage.getItem('rentpipe_auth'),
                profile: localStorage.getItem('rentpipe_user_profile')
            };

            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
            console.log('💾 データバックアップ作成完了');
            return true;

        } catch (error) {
            console.error('❌ バックアップ作成エラー:', error);
            return false;
        }
    }

    // バックアップからの復元
    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem(this.BACKUP_KEY);
            if (!backupData) {
                console.warn('⚠️ バックアップデータが見つかりません');
                return false;
            }

            const backup = JSON.parse(backupData);
            
            if (backup.customers) localStorage.setItem(this.CUSTOMERS_KEY, backup.customers);
            if (backup.history) localStorage.setItem(this.HISTORY_KEY, backup.history);
            if (backup.auth) localStorage.setItem('rentpipe_auth', backup.auth);
            if (backup.profile) localStorage.setItem('rentpipe_user_profile', backup.profile);

            console.log('♻️ バックアップからの復元完了');
            return true;

        } catch (error) {
            console.error('❌ バックアップ復元エラー:', error);
            return false;
        }
    }

    // 検証結果サマリーの生成
    generateValidationSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            duration: this.stats.startTime ? 
                Math.round((new Date() - new Date(this.stats.startTime)) / 1000) : 0,
            statistics: {
                totalRecords: this.stats.total,
                validRecords: this.stats.valid,
                invalidRecords: this.stats.invalid,
                repairedRecords: this.stats.repaired,
                healthScore: this.stats.total > 0 ? 
                    Math.round((this.stats.valid / this.stats.total) * 100) : 100
            },
            issues: this.issues,
            recommendations: this.generateRecommendations()
        };

        return summary;
    }

    // 推奨事項の生成
    generateRecommendations() {
        const recommendations = [];

        if (this.stats.invalid > 0) {
            recommendations.push('データ修復機能の実行を推奨します');
        }

        if (this.stats.total === 0) {
            recommendations.push('デモデータの生成を推奨します');
        }

        const errorCount = this.issues.filter(issue => issue.severity === 'error').length;
        if (errorCount > 0) {
            recommendations.push('重要なエラーが検出されました。手動での確認が必要です');
        }

        if (recommendations.length === 0) {
            recommendations.push('データの品質は良好です');
        }

        return recommendations;
    }

    // ヘルパー関数: メールアドレスの検証
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ヘルパー関数: 日付の検証
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // 重複データの検出
    findDuplicates() {
        const customersData = localStorage.getItem(this.CUSTOMERS_KEY);
        if (!customersData) return [];

        try {
            const customers = JSON.parse(customersData);
            const duplicates = [];
            const emailMap = new Map();

            customers.forEach((customer, index) => {
                if (customer.email) {
                    if (emailMap.has(customer.email)) {
                        duplicates.push({
                            type: 'メール重複',
                            customers: [emailMap.get(customer.email), { customer, index }],
                            email: customer.email
                        });
                    } else {
                        emailMap.set(customer.email, { customer, index });
                    }
                }
            });

            return duplicates;

        } catch (error) {
            console.error('❌ 重複検出エラー:', error);
            return [];
        }
    }
}

// グローバルインスタンス
window.DataValidator = new DataValidator();

console.log('✅ データ検証システム準備完了');
