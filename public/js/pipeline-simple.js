// RentPipe シンプルパイプライン管理
class SimplePipelineManager {
    constructor() {
        this.customers = [];
        this.init();
    }

    init() {
        console.log('SimplePipelineManager初期化開始');
        this.loadCustomers();
        this.renderPipeline();
        this.updateStats();
        this.initDragAndDrop();
    }

    loadCustomers() {
        // ローカルストレージから顧客データを読み込み
        const stored = localStorage.getItem('rentpipe_demo_customers');
        if (stored) {
            this.customers = JSON.parse(stored);
            console.log('顧客データ読み込み:', this.customers.length + '件');
        } else {
            // デモデータがない場合は生成
            this.customers = this.generateDemoData();
            console.log('デモデータ生成:', this.customers.length + '件');
        }
    }

    generateDemoData() {
        const demoCustomers = [
            {
                id: 'demo-1',
                name: '田中 太郎',
                email: 'tanaka@example.com',
                phone: '090-1234-5678',
                pipelineStatus: '初回相談',
                preferences: { budgetMin: 80000, budgetMax: 120000, areas: ['渋谷区'] },
                notes: '駅近希望',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-2',
                name: '佐藤 花子',
                email: 'sato@example.com',
                phone: '080-9876-5432',
                pipelineStatus: '物件紹介',
                preferences: { budgetMin: 100000, budgetMax: 150000, areas: ['目黒区'] },
                notes: 'ファミリー向け',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-3',
                name: '鈴木 一郎',
                email: 'suzuki@example.com',
                phone: '070-1111-2222',
                pipelineStatus: '内見',
                preferences: { budgetMin: 60000, budgetMax: 90000, areas: ['新宿区'] },
                notes: '学生',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-4',
                name: '高橋 美咲',
                email: 'takahashi@example.com',
                phone: '090-3333-4444',
                pipelineStatus: '申込',
                preferences: { budgetMin: 70000, budgetMax: 100000, areas: ['品川区'] },
                notes: '急ぎ',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-5',
                name: '伊藤 次郎',
                email: 'ito@example.com',
                phone: '080-5555-6666',
                pipelineStatus: '審査',
                preferences: { budgetMin: 120000, budgetMax: 180000, areas: ['千代田区'] },
                notes: '会社員',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-6',
                name: '山田 三郎',
                email: 'yamada@example.com',
                phone: '070-7777-8888',
                pipelineStatus: '契約',
                preferences: { budgetMin: 90000, budgetMax: 130000, areas: ['中央区'] },
                notes: '契約書準備中',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'demo-7',
                name: '木村 聡美',
                email: 'kimura@example.com',
                phone: '090-9999-0000',
                pipelineStatus: '完了',
                preferences: { budgetMin: 85000, budgetMax: 110000, areas: ['台東区'] },
                notes: '契約完了',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        // ローカルストレージに保存
        localStorage.setItem('rentpipe_demo_customers', JSON.stringify(demoCustomers));
        return demoCustomers;
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
            }
        });
    }

    createCustomerCard(customer) {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.draggable = true;
        card.dataset.customerId = customer.id;
        
        card.innerHTML = `
            <div class="customer-name">${customer.name}</div>
            <div class="customer-contact">📧 ${customer.email}</div>
            <div class="customer-contact">📱 ${customer.phone}</div>
            <div class="customer-budget">💰 ${(customer.preferences?.budgetMin || 0).toLocaleString()}〜${(customer.preferences?.budgetMax || 0).toLocaleString()}円</div>
            <div class="customer-area">📍 ${customer.preferences?.areas?.[0] || '未設定'}</div>
            ${customer.notes ? `<div class="customer-notes">📝 ${customer.notes}</div>` : ''}
        `;
        
        card.addEventListener('click', () => {
            alert(`顧客詳細\n\n名前: ${customer.name}\nメール: ${customer.email}\n電話: ${customer.phone}\nステータス: ${customer.pipelineStatus}\n備考: ${customer.notes || 'なし'}`);
        });
        
        return card;
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
        
        if (daysElement) daysElement.textContent = '15日'; // 固定値
        
        console.log('統計更新完了');
    }

    initDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.customerId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('customer-card')) {
                e.target.classList.remove('dragging');
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
        if (customer) {
            customer.pipelineStatus = newStatus;
            customer.updatedAt = new Date().toISOString();
            
            // ローカルストレージを更新
            localStorage.setItem('rentpipe_demo_customers', JSON.stringify(this.customers));
            
            // 画面を再描画
            this.renderPipeline();
            this.updateStats();
            
            console.log(`${customer.name}のステータスを${newStatus}に変更`);
        }
    }
}

// グローバル変数として設定
let pipelineManager;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - SimplePipelineManager初期化');
    pipelineManager = new SimplePipelineManager();
    window.pipelineManager = pipelineManager; // グローバルアクセス用
});
