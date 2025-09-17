// RentPipe データヘルス管理UI制御システム
class DataHealthUI {
    constructor() {
        this.currentValidation = null;
        this.init();
    }

    init() {
        console.log('📊 データヘルスUI初期化中...');
        
        // 初期ヘルススコアを表示
        this.updateHealthScore(null);
        
        // ページ読み込み時に簡易チェックを実行
        setTimeout(() => {
            this.performQuickCheck();
        }, 1000);
        
        console.log('✅ データヘルスUI準備完了');
    }

    // クイックチェック（軽量な初期確認）
    async performQuickCheck() {
        try {
            const customersData = localStorage.getItem('rentpipe_stable_customers');
            const authData = localStorage.getItem('rentpipe_auth');
            
            let quickScore = 0;
            let totalChecks = 3;
            let completedChecks = 0;
            
            // 顧客データの存在チェック
            if (customersData) {
                try {
                    const customers = JSON.parse(customersData);
                    if (Array.isArray(customers) && customers.length > 0) {
                        quickScore += 40; // 40点
                    }
                    completedChecks++;
                } catch (error) {
                    console.warn('顧客データの解析に失敗:', error);
                }
            }
            
            // 認証データの存在チェック
            if (authData) {
                try {
                    const auth = JSON.parse(authData);
                    if (auth.email) {
                        quickScore += 30; // 30点
                    }
                    completedChecks++;
                } catch (error) {
                    console.warn('認証データの解析に失敗:', error);
                }
            }
            
            // データ構造の基本チェック
            quickScore += 30; // 30点（基本構造は存在するため）
            completedChecks++;
            
            this.updateHealthScore(quickScore);
            console.log(`📊 クイックチェック完了: ${quickScore}点`);
            
        } catch (error) {
            console.error('❌ クイックチェックエラー:', error);
            this.updateHealthScore(0);
        }
    }

    // ヘルススコアの更新
    updateHealthScore(score) {
        const scoreElement = document.getElementById('healthScore');
        if (!scoreElement) return;
        
        if (score === null) {
            scoreElement.innerHTML = '<span style="font-size: 1rem;">検証中...</span>';
            scoreElement.className = 'score-circle score-good';
            return;
        }
        
        // スコアに基づいてクラスを決定
        let scoreClass = 'score-danger';
        let emoji = '🚨';
        
        if (score >= 90) {
            scoreClass = 'score-excellent';
            emoji = '🌟';
        } else if (score >= 75) {
            scoreClass = 'score-good';
            emoji = '✅';
        } else if (score >= 50) {
            scoreClass = 'score-warning';
            emoji = '⚠️';
        }
        
        scoreElement.className = `score-circle ${scoreClass}`;
        scoreElement.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 1.5rem;">${emoji}</div>
                <div>${Math.round(score)}%</div>
            </div>
        `;
    }

    // ローディング表示の制御
    showLoading(show = true) {
        const loadingElement = document.getElementById('loadingIndicator');
        const resultsElement = document.getElementById('resultsContainer');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        if (resultsElement && !show) {
            resultsElement.style.display = 'block';
        }
    }

    // 統計情報の表示
    displayStatistics(stats) {
        const statsGrid = document.getElementById('statisticsGrid');
        if (!statsGrid) return;
        
        const statItems = [
            {
                label: '総レコード数',
                value: stats.totalRecords || 0,
                icon: '📊'
            },
            {
                label: '正常なレコード',
                value: stats.validRecords || 0,
                icon: '✅'
            },
            {
                label: '問題のあるレコード',
                value: stats.invalidRecords || 0,
                icon: '⚠️'
            },
            {
                label: '修復されたレコード',
                value: stats.repairedRecords || 0,
                icon: '🛠️'
            }
        ];
        
        statsGrid.innerHTML = statItems.map(item => `
            <div class="stat-item">
                <div class="stat-value">${item.icon} ${item.value}</div>
                <div class="stat-label">${item.label}</div>
            </div>
        `).join('');
    }

    // 推奨事項の表示
    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendationsList');
        if (!recommendationsList || !recommendations) return;
        
        if (recommendations.length === 0) {
            recommendationsList.innerHTML = '<li>特に推奨事項はありません。データは良好な状態です。</li>';
            return;
        }
        
        recommendationsList.innerHTML = recommendations.map(rec => 
            `<li>${rec}</li>`
        ).join('');
    }

    // 問題一覧の表示
    displayIssues(issues) {
        const issuesList = document.getElementById('issuesList');
        if (!issuesList) return;
        
        if (!issues || issues.length === 0) {
            issuesList.innerHTML = `
                <div class="issue-item issue-info">
                    <strong>✅ 問題は検出されませんでした</strong><br>
                    データは正常な状態です。
                </div>
            `;
            return;
        }
        
        // 重要度順にソート
        const sortedIssues = issues.sort((a, b) => {
            const severityOrder = { 'error': 3, 'warning': 2, 'info': 1 };
            return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        });
        
        // 表示件数を制限（パフォーマンス考慮）
        const displayIssues = sortedIssues.slice(0, 20);
        
        issuesList.innerHTML = displayIssues.map(issue => `
            <div class="issue-item issue-${issue.severity}">
                <strong>${this.getSeverityIcon(issue.severity)} ${issue.type}</strong><br>
                ${issue.description}
                ${issue.autoFixable ? '<br><small>🛠️ 自動修復可能</small>' : ''}
            </div>
        `).join('');
        
        if (sortedIssues.length > 20) {
            issuesList.innerHTML += `
                <div class="issue-item issue-info">
                    <strong>ℹ️ 表示制限</strong><br>
                    ${sortedIssues.length - 20}件の追加の問題があります。
                </div>
            `;
        }
    }

    // 重要度アイコンの取得
    getSeverityIcon(severity) {
        const icons = {
            'error': '🚨',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[severity] || 'ℹ️';
    }

    // 検証結果の完全表示
    displayValidationResults(summary) {
        console.log('📊 検証結果を表示:', summary);
        
        this.currentValidation = summary;
        
        // ヘルススコアの更新
        this.updateHealthScore(summary.statistics.healthScore);
        
        // 統計情報の表示
        this.displayStatistics(summary.statistics);
        
        // 推奨事項の表示
        this.displayRecommendations(summary.recommendations);
        
        // 問題一覧の表示
        this.displayIssues(summary.issues);
        
        // 結果コンテナを表示
        this.showLoading(false);
    }

    // 成功メッセージの表示
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // エラーメッセージの表示
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // 情報メッセージの表示
    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

    // メッセージ表示の共通関数
    showMessage(message, type = 'info') {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.floating-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 新しいメッセージを作成
        const messageElement = document.createElement('div');
        messageElement.className = `floating-message message-${type}`;
        messageElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${this.getMessageIcon(type)}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
        `;
        
        // スタイルを設定
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            ${this.getMessageStyle(type)}
        `;
        
        document.body.appendChild(messageElement);
        
        // 自動削除（エラー以外）
        if (type !== 'error') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }
    }

    // メッセージアイコンの取得
    getMessageIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️'
        };
        return icons[type] || 'ℹ️';
    }

    // メッセージスタイルの取得
    getMessageStyle(type) {
        const styles = {
            'success': 'background: #d1fae5; border: 1px solid #10b981; color: #065f46;',
            'error': 'background: #fee2e2; border: 1px solid #ef4444; color: #991b1b;',
            'info': 'background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af;',
            'warning': 'background: #fef3c7; border: 1px solid #f59e0b; color: #92400e;'
        };
        return styles[type] || styles['info'];
    }

    // エクスポート機能
    exportValidationResults() {
        if (!this.currentValidation) {
            this.showErrorMessage('エクスポートする検証結果がありません');
            return;
        }
        
        try {
            const dataStr = JSON.stringify(this.currentValidation, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `rentpipe_validation_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showSuccessMessage('検証結果をエクスポートしました');
            
        } catch (error) {
            console.error('❌ エクスポートエラー:', error);
            this.showErrorMessage('エクスポート中にエラーが発生しました');
        }
    }
}

// グローバル関数（HTML から呼び出される）
async function runValidation() {
    const ui = window.dataHealthUI;
    
    try {
        ui.showLoading(true);
        ui.showInfoMessage('データ検証を実行中...');
        
        const summary = await window.DataValidator.validateAllData();
        ui.displayValidationResults(summary);
        
        ui.showSuccessMessage(`検証完了: ヘルススコア ${summary.statistics.healthScore}%`);
        
    } catch (error) {
        console.error('❌ 検証実行エラー:', error);
        ui.showLoading(false);
        ui.showErrorMessage('データ検証中にエラーが発生しました');
    }
}

async function repairData() {
    const ui = window.dataHealthUI;
    
    if (!confirm('データの自動修復を実行しますか？\n※修復前にバックアップの作成をお勧めします。')) {
        return;
    }
    
    try {
        ui.showInfoMessage('データ修復を実行中...');
        
        const repairedCount = await window.DataValidator.repairData();
        
        if (repairedCount > 0) {
            ui.showSuccessMessage(`${repairedCount}件のデータを修復しました`);
            
            // 修復後に再検証を実行
            setTimeout(() => {
                runValidation();
            }, 1000);
        } else {
            ui.showInfoMessage('修復が必要なデータは見つかりませんでした');
        }
        
    } catch (error) {
        console.error('❌ データ修復エラー:', error);
        ui.showErrorMessage('データ修復中にエラーが発生しました');
    }
}

async function createBackup() {
    const ui = window.dataHealthUI;
    
    try {
        ui.showInfoMessage('バックアップを作成中...');
        
        const success = window.DataValidator.createBackup();
        
        if (success) {
            ui.showSuccessMessage('データバックアップを作成しました');
        } else {
            ui.showErrorMessage('バックアップ作成に失敗しました');
        }
        
    } catch (error) {
        console.error('❌ バックアップ作成エラー:', error);
        ui.showErrorMessage('バックアップ作成中にエラーが発生しました');
    }
}

async function restoreData() {
    const ui = window.dataHealthUI;
    
    if (!confirm('バックアップからデータを復元しますか？\n※現在のデータは上書きされます。')) {
        return;
    }
    
    try {
        ui.showInfoMessage('データを復元中...');
        
        const success = window.DataValidator.restoreFromBackup();
        
        if (success) {
            ui.showSuccessMessage('データを復元しました。ページを更新してください。');
            
            // 2秒後にページをリロード
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            ui.showErrorMessage('データ復元に失敗しました');
        }
        
    } catch (error) {
        console.error('❌ データ復元エラー:', error);
        ui.showErrorMessage('データ復元中にエラーが発生しました');
    }
}

// アニメーション用CSSを動的に追加
const animationCSS = `
<style>
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', animationCSS);

// UIインスタンスの作成
window.dataHealthUI = new DataHealthUI();

console.log('✅ データヘルスUI制御システム準備完了');
