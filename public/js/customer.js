/**
 * RentPipe 顧客管理システム
 * 美しいデザインと完全な機能
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
        this.loadCustomers();
        this.renderCustomers();
        this.setupEventListeners();
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

        // クイック登録ボタン
        const quickBtn = document.getElementById('quick-add-btn');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => this.showQuickForm());
        }

        // フォーム送信
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // クイック登録フォーム送信
        const quickForm = document.getElementById('quick-add-form');
        if (quickForm) {
            quickForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickSubmit();
            });
        }
    }

    loadCustomers() {
        try {
            const stored = localStorage.getItem('rentpipe_customers');
            if (stored) {
                this.customers = JSON.parse(stored);
            } else {
                this.customers = this.generateSampleData();
                this.saveCustomers();
            }
        } catch (error) {
            console.error('顧客データの読み込みに失敗:', error);
            this.customers = [];
        }
    }

    saveCustomers() {
        try {
            localStorage.setItem('rentpipe_customers', JSON.stringify(this.customers));
            return true;
        } catch (error) {
            console.error('顧客データの保存に失敗:', error);
            alert('データの保存に失敗しました');
            return false;
        }
    }

    addCustomer(customerData) {
        if (!customerData.name?.trim()) {
            alert('お名前は必須項目です');
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
            this.hideQuickForm();
            alert(`${customer.name}さんを登録しました`);
            return true;
        }
        return false;
    }

    updateCustomer(customerId, customerData) {
        if (!customerData.name?.trim()) {
            alert('お名前は必須項目です');
            return false;
        }

        const index = this.customers.findIndex(c => c.id === customerId);
        if (index === -1) {
            alert('顧客が見つかりません');
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
            alert(`${customerData.name}さんの情報を更新しました`);
            return true;
        }
        return false;
    }

    deleteCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            alert('顧客が見つかりません');
            return false;
        }

        if (confirm(`${customer.name}さんの情報を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
            this.customers = this.customers.filter(c => c.id !== customerId);
            
            if (this.saveCustomers()) {
                this.renderCustomers();
                alert(`${customer.name}さんの情報を削除しました`);
                return true;
            }
        }
        return false;
    }

    handleFormSubmit() {
        const formData = new FormData(document.getElementById('customer-form'));
        const customerData = {};
        
        formData.forEach((value, key) => {
            if (key.includes('.')) {
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
    }

    handleQuickSubmit() {
        const formData = new FormData(document.getElementById('quick-add-form'));
        const customerData = {};
        
        formData.forEach((value, key) => {
            customerData[key] = value;
        });

        this.addCustomer(customerData);
    }

    renderCustomers() {
        const filteredCustomers = this.getFilteredCustomers();
        const paginatedCustomers = this.getPaginatedCustomers(filteredCustomers);
        
        this.renderCustomerTable(paginatedCustomers);
        this.renderPagination(filteredCustomers.length);
        this.renderStats();
    }

    getFilteredCustomers() {
        return this.customers.filter(customer => {
            const matchesSearch = this.searchTerm === '' || 
                customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                customer.phone?.includes(this.searchTerm);
            
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

    getPaginatedCustomers(customers) {
        const startIndex = (this.currentPage - 1) * this.customersPerPage;
        return customers.slice(startIndex, startIndex + this.customersPerPage);
    }

    renderCustomerTable(customers) {
        const tbody = document.getElementById('customer-tbody');
        if (!tbody) return;

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>
                    <div class="customer-name">${customer.name}</div>
                    ${customer.email ? `<div class="customer-email">${customer.email}</div>` : ''}
                </td>
                <td>
                    ${customer.phone ? `<div class="customer-phone">📱 ${customer.phone}</div>` : ''}
                    ${customer.email ? `<div class="customer-email">📧 ${customer.email}</div>` : ''}
                </td>
                <td>
                    ${customer.age ? `<div>${customer.age}歳</div>` : ''}
                    ${customer.occupation ? `<div>${customer.occupation}</div>` : ''}
                </td>
                <td>
                    ${customer.preferences?.budgetMin || customer.preferences?.budgetMax ? 
                        `<div>💰 ${(customer.preferences.budgetMin || 0).toLocaleString()} - ${(customer.preferences.budgetMax || 0).toLocaleString()}円</div>` : ''}
                    ${customer.preferences?.areas ? `<div>📍 ${customer.preferences.areas.join(', ')}</div>` : ''}
                    ${customer.preferences?.roomType ? `<div>🏠 ${customer.preferences.roomType}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge status-${customer.pipelineStatus?.replace(/\s+/g, '-')}">${customer.pipelineStatus || '未設定'}</span>
                </td>
                <td>
                    <div class="date-info">
                        <div>登録: ${new Date(customer.createdAt).toLocaleDateString('ja-JP')}</div>
                        ${customer.updatedAt !== customer.createdAt ? 
                            `<div>更新: ${new Date(customer.updatedAt).toLocaleDateString('ja-JP')}</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="customerManager.editCustomer('${customer.id}')" class="btn-icon edit" title="編集">
                            ✏️
                        </button>
                        <button onclick="customerManager.deleteCustomer('${customer.id}')" class="btn-icon delete" title="削除">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(totalCustomers) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(totalCustomers / this.customersPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // 前へボタン
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="customerManager.changePage(${this.currentPage - 1})" class="pagination-btn">← 前へ</button>`;
        }

        // ページ番号
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage || i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 1) {
                paginationHTML += `<button onclick="customerManager.changePage(${i})" class="pagination-btn ${i === this.currentPage ? 'active' : ''}">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        // 次へボタン
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="customerManager.changePage(${this.currentPage + 1})" class="pagination-btn">次へ →</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    renderStats() {
        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => !['完了', '契約'].includes(c.pipelineStatus)).length;
        const completedCustomers = this.customers.filter(c => c.pipelineStatus === '完了').length;
        const conversionRate = totalCustomers > 0 ? Math.round((completedCustomers / totalCustomers) * 100) : 0;

        const elements = {
            'total-customers': totalCustomers,
            'active-customers': activeCustomers,
            'completed-customers': completedCustomers,
            'conversion-rate': `${conversionRate}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    changePage(page) {
        this.currentPage = page;
        this.renderCustomers();
    }

    showAddForm() {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('customer-form');
        
        if (modal && title && form) {
            title.textContent = '新規顧客追加';
            form.reset();
            document.getElementById('customer-id').value = '';
            modal.classList.remove('hidden');
        }
    }

    showQuickForm() {
        const modal = document.getElementById('quick-add-modal');
        const form = document.getElementById('quick-add-form');
        
        if (modal && form) {
            form.reset();
            modal.classList.remove('hidden');
        }
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('modal-title');
        
        if (modal && title) {
            title.textContent = '顧客情報編集';
            
            // フォームに値を設定
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('name').value = customer.name || '';
            document.getElementById('email').value = customer.email || '';
            document.getElementById('phone').value = customer.phone || '';
            document.getElementById('age').value = customer.age || '';
            document.getElementById('occupation').value = customer.occupation || '';
            document.getElementById('annualIncome').value = customer.annualIncome || '';
            document.getElementById('budgetMin').value = customer.preferences?.budgetMin || '';
            document.getElementById('budgetMax').value = customer.preferences?.budgetMax || '';
            document.getElementById('areas').value = customer.preferences?.areas?.join(', ') || '';
            document.getElementById('roomType').value = customer.preferences?.roomType || '';
            document.getElementById('pipelineStatus').value = customer.pipelineStatus || '';
            document.getElementById('notes').value = customer.notes || '';
            
            modal.classList.remove('hidden');
        }
    }

    hideForm() {
        const modal = document.getElementById('customer-modal');
        if (modal) modal.classList.add('hidden');
    }

    hideQuickForm() {
        const modal = document.getElementById('quick-add-modal');
        if (modal) modal.classList.add('hidden');
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
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.customerManager = new CustomerManager();
});
