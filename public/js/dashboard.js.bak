// RentPipe ダッシュボード機能（統一データ管理対応版・同期修正版）
class Dashboard {
    constructor() {
        this.dataManager = null;
        this.init();
    }

    async init() {
        console.log('📊 ダッシュボード初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // ダッシュボードデータを読み込み・表示
        this.loadDashboardData();
        
        // 他画面からのデータ変更イベントを監視
        window.addEventListener('dataChanged', () => {
            console.log('📡 データ変更イベント受信 - ダッシュボード更新');
            this.loadDashboardData();
        });
        
        // 定期更新を設定（5分ごと）
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
        
        console.log('✅ ダッシュボード準備完了（同期対応）');
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

    loadDashboardData() {
        if (!this.dataManager) {
            console.error('❌ 統一データ管理システムが利用できません');
            return;
        }

        try {
            // 統計データを取得
            const stats = this.dataManager.getDataStatistics();
            console.log('📊 ダッシュボードデータ読み込み:', stats);
            
            // 各統計を更新
            this.updateStatCard('total-customers', stats.totalCustomers, '総顧客数');
            this.updateStatCard('this-month-new', stats.thisMonthNew, '今月新規');
            this.updateStatCard('this-month-completed', stats.thisMonthCompleted, '今月成約');
            this.updateStatCard('conversion-rate', `${stats.conversionRate}%`, '成約率');
            
            // パイプライン統計の表示（リアルタイム同期）
            this.updatePipelineStats(stats.statusCounts);
            
            // 最近の顧客活動を表示
            this.updateRecentActivity();
            
        } catch (error) {
            console.error('❌ ダッシュボードデータ読み込みエラー:', error);
        }
    }

    updateStatCard(elementId, value, label) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            console.log(`📈 ${label}: ${value}`);
        }
    }

    updatePipelineStats(statusCounts) {
        const pipelineContainer = document.getElementById('pipeline-overview');
        if (!pipelineContainer) return;

        const statusOrder = ['初回相談', '物件紹介', '内見', '申込', '審査', '契約', '完了'];
        const statusColors = {
            '初回相談': '#ef4444',
            '物件紹介': '#f97316', 
            '内見': '#eab308',
            '申込': '#22c55e',
            '審査': '#3b82f6',
            '契約': '#8b5cf6',
            '完了': '#10b981'
        };

        const pipelineHTML = statusOrder.map(status => `
            <div class="pipeline-stat-item" style="border-left: 4px solid ${statusColors[status]}">
                <div class="stat-value">${statusCounts[status] || 0}</div>
                <div class="stat-label">${status}</div>
            </div>
        `).join('');

        pipelineContainer.innerHTML = `
            <div class="pipeline-stats-grid">
                ${pipelineHTML}
            </div>
        `;
        
        console.log('📊 パイプライン統計更新完了:', statusCounts);
    }

    updateRecentActivity() {
        const customers = this.dataManager.getCustomers();
        const history = this.dataManager.getHistory();
        
        // 最新の履歴エントリを取得（最大5件）
        const recentHistory = history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        if (recentHistory.length === 0) {
            activityContainer.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">📝</div>
                    <div class="activity-content">
                        <div class="activity-title">最近の活動はありません</div>
                        <div class="activity-time">顧客データの操作が行われると、ここに表示されます</div>
                    </div>
                </div>
            `;
            return;
        }

        const activityHTML = recentHistory.map(entry => {
            const customer = customers.find(c => c.id === entry.customerId);
            const customerName = customer ? customer.name : '不明な顧客';
            const timeAgo = this.getTimeAgo(entry.timestamp);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${this.getStatusIcon(entry.toStatus)}</div>
                    <div class="activity-content">
                        <div class="activity-title">
                            ${customerName} が ${entry.fromStatus || '新規'} → ${entry.toStatus} に移動
                        </div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        activityContainer.innerHTML = activityHTML;
        console.log('📝 最近の活動更新完了');
    }

    getStatusIcon(status) {
        const icons = {
            '初回相談': '💬',
            '物件紹介': '🏠',
            '内見': '👁️',
            '申込': '📝',
            '審査': '🔍',
            '契約': '📋',
            '完了': '✅',
            '削除': '🗑️'
        };
        return icons[status] || '📌';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'たった今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 30) return `${diffDays}日前`;
        return time.toLocaleDateString();
    }

    // 手動リフレッシュ機能
    refresh() {
        console.log('🔄 ダッシュボード手動更新');
        this.loadDashboardData();
    }
}

// グローバル関数
function refreshDashboard() {
    if (window.dashboard) {
        window.dashboard.refresh();
    }
}

// ダッシュボードインスタンスを作成
let dashboard = null;

// DOMが読み込まれてから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new Dashboard();
        window.dashboard = dashboard;
    });
} else {
    dashboard = new Dashboard();
    window.dashboard = dashboard;
}

console.log('✅ 統一対応ダッシュボードスクリプト準備完了（同期修正版）');
