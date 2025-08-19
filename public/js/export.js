// データエクスポート機能 - 完全修正版
class DataExporter {
    constructor() {
        this.customers = [];
        // 初期化を非同期で実行（エラーを防ぐため）
        setTimeout(() => {
            this.init().catch(error => {
                console.warn('DataExporter初期化警告:', error.message);
            });
        }, 100);
    }

    async init() {
        try {
            await this.loadCustomers();
            console.log('DataExporter初期化完了。顧客数:', this.customers.length);
        } catch (error) {
            console.warn('DataExporter初期化エラー:', error.message);
            // デモデータで初期化
            this.customers = this.getDemoCustomers();
            console.log('デモデータで初期化完了。顧客数:', this.customers.length);
        }
    }

    async loadCustomers() {
        try {
            // Firebase接続の安全な確認
            const firebaseAvailable = window.db && 
                                    typeof window.db === 'object' && 
                                    typeof window.db.collection === 'function';
            
            if (firebaseAvailable) {
                console.log('Firebase接続を試行中...');
                const snapshot = await window.db.collection('customers')
                    .orderBy('updatedAt', 'desc')
                    .get();
                
                this.customers = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('✅ Firebaseから顧客データを読み込みました:', this.customers.length, '件');
                return;
            } else {
                throw new Error('Firebase未利用環境です');
            }
        } catch (error) {
            console.warn('⚠️ Firebase接続エラー:', error.message);
            
            // デモデータ + ローカルストレージデータを結合
            const demoCustomers = this.getDemoCustomers();
            const localCustomers = this.getLocalStorageCustomers();
            this.customers = [...demoCustomers, ...localCustomers];
            
            console.log('✅ ローカルデータを使用:', {
                デモ顧客: demoCustomers.length,
                登録顧客: localCustomers.length,
                合計: this.customers.length
            });
        }
    }

    getLocalStorageCustomers() {
        try {
            const stored = localStorage.getItem('demoCustomers');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('ローカルストレージ読み込みエラー:', error);
            return [];
        }
    }

    getDemoCustomers() {
        const statuses = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const customers = [];
        
        for (let i = 1; i <= 12; i++) {
            customers.push({
                id: `demo-${i}`,
                name: `サンプル${i}`,
                email: `sample${i}@example.com`,
                phone: `090-0000-${String(i).padStart(4, '0')}`,
                age: 25 + (i % 15),
                occupation: ['会社員', '公務員', '自営業', 'フリーランス'][i % 4],
                annualIncome: 300 + (i * 20),
                pipelineStatus: statuses[i % statuses.length],
                preferences: {
                    budgetMin: 50000 + (i * 3000),
                    budgetMax: 80000 + (i * 3000),
                    areas: ['渋谷区', '新宿区', '港区', '中央区'][i % 4],
                    roomType: ['1K', '1DK', '1LDK', '2K'][i % 4],
                    requirements: ['駅徒歩10分以内', 'バストイレ別', 'エアコン付'][i % 3] ? [['駅徒歩10分以内', 'バストイレ別', 'エアコン付'][i % 3]] : []
                },
                notes: i % 3 === 0 ? '急ぎの案件です' : i % 2 === 0 ? '条件要相談' : '',
                createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                updatedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)),
                source: 'demo'
            });
        }
        
        return customers;
    }

    // CSV エクスポート
    exportToCSV(filteredCustomers = null) {
        try {
            const customers = filteredCustomers || this.customers;
            
            if (!customers || customers.length === 0) {
                alert('エクスポートするデータがありません。');
                return;
            }

            console.log('CSV エクスポート開始:', customers.length, '件');

            // CSV ヘッダー
            const headers = [
                'ID', '名前', 'メールアドレス', '電話番号', '年齢', '職業', '年収（万円）',
                'ステータス', '最低予算', '最高予算', '希望エリア', '間取り',
                'こだわり条件', '備考', '登録日', '更新日', '登録元'
            ];

            // CSV データ変換
            const csvData = customers.map(customer => [
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
            
            // エクスポート完了通知
            this.showExportNotification('CSV', customers.length);
            
        } catch (error) {
            console.error('CSV エクスポートエラー:', error);
            alert('CSV エクスポートに失敗しました: ' + error.message);
        }
    }

    // JSON エクスポート
    exportToJSON(filteredCustomers = null) {
        try {
            const customers = filteredCustomers || this.customers;
            
            if (!customers || customers.length === 0) {
                alert('エクスポートするデータがありません。');
                return;
            }

            console.log('JSON エクスポート開始:', customers.length, '件');

            // JSON データ準備
            const jsonData = {
                exportInfo: {
                    date: new Date().toISOString(),
                    totalCount: customers.length,
                    source: 'RentPipe顧客管理システム',
                    version: '1.0'
                },
                customers: customers.map(customer => ({
                    ...customer,
                    createdAt: customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt,
                    updatedAt: customer.updatedAt instanceof Date ? customer.updatedAt.toISOString() : customer.updatedAt
                }))
            };

            // JSON 文字列生成
            const jsonContent = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            
            this.downloadFile(blob, `RentPipe顧客データ_${this.formatDateForFilename(new Date())}.json`);
            
            // エクスポート完了通知
            this.showExportNotification('JSON', customers.length);
            
        } catch (error) {
            console.error('JSON エクスポートエラー:', error);
            alert('JSON エクスポートに失敗しました: ' + error.message);
        }
    }

    // ファイルダウンロード
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
            
            console.log('✅ ファイルダウンロード完了:', filename);
        } catch (error) {
            console.error('ファイルダウンロードエラー:', error);
            alert('ファイルのダウンロードに失敗しました。');
        }
    }

    // 日付フォーマット
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
            console.warn('日付フォーマットエラー:', error);
            return '';
        }
    }

    formatDateForFilename(date) {
        try {
            return date.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        } catch (error) {
            return 'unknown_date';
        }
    }

    // エクスポート完了通知
    showExportNotification(format, count) {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                max-width: 300px;
                animation: slideInFromRight 0.3s ease-out;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">✅</span>
                    <div>
                        <div style="font-weight: bold;">エクスポート完了</div>
                        <div style="font-size: 12px; opacity: 0.9;">${format}形式 • ${count}件のデータ</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // 4秒後に自動削除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutToRight 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
            
        } catch (error) {
            console.warn('通知表示エラー:', error);
        }
    }

    // エクスポートモーダル表示
    showExportModal() {
        try {
            // 既存のモーダルがあれば削除
            const existingModal = document.getElementById('exportModal');
            if (existingModal) {
                existingModal.remove();
            }
            
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
                z-index: 20000;
                backdrop-filter: blur(4px);
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
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    font-family: system-ui, -apple-system, sans-serif;
                ">
                    <h2 style="margin-bottom: 20px; color: #1e293b; font-size: 24px;">📊 データエクスポート</h2>
                    
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">
                            現在 <strong style="color: #1e3a8a;">${this.customers.length}件</strong> の顧客データがエクスポート可能です
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h3 style="margin-bottom: 12px; color: #1e293b; font-size: 16px;">エクスポート形式</h3>
                        <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                            <input type="radio" name="exportFormat" value="csv" checked style="margin-right: 10px;">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">CSV形式</div>
                                <div style="font-size: 12px; color: #64748b;">Excel・スプレッドシートで開けます</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                            <input type="radio" name="exportFormat" value="json" style="margin-right: 10px;">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">JSON形式</div>
                                <div style="font-size: 12px; color: #64748b;">プログラムでの処理に適しています</div>
                            </div>
                        </label>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button onclick="closeExportModal()" style="
                            padding: 12px 20px;
                            border: 2px solid #e2e8f0;
                            background: white;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">キャンセル</button>
                        <button onclick="executeExport()" style="
                            padding: 12px 24px;
                            border: none;
                            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">📥 エクスポート実行</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            
            // モーダル外クリックで閉じる
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeExportModal();
                }
            });
            
        } catch (error) {
            console.error('エクスポートモーダル表示エラー:', error);
            alert('エクスポート画面の表示に失敗しました。');
        }
    }
}

// グローバル関数定義
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

        console.log('エクスポート実行:', format);

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

// アニメーション用CSS追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutToRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// エクスポート機能初期化（安全な初期化）
let dataExporter;
document.addEventListener('DOMContentLoaded', () => {
    try {
        dataExporter = new DataExporter();
        window.dataExporter = dataExporter;
        console.log('✅ DataExporter初期化成功');
    } catch (error) {
        console.error('❌ DataExporter初期化失敗:', error);
        // フォールバック用の最小限のオブジェクト
        window.dataExporter = {
            showExportModal: () => alert('エクスポート機能が利用できません。'),
            exportToCSV: () => alert('CSV エクスポートが利用できません。'),
            exportToJSON: () => alert('JSON エクスポートが利用できません。')
        };
    }
});
