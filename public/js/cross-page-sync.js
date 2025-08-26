// ページ間リアルタイムデータ同期システム（修正版）
console.log('ページ間同期システム初期化中...');

// データ変更イベントの管理
window.CrossPageSync = {
    // データ変更を他のページに通知
    notifyDataChange: function(type, data) {
        console.log(`データ変更通知: ${type}`, data);
        
        // localStorageイベントを使用してページ間通信
        const syncEvent = {
            type: type,
            data: data,
            timestamp: Date.now(),
            source: window.location.pathname
        };
        
        localStorage.setItem('rentpipe_sync_event', JSON.stringify(syncEvent));
        
        // 即座に削除（イベント発火のため）
        setTimeout(() => {
            localStorage.removeItem('rentpipe_sync_event');
        }, 100);
    },
    
    // データ変更を監視
    setupChangeListener: function() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'rentpipe_sync_event' && event.newValue) {
                try {
                    const syncEvent = JSON.parse(event.newValue);
                    console.log(`データ変更受信: ${syncEvent.type}`, syncEvent);
                    
                    // 自分が送信したイベントは無視
                    if (syncEvent.source === window.location.pathname) {
                        return;
                    }
                    
                    this.handleDataChange(syncEvent);
                    
                } catch (error) {
                    console.error('同期イベント処理エラー:', error);
                }
            }
        });
        
        console.log('ページ間同期リスナー設定完了');
    },
    
    // データ変更の処理
    handleDataChange: function(syncEvent) {
        console.log(`データ変更処理開始: ${syncEvent.type}`);
        
        switch (syncEvent.type) {
            case 'customer_added':
            case 'customer_updated':
            case 'customer_deleted':
                this.reloadCustomerData();
                break;
            case 'pipeline_moved':
                this.reloadPipelineData();
                break;
            case 'data_unified':
                this.reloadAllData();
                break;
            default:
                console.log(`未知の同期イベント: ${syncEvent.type}`);
        }
    },
    
    // 顧客データリロード
    reloadCustomerData: async function() {
        console.log('顧客データリロード実行...');
        
        try {
            // 顧客管理画面のリロード
            if (window.customerManager && typeof window.customerManager.loadCustomers === 'function') {
                await window.customerManager.loadCustomers();
                console.log('顧客管理画面更新完了');
            }
            
            // パイプライン画面のリロード
            if (window.pipelineManager && typeof window.pipelineManager.loadPipeline === 'function') {
                await window.pipelineManager.loadPipeline();
                console.log('パイプライン画面更新完了');
            }
            
        } catch (error) {
            console.error('顧客データリロードエラー:', error);
        }
    },
    
    // パイプラインデータリロード
    reloadPipelineData: async function() {
        console.log('パイプラインデータリロード実行...');
        
        try {
            if (window.pipelineManager && typeof window.pipelineManager.loadPipeline === 'function') {
                await window.pipelineManager.loadPipeline();
                console.log('パイプラインデータ更新完了');
            }
            
        } catch (error) {
            console.error('パイプラインデータリロードエラー:', error);
        }
    },
    
    // 全データリロード
    reloadAllData: async function() {
        console.log('全データリロード実行...');
        
        try {
            await this.reloadCustomerData();
            
            // 少し遅延してからパイプラインも更新
            setTimeout(async () => {
                if (window.pipelineManager && typeof window.pipelineManager.loadPipeline === 'function') {
                    await window.pipelineManager.loadPipeline();
                }
            }, 500);
            
        } catch (error) {
            console.error('全データリロードエラー:', error);
        }
    }
};

// 既存の顧客管理システムに通知機能を追加（安全版）
if (window.UnifiedDataManager) {
    console.log('UnifiedDataManagerに通知機能を追加...');
    
    // saveCustomer関数が存在する場合のみ拡張
    if (typeof window.UnifiedDataManager.saveCustomer === 'function') {
        const originalSaveCustomer = window.UnifiedDataManager.saveCustomer;
        
        window.UnifiedDataManager.saveCustomer = function(customerData) {
            const result = originalSaveCustomer.call(this, customerData);
            
            if (result && customerData && customerData.id && customerData.name) {
                // データ変更を通知
                window.CrossPageSync.notifyDataChange('customer_added', {
                    customerId: customerData.id,
                    customerName: customerData.name
                });
            }
            
            return result;
        };
    }
    
    // deleteCustomer関数が存在する場合のみ拡張
    if (typeof window.UnifiedDataManager.deleteCustomer === 'function') {
        const originalDeleteCustomer = window.UnifiedDataManager.deleteCustomer;
        
        window.UnifiedDataManager.deleteCustomer = function(customerId) {
            let customer = null;
            
            // 削除前に顧客情報を取得
            if (typeof this.getCustomerById === 'function') {
                customer = this.getCustomerById(customerId);
            }
            
            const result = originalDeleteCustomer.call(this, customerId);
            
            if (result && customer && customer.name) {
                // データ変更を通知
                window.CrossPageSync.notifyDataChange('customer_deleted', {
                    customerId: customerId,
                    customerName: customer.name
                });
            }
            
            return result;
        };
    }
    
    console.log('UnifiedDataManager通知機能追加完了');
}

// Firebase統合時の通知機能追加（安全版）
if (window.FirebaseDataManager) {
    console.log('FirebaseDataManagerに通知機能を追加...');
    
    // saveCustomer関数が存在する場合のみ拡張
    if (typeof window.FirebaseDataManager.saveCustomer === 'function') {
        const originalFirebaseSaveCustomer = window.FirebaseDataManager.saveCustomer;
        
        window.FirebaseDataManager.saveCustomer = async function(customerData) {
            const result = await originalFirebaseSaveCustomer.call(this, customerData);
            
            if (result && customerData && customerData.id && customerData.name) {
                // データ変更を通知
                window.CrossPageSync.notifyDataChange('customer_added', {
                    customerId: result,
                    customerName: customerData.name
                });
            }
            
            return result;
        };
    }
    
    console.log('FirebaseDataManager通知機能追加完了');
}

// ページ読み込み時に同期システムを開始
document.addEventListener('DOMContentLoaded', function() {
    // 少し遅延してからリスナーを設定
    setTimeout(() => {
        window.CrossPageSync.setupChangeListener();
        console.log('ページ間同期システム開始完了');
    }, 1000);
});

console.log('ページ間同期システム準備完了');
