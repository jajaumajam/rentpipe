// ローカルファースト・Firebase同期システム
console.log('ローカルファースト同期システム初期化中...');

class LocalFirstSyncManager {
    constructor() {
        this.syncQueue = [];
        this.isFirebaseConnected = false;
        this.initializeSystem();
    }
    
    // システム初期化
    async initializeSystem() {
        this.checkFirebaseConnection();
        this.startSyncProcess();
        this.setupConnectionMonitoring();
        
        console.log('ローカルファースト同期システム開始');
    }
    
    // Firebase接続状態確認
    checkFirebaseConnection() {
        this.isFirebaseConnected = !!(
            window.firebase && 
            window.db && 
            window.auth && 
            window.auth.currentUser
        );
        
        console.log(`Firebase接続状態: ${this.isFirebaseConnected}`);
        return this.isFirebaseConnected;
    }
    
    // 接続状態監視
    setupConnectionMonitoring() {
        // Firebase認証状態変更の監視
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                const wasConnected = this.isFirebaseConnected;
                this.isFirebaseConnected = !!user;
                
                if (!wasConnected && this.isFirebaseConnected) {
                    console.log('Firebase接続復旧 - 同期開始');
                    this.processSyncQueue();
                }
            });
        }
        
        // 定期的な接続チェック
        setInterval(() => {
            const wasConnected = this.isFirebaseConnected;
            this.checkFirebaseConnection();
            
            if (!wasConnected && this.isFirebaseConnected) {
                console.log('Firebase接続回復 - 同期処理開始');
                this.processSyncQueue();
            }
        }, 10000); // 10秒ごと
    }
    
    // 顧客データ更新（ローカルファースト）
    async updateCustomer(customerId, updates) {
        console.log(`顧客更新開始: ${customerId}`, updates);
        
        try {
            // 1. ローカルストレージを即座に更新
            const localResult = await this.updateLocalCustomer(customerId, updates);
            if (!localResult) {
                throw new Error('ローカル更新に失敗');
            }
            
            console.log('ローカル更新成功');
            
            // 2. Firebaseに接続されている場合は即座に同期
            if (this.isFirebaseConnected) {
                try {
                    await this.updateFirebaseCustomer(customerId, updates);
                    console.log('Firebase即時同期成功');
                } catch (error) {
                    console.warn('Firebase即時同期失敗 - 同期キューに追加', error);
                    this.addToSyncQueue('update', customerId, updates);
                }
            } else {
                // 3. 接続されていない場合は同期キューに追加
                this.addToSyncQueue('update', customerId, updates);
                console.log('同期キューに追加');
            }
            
            // 4. 画面更新通知
            this.notifyScreenUpdate(customerId, updates);
            
            return true;
            
        } catch (error) {
            console.error('顧客更新エラー:', error);
            return false;
        }
    }
    
    // ローカルストレージ更新
    async updateLocalCustomer(customerId, updates) {
        const keys = ['rentpipe_customers', 'rentpipe_demo_customers', 'customers'];
        let success = false;
        
        for (const key of keys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const customers = JSON.parse(stored);
                    const customerIndex = customers.findIndex(c => c.id === customerId);
                    
                    if (customerIndex !== -1) {
                        customers[customerIndex] = {
                            ...customers[customerIndex],
                            ...updates,
                            updatedAt: new Date().toISOString(),
                            lastSynced: this.isFirebaseConnected ? new Date().toISOString() : null
                        };
                        
                        localStorage.setItem(key, JSON.stringify(customers));
                        success = true;
                        console.log(`ローカル更新成功: ${key}`);
                    }
                } catch (e) {
                    console.warn(`${key}の更新失敗:`, e);
                }
            }
        }
        
        return success;
    }
    
    // Firebase更新
    async updateFirebaseCustomer(customerId, updates) {
        if (!this.isFirebaseConnected || !window.FirebaseDataManager) {
            throw new Error('Firebase接続なし');
        }
        
        try {
            const customers = await window.FirebaseDataManager.getCustomers();
            const customer = customers.find(c => c.id === customerId);
            
            if (customer) {
                const updatedCustomer = {
                    ...customer,
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastSynced: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const result = await window.FirebaseDataManager.saveCustomer(updatedCustomer);
                return result;
            } else {
                throw new Error('Firebase上に顧客が見つからない');
            }
        } catch (error) {
            console.error('Firebase更新エラー:', error);
            throw error;
        }
    }
    
    // 同期キューに追加
    addToSyncQueue(action, customerId, data) {
        const queueItem = {
            id: Date.now() + Math.random(),
            action: action,
            customerId: customerId,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        this.syncQueue.push(queueItem);
        console.log(`同期キューに追加: ${queueItem.id}`);
    }
    
    // 同期キュー処理
    async processSyncQueue() {
        if (!this.isFirebaseConnected || this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`同期キュー処理開始: ${this.syncQueue.length}項目`);
        
        const processedItems = [];
        
        for (const item of this.syncQueue) {
            try {
                await this.updateFirebaseCustomer(item.customerId, item.data);
                processedItems.push(item);
                console.log(`同期完了: ${item.customerId}`);
            } catch (error) {
                console.error(`同期失敗: ${item.customerId}`, error);
            }
        }
        
        // 処理済みアイテムをキューから削除
        this.syncQueue = this.syncQueue.filter(item => 
            !processedItems.some(processed => processed.id === item.id)
        );
        
        console.log(`同期処理完了: ${processedItems.length}項目処理済み`);
    }
    
    // 同期プロセス開始
    startSyncProcess() {
        // 5分ごとに同期試行
        setInterval(() => {
            if (this.isFirebaseConnected) {
                this.processSyncQueue();
            }
        }, 5 * 60 * 1000); // 5分
    }
    
    // 画面更新通知
    notifyScreenUpdate(customerId, updates) {
        // ページ間同期通知
        if (window.CrossPageSync) {
            window.CrossPageSync.notifyDataChange('customer_updated', {
                customerId: customerId,
                customerName: updates.name || 'Unknown',
                newStatus: updates.status || updates.pipelineStatus
            });
        }
        
        // 画面を強制的にリロード
        this.forceScreenReload();
    }
    
    // 画面強制リロード
    async forceScreenReload() {
        try {
            // 顧客管理画面のリロード
            if (window.customerManager && typeof window.customerManager.loadCustomers === 'function') {
                await window.customerManager.loadCustomers();
                console.log('顧客管理画面リロード完了');
            }
            
            // パイプライン画面のリロード
            if (window.pipelineManager && typeof window.pipelineManager.loadPipeline === 'function') {
                await window.pipelineManager.loadPipeline();
                console.log('パイプライン画面リロード完了');
            }
        } catch (error) {
            console.error('画面リロードエラー:', error);
        }
    }
    
    // 同期状態取得
    getSyncStatus() {
        return {
            isFirebaseConnected: this.isFirebaseConnected,
            queueLength: this.syncQueue.length,
            lastSyncAttempt: this.lastSyncAttempt || null
        };
    }
}

// グローバルインスタンス
window.localFirstSync = new LocalFirstSyncManager();

console.log('ローカルファースト同期システム準備完了');
