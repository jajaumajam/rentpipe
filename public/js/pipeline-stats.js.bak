// パイプライン統計機能
console.log('📊 パイプライン統計機能初期化中...');

// 統計計算クラス
class PipelineStats {
    constructor() {
        this.customers = [];
    }
    
    // 統計情報更新
    updateStats(customers) {
        this.customers = customers || [];
        
        // 基本統計
        const totalCustomers = this.customers.length;
        const monthlyContracts = this.getMonthlyContracts();
        const conversionRate = this.getConversionRate();
        const averageDays = this.getAverageDays();
        
        // DOM更新
        this.updateStatsDOM(totalCustomers, monthlyContracts, conversionRate, averageDays);
        
        console.log(`📊 統計更新: 総数${totalCustomers}件, 今月成約${monthlyContracts}件, 成約率${conversionRate}%, 平均${averageDays}日`);
    }
    
    // 今月の成約数
    getMonthlyContracts() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return this.customers.filter(customer => {
            if (customer.pipelineStatus !== '完了' && customer.status !== '完了') return false;
            
            const updatedAt = customer.updatedAt ? new Date(customer.updatedAt) : null;
            return updatedAt && updatedAt >= thisMonth;
        }).length;
    }
    
    // 成約率計算
    getConversionRate() {
        if (this.customers.length === 0) return 0;
        
        const completed = this.customers.filter(customer => 
            customer.pipelineStatus === '完了' || customer.status === '完了'
        ).length;
        
        return Math.round((completed / this.customers.length) * 100);
    }
    
    // 平均期間計算
    getAverageDays() {
        const completedCustomers = this.customers.filter(customer => 
            customer.pipelineStatus === '完了' || customer.status === '完了'
        );
        
        if (completedCustomers.length === 0) return 0;
        
        const totalDays = completedCustomers.reduce((sum, customer) => {
            const created = customer.createdAt ? new Date(customer.createdAt) : null;
            const updated = customer.updatedAt ? new Date(customer.updatedAt) : null;
            
            if (!created || !updated) return sum;
            
            const days = Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);
        
        return Math.round(totalDays / completedCustomers.length);
    }
    
    // DOM更新
    updateStatsDOM(total, monthly, rate, days) {
        const totalElement = document.getElementById('totalCustomers');
        const monthlyElement = document.getElementById('monthlyContracts');
        const rateElement = document.getElementById('conversionRate');
        const daysElement = document.getElementById('averageDays');
        
        if (totalElement) totalElement.textContent = total;
        if (monthlyElement) monthlyElement.textContent = monthly;
        if (rateElement) rateElement.textContent = `${rate}%`;
        if (daysElement) daysElement.textContent = `${days}日`;
    }
}

// グローバル統計インスタンス
window.pipelineStats = new PipelineStats();

// 既存のパイプライン管理システムに統計機能を追加
if (window.PipelineManager) {
    const originalLoadPipeline = window.PipelineManager.prototype.loadPipeline;
    
    window.PipelineManager.prototype.loadPipeline = async function() {
        const result = await originalLoadPipeline.call(this);
        
        // 統計情報更新
        if (window.pipelineStats && this.customers) {
            window.pipelineStats.updateStats(this.customers);
        }
        
        return result;
    };
}

console.log('✅ パイプライン統計機能準備完了');
