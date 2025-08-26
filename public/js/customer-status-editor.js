// 顧客管理画面のステータス変更機能（ローカルファースト版）
console.log('顧客ステータス変更機能初期化中...');

class CustomerStatusEditor {
    constructor() {
        this.statusOptions = [
            { value: '初回相談', label: '初回相談', color: '#ef4444' },
            { value: '物件紹介', label: '物件紹介', color: '#f97316' },
            { value: '内見', label: '内見', color: '#eab308' },
            { value: '申込', label: '申込', color: '#22c55e' },
            { value: '審査', label: '審査', color: '#3b82f6' },
            { value: '契約', label: '契約', color: '#8b5cf6' },
            { value: '完了', label: '完了', color: '#10b981' }
        ];
        
        this.monitorCustomerRendering();
    }
    
    // 顧客カード描画を監視
    monitorCustomerRendering() {
        const observer = new MutationObserver(() => {
            this.addClickListenersToStatusElements();
        });
        
        const customersList = document.getElementById('customersList');
        if (customersList) {
            observer.observe(customersList, {
                childList: true,
                subtree: true
            });
        }
        
        // 定期的に実行
        setInterval(() => {
            this.addClickListenersToStatusElements();
        }, 2000);
    }
    
    // ステータス要素にクリックリスナーを追加
    addClickListenersToStatusElements() {
        const statusElements = document.querySelectorAll('.customer-status:not([data-status-clickable])');
        
        statusElements.forEach(element => {
            element.setAttribute('data-status-clickable', 'true');
            element.style.cursor = 'pointer';
            element.title = 'クリックでステータス変更';
            
            const customerCard = element.closest('.customer-card');
            if (!customerCard) return;
            
            const customerId = customerCard.getAttribute('data-customer-id');
            if (!customerId) return;
            
            const currentStatus = element.textContent.trim();
            
            element.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showStatusMenu(customerId, currentStatus, event);
            });
        });
        
        if (statusElements.length > 0) {
            console.log(`ステータスクリック機能を${statusElements.length}個の新しい要素に追加`);
        }
    }
    
    // ステータス変更メニューを表示
    showStatusMenu(customerId, currentStatus, event) {
        this.hideStatusMenu();
        
        const menu = document.createElement('div');
        menu.id = 'statusChangeMenu';
        menu.className = 'status-change-menu';
        
        const rect = event.target.getBoundingClientRect();
        menu.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 5}px;
            left: ${rect.left}px;
            z-index: 1000;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px;
            min-width: 150px;
        `;
        
        this.statusOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'status-menu-item';
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 6px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.2s;
                ${option.value === currentStatus ? 'background: #f3f4f6; font-weight: 600;' : ''}
            `;
            
            item.innerHTML = `
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${option.color};"></div>
                ${option.label}
                ${option.value === currentStatus ? '<span style="margin-left: auto; color: #10b981;">✓</span>' : ''}
            `;
            
            item.addEventListener('mouseenter', () => {
                if (option.value !== currentStatus) {
                    item.style.background = '#f9fafb';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (option.value !== currentStatus) {
                    item.style.background = '';
                }
            });
            
            item.addEventListener('click', () => {
                if (option.value !== currentStatus) {
                    this.changeCustomerStatus(customerId, option.value);
                }
                this.hideStatusMenu();
            });
            
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this));
        }, 100);
    }
    
    // メニューを非表示
    hideStatusMenu() {
        const menu = document.getElementById('statusChangeMenu');
        if (menu) {
            menu.remove();
        }
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
    
    // 外側クリックハンドラ
    handleOutsideClick(event) {
        const menu = document.getElementById('statusChangeMenu');
        if (menu && !menu.contains(event.target)) {
            this.hideStatusMenu();
        }
    }
    
    // 顧客ステータス変更（ローカルファースト版）
    async changeCustomerStatus(customerId, newStatus) {
        try {
            console.log(`ステータス変更開始: ${customerId} → ${newStatus}`);
            
            // 現在の顧客データを取得
            const customer = this.getCustomerById(customerId);
            if (!customer) {
                throw new Error('顧客が見つかりません');
            }
            
            const oldStatus = customer.status || customer.pipelineStatus || '';
            console.log(`顧客発見: ${customer.name}, 現在のステータス: ${oldStatus}`);
            
            // ローカルファースト同期システムを使用
            if (window.localFirstSync) {
                const result = await window.localFirstSync.updateCustomer(customerId, {
                    status: newStatus,
                    pipelineStatus: newStatus
                });
                
                if (result) {
                    this.showStatusMessage(`${customer.name} のステータスを「${newStatus}」に変更しました`, 'success');
                    
                    // 少し遅延してから画面を更新
                    setTimeout(() => {
                        this.forceReloadCustomerList();
                    }, 500);
                } else {
                    throw new Error('ステータス更新に失敗しました');
                }
            } else {
                throw new Error('同期システムが初期化されていません');
            }
            
        } catch (error) {
            console.error('ステータス変更エラー:', error);
            this.showStatusMessage('ステータス変更に失敗しました', 'error');
        }
    }
    
    // 顧客IDから顧客データを取得
    getCustomerById(customerId) {
        const keys = ['rentpipe_customers', 'rentpipe_demo_customers', 'customers'];
        
        for (const key of keys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const customers = JSON.parse(stored);
                    const customer = customers.find(c => c.id === customerId);
                    if (customer) {
                        return customer;
                    }
                } catch (e) {
                    console.warn(`${key}の読み取りエラー:`, e);
                }
            }
        }
        
        return null;
    }
    
    // 顧客リストを強制リロード
    async forceReloadCustomerList() {
        try {
            if (window.customerManager && typeof window.customerManager.loadCustomers === 'function') {
                await window.customerManager.loadCustomers();
                console.log('顧客リスト強制リロード完了');
                
                // リロード後にクリックリスナーを再設定
                setTimeout(() => {
                    this.addClickListenersToStatusElements();
                }, 500);
            } else {
                // 最後の手段：ページリロード
                console.log('ページリロードによる更新');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('顧客リストリロードエラー:', error);
        }
    }
    
    // ステータス変更メッセージ
    showStatusMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.status-change-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'status-change-message';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-size: 14px;
            font-weight: 500;
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

// グローバルインスタンス
window.customerStatusEditor = new CustomerStatusEditor();

console.log('顧客ステータス変更機能準備完了');
