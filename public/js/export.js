// データエクスポート機能 - ローカルデータ専用版
class DataExporter {
    constructor() {
        this.customers = [];
        this.isReady = false;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 DataExporter初期化開始...');
            await this.loadCustomers();
            this.isReady = true;
            console.log('✅ DataExporter初期化完了。顧客数:', this.customers.length);
        } catch (error) {
            console.warn('⚠️ DataExporter初期化警告:', error.message);
            this.customers = this.getDemoCustomers();
            this.isReady = true;
            console.log('✅ デモデータで初期化完了。顧客数:', this.customers.length);
        }
    }

    async loadCustomers() {
        // ローカルストレージからデータを読み込み
        const localCustomers = window.DemoDataManager ? 
            window.DemoDataManager.getCustomers() : 
            this.getLocalStorageCustomers();
        
        const demoCustomers = this.getDemoCustomers();
        
        // ローカルデータとデモデータを結合
        this.customers = [...localCustomers, ...demoCustomers];
        
        console.log('📊 データ読み込み完了:', {
            ローカル顧客: localCustomers.length,
            デモ顧客: demoCustomers.length,
            合計: this.customers.length
        });
    }

    getLocalStorageCustomers() {
        try {
            const stored = localStorage.getItem('demoCustomers') || 
                          localStorage.getItem('rentpipe_demo_customers');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('ローカルストレージ読み込みエラー:', error);
            return [];
        }
    }

    getDemoCustomers() {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const areas = ['渋谷区', '新宿区', '港区', '中央区', '世田谷区', '品川区'];
        const roomTypes = ['ワンルーム', '1K', '1DK', '1LDK', '2K', '2DK'];
        const occupations = ['会社員', '公務員', '自営業', 'フリーランス', '学生'];
        
        const customers = [];
        
        for (let i = 1; i <= 10; i++) {
            customers.push({
                id: `demo-${i}`,
                name: `サンプル顧客${i}`,
                email: `sample${i}@example.com`,
                phone: `090-0000-${String(1000 + i).slice(-4)}`,
                age: 22 + (i % 20),
                occupation: occupations[i % occupations.length],
                annualIncome: 250 + (i * 25),
                pipelineStatus: statuses[i % statuses.length],
                preferences: {
                    budgetMin: 40000 + (i * 5000),
                    budgetMax: 70000 + (i * 5000),
                    areas: [areas[i % areas.length]],
                    roomType: roomTypes[i % roomTypes.length],
                    requirements: i % 2 === 0 ? ['駅徒歩10分以内', 'バストイレ別'] : ['エアコン付']
                },
                notes: i % 3 === 0 ? '急ぎでお願いします' : i % 2 === 0 ? '条件相談可能' : '',
                urgency: i % 4 === 0 ? '急ぎ' : '普通',
                contactTime: 'いつでも',
                createdAt: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)),
                updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                source: 'demo'
            });
        }
        
        return customers;
    }

    // CSV エクスポート
    exportToCSV() {
        try {
            if (!this.isReady) {
                alert('データ読み込み中です。少々お待ちください。');
                return;
            }

            if (this.customers.length === 0) {
                alert('エクスポートするデータがありません。');
                return;
            }

            console.log('📥 CSV エクスポート開始:', this.customers.length, '件');

            // CSV ヘッダー
            const headers = [
                'ID', '名前', 'メールアドレス', '電話番号', '年齢', '職業', '年収（万円）',
                'ステータス', '最低予算', '最高予算', '希望エリア', '間取り',
                'こだわり条件', '備考', '緊急度', '連絡希望時間',
                '登録日', '更新日', '登録元'
            ];

            // CSV データ変換
            const csvData = this.customers.map(customer => [
                customer.id || '',
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                customer.age || '',
                customer.occupation || '',
                customer.annualIncome || '',
                customer.pipelineStatus || '',
                customer.preferences?.budgetMin || '',
                customer.preferences?.budgetMax || '',
                (customer.preferences?.areas || []).join('・'),
                customer.preferences?.roomType || '',
                (customer.preferences?.requirements || []).join('・'),
                customer.notes || '',
                customer.urgency || '',
                customer.contactTime || '',
                this.formatDate(customer.createdAt),
                this.formatDate(customer.updatedAt),
                customer.source || 'unknown'
            ]);

            // CSV 文字列生成
            const csvContent = [headers, ...csvData]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            // BOM付きUTF-8でダウンロード
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            this.downloadFile(blob, `RentPipe顧客データ_${this.formatDateForFilename(new Date())}.csv`);
            this.showExportNotification('CSV', this.customers.length);
            
        } catch (error) {
            console.error('CSV エクスポートエラー:', error);
            alert('CSV エクスポートに失敗しました: ' + error.message);
        }
    }

    // JSON エクスポート
    exportToJSON() {
        try {
            if (!this.isReady) {
                alert('データ読み込み中です。少々お待ちください。');
                return;
            }

            if (this.customers.length === 0) {
                alert('エクスポートするデータがありません。');
                return;
            }

            console.log('📥 JSON エクスポート開始:', this.customers.length, '件');

            // JSON データ準備
            const jsonData = {
                exportInfo: {
                    date: new Date().toISOString(),
                    totalCount: this.customers.length,
                    source: 'RentPipe デモ環境',
                    version: '1.0'
                },
                customers: this.customers.map(customer => ({
                    ...customer,
                    createdAt: customer.createdAt instanceof Date ? 
                        customer.createdAt.toISOString() : customer.createdAt,
                    updatedAt: customer.updatedAt instanceof Date ? 
                        customer.updatedAt.toISOString() : customer.updatedAt
                }))
            };

            // JSON 文字列生成
            const jsonContent = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            
            this.downloadFile(blob, `RentPipe顧客データ_${this.formatDateForFilename(new Date())}.json`);
            this.showExportNotification('JSON', this.customers.length);
            
        } catch (error) {
            console.error('JSON エクスポートエラー:', error);
            alert('JSON エクスポートに失敗しました: ' + error.message);
        }
    }

    downloadFile(blob, filename) {
        try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ ダウンロード完了:', filename);
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            alert('ファイルのダウンロードに失敗しました。');
        }
    }

    formatDate(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            return d.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    }

    formatDateForFilename(date) {
        return date.toISOString().slice(0, 10).replace(/-/g, '') + '_' + 
               date.toTimeString().slice(0, 8).replace(/:/g, '');
    }

    showExportNotification(format, count) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3);
            z-index: 10000;
            font-family: system-ui, sans-serif;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">📥</div>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">エクスポート完了</div>
                    <div style="font-size: 14px; opacity: 0.9;">${format}形式 • ${count}件のデータ</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // アニメーション
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自動削除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showExportModal() {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            backdrop-filter: blur(8px);
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                font-family: system-ui, sans-serif;
            ">
                <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 24px; text-align: center;">
                    📊 データエクスポート
                </h2>
                
                <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #64748b;">
                        現在 <strong style="color: #1e3a8a; font-size: 20px;">${this.customers.length}件</strong> の顧客データ
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">
                        エクスポート可能です
                    </p>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px;">エクスポート形式を選択</h3>
                    
                    <label style="display: block; margin-bottom: 12px; cursor: pointer; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; transition: all 0.2s;">
                        <input type="radio" name="exportFormat" value="csv" checked style="margin-right: 12px;">
                        <div style="display: inline-block;">
                            <div style="font-weight: 600; color: #1e293b;">📊 CSV形式</div>
                            <div style="font-size: 14px; color: #64748b;">Excel・Googleスプレッドシートで開けます</div>
                        </div>
                    </label>
                    
                    <label style="display: block; cursor: pointer; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; transition: all 0.2s;">
                        <input type="radio" name="exportFormat" value="json" style="margin-right: 12px;">
                        <div style="display: inline-block;">
                            <div style="font-weight: 600; color: #1e293b;">💻 JSON形式</div>
                            <div style="font-size: 14px; color: #64748b;">プログラムでの処理・分析に最適</div>
                        </div>
                    </label>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button onclick="closeExportModal()" style="
                        flex: 1;
                        padding: 14px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        transition: all 0.2s;
                    ">キャンセル</button>
                    
                    <button onclick="executeExport()" style="
                        flex: 2;
                        padding: 14px;
                        border: none;
                        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: all 0.2s;
                    ">📥 エクスポート実行</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // ラジオボタンのホバー効果
        modal.querySelectorAll('label').forEach(label => {
            label.addEventListener('mouseenter', () => {
                label.style.borderColor = '#3b82f6';
                label.style.backgroundColor = '#f8fafc';
            });
            label.addEventListener('mouseleave', () => {
                label.style.borderColor = '#e2e8f0';
                label.style.backgroundColor = 'transparent';
            });
        });
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeExportModal();
            }
        });
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
    try {
        const formatRadio = document.querySelector('input[name="exportFormat"]:checked');
        const format = formatRadio ? formatRadio.value : 'csv';

        if (format === 'csv') {
            window.dataExporter.exportToCSV();
        } else {
            window.dataExporter.exportToJSON();
        }

        closeExportModal();
    } catch (error) {
        console.error('エクスポート実行エラー:', error);
        alert('エクスポートの実行に失敗しました。');
    }
}

// 初期化
let dataExporter;
document.addEventListener('DOMContentLoaded', () => {
    dataExporter = new DataExporter();
    window.dataExporter = dataExporter;
    console.log('✅ DataExporter (ローカル版) 初期化完了');
});
