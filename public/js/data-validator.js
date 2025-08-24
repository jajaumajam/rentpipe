// RentPipe データ検証・整合性チェックシステム（統一データ対応版）
class DataValidator {
    constructor() {
        // 統一データ管理システムを使用
        this.dataManager = null;
        this.issues = [];
        this.stats = {
            total: 0,
            valid: 0,
            invalid: 0,
            repaired: 0,
            errors: []
        };
        
        this.init();
    }

    init() {
        console.log('🔍 データ検証システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        if (window.UnifiedDataManager) {
            this.dataManager = window.UnifiedDataManager;
            console.log('✅ 統一データ管理システムと連携完了');
        } else {
            setTimeout(() => {
                this.dataManager = window.UnifiedDataManager;
                console.log('✅ 統一データ管理システムと連携完了（遅延）');
            }, 500);
        }
    }

    // メイン検証プロセス
    async validateAllData() {
        console.log('🔍 統一データ検証を開始します...');
        this.resetStats();
        
        try {
            // 統一データ管理システムが利用可能か確認
            if (!this.dataManager) {
                this.addIssue('system', 'システムエラー', '統一データ管理システムが利用できません', 'error');
                return this.generateValidationSummary();
            }
            
            // 1. 顧客データの検証
            await this.validateCustomers();
            
            // 2. パイプライン履歴の検証
            await this.validateHistory();
            
            // 3. 認証データの検証
            await this.validateAuthData();
            
            // 4. データ整合性の検証
            await this.validateDataConsistency();
            
            // 5. 検証結果のサマリー作成
            const summary = this.generateValidationSummary();
            
            console.log('✅ 統一データ検証完了:', summary);
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
        console.log('👥 統一顧客データの検証中...');
        
        try {
            const customers = this.dataManager.getCustomers();
            
            if (!customers || !Array.isArray(customers)) {
                this.addIssue('customers', 'データ形式エラー', '顧客データが配列ではありません', 'error');
                return;
            }

            if (customers.length === 0) {
                this.addIssue('customers', 'データなし', '顧客データが存在しません', 'warning');
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
            this.addIssue('customers', 'システムエラー', `顧客データ取得エラー: ${error.message}`, 'error');
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
                description: `${customerContext}: 無効なパイプラインステータス "${customer.pipelineStatus}"`,
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
        if (customer.preferences && customer.preferences.budgetMin && customer.preferences.budgetMax) {
            if (customer.preferences.budgetMin > customer.preferences.budgetMax) {
                issues.push({
                    category: 'customers',
                    type: 'データ論理エラー',
                    description: `${customerContext}: 最小予算(${customer.preferences.budgetMin})が最大予算(${customer.preferences.budgetMax})を上回っています`,
                    severity: 'warning',
                    customer: customer,
                    field: 'preferences.budget',
                    index: index,
                    autoFixable: true
                });
            }
        }

        // 年齢の妥当性チェック
        if (customer.age && (customer.age < 18 || customer.age > 100)) {
            issues.push({
                category: 'customers',
                type: 'データ値エラー',
                description: `${customerContext}: 年齢(${customer.age})が妥当な範囲外です`,
                severity: 'warning',
                customer: customer,
                field: 'age',
                index: index,
                autoFixable: false
            });
        }

        // 電話番号の形式チェック
        if (customer.phone && !this.isValidPhoneNumber(customer.phone)) {
            issues.push({
                category: 'customers',
                type: 'データ形式エラー',
                description: `${customerContext}: 電話番号の形式が無効です`,
                severity: 'warning',
                customer: customer,
                field: 'phone',
                index: index,
                autoFixable: false
            });
        }

        return issues;
    }

    // パイプライン履歴の検証
    async validateHistory() {
        console.log('📈 パイプライン履歴の検証中...');
        
        try {
            const history = this.dataManager.getHistory();
            
            if (!Array.isArray(history)) {
                this.addIssue('history', 'データ形式エラー', '履歴データが配列ではありません', 'error');
                return;
            }

            if (history.length === 0) {
                this.addIssue('history', 'データ少量', 'パイプライン履歴が少ないです', 'info');
                return;
            }

            let validEntries = 0;
            for (let i = 0; i < history.length; i++) {
                const entry = history[i];
                if (!entry.customerId || !entry.timestamp) {
                    this.addIssue('history', '不完全な履歴エントリ', `履歴#${i}: 必須フィールドが不足`, 'warning');
                } else {
                    validEntries++;
                }
            }

            console.log(`📊 履歴データ検証完了: ${history.length}件中 ${validEntries}件が正常`);

        } catch (error) {
            this.addIssue('history', 'システムエラー', `履歴データ取得エラー: ${error.message}`, 'error');
        }
    }

    // 認証データの検証
    async validateAuthData() {
        console.log('🔐 認証データの検証中...');
        
        try {
            const authData = window.UnifiedAuth ? window.UnifiedAuth.getCurrentUser() : null;
            
            if (!authData) {
                this.addIssue('auth', 'データなし', '認証データが存在しません', 'warning');
                return;
            }

            if (!authData.email) {
                this.addIssue('auth', '必須フィールド不足', '認証データにメールアドレスがありません', 'error');
            }

            if (authData.email && !this.isValidEmail(authData.email)) {
                this.addIssue('auth', 'データ形式エラー', '認証データのメールアドレスが無効です', 'warning');
            }

            console.log('📊 認証データ検証完了');

        } catch (error) {
            this.addIssue('auth', 'システムエラー', `認証データ検証エラー: ${error.message}`, 'error');
        }
    }

    // データ整合性の検証
    async validateDataConsistency() {
        console.log('🔗 データ整合性の検証中...');
        
        try {
            const customers = this.dataManager.getCustomers();
            const history = this.dataManager.getHistory();
            
            // 履歴内の顧客IDが実在するかチェック
            const customerIds = new Set(customers.map(c => c.id));
            const orphanedHistories = history.filter(h => 
                h.customerId && !customerIds.has(h.customerId)
            );
            
            if (orphanedHistories.length > 0) {
                this.addIssue('consistency', 'データ整合性エラー', 
                    `${orphanedHistories.length}件の履歴が存在しない顧客を参照しています`, 'warning');
            }
            
            // メールアドレスの重複チェック
            const emailMap = new Map();
            const duplicateEmails = [];
            
            customers.forEach((customer, index) => {
                if (customer.email) {
                    if (emailMap.has(customer.email)) {
                        duplicateEmails.push({
                            email: customer.email,
                            customers: [emailMap.get(customer.email), { customer, index }]
                        });
                    } else {
                        emailMap.set(customer.email, { customer, index });
                    }
                }
            });
            
            if (duplicateEmails.length > 0) {
                this.addIssue('consistency', 'データ重複', 
                    `${duplicateEmails.length}件のメールアドレス重複があります`, 'warning');
            }
            
            console.log('📊 データ整合性検証完了');
            
        } catch (error) {
            this.addIssue('consistency', 'システムエラー', 
                `データ整合性検証エラー: ${error.message}`, 'error');
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
        console.log('🛠️ 統一データ自動修復を開始します...');
        
        if (!this.dataManager) {
            console.error('❌ 統一データ管理システムが利用できません');
            return 0;
        }
        
        let repairedCount = 0;

        try {
            const customers = this.dataManager.getCustomers();
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
                this.dataManager.saveCustomers(customers);
                console.log(`✅ ${repairedCount}件の顧客データを修復しました`);
            }

        } catch (error) {
            console.error('❌ データ修復エラー:', error);
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

        // 基本フィールドの補完
        if (!customer.urgency) {
            customer.urgency = '中';
            modified = true;
        }

        if (!customer.source) {
            customer.source = '不明';
            modified = true;
        }

        return modified;
    }

    // バックアップ作成
    createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                customers: JSON.stringify(this.dataManager.getCustomers()),
                history: JSON.stringify(this.dataManager.getHistory()),
                auth: localStorage.getItem('rentpipe_auth'),
                profile: localStorage.getItem('rentpipe_user_profile')
            };

            localStorage.setItem('rentpipe_data_backup', JSON.stringify(backup));
            console.log('💾 統一データバックアップ作成完了');
            return true;

        } catch (error) {
            console.error('❌ バックアップ作成エラー:', error);
            return false;
        }
    }

    // バックアップからの復元
    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem('rentpipe_data_backup');
            if (!backupData) {
                console.warn('⚠️ バックアップデータが見つかりません');
                return false;
            }

            const backup = JSON.parse(backupData);
            
            if (backup.customers) {
                const customers = JSON.parse(backup.customers);
                this.dataManager.saveCustomers(customers);
            }
            
            if (backup.history) {
                const history = JSON.parse(backup.history);
                this.dataManager.saveHistory(history);
            }
            
            if (backup.auth) localStorage.setItem('rentpipe_auth', backup.auth);
            if (backup.profile) localStorage.setItem('rentpipe_user_profile', backup.profile);

            console.log('♻️ 統一データバックアップからの復元完了');
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
                    Math.round((this.stats.valid / this.stats.total) * 100) : 
                    (this.issues.length === 0 ? 100 : 0)
            },
            issues: this.issues,
            recommendations: this.generateRecommendations()
        };

        return summary;
    }

    // 推奨事項の生成
    generateRecommendations() {
        const recommendations = [];
        const errorCount = this.issues.filter(issue => issue.severity === 'error').length;
        const warningCount = this.issues.filter(issue => issue.severity === 'warning').length;

        if (errorCount > 0) {
            recommendations.push('重要なエラーが検出されました。データ修復機能の実行を推奨します');
        }

        if (warningCount > 5) {
            recommendations.push('多数の警告が検出されました。データ品質の改善を推奨します');
        }

        if (this.stats.total === 0) {
            recommendations.push('顧客データがありません。新規顧客の登録またはデモデータの生成を推奨します');
        }

        if (this.stats.total > 0 && this.stats.total < 5) {
            recommendations.push('顧客データが少量です。より多くの顧客データの蓄積を推奨します');
        }

        const healthScore = this.stats.total > 0 ? 
            Math.round((this.stats.valid / this.stats.total) * 100) : 100;

        if (healthScore >= 90) {
            recommendations.push('データの品質は優秀です。現在の管理方法を継続してください');
        } else if (healthScore >= 75) {
            recommendations.push('データの品質は良好です。定期的な検証を推奨します');
        } else if (healthScore >= 50) {
            recommendations.push('データの品質に改善の余地があります。自動修復機能の活用を推奨します');
        }

        if (recommendations.length === 0) {
            recommendations.push('現在、特に推奨する事項はありません');
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

    // ヘルパー関数: 電話番号の検証
    isValidPhoneNumber(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/[\D]/g, '').length >= 10;
    }

    // 重複データの検出
    findDuplicates() {
        if (!this.dataManager) return [];

        try {
            const customers = this.dataManager.getCustomers();
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

console.log('✅ 統一データ対応検証システム準備完了');
