// パイプライン管理機能
class PipelineManager {
    constructor() {
        this.customers = [];
        this.currentFilter = 'all';
        this.statusHistory = [];
        this.init();
    }

    async init() {
        await this.loadCustomers();
        await this.loadStatusHistory();
        this.renderPipeline();
        this.updateStats();
        this.initDragAndDrop();
        this.renderStatusHistory();
    }

    async loadCustomers() {
        try {
            const snapshot = await db.collection('customers')
                .orderBy('updatedAt', 'desc')
                .get();
            
            this.customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('顧客データの読み込みエラー:', error);
            this.customers = this.getDemoCustomers();
        }
    }

    async loadStatusHistory() {
        try {
            const snapshot = await db.collection('statusHistory')
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();
            
            this.statusHistory = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('履歴データの読み込みエラー:', error);
            this.statusHistory = [];
        }
    }

    getDemoCustomers() {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const customers = [];
        
        for (let i = 1; i <= 15; i++) {
            customers.push({
                id: `demo-${i}`,
                name: `田中${i}`,
                email: `tanaka${i}@example.com`,
                phone: `090-1234-567${i % 10}`,
                pipelineStatus: statuses[Math.floor(Math.random() * statuses.length)],
                preferences: {
                    budgetMin: 50000 + (i * 5000),
                    budgetMax: 80000 + (i * 5000),
                    areas: ['渋谷区', '新宿区'][Math.floor(Math.random() * 2)]
                },
                notes: i % 3 === 0 ? '急ぎの案件' : '',
                createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
            });
        }
        
        return customers;
    }

    renderPipeline() {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        
        statuses.forEach(status => {
            const listElement = document.getElementById(`list-${status}`);
            const countElement = document.getElementById(`count-${status}`);
            
            if (!listElement || !countElement) return;
            
            // フィルター適用
            const filteredCustomers = this.getFilteredCustomers(status);
            
            listElement.innerHTML = '';
            countElement.textContent = filteredCustomers.length;
            
            filteredCustomers.forEach(customer => {
                const card = this.createCustomerCard(customer);
                listElement.appendChild(card);
            });
        });
    }

    getFilteredCustomers(status) {
        let filtered = this.customers.filter(customer => customer.pipelineStatus === status);
        
        switch (this.currentFilter) {
            case 'thisWeek':
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(customer => 
                    new Date(customer.updatedAt) >= weekAgo
                );
                break;
            case 'thisMonth':
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(customer => 
                    new Date(customer.updatedAt) >= monthAgo
                );
                break;
            case 'urgent':
                filtered = filtered.filter(customer => 
                    customer.notes && customer.notes.includes('急ぎ')
                );
                break;
        }
        
        return filtered;
    }

    createCustomerCard(customer) {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.draggable = true;
        card.dataset.customerId = customer.id;
        
        const isUrgent = customer.notes && customer.notes.includes('急ぎ');
        if (isUrgent) {
            card.style.borderLeftColor = '#ef4444';
        }
        
        card.innerHTML = `
            <div class="customer-name">${customer.name}</div>
            <div class="customer-info">📧 ${customer.email}</div>
            <div class="customer-info">📱 ${customer.phone}</div>
            <div class="customer-info">📍 ${customer.preferences?.areas?.[0] || '未設定'}</div>
            <div class="customer-budget">
                💰 ${(customer.preferences?.budgetMin || 0).toLocaleString()}〜${(customer.preferences?.budgetMax || 0).toLocaleString()}円
            </div>
            ${isUrgent ? '<div style="color: #ef4444; font-size: 11px; font-weight: bold; margin-top: 5px;">🚨 急ぎ</div>' : ''}
        `;
        
        // カードクリックで詳細表示
        card.addEventListener('click', () => {
            this.showCustomerDetail(customer);
        });
        
        return card;
    }

    showCustomerDetail(customer) {
        alert(`顧客詳細\n\n名前: ${customer.name}\nメール: ${customer.email}\n電話: ${customer.phone}\nステータス: ${customer.pipelineStatus}\n備考: ${customer.notes || 'なし'}`);
    }

    initDragAndDrop() {
        // ドラッグ開始
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.customerId);
            }
        });

        // ドラッグ終了
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.remove('dragging');
            }
        });

        // ドロップエリアの設定
        document.querySelectorAll('.pipeline-column').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const customerId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                this.updateCustomerStatus(customerId, newStatus);
            });
        });
    }

    async updateCustomerStatus(customerId, newStatus) {
        try {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) return;

            const oldStatus = customer.pipelineStatus;
            
            // ローカルデータ更新
            customer.pipelineStatus = newStatus;
            customer.updatedAt = new Date();

            // Firebase更新（デモ環境では実際には更新しない）
            if (customerId.startsWith('demo-')) {
                console.log(`デモ: ${customer.name} のステータスを ${oldStatus} → ${newStatus} に変更`);
            } else {
                await db.collection('customers').doc(customerId).update({
                    pipelineStatus: newStatus,
                    updatedAt: new Date()
                });
            }

            // 履歴記録
            await this.addStatusHistory(customer, oldStatus, newStatus);

            // 画面更新
            this.renderPipeline();
            this.updateStats();
            this.renderStatusHistory();

            // 成功メッセージ
            this.showNotification(`${customer.name} のステータスを「${newStatus}」に変更しました`);

        } catch (error) {
            console.error('ステータス更新エラー:', error);
            alert('ステータスの更新に失敗しました。');
        }
    }

    async addStatusHistory(customer, oldStatus, newStatus) {
        const historyItem = {
            customerId: customer.id,
            customerName: customer.name,
            oldStatus: oldStatus,
            newStatus: newStatus,
            timestamp: new Date(),
            note: `${oldStatus} → ${newStatus}`
        };

        // ローカル履歴に追加
        this.statusHistory.unshift(historyItem);
        
        // 最新20件のみ保持
        this.statusHistory = this.statusHistory.slice(0, 20);

        // Firebase保存（デモ環境では実際には保存しない）
        if (!customer.id.startsWith('demo-')) {
            try {
                await db.collection('statusHistory').add(historyItem);
            } catch (error) {
                console.error('履歴保存エラー:', error);
            }
        }
    }

    updateStats() {
        const totalCustomers = this.customers.length;
        const completedThisMonth = this.customers.filter(customer => {
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return customer.pipelineStatus === '完了' && 
                   new Date(customer.updatedAt) >= monthAgo;
        }).length;

        const conversionRate = totalCustomers > 0 ? 
            Math.round((completedThisMonth / totalCustomers) * 100) : 0;

        // 平均日数計算（初回相談から完了まで）
        const completedCustomers = this.customers.filter(c => c.pipelineStatus === '完了');
        const avgDays = completedCustomers.length > 0 ? 
            Math.round(completedCustomers.reduce((sum, customer) => {
                const days = Math.floor((new Date(customer.updatedAt) - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0) / completedCustomers.length) : 0;

        // 統計更新
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('monthlyConversions').textContent = completedThisMonth;
        document.getElementById('conversionRate').textContent = `${conversionRate}%`;
        document.getElementById('avgDays').textContent = `${avgDays}日`;
    }

    renderStatusHistory() {
        const historyElement = document.getElementById('statusHistory');
        
        if (this.statusHistory.length === 0) {
            historyElement.innerHTML = `
                <p style="text-align: center; color: #64748b; padding: 20px;">
                    ステータス変更履歴がここに表示されます
                </p>
            `;
            return;
        }

        historyElement.innerHTML = this.statusHistory.map(item => `
            <div class="history-item">
                <div class="history-time">
                    ${this.formatTime(item.timestamp)}
                </div>
                <div class="history-content">
                    <div class="history-customer">${item.customerName}</div>
                    <div class="history-change">${item.note}</div>
                </div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffMinutes < 60) {
            return `${diffMinutes}分前`;
        } else if (diffMinutes < 1440) {
            return `${Math.floor(diffMinutes / 60)}時間前`;
        } else {
            return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        }
    }

    showNotification(message) {
        // 簡易通知表示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #22c55e;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// フィルター機能
function filterPipeline(filter) {
    // ボタンの状態更新
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // フィルター適用
    pipelineManager.currentFilter = filter;
    pipelineManager.renderPipeline();
}

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// パイプライン管理開始
let pipelineManager;
document.addEventListener('DOMContentLoaded', () => {
    pipelineManager = new PipelineManager();
});
