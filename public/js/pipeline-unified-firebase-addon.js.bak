// パイプラインFirebase統合アドオン - 既存のpipeline-unified.jsに追加機能
console.log('🔥 パイプラインFirebase統合アドオン初期化中...');

// 既存のPipelineManagerクラスを拡張
if (window.PipelineManager) {
    console.log('✅ 既存のPipelineManagerが見つかりました');
    
    // Firebase統合機能を追加
    const originalLoadPipeline = window.PipelineManager.prototype.loadPipeline;
    const originalMoveCustomer = window.PipelineManager.prototype.moveCustomer;
    const originalAddHistory = window.PipelineManager.prototype.addHistory;
    
    // Firebase対応のloadPipeline
    window.PipelineManager.prototype.loadPipeline = async function() {
        console.log(`📊 パイプラインデータ読み込み (${this.isFirebaseMode() ? 'Firebase' : 'ローカル'}モード)`);
        
        if (this.isFirebaseMode()) {
            try {
                // Firebase認証確認
                if (!window.auth.currentUser) {
                    console.log('🔐 匿名認証開始...');
                    await window.auth.signInAnonymously();
                }
                
                // FirebaseDataManagerから顧客データ取得
                const customers = await window.FirebaseDataManager.getCustomers();
                console.log(`✅ Firebaseパイプラインデータ取得: ${customers.length}件`);
                
                // パイプライン表示更新
                this.customers = customers || [];
                this.renderPipeline();
                this.updateCounts();
                
                return customers;
                
            } catch (error) {
                console.error('❌ Firebaseパイプラインデータ取得エラー:', error);
                console.log('🔄 ローカルデータにフォールバック');
                // エラー時は元の関数を使用
                return originalLoadPipeline.call(this);
            }
        } else {
            // ローカルモードは元の関数を使用
            return originalLoadPipeline.call(this);
        }
    };
    
    // Firebase対応のmoveCustomer（ステータス変更）
    window.PipelineManager.prototype.moveCustomer = async function(customerId, newStatus) {
        console.log(`🔄 ステータス変更: ${customerId} → ${newStatus} (${this.isFirebaseMode() ? 'Firebase' : 'ローカル'}モード)`);
        
        if (this.isFirebaseMode()) {
            try {
                const customer = this.customers.find(c => c.id === customerId);
                if (!customer) {
                    throw new Error('顧客が見つかりません');
                }
                
                const oldStatus = customer.status || customer.pipelineStatus;
                
                // 顧客データ更新
                const updatedCustomer = {
                    ...customer,
                    status: newStatus,
                    pipelineStatus: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Firestoreに保存
                const result = await window.FirebaseDataManager.saveCustomer(updatedCustomer);
                if (!result) {
                    throw new Error('Firebase保存失敗');
                }
                
                // 履歴追加
                await this.addHistory(customerId, customer.name, oldStatus, newStatus);
                
                // 画面更新
                await this.loadPipeline();
                
                // 成功メッセージ
                this.showMessage(`${customer.name} のステータスを「${newStatus}」に変更しました`, 'success');
                
                console.log(`✅ Firebaseステータス変更成功: ${customerId}`);
                
            } catch (error) {
                console.error('❌ Firebaseステータス変更エラー:', error);
                console.log('🔄 ローカル処理にフォールバック');
                // エラー時は元の関数を使用
                return originalMoveCustomer.call(this, customerId, newStatus);
            }
        } else {
            // ローカルモードは元の関数を使用
            return originalMoveCustomer.call(this, customerId, newStatus);
        }
    };
    
    // Firebase対応のaddHistory（履歴追加）
    window.PipelineManager.prototype.addHistory = async function(customerId, customerName, oldStatus, newStatus) {
        console.log(`📝 履歴追加: ${customerName} ${oldStatus} → ${newStatus} (${this.isFirebaseMode() ? 'Firebase' : 'ローカル'}モード)`);
        
        if (this.isFirebaseMode()) {
            try {
                const currentUser = window.auth.currentUser;
                if (!currentUser) {
                    throw new Error('認証が必要です');
                }
                
                const historyData = {
                    customerId: customerId,
                    customerName: customerName,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    tenantId: currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    type: 'status_change'
                };
                
                // Firestoreの履歴コレクションに保存
                const tenantId = currentUser.uid;
                await window.db.collection(`tenants/${tenantId}/history`).add(historyData);
                
                console.log(`✅ Firebase履歴保存成功: ${customerName}`);
                
            } catch (error) {
                console.error('❌ Firebase履歴保存エラー:', error);
                // エラー時は元の関数を使用（ローカル履歴）
                if (originalAddHistory) {
                    return originalAddHistory.call(this, customerId, customerName, oldStatus, newStatus);
                }
            }
        } else {
            // ローカルモードは元の関数を使用
            if (originalAddHistory) {
                return originalAddHistory.call(this, customerId, customerName, oldStatus, newStatus);
            }
        }
    };
    
    // Firebase判定機能を追加
    window.PipelineManager.prototype.isFirebaseMode = function() {
        return !!(window.FirebaseDataManager && window.auth && !window.location.search.includes('fallback=demo'));
    };
    
    console.log('✅ PipelineManagerにFirebase機能を追加しました');
} else {
    console.warn('⚠️ PipelineManagerが見つかりません');
}

// Firebase接続状況を表示する関数
function updatePipelineFirebaseStatus() {
    const statusElement = document.getElementById('firebaseStatus');
    if (!statusElement) return;
    
    const isFirebase = window.PipelineManager && window.PipelineManager.prototype.isFirebaseMode();
    const currentUser = window.auth ? window.auth.currentUser : null;
    
    if (isFirebase && currentUser) {
        statusElement.className = 'firebase-status firebase-connected';
        statusElement.innerHTML = `🔥 パイプライン Firebase接続中 (${currentUser.isAnonymous ? 'ゲスト' : 'ユーザー'}: ${currentUser.uid.substring(0, 8)}...)`;
    } else if (isFirebase && !currentUser) {
        statusElement.className = 'firebase-status firebase-connecting';
        statusElement.innerHTML = '🔐 Firebase認証中...';
    } else {
        statusElement.className = 'firebase-status firebase-local';
        statusElement.innerHTML = '💾 パイプライン ローカルストレージモード';
    }
}

// 認証状態変更の監視
if (window.auth) {
    window.auth.onAuthStateChanged(function(user) {
        console.log(`👤 パイプライン認証状態変更: ${user ? user.uid : '未認証'}`);
        updatePipelineFirebaseStatus();
        
        // 認証状態が変わったらパイプラインデータを再読み込み
        setTimeout(() => {
            if (window.pipelineManager) {
                window.pipelineManager.loadPipeline();
            }
        }, 500);
    });
}

// ページ読み込み完了後に状況表示を更新
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updatePipelineFirebaseStatus, 1000);
    
    // 定期的に状況を更新
    setInterval(updatePipelineFirebaseStatus, 5000);
});

console.log('✅ パイプラインFirebase統合アドオン準備完了');
