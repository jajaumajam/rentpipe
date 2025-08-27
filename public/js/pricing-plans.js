// RentPipe 料金プラン設定
console.log('💰 RentPipe料金プラン設定読み込み中...');

window.RentPipePlans = {
    plans: {
        free: {
            id: 'free',
            name: 'フリー',
            price: 0,
            customerLimit: 5,
            features: {
                customers: true,
                pipeline: true,
                basicReports: true,
                mobileAccess: true,
                advancedAnalytics: false,
                dataExport: false,
                autoFollowUp: false,
                salesPrediction: false
            },
            description: '個人エージェント体験版',
            buttonText: '無料で始める',
            popular: false
        },
        
        standard: {
            id: 'standard',
            name: 'スタンダード',
            price: 490,
            customerLimit: 30,
            features: {
                customers: true,
                pipeline: true,
                basicReports: true,
                mobileAccess: true,
                emailSupport: true,
                advancedAnalytics: false,
                dataExport: false,
                autoFollowUp: false,
                salesPrediction: false
            },
            description: '個人エージェント標準プラン',
            buttonText: '無料トライアル開始',
            popular: true
        },
        
        pro: {
            id: 'pro',
            name: 'プロ',
            price: 2980,
            customerLimit: 100,
            features: {
                customers: true,
                pipeline: true,
                basicReports: true,
                mobileAccess: true,
                emailSupport: true,
                advancedAnalytics: true,
                dataExport: true,
                autoFollowUp: true,
                salesPrediction: true,
                prioritySupport: true
            },
            description: '本格的な営業活動をサポート',
            buttonText: '無料トライアル開始',
            popular: false
        },
        
        premium: {
            id: 'premium',
            name: 'プレミアム',
            price: 4980,
            customerLimit: 300,
            features: {
                customers: true,
                pipeline: true,
                basicReports: true,
                mobileAccess: true,
                emailSupport: true,
                advancedAnalytics: true,
                dataExport: true,
                autoFollowUp: true,
                salesPrediction: true,
                prioritySupport: true,
                customIntegrations: true,
                dedicatedSupport: true
            },
            description: '大規模チーム・企業向け',
            buttonText: '無料トライアル開始',
            popular: false
        }
    },
    
    featureDescriptions: {
        customers: '顧客管理',
        pipeline: 'パイプライン管理',
        basicReports: '基本レポート',
        mobileAccess: 'モバイル対応',
        emailSupport: 'メールサポート',
        advancedAnalytics: '売上予測・分析レポート',
        dataExport: 'データインポート/エクスポート',
        autoFollowUp: '自動フォローアップ通知',
        salesPrediction: '売上予測機能',
        prioritySupport: '優先サポート',
        customIntegrations: 'カスタム連携',
        dedicatedSupport: '専任サポート'
    },
    
    getPlan: function(planId) {
        return this.plans[planId] || this.plans.free;
    }
};

console.log('✅ RentPipe料金プラン設定完了');
