// RentPipe マルチテナント管理システム
console.log('🏢 マルチテナント管理システム初期化中...');

window.TenantManager = {
    // 現在のテナント情報
    currentTenant: null,
    
    // テナント情報の初期化
    initialize: function() {
        // ローカルストレージから現在のテナントIDを取得
        const savedTenantId = localStorage.getItem('rentpipe_current_tenant');
        
        if (savedTenantId) {
            this.loadTenant(savedTenantId);
        } else {
            // デモ用のデフォルトテナントを作成
            this.createDemoTenant();
        }
        
        return this.currentTenant;
    },
    
    // デモテナントの作成
    createDemoTenant: function() {
        const demoTenant = {
            id: 'demo_tenant_001',
            name: 'デモエージェント',
            email: 'demo@rentpipe.jp',
            plan: 'free',
            createdAt: new Date().toISOString(),
            settings: {
                companyName: 'デモ不動産',
                agentName: 'デモ太郎',
                phone: '03-0000-0000',
                address: '東京都渋谷区',
                maxCustomers: 10, // フリープランの制限
                features: {
                    export: false,
                    analytics: false,
                    teamMembers: 1
                }
            }
        };
        
        this.currentTenant = demoTenant;
        this.saveTenant(demoTenant);
        
        console.log('✅ デモテナント作成完了:', demoTenant.name);
        return demoTenant;
    },
    
    // テナントの作成（Phase2で使用）
    createTenant: function(tenantData) {
        const tenant = {
            id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: tenantData.name,
            email: tenantData.email,
            plan: tenantData.plan || 'free',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: {
                companyName: tenantData.companyName || '',
                agentName: tenantData.agentName || tenantData.name,
                phone: tenantData.phone || '',
                address: tenantData.address || '',
                maxCustomers: this.getPlanLimit(tenantData.plan || 'free'),
                features: this.getPlanFeatures(tenantData.plan || 'free')
            },
            subscription: {
                status: 'active',
                startDate: new Date().toISOString(),
                nextBillingDate: this.getNextBillingDate(),
                amount: this.getPlanPrice(tenantData.plan || 'free')
            }
        };
        
        this.saveTenant(tenant);
        this.currentTenant = tenant;
        
        console.log('✅ 新規テナント作成:', tenant.name);
        return tenant;
    },
    
    // テナントの読み込み
    loadTenant: function(tenantId) {
        const tenantKey = `rentpipe_tenant_${tenantId}`;
        const stored = localStorage.getItem(tenantKey);
        
        if (stored) {
            this.currentTenant = JSON.parse(stored);
            localStorage.setItem('rentpipe_current_tenant', tenantId);
            console.log('✅ テナント読み込み完了:', this.currentTenant.name);
            return this.currentTenant;
        }
        
        console.warn('⚠️ テナントが見つかりません:', tenantId);
        return null;
    },
    
    // テナントの保存
    saveTenant: function(tenant) {
        const tenantKey = `rentpipe_tenant_${tenant.id}`;
        localStorage.setItem(tenantKey, JSON.stringify(tenant));
        localStorage.setItem('rentpipe_current_tenant', tenant.id);
    },
    
    // テナント切り替え
    switchTenant: function(tenantId) {
        const previousTenant = this.currentTenant;
        
        if (this.loadTenant(tenantId)) {
            console.log(`🔄 テナント切り替え: ${previousTenant?.name} → ${this.currentTenant.name}`);
            
            // ページをリロードして新しいテナントのデータを読み込む
            window.location.reload();
            return true;
        }
        
        return false;
    },
    
    // プランごとの制限を取得
    getPlanLimit: function(plan) {
        const limits = {
            'free': 10,
            'standard': 50,
            'pro': 200,
            'enterprise': -1 // 無制限
        };
        return limits[plan] || 10;
    },
    
    // プランごとの機能を取得
    getPlanFeatures: function(plan) {
        const features = {
            'free': {
                export: false,
                analytics: false,
                teamMembers: 1,
                customForms: false,
                apiAccess: false
            },
            'standard': {
                export: true,
                analytics: false,
                teamMembers: 1,
                customForms: true,
                apiAccess: false
            },
            'pro': {
                export: true,
                analytics: true,
                teamMembers: 3,
                customForms: true,
                apiAccess: false
            },
            'enterprise': {
                export: true,
                analytics: true,
                teamMembers: -1, // 無制限
                customForms: true,
                apiAccess: true
            }
        };
        return features[plan] || features['free'];
    },
    
    // プラン価格を取得
    getPlanPrice: function(plan) {
        const prices = {
            'free': 0,
            'standard': 2980,
            'pro': 4980,
            'enterprise': 9980
        };
        return prices[plan] || 0;
    },
    
    // 次回請求日を計算
    getNextBillingDate: function() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toISOString();
    },
    
    // 顧客数制限チェック
    canAddCustomer: function() {
        if (!this.currentTenant) return false;
        
        const maxCustomers = this.currentTenant.settings.maxCustomers;
        if (maxCustomers === -1) return true; // 無制限
        
        const currentCount = this.getCustomerCount();
        return currentCount < maxCustomers;
    },
    
    // 現在の顧客数を取得
    getCustomerCount: function() {
        if (!this.currentTenant) return 0;
        
        const customers = this.getTenantData('customers') || [];
        return customers.length;
    },
    
    // テナント固有のデータキーを生成
    getTenantKey: function(dataType) {
        if (!this.currentTenant) return null;
        return `rentpipe_${this.currentTenant.id}_${dataType}`;
    },
    
    // テナントデータの取得
    getTenantData: function(dataType) {
        const key = this.getTenantKey(dataType);
        if (!key) return null;
        
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error(`データ読み込みエラー (${dataType}):`, error);
            return null;
        }
    },
    
    // テナントデータの保存
    setTenantData: function(dataType, data) {
        const key = this.getTenantKey(dataType);
        if (!key) return false;
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ ${dataType}データ保存完了`);
            return true;
        } catch (error) {
            console.error(`データ保存エラー (${dataType}):`, error);
            if (window.ErrorHandler) {
                ErrorHandler.handleSaveError(error, dataType);
            }
            return false;
        }
    },
    
    // プランアップグレード
    upgradePlan: function(newPlan) {
        if (!this.currentTenant) return false;
        
        const oldPlan = this.currentTenant.plan;
        this.currentTenant.plan = newPlan;
        this.currentTenant.settings.maxCustomers = this.getPlanLimit(newPlan);
        this.currentTenant.settings.features = this.getPlanFeatures(newPlan);
        this.currentTenant.subscription.amount = this.getPlanPrice(newPlan);
        this.currentTenant.updatedAt = new Date().toISOString();
        
        this.saveTenant(this.currentTenant);
        
        console.log(`🎉 プランアップグレード: ${oldPlan} → ${newPlan}`);
        
        if (window.ErrorHandler) {
            ErrorHandler.showSuccess(`プランを${newPlan}にアップグレードしました`);
        }
        
        return true;
    },
    
    // 使用状況の取得
    getUsageStats: function() {
        if (!this.currentTenant) return null;
        
        const customers = this.getTenantData('customers') || [];
        const maxCustomers = this.currentTenant.settings.maxCustomers;
        
        return {
            tenantId: this.currentTenant.id,
            tenantName: this.currentTenant.name,
            plan: this.currentTenant.plan,
            customersUsed: customers.length,
            customersLimit: maxCustomers,
            usagePercentage: maxCustomers === -1 ? 0 : 
                Math.round((customers.length / maxCustomers) * 100),
            features: this.currentTenant.settings.features,
            subscription: this.currentTenant.subscription
        };
    },
    
    // デモデータのリセット（テナント単位）
    resetTenantData: function() {
        if (!this.currentTenant) return;
        
        const types = ['customers', 'history', 'pipeline', 'settings'];
        types.forEach(type => {
            const key = this.getTenantKey(type);
            if (key) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('🔄 テナントデータをリセットしました:', this.currentTenant.name);
        
        if (window.ErrorHandler) {
            ErrorHandler.showSuccess('データをリセットしました');
        }
    },
    
    // 全テナントの一覧取得（管理用）
    getAllTenants: function() {
        const tenants = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('rentpipe_tenant_')) {
                try {
                    const tenant = JSON.parse(localStorage.getItem(key));
                    tenants.push(tenant);
                } catch (error) {
                    console.error('テナント読み込みエラー:', key, error);
                }
            }
        }
        
        return tenants;
    }
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    window.TenantManager.initialize();
    
    // 使用状況を表示
    const stats = window.TenantManager.getUsageStats();
    if (stats) {
        console.log('📊 テナント使用状況:', stats);
    }
});

console.log('✅ マルチテナント管理システム準備完了');
