// RentPipe プラン管理システム
console.log('プラン管理システム初期化中...');

window.PlanManager = {
    
    // 現在のユーザープラン（デフォルトはfree）
    currentPlan: 'free',
    currentCustomerCount: 0,
    
    // プラン情報を取得
    getCurrentPlan: function() {
        try {
            const stored = localStorage.getItem('rentpipe_current_plan');
            this.currentPlan = stored || 'free';
            return this.currentPlan;
        } catch (error) {
            console.error('プラン情報取得エラー:', error);
            return 'free';
        }
    },
    
    // プラン設定
    setCurrentPlan: function(planId) {
        try {
            localStorage.setItem('rentpipe_current_plan', planId);
            this.currentPlan = planId;
            console.log(`プラン更新: ${planId}`);
            
            // プラン変更イベントを発火
            window.dispatchEvent(new CustomEvent('planChanged', {
                detail: { newPlan: planId }
            }));
            
            return true;
        } catch (error) {
            console.error('プラン設定エラー:', error);
            return false;
        }
    },
    
    // 現在の顧客数を更新
    updateCustomerCount: function() {
        try {
            const customers = JSON.parse(localStorage.getItem('rentpipe_demo_customers') || '[]');
            this.currentCustomerCount = customers.length;
            return this.currentCustomerCount;
        } catch (error) {
            console.error('顧客数取得エラー:', error);
            return 0;
        }
    },
    
    // プラン制限チェック
    checkLimits: function(planId = null) {
        const plan = window.RentPipePlans.getPlan(planId || this.currentPlan);
        this.updateCustomerCount();
        
        return {
            customerLimit: plan.customerLimit,
            currentCount: this.currentCustomerCount,
            remaining: Math.max(0, plan.customerLimit - this.currentCustomerCount),
            isOverLimit: this.currentCustomerCount >= plan.customerLimit,
            usagePercentage: Math.min(100, (this.currentCustomerCount / plan.customerLimit) * 100),
            warningLevel: this.getWarningLevel(this.currentCustomerCount, plan.customerLimit)
        };
    },
    
    // 警告レベル取得
    getWarningLevel: function(current, limit) {
        const percentage = (current / limit) * 100;
        if (percentage >= 100) return 'over';
        if (percentage >= 90) return 'critical';
        if (percentage >= 75) return 'warning';
        return 'normal';
    },
    
    // 機能アクセス権限チェック
    hasFeature: function(featureName, planId = null) {
        const plan = window.RentPipePlans.getPlan(planId || this.currentPlan);
        return !!plan.features[featureName];
    },
    
    // アップグレード案内表示
    showUpgradePrompt: function(requiredFeature = null, context = 'limit') {
        const currentPlan = window.RentPipePlans.getPlan(this.currentPlan);
        let message = '';
        
        if (context === 'limit') {
            message = `顧客数の上限（${currentPlan.customerLimit}人）に達しました。\n\nより多くの顧客を管理するには、上位プランへのアップグレードが必要です。`;
        } else if (requiredFeature) {
            const featureName = window.RentPipePlans.featureDescriptions[requiredFeature] || requiredFeature;
            message = `${featureName}機能は ${this.getRequiredPlanForFeature(requiredFeature)} プラン以上でご利用いただけます。`;
        }
        
        const upgrade = confirm(message + '\n\n料金プランページを開きますか？');
        if (upgrade) {
            window.location.href = 'pricing.html';
        }
    },
    
    // 機能に必要なプラン取得
    getRequiredPlanForFeature: function(featureName) {
        const planOrder = ['standard', 'pro', 'premium'];
        for (const planId of planOrder) {
            const plan = window.RentPipePlans.getPlan(planId);
            if (plan.features[featureName]) {
                return plan.name;
            }
        }
        return 'プロ';
    },
    
    // 使用状況取得
    getUsageStats: function() {
        const limits = this.checkLimits();
        const plan = window.RentPipePlans.getPlan(this.currentPlan);
        
        return {
            plan: {
                id: this.currentPlan,
                name: plan.name,
                price: plan.price
            },
            customers: {
                current: limits.currentCount,
                limit: limits.customerLimit,
                remaining: limits.remaining,
                percentage: limits.usagePercentage,
                warningLevel: limits.warningLevel
            },
            features: plan.features
        };
    }
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    window.PlanManager.getCurrentPlan();
    window.PlanManager.updateCustomerCount();
    console.log('プラン管理システム準備完了');
});

console.log('プラン管理システム読み込み完了');
