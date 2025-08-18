/**
 * RentPipe 顧客管理システム（エラーハンドリング強化版）
 * Phase2対応：安定性とユーザビリティの向上
 */

class CustomerManager {
    constructor() {
        this.customers = [];
        this.currentPage = 1;
        this.customersPerPage = 10;
        this.searchTerm = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.filterStatus = 'all';
        
        this.init();
    }

    init() {
        try {
            this.loadCustomers();
            this.renderCustomers();
            this.setupEventListeners();
            showSuccess('顧客管理システム', '正常に読み込まれました');
        } catch (error) {
            errorHandler.handleError('初期化エラー', '顧客管理システムの初期化に失敗しました');
        }
    }

    setupEventListeners() {
        // 検索機能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.renderCustomers();
            });
        }

        // ソート機能
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [field, order] = e.target.value.split('-');
                this.sortBy = field;
                this.sortOrder = order;
                this.renderCustomers();
            });
        }

        // フィルター機能
        const filterSelect = document.getElementById('filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.currentPage = 1;
                this.renderCustomers();
            });
        }

        // 新規顧客追加
        const addBtn = document.getElementById('add-customer-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddForm());
        }

        // フォーム送信
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    loadCustomers() {
        try {
            const stored = localStorage.getItem('rentpipe_customers');
            if (stored) {
                this.customers = JSON.parse(stored);
            } else {
                // 初回起動時のサンプルデータ
                this.customers = this.generateSampleData();
                this.saveCustomers();
            }
        } catch (error) {
            errorHandler.handleSaveError('顧客データ読み込み');
            this.customers = [];
        }
    }

    saveCustomers() {
        try {
            showLoading('データを保存中...');
            localStorage.setItem('rentpipe_customers', JSON.stringify(this.customers));
            hideLoading();
            return true;
        } catch (error) {
            hideLoading();
            errorHandler.handleSaveError('顧客データ保存');
            return false;
        }
    }

    addCustomer(customerData) {
        try {
            // バリデーション
            const validation = this.validateCustomerData(customerData);
            if (!validation.isValid) {
                errorHandler.handleValidationError('入力データ', validation.message);
                return false;
            }

            const customer = {
                id: 'customer_' + Date.now(),
                ...customerData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                statusHistory: [{
                    status: customerData.pipelineStatus || '初回相談',
                    date: new Date().toISOString(),
                    note: '顧客登録'
                }]
            };

            this.customers.unshift(customer);
            
            if (this.saveCustomers()) {
                this.renderCustomers();
                this.hideForm();
                showSuccess('顧客追加完了', `${customer.name}さんを登録しました`);
                return true;
            }
            return false;
        } catch (error) {
            errorHandler.handleError('顧客追加エラー', '顧客の追加に失敗しました');
            return false;
        }
    }

    updateCustomer(customerId, customerData) {
        try {
            const validation = this.validateCustomerData(customerData);
            if (!validation.isValid) {
                errorHandler.handleValidationError('入力データ', validation.message);
                return false;
            }

            const index = this.customers.findIndex(c => c.id === customerId);
            if (index === -1) {
                errorHandler.handleError('更新エラー', '顧客が見つかりません');
                return false;
            }

            const oldCustomer = this.customers[index];
            this.customers[index] = {
                ...oldCustomer,
                ...customerData,
                updatedAt: new Date().toISOString()
            };

            // パイプラインステータスが変更された場合
            if (oldCustomer.pipelineStatus !== customerData.pipelineStatus) {
                this.customers[index].statusHistory.push({
                    status: customerData.pipelineStatus,
                    date: new Date().toISOString(),
                    note: 'ステータス更新'
                });
            }

            if (this.saveCustomers()) {
                this.renderCustomers();
                this.hideForm();
                showSuccess('顧客更新完了', `${customerData.name}さんの情報を更新しました`);
                return true;
            }
            return false;
        } catch (error) {
            errorHandler.handleError('顧客更新エラー', '顧客の更新に失敗しました');
            return false;
        }
    }

    deleteCustomer(customerId) {
        try {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) {
                errorHandler.handleError('削除エラー', '顧客が見つかりません');
                return false;
            }

            if (confirm(`${customer.name}さんの情報を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
                this.customers = this.customers.filter(c => c.id !== customerId);
                
                if (this.saveCustomers()) {
                    this.renderCustomers();
                    showSuccess('顧客削除完了', `${customer.name}さんの情報を削除しました`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            errorHandler.handleError('顧客削除エラー', '顧客の削除に失敗しました');
            return false;
        }
    }

    validateCustomerData(data) {
        if (!data.name?.trim()) {
            return { isValid: false, message: 'お名前は必須項目です' };
        }
        
        if (data.email && !this.isValidEmail(data.email)) {
            return { isValid: false, message: 'メールアドレスの形式が正しくありません' };
        }
        
        if (data.phone && !this.isValidPhone(data.phone)) {
            return { isValid: false, message: '電話番号の形式が正しくありません' };
        }
        
        if (data.age && (data.age < 18 || data.age > 100)) {
            return { isValid: false, message: '年齢は18〜100歳の範囲で入力してください' };
        }

        return { isValid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    handleFormSubmit() {
        try {
            const formData = new FormData(document.getElementById('customer-form'));
            const customerData = {};
            
            formData.forEach((value, key) => {
                if (key.includes('.')) {
                    // ネストされたオブジェクト処理（例：preferences.budgetMin）
                    const [parent, child] = key.split('.');
                    if (!customerData[parent]) customerData[parent] = {};
                    customerData[parent][child] = value;
                } else {
                    customerData[key] = value;
                }
            });

            // 数値変換
            if (customerData.age) customerData.age = parseInt(customerData.age);
            if (customerData.annualIncome) customerData.annualIncome = parseInt(customerData.annualIncome);
            if (customerData.preferences?.budgetMin) {
                customerData.preferences.budgetMin = parseInt(customerData.preferences.budgetMin);
            }
            if (customerData.preferences?.budgetMax) {
                customerData.preferences.budgetMax = parseInt(customerData.preferences.budgetMax);
            }

            // 配列処理（希望エリア）
            if (customerData.preferences?.areas) {
                customerData.preferences.areas = customerData.preferences.areas.split(',').map(s => s.trim()).filter(s => s);
            }

            const customerId = document.getElementById('customer-id').value;
            
            if (customerId) {
                this.updateCustomer(customerId, customerData);
            } else {
                this.addCustomer(customerData);
            }
        } catch (error) {
            errorHandler.handleError('フォーム処理エラー', 'フォームの処理中にエラーが発生しました');
        }
    }

    renderCustomers() {
        try {
            showLoading('顧客データを読み込み中...');
            
            const filteredCustomers = this.getFilteredCustomers();
            const paginatedCustomers = this.getPaginatedCustomers(filteredCustomers);
            
            this.renderCustomerTable(paginatedCustomers);
            this.renderPagination(filteredCustomers.length);
            this.renderStats();
            
            hideLoading();
        } catch (error) {
            hideLoading();
            errorHandler.handleError('表示エラー', '顧客データの表示に失敗しました');
        }
    }

    getFilteredCustomers() {
        return this.customers.filter(customer => {
            // 検索フィルター
            const matchesSearch = this.searchTerm === '' || 
                customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                customer.phone?.includes(this.searchTerm);
            
            // ステータスフィルター
            const matchesStatus = this.filterStatus === 'all' || 
                customer.pipelineStatus === this.filterStatus;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];
            
            if (this.sortBy === 'createdAt' || this.sortBy === 'updatedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    generateSampleData() {
        return [
            {
                id: 'customer_1',
                name: '田中太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                age: 28,
                occupation: '会社員',
                annualIncome: 4000000,
                preferences: {
                    budgetMin: 60000,
                    budgetMax: 80000,
                    areas: ['渋谷区', '新宿区'],
                    roomType: '1K',
                    requirements: ['駅徒歩10分以内', 'バストイレ別']
                },
                pipelineStatus: '内見',
                notes: '転勤のため急ぎ対応',
                createdAt: '2025-08-15T10:30:00.000Z',
                updatedAt: '2025-08-18T14:20:00.000Z',
                statusHistory: [
                    { status: '初回相談', date: '2025-08-15T10:30:00.000Z', note: '希望条件ヒアリング完了' },
                    { status: '物件紹介', date: '2025-08-16T09:15:00.000Z', note: '5件の物件を紹介' },
                    { status: '内見', date: '2025-08-18T14:20:00.000Z', note: '2件の内見予定' }
                ]
            }
        ];
    }

    // 残りのメソッドは既存の実装を使用
    renderCustomerTable(customers) {
        // 既存の実装
    }

    renderPagination(totalCustomers) {
        // 既存の実装
    }

    renderStats() {
        // 既存の実装
    }

    showAddForm() {
        // 既存の実装
    }

    hideForm() {
        // 既存の実装
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.customerManager = new CustomerManager();
});
