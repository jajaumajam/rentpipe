// 顧客管理システム - Firebase統合版
console.log('🔥 Firebase統合顧客管理システム初期化中...');

// 統合データ管理（Firebaseとローカルストレージのハイブリッド）
class CustomerManager {
    constructor() {
        this.dataManager = window.FirebaseDataManager || null;
        this.isFirebaseMode = !!(this.dataManager && !window.location.search.includes('fallback=demo'));
        this.customers = [];
        this.filteredCustomers = [];
        this.currentUser = null;
        
        console.log(`📊 データモード: ${this.isFirebaseMode ? 'Firebase' : 'ローカルストレージ'}`);
        
        // 認証状態監視
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                console.log(`👤 認証状態変更: ${user ? user.uid : '未認証'}`);
                this.loadCustomers(); // 認証状態変更時に再読み込み
            });
        }
        
        this.init();
    }
    
    async init() {
        console.log('🚀 顧客管理システム初期化開始...');
        
        try {
            // Firebase認証がまだの場合は匿名認証
            if (this.isFirebaseMode && window.auth && !this.currentUser) {
                console.log('🔐 匿名認証開始...');
                await window.auth.signInAnonymously();
            }
            
            await this.loadCustomers();
            this.setupEventListeners();
            console.log('✅ 顧客管理システム初期化完了');
            
        } catch (error) {
            console.error('❌ 顧客管理システム初期化エラー:', error);
            // エラー時はローカルストレージモードにフォールバック
            this.isFirebaseMode = false;
            await this.loadCustomers();
            this.setupEventListeners();
        }
    }
    
    // 顧客データ読み込み（Firebase統合）
    async loadCustomers() {
        try {
            console.log(`📊 顧客データ読み込み開始 (${this.isFirebaseMode ? 'Firebase' : 'ローカル'}モード)`);
            
            if (this.isFirebaseMode && this.dataManager) {
                // Firebaseから読み込み
                this.customers = await this.dataManager.getCustomers();
            } else {
                // ローカルストレージから読み込み（既存ロジック）
                const stored = localStorage.getItem('rentpipe_demo_customers');
                this.customers = stored ? JSON.parse(stored) : this.getDefaultCustomers();
            }
            
            // フィルタリングされた顧客リストを初期化
            this.filteredCustomers = [...this.customers];
            
            console.log(`✅ 顧客データ読み込み完了: ${this.customers.length}件`);
            this.renderCustomers();
            this.updateCustomerCount();
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
            this.customers = [];
            this.filteredCustomers = [];
            this.renderCustomers();
        }
    }
    
    // 顧客データ保存（Firebase統合）
    async saveCustomer(customerData) {
        try {
            console.log(`💾 顧客データ保存開始: ${customerData.name}`);
            
            if (this.isFirebaseMode && this.dataManager) {
                // Firestoreに保存
                const result = await this.dataManager.saveCustomer(customerData);
                if (result) {
                    console.log(`✅ Firebase顧客データ保存完了: ${result}`);
                    return result;
                } else {
                    throw new Error('Firebase保存に失敗しました');
                }
            } else {
                // ローカルストレージに保存（既存ロジック）
                let customers = [...this.customers];
                const existingIndex = customers.findIndex(c => c.id === customerData.id);
                
                if (existingIndex !== -1) {
                    customers[existingIndex] = customerData;
                } else {
                    customerData.id = customerData.id || `customer_${Date.now()}`;
                    customers.push(customerData);
                }
                
                localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
                console.log(`✅ ローカル顧客データ保存完了: ${customerData.id}`);
                return customerData.id;
            }
            
        } catch (error) {
            console.error('❌ 顧客データ保存エラー:', error);
            return false;
        }
    }
    
    // 顧客削除（Firebase統合）
    async deleteCustomer(customerId) {
        if (!confirm('この顧客を削除しますか？この操作は取り消しできません。')) {
            return false;
        }

        try {
            console.log(`🗑️ 顧客削除開始: ${customerId}`);
            
            if (this.isFirebaseMode && this.dataManager && this.currentUser) {
                // Firestoreから削除
                const tenantId = this.currentUser.uid;
                await window.db.collection(`tenants/${tenantId}/customers`).doc(customerId).delete();
                console.log(`✅ Firebase顧客削除完了: ${customerId}`);
            } else {
                // ローカルストレージから削除（既存ロジック）
                const customers = [...this.customers];
                const filteredCustomers = customers.filter(c => c.id !== customerId);
                localStorage.setItem('rentpipe_demo_customers', JSON.stringify(filteredCustomers));
                console.log(`✅ ローカル顧客削除完了: ${customerId}`);
            }
            
            // 画面を更新
            await this.loadCustomers();
            this.showMessage('顧客を削除しました', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ 顧客削除エラー:', error);
            this.showMessage('顧客の削除に失敗しました', 'error');
            return false;
        }
    }
    
    // 顧客追加（Firebase統合）
    async addCustomer(customerData) {
        try {
            // 必要な情報を追加
            customerData.id = customerData.id || `customer_${Date.now()}`;
            customerData.createdAt = customerData.createdAt || new Date().toISOString();
            customerData.updatedAt = new Date().toISOString();
            
            if (this.isFirebaseMode) {
                // Firestoreの serverTimestamp を使用
                customerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                customerData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            const result = await this.saveCustomer(customerData);
            
            if (result) {
                await this.loadCustomers(); // リストを更新
                this.showMessage('顧客を追加しました', 'success');
                console.log(`✅ 新規顧客追加完了: ${customerData.name}`);
                return result;
            } else {
                throw new Error('顧客の追加に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ 顧客追加エラー:', error);
            this.showMessage('顧客の追加に失敗しました', 'error');
            return false;
        }
    }
    
    // 顧客更新（Firebase統合）
    async updateCustomer(customerId, updates) {
        try {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) {
                throw new Error('顧客が見つかりません');
            }
            
            const updatedCustomer = {
                ...customer,
                ...updates,
                updatedAt: this.isFirebaseMode ? 
                    firebase.firestore.FieldValue.serverTimestamp() : 
                    new Date().toISOString()
            };
            
            const result = await this.saveCustomer(updatedCustomer);
            
            if (result) {
                await this.loadCustomers(); // リストを更新
                this.showMessage('顧客情報を更新しました', 'success');
                console.log(`✅ 顧客更新完了: ${customer.name}`);
                return updatedCustomer;
            } else {
                throw new Error('顧客の更新に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ 顧客更新エラー:', error);
            this.showMessage('顧客の更新に失敗しました', 'error');
            return false;
        }
    }
    
    // 検索・フィルタリング
    filterCustomers() {
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const sortOrder = document.getElementById('sortOrder')?.value || 'updatedDesc';
        
        // フィルタリング
        this.filteredCustomers = this.customers.filter(customer => {
            const matchesSearch = !searchTerm || 
                customer.name?.toLowerCase().includes(searchTerm) ||
                customer.email?.toLowerCase().includes(searchTerm) ||
                customer.phone?.includes(searchTerm);
            
            const matchesStatus = !statusFilter || customer.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        // ソート
        this.filteredCustomers.sort((a, b) => {
            switch (sortOrder) {
                case 'updatedDesc':
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                case 'updatedAsc':
                    return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
                case 'createdDesc':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'createdAsc':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'nameAsc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'nameDesc':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });
        
        this.renderCustomers();
        this.updateCustomerCount();
    }
    
    // 顧客一覧レンダリング
    renderCustomers() {
        const container = document.getElementById('customerList');
        if (!container) return;
        
        if (this.filteredCustomers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>顧客が見つかりません</h3>
                    <p>新しい顧客を追加するか、検索条件を変更してください。</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.filteredCustomers.map(customer => this.customerCardHTML(customer)).join('');
    }
    
    // 顧客カードHTML生成
    customerCardHTML(customer) {
        const updatedDate = customer.updatedAt ? 
            new Date(customer.updatedAt.toDate ? customer.updatedAt.toDate() : customer.updatedAt).toLocaleDateString('ja-JP') : 
            '日付なし';
        
        return `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-main-info">
                    <div class="customer-header">
                        <h3 class="customer-name">${customer.name || '名前未設定'}</h3>
                        <span class="customer-status status-${(customer.status || 'initial_contact').replace(/\s+/g, '-')}">${customer.status || '初回相談'}</span>
                    </div>
                    <div class="customer-contact">
                        ${customer.email ? `<span>📧 ${customer.email}</span>` : ''}
                        ${customer.phone ? `<span>📱 ${customer.phone}</span>` : ''}
                    </div>
                </div>
                <div class="customer-actions">
                    <div class="customer-meta">
                        <small>更新: ${updatedDate}</small>
                    </div>
                    <div class="customer-buttons">
                        <button onclick="editCustomer('${customer.id}')" class="btn-small btn-outline">
                            ✏️ 編集
                        </button>
                        <button onclick="deleteCustomer('${customer.id}')" class="btn-small btn-danger">
                            🗑️ 削除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 顧客数表示更新
    updateCustomerCount() {
        const countElement = document.getElementById('customerCount');
        if (countElement) {
            const total = this.customers.length;
            const filtered = this.filteredCustomers.length;
            
            countElement.textContent = total === filtered ? 
                `${total}件の顧客` : `${filtered}/${total}件の顧客`;
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // 検索・フィルター
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const sortOrder = document.getElementById('sortOrder');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterCustomers());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterCustomers());
        }
        
        if (sortOrder) {
            sortOrder.addEventListener('change', () => this.filterCustomers());
        }
        
        // クイック登録ボタン
        const quickRegisterBtn = document.getElementById('quickRegisterBtn');
        if (quickRegisterBtn) {
            quickRegisterBtn.addEventListener('click', () => this.showQuickRegisterModal());
        }
        
        console.log('✅ イベントリスナー設定完了');
    }
    
    // クイック登録モーダル表示
    showQuickRegisterModal() {
        // 既存のクイック登録機能を維持
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>⚡ クイック登録</h2>
                <p style="color: #666; margin-bottom: 20px;">基本情報のみで素早く顧客を登録します</p>
                
                <form id="quickRegisterForm">
                    <input type="text" id="quickName" placeholder="顧客名 *" required style="margin-bottom: 15px;">
                    <input type="tel" id="quickPhone" placeholder="電話番号 *" required style="margin-bottom: 15px;">
                    <input type="email" id="quickEmail" placeholder="メールアドレス" style="margin-bottom: 15px;">
                    
                    <select id="quickStatus" style="margin-bottom: 20px;">
                        <option value="initial_contact">初回相談</option>
                        <option value="property_viewing">物件紹介</option>
                        <option value="viewing">内見</option>
                        <option value="application">申込</option>
                        <option value="screening">審査</option>
                        <option value="contract">契約</option>
                        <option value="completed">完了</option>
                    </select>
                    
                    <textarea id="quickNotes" placeholder="メモ（任意）" rows="3" style="margin-bottom: 20px;"></textarea>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeQuickRegisterModal()" class="btn btn-outline">
                            キャンセル
                        </button>
                        <button type="submit" class="btn btn-primary">
                            登録
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // フォーム送信処理
        document.getElementById('quickRegisterForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const customerData = {
                name: document.getElementById('quickName').value.trim(),
                phone: document.getElementById('quickPhone').value.trim(),
                email: document.getElementById('quickEmail').value.trim(),
                status: document.getElementById('quickStatus').value,
                notes: document.getElementById('quickNotes').value.trim(),
                source: 'quick_register'
            };
            
            if (!customerData.name || !customerData.phone) {
                alert('顧客名と電話番号は必須です。');
                return;
            }
            
            const result = await this.addCustomer(customerData);
            if (result) {
                this.closeQuickRegisterModal();
            }
        });
        
        // フォーカス設定
        document.getElementById('quickName').focus();
    }
    
    closeQuickRegisterModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
    
    // 顧客編集（既存機能維持）
    editCustomer(customerId) {
        window.location.href = `customer-form.html?edit=${customerId}`;
    }
    
    // メッセージ表示
    showMessage(message, type = 'info') {
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
            background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
            border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }
    
    // デフォルト顧客データ（既存機能維持）
    getDefaultCustomers() {
        return [
            {
                id: 'demo-customer-001',
                name: '田中太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                status: 'initial_contact',
                createdAt: new Date('2024-01-15').toISOString(),
                updatedAt: new Date('2024-01-20').toISOString(),
                source: 'demo'
            },
            // ... 他のデモデータ
        ];
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

function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortOrder) sortOrder.value = 'updatedDesc';
    
    if (window.customerManager) {
        window.customerManager.filterCustomers();
    }
}

function closeQuickRegisterModal() {
    if (window.customerManager) {
        window.customerManager.closeQuickRegisterModal();
    }
}

// 顧客管理システムのインスタンス作成
let customerManager = null;

// DOM読み込み後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Firebase設定の読み込みを待つ
        await new Promise(resolve => {
            const checkFirebase = () => {
                if (window.FirebaseDataManager) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
        
        customerManager = new CustomerManager();
        window.customerManager = customerManager;
    });
} else {
    // すでに読み込み済みの場合
    setTimeout(async () => {
        await new Promise(resolve => {
            const checkFirebase = () => {
                if (window.FirebaseDataManager) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
        
        customerManager = new CustomerManager();
        window.customerManager = customerManager;
    }, 100);
}

console.log('✅ Firebase統合顧客管理スクリプト準備完了');
