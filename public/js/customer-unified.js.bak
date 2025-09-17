// RentPipe 顧客管理機能（統一データ管理対応版）
class CustomerManager {
    constructor() {
        this.dataManager = null;
        this.currentFilter = 'all';
        this.currentSort = 'updatedAt';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        console.log('👥 顧客管理システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 顧客リストの読み込み・表示
        this.loadCustomers();
        
        console.log('✅ 統一対応顧客管理システム準備完了');
    }

    async waitForDataManager() {
        return new Promise((resolve) => {
            if (window.UnifiedDataManager) {
                this.dataManager = window.UnifiedDataManager;
                resolve();
            } else {
                setTimeout(() => {
                    this.dataManager = window.UnifiedDataManager;
                    resolve();
                }, 500);
            }
        });
    }

    setupEventListeners() {
        // 検索機能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterAndDisplayCustomers();
            });
        }

        // フィルター機能
        const filterSelect = document.getElementById('statusFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterAndDisplayCustomers();
            });
        }

        // ソート機能
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.filterAndDisplayCustomers();
            });
        }
    }

    loadCustomers() {
        if (!this.dataManager) {
            console.error('❌ 統一データ管理システムが利用できません');
            return;
        }

        try {
            const customers = this.dataManager.getCustomers();
            console.log(`📊 顧客データ読み込み: ${customers.length}件`);
            
            this.filterAndDisplayCustomers();
            this.updateCustomerStats(customers);
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
        }
    }

    filterAndDisplayCustomers() {
        const customers = this.dataManager.getCustomers();
        
        // フィルター適用
        let filteredCustomers = customers.filter(customer => {
            // ステータスフィルター
            if (this.currentFilter !== 'all' && customer.pipelineStatus !== this.currentFilter) {
                return false;
            }
            
            // 検索フィルター
            if (this.searchTerm) {
                const searchFields = [
                    customer.name,
                    customer.email,
                    customer.phone,
                    customer.occupation,
                    customer.notes
                ].filter(field => field).join(' ').toLowerCase();
                
                if (!searchFields.includes(this.searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });

        // ソート適用
        filteredCustomers.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'createdAt':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'updatedAt':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                default:
                    return 0;
            }
        });

        this.displayCustomers(filteredCustomers);
        this.updateResultsCount(filteredCustomers.length, customers.length);
    }

    displayCustomers(customers) {
        const customersList = document.getElementById('customersList');
        if (!customersList) return;

        if (customers.length === 0) {
            customersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>顧客データがありません</h3>
                    <p>検索条件を変更するか、新規顧客を登録してください。</p>
                    <button class="btn btn-primary" onclick="showQuickRegisterModal()">
                        新規顧客登録
                    </button>
                </div>
            `;
            return;
        }

        const customersHTML = customers.map(customer => this.createCustomerCard(customer)).join('');
        customersList.innerHTML = customersHTML;
    }

    createCustomerCard(customer) {
        const statusColors = {
            '初回相談': '#ef4444',
            '物件紹介': '#f97316',
            '内見': '#eab308',
            '申込': '#22c55e',
            '審査': '#3b82f6',
            '契約': '#8b5cf6',
            '完了': '#10b981'
        };

        const urgencyIcons = {
            '高': '🔴',
            '中': '🟡',
            '低': '🟢'
        };

        const lastUpdated = new Date(customer.updatedAt).toLocaleDateString('ja-JP');
        const budgetRange = customer.preferences?.budgetMin && customer.preferences?.budgetMax ? 
            `${(customer.preferences.budgetMin / 10000).toFixed(0)}万〜${(customer.preferences.budgetMax / 10000).toFixed(0)}万円` : '予算未設定';

        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-header">
                    <div class="customer-name">
                        ${urgencyIcons[customer.urgency] || '⚪'} ${customer.name}
                    </div>
                    <div class="customer-status" style="background: ${statusColors[customer.pipelineStatus] || '#6b7280'}">
                        ${customer.pipelineStatus}
                    </div>
                </div>
                
                <div class="customer-details">
                    <div class="detail-item">
                        <span class="detail-icon">📧</span>
                        <span>${customer.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📱</span>
                        <span>${customer.phone || '電話番号未登録'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">💰</span>
                        <span>${budgetRange}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${customer.preferences?.areas?.join(', ') || 'エリア未設定'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span>最終更新: ${lastUpdated}</span>
                    </div>
                </div>
                
                ${customer.notes ? `
                    <div class="customer-notes">
                        <span class="detail-icon">📝</span>
                        ${customer.notes}
                    </div>
                ` : ''}
                
                <div class="customer-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editCustomer('${customer.id}')">
                        編集
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.id}')">
                        削除
                    </button>
                </div>
            </div>
        `;
    }

    updateCustomerStats(customers) {
        const totalCount = document.getElementById('totalCustomers');
        const thisMonthCount = document.getElementById('thisMonthCustomers');
        const completedCount = document.getElementById('completedCustomers');

        if (totalCount) totalCount.textContent = customers.length;

        // 今月の新規顧客
        const thisMonth = new Date().toISOString().slice(0, 7);
        const thisMonthCustomers = customers.filter(c => 
            c.createdAt && c.createdAt.startsWith(thisMonth)
        ).length;
        if (thisMonthCount) thisMonthCount.textContent = thisMonthCustomers;

        // 完了した顧客
        const completedCustomers = customers.filter(c => c.pipelineStatus === '完了').length;
        if (completedCount) completedCount.textContent = completedCustomers;
    }

    updateResultsCount(filtered, total) {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = filtered === total ? 
                `${total}件の顧客` : `${filtered}/${total}件の顧客`;
        }
    }

    // 顧客削除
    deleteCustomer(customerId) {
        if (!confirm('この顧客を削除しますか？この操作は取り消しできません。')) {
            return;
        }

        try {
            if (this.dataManager.deleteCustomer(customerId)) {
                this.loadCustomers(); // リストを再読み込み
                this.showMessage('顧客を削除しました', 'success');
            } else {
                this.showMessage('顧客の削除に失敗しました', 'error');
            }
        } catch (error) {
            console.error('❌ 顧客削除エラー:', error);
            this.showMessage('顧客削除中にエラーが発生しました', 'error');
        }
    }

    // 顧客編集
    editCustomer(customerId) {
        window.location.href = `customer-form.html?edit=${customerId}`;
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        // 簡易メッセージ表示（既存のUIがある場合は置き換え）
        const existingMessage = document.querySelector('.floating-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `floating-message message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
            border: 1px solid ${type === 'success' ? '#10b981' : '#ef4444'};
            color: ${type === 'success' ? '#065f46' : '#991b1b'};
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }
}

// グローバル関数（HTMLから呼び出される）
function editCustomer(customerId) {
    if (window.customerManager) {
        window.customerManager.editCustomer(customerId);
    }
}

function deleteCustomer(customerId) {
    if (window.customerManager) {
        window.customerManager.deleteCustomer(customerId);
    }
}

function refreshCustomers() {
    if (window.customerManager) {
        window.customerManager.loadCustomers();
    }
}

// 顧客管理システムのインスタンス作成
let customerManager = null;

// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        customerManager = new CustomerManager();
        window.customerManager = customerManager;
    });
} else {
    customerManager = new CustomerManager();
    window.customerManager = customerManager;
}

console.log('✅ 統一対応顧客管理スクリプト準備完了');
