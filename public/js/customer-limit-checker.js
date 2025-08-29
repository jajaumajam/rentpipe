// 顧客登録制限チェッカー
console.log('顧客制限チェッカー初期化中...');

window.CustomerLimitChecker = {
    
    // 新規顧客登録前チェック
    checkBeforeAdd: function() {
        if (!window.PlanManager) {
            console.error('PlanManagerが見つかりません');
            return true; // エラー時は登録を許可
        }
        
        const limits = window.PlanManager.checkLimits();
        
        if (limits.isOverLimit) {
            console.log('顧客数上限に達しているため登録を拒否');
            window.PlanManager.showUpgradePrompt(null, 'limit');
            return false;
        }
        
        // 90%以上の場合は警告
        if (limits.warningLevel === 'critical') {
            const warning = confirm(
                `顧客数が上限の90%に達しています。\n` +
                `現在: ${limits.currentCount}/${limits.customerLimit}人\n\n` +
                `このまま登録を続けますか？`
            );
            return warning;
        }
        
        return true;
    },
    
    // 制限状況の表示更新
    updateLimitDisplay: function() {
        const statusElement = document.getElementById('customerLimitStatus');
        if (!statusElement || !window.PlanManager) return;
        
        const limits = window.PlanManager.checkLimits();
        const plan = window.RentPipePlans.getPlan(window.PlanManager.currentPlan);
        
        let statusClass = 'limit-normal';
        let statusText = `${limits.currentCount}/${limits.customerLimit}人`;
        
        switch (limits.warningLevel) {
            case 'over':
                statusClass = 'limit-over';
                statusText += ' (上限超過)';
                break;
            case 'critical':
                statusClass = 'limit-critical';
                statusText += ' (上限間近)';
                break;
            case 'warning':
                statusClass = 'limit-warning';
                break;
        }
        
        statusElement.className = `customer-limit-status ${statusClass}`;
        statusElement.innerHTML = `
            <span class="limit-text">${plan.name}プラン: ${statusText}</span>
            <div class="limit-bar">
                <div class="limit-progress" style="width: ${limits.usagePercentage}%"></div>
            </div>
        `;
    }
};

// 顧客一覧ページでの制限表示
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('customer.html')) {
        // 制限状況表示要素を追加
        const header = document.querySelector('.customer-header');
        if (header) {
            const limitStatus = document.createElement('div');
            limitStatus.id = 'customerLimitStatus';
            limitStatus.className = 'customer-limit-status';
            header.appendChild(limitStatus);
            
            // 初期表示
            setTimeout(() => {
                window.CustomerLimitChecker.updateLimitDisplay();
            }, 1000);
        }
    }
});

console.log('顧客制限チェッカー準備完了');
