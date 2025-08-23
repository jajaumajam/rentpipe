// RentPipe シンプルパイプライン管理 v2（データ安定化版）
class SimplePipelineManager {
    constructor() {
        this.customers = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('SimplePipelineManager初期化開始');
        this.clearOldData(); // 古いデータをクリア
        this.loadCustomers();
        this.renderPipeline();
        this.updateStats();
        this.initDragAndDrop();
        this.isInitialized = true;
    }

    clearOldData() {
        // 古い不安定なデータをクリア
        const keys = ['rentpipe_demo_customers', 'customers', 'rentpipe_customers'];
        keys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`古いデータ削除: ${key}`);
            }
        });
        localStorage.removeItem('rentpipe_demo_customers');
        localStorage.removeItem('customers'); 
        localStorage.removeItem('rentpipe_customers');
    }

    loadCustomers() {
        // 常に新しいデモデータを生成（安定性のため）
        this.customers = this.generateStableDemoData();
        console.log('安定版デモデータ生成:', this.customers.length + '件');
    }

    generateStableDemoData() {
        const stableDemoCustomers = [
            {
                id: 'stable-1',
                name: '田中 太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                pipelineStatus: '初回相談',
                preferences: { budgetMin: 80000, budgetMax: 120000, areas: ['渋谷区'] },
                notes: '駅近希望',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-2',
                name: '佐藤 花子',
                email: 'sato@example.com',
                phone: '080-9876-5432',
                pipelineStatus: '物件紹介',
                preferences: { budgetMin: 100000, budgetMax: 150000, areas: ['目黒区'] },
                notes: 'ファミリー向け',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-3',
                name: '鈴木 一郎',
                email: 'suzuki@example.com',
                phone: '070-1111-2222',
                pipelineStatus: '初回相談',
                preferences: { budgetMin: 60000, budgetMax: 90000, areas: ['新宿区'] },
                notes: '学生',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-4',
                name: '高橋 美咲',
                email: 'takahashi@example.com',
                phone: '090-3333-4444',
                pipelineStatus: '内見',
                preferences: { budgetMin: 70000, budgetMax: 100000, areas: ['品川区'] },
                notes: '急ぎ',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-5',
                name: '伊藤 次郎',
                email: 'ito@example.com',
                phone: '080-5555-6666',
                pipelineStatus: '申込',
                preferences: { budgetMin: 120000, budgetMax: 180000, areas: ['千代田区'] },
                notes: '会社員',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-6',
                name: '山田 三郎',
                email: 'yamada@example.com',
                phone: '070-7777-8888',
                pipelineStatus: '審査',
                preferences: { budgetMin: 90000, budgetMax: 130000, areas: ['中央区'] },
                notes: '契約書準備中',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'stable-7',
                name: '木村 聡美',
                email: 'kimura@example.com',
                phone: '090-9999-0000',
                pipelineStatus: '完了',
                preferences: { budgetMin: 85000, budgetMax: 110000, areas: ['台東区'] },
                notes: '契約完了',
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        return stableDemoCustomers;
    }

    renderPipeline() {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        
        statuses.forEach(status => {
            const column = document.querySelector(`[data-column="${status}"]`);
            const countElement = document.querySelector(`[data-count="${status}"]`);
            
            if (column) {
                const statusCustomers = this.customers.filter(c => c.pipelineStatus === status);
                column.innerHTML = '';
                
                statusCustomers.forEach(customer => {
                    const card = this.createCustomerCard(customer);
                    column.appendChild(card);
                });
                
                if (countElement) {
                    countElement.textContent = statusCustomers.length;
                }
                
                console.log(`${status}: ${statusCustomers.length}件`);
            }
        });
        
        console.log('パイプライン描画完了:', this.customers.length + '件');
    }

    createCustomerCard(customer) {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.draggable = true;
        card.dataset.customerId = customer.id;
        
        // 予算を万円表示に変換
        const budgetMin = Math.floor((customer.preferences?.budgetMin || 0) / 10000);
        const budgetMax = Math.floor((customer.preferences?.budgetMax || 0) / 10000);
        
        card.innerHTML = `
            <div class="customer-name">${customer.name}</div>
            <div class="customer-budget">💰 ${budgetMin}〜${budgetMax}万円</div>
            <div class="customer-area">📍 ${customer.preferences?.areas?.[0] || '未設定'}</div>
            <div class="customer-contact">📧 ${customer.email}</div>
            <div class="customer-contact">📱 ${customer.phone}</div>
            ${customer.notes ? `<div class="customer-notes">📝 ${customer.notes}</div>` : ''}
        `;
        
        // カードクリックで詳細表示
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCustomerDetail(customer);
        });
        
        return card;
    }

    showCustomerDetail(customer) {
        const budgetMin = Math.floor((customer.preferences?.budgetMin || 0) / 10000);
        const budgetMax = Math.floor((customer.preferences?.budgetMax || 0) / 10000);
        
        alert(`顧客詳細

名前: ${customer.name}
メール: ${customer.email}
電話: ${customer.phone}
ステータス: ${customer.pipelineStatus}
予算: ${budgetMin}〜${budgetMax}万円
エリア: ${customer.preferences?.areas?.[0] || '未設定'}
備考: ${customer.notes || 'なし'}`);
    }

    updateStats() {
        const totalElement = document.getElementById('totalCustomers');
        const monthlyElement = document.getElementById('monthlyContracts');
        const rateElement = document.getElementById('conversionRate');
        const daysElement = document.getElementById('averageDays');

        if (totalElement) totalElement.textContent = this.customers.length;
        
        const completed = this.customers.filter(c => c.pipelineStatus === '完了');
        if (monthlyElement) monthlyElement.textContent = completed.length;
        
        const rate = this.customers.length > 0 ? Math.round((completed.length / this.customers.length) * 100) : 0;
        if (rateElement) rateElement.textContent = rate + '%';
        
        if (daysElement) daysElement.textContent = '12日';
        
        console.log('統計更新:', {
            total: this.customers.length,
            completed: completed.length,
            rate: rate + '%'
        });
    }

    initDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.customerId);
                console.log('ドラッグ開始:', e.target.dataset.customerId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.remove('dragging');
                console.log('ドラッグ終了');
            }
        });

        document.querySelectorAll('.pipeline-column').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const customerId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                if (customerId && newStatus) {
                    this.updateCustomerStatus(customerId, newStatus);
                }
            });
        });
    }

    updateCustomerStatus(customerId, newStatus) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer && customer.pipelineStatus !== newStatus) {
            const oldStatus = customer.pipelineStatus;
            customer.pipelineStatus = newStatus;
            customer.updatedAt = new Date().toISOString();
            
            // 画面を再描画
            this.renderPipeline();
            this.updateStats();
            
            // 成功フィードバック
            this.showStatusChangeSuccess(customer.name, oldStatus, newStatus);
            
            console.log(`${customer.name}: ${oldStatus} → ${newStatus}`);
        }
    }

    showStatusChangeSuccess(customerName, oldStatus, newStatus) {
        // 簡易通知表示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = `${customerName}を${newStatus}に移動しました`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
        
        // ハプティクスフィードバック
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// グローバル変数として設定
let pipelineManager;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - SimplePipelineManager初期化');
    setTimeout(() => {
        pipelineManager = new SimplePipelineManager();
        window.pipelineManager = pipelineManager;
        console.log('✅ パイプライン管理システム初期化完了');
    }, 100);
});
