// データエクスポート機能
class DataExporter {
    constructor() {
        this.customers = [];
        this.init();
    }

    async init() {
        await this.loadCustomers();
    }

    async loadCustomers() {
        try {
            // Firebase接続チェック
            if (window.db && typeof window.db.collection === 'function') {
                const snapshot = await window.db.collection('customers')
                    .orderBy('updatedAt', 'desc')
                    .get();
                
                this.customers = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('Firebaseから顧客データを読み込みました');
            } else {
                throw new Error('Firebase not available, using demo data');
            }
        } catch (error) {
            console.warn('顧客データの読み込み警告:', error.message);
            
            // デモデータ + フォームデータを結合
            const demoCustomers = this.getDemoCustomers();
            const formCustomers = JSON.parse(localStorage.getItem('demoCustomers') || '[]');
            this.customers = [...demoCustomers, ...formCustomers];
            console.log('デモデータを使用します。顧客数:', this.customers.length);
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
                age: 25 + (i % 15),
                occupation: ['会社員', '公務員', '自営業'][i % 3],
                annualIncome: 300 + (i * 20),
                pipelineStatus: statuses[Math.floor(Math.random() * statuses.length)],
                preferences: {
                    budgetMin: 50000 + (i * 5000),
                    budgetMax: 80000 + (i * 5000),
                    areas: ['渋谷区', '新宿区', '港区'][i % 3],
                    roomType: ['1K', '1DK', '1LDK'][i % 3],
                    requirements: ['駅徒歩10分以内', 'バストイレ別']
                },
                notes: i % 3 === 0 ? '急ぎの案件' : '',
                createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                source: 'demo'
            });
        }
        
        return customers;
    }

    // CSV エクスポート
    exportToCSV(filteredCustomers = null) {
        const customers = filteredCustomers || this.customers;
        
        if (customers.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }

        // CSV ヘッダー
        const headers = [
            'ID', '名前', 'メールアドレス', '電話番号', '年齢', '職業', '年収',
            'ステータス', '最低予算', '最高予算', '希望エリア', '間取り',
            '入居希望日', 'こだわり条件', '備考', '緊急度', '連絡希望時間',
            '登録日', '更新日', '登録元'
        ];

        // CSV データ変換
        const csvData = customers.map(customer => [
            customer.id,
            customer.name,
            customer.email,
            customer.phone,
            customer.age || '',
            customer.occupation || '',
            customer.annualIncome || '',
            customer.pipelineStatus,
            customer.preferences?.budgetMin || '',
            customer.preferences?.budgetMax || '',
            (customer.preferences?.areas || []).join('・'),
            customer.preferences?.roomType || '',
            customer.preferences?.moveInDate || '',
            (customer.preferences?.requirements || []).join('・'),
            customer.notes || '',
            customer.urgency || '',
            customer.contactTime || '',
            this.formatDate(customer.createdAt),
            this.formatDate(customer.updatedAt),
            customer.source || 'system'
        ]);

        // CSV 文字列生成
        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        // BOM付きUTF-8でダウンロード
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        this.downloadFile(blob, `顧客データ_${this.formatDateForFilename(new Date())}.csv`);
        
        // エクスポート完了通知
        this.showExportNotification('CSV', customers.length);
    }

    // JSON エクスポート
    exportToJSON(filteredCustomers = null) {
        const customers = filteredCustomers || this.customers;
        
        if (customers.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }

        // JSON データ準備
        const jsonData = {
            exportDate: new Date().toISOString(),
            totalCount: customers.length,
            data: customers.map(customer => ({
                ...customer,
                createdAt: customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt,
                updatedAt: customer.updatedAt instanceof Date ? customer.updatedAt.toISOString() : customer.updatedAt
            }))
        };

        // JSON 文字列生成
        const jsonContent = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        
        this.downloadFile(blob, `顧客データ_${this.formatDateForFilename(new Date())}.json`);
        
        // エクスポート完了通知
        this.showExportNotification('JSON', customers.length);
    }

    // ファイルダウンロード
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // 日付フォーマット
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateForFilename(date) {
        return date.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    }

    // エクスポート完了通知
    showExportNotification(format, count) {
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
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <strong>エクスポート完了</strong><br>
            ${format}形式で${count}件のデータをダウンロードしました
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // エクスポートモーダル表示
    showExportModal() {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="margin-bottom: 20px; color: #1e293b;">データエクスポート</h2>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px; color: #1e293b;">エクスポート形式</h3>
                    <label style="display: block; margin-bottom: 8px;">
                        <input type="radio" name="exportFormat" value="csv" checked style="margin-right: 8px;">
                        CSV形式 (Excel対応)
                    </label>
                    <label style="display: block;">
                        <input type="radio" name="exportFormat" value="json" style="margin-right: 8px;">
                        JSON形式 (技術者向け)
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeExportModal()" style="
                        padding: 10px 20px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">キャンセル</button>
                    <button onclick="executeExport()" style="
                        padding: 10px 20px;
                        border: none;
                        background: #1e3a8a;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">エクスポート実行</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

// グローバル関数
function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.remove();
    }
}

function executeExport() {
    const format = document.querySelector('input[name="exportFormat"]:checked').value;

    if (format === 'csv') {
        dataExporter.exportToCSV();
    } else {
        dataExporter.exportToJSON();
    }

    closeExportModal();
}

// エクスポート機能初期化
let dataExporter;
document.addEventListener('DOMContentLoaded', () => {
    dataExporter = new DataExporter();
    console.log('DataExporter initialized');
});
