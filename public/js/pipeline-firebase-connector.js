// パイプラインFirebase接続強制化
console.log('🔥 Firebase接続強制化スクリプト開始...');

// Firebase接続強制化関数
async function forceConnectFirebase() {
    console.log('🚀 Firebase接続を強制実行中...');
    
    try {
        // ステップ1: Firebase初期化確認
        if (!window.firebase || !window.db || !window.auth) {
            throw new Error('Firebase SDKが初期化されていません');
        }
        console.log('✅ Firebase SDK確認完了');
        
        // ステップ2: 匿名認証実行
        if (!window.auth.currentUser) {
            console.log('🔐 匿名認証実行中...');
            const result = await window.auth.signInAnonymously();
            console.log(`✅ 匿名認証完了: ${result.user.uid}`);
        } else {
            console.log(`✅ 既に認証済み: ${window.auth.currentUser.uid}`);
        }
        
        // ステップ3: FirebaseDataManagerの動作確認
        if (!window.FirebaseDataManager) {
            throw new Error('FirebaseDataManagerが見つかりません');
        }
        
        const testResult = await window.FirebaseDataManager.testConnection();
        if (!testResult) {
            throw new Error('Firebase接続テストに失敗しました');
        }
        console.log('✅ FirebaseDataManager接続確認完了');
        
        // ステップ4: パイプラインマネージャーの更新
        if (window.pipelineManager) {
            await window.pipelineManager.loadPipeline();
            console.log('✅ パイプラインデータをFirebaseから読み込み完了');
        }
        
        // ステップ5: 接続状況表示更新
        updatePipelineFirebaseStatus();
        
        alert('🎉 Firebase接続が完了しました！\n\n顧客カードを移動するとFirestoreに保存されます。');
        
    } catch (error) {
        console.error('❌ Firebase接続強制化エラー:', error);
        alert(`Firebase接続に失敗しました:\n${error.message}`);
    }
}

// 接続状況表示更新（改良版）
function updatePipelineFirebaseStatus() {
    const statusElement = document.getElementById('firebaseStatus');
    if (!statusElement) return;
    
    const hasFirebaseSDK = !!(window.firebase && window.db && window.auth);
    const currentUser = window.auth ? window.auth.currentUser : null;
    const hasDataManager = !!window.FirebaseDataManager;
    
    if (hasFirebaseSDK && currentUser && hasDataManager) {
        statusElement.className = 'firebase-status firebase-connected';
        statusElement.innerHTML = `🔥 Firebase接続済み (UID: ${currentUser.uid.substring(0, 8)}...) <button onclick="forceConnectFirebase()" style="margin-left:10px;padding:2px 8px;font-size:11px;border:1px solid #0369a1;background:white;border-radius:4px;cursor:pointer;">🔄 再接続</button>`;
    } else if (hasFirebaseSDK && hasDataManager && !currentUser) {
        statusElement.className = 'firebase-status firebase-connecting';
        statusElement.innerHTML = `🔐 Firebase認証待機中... <button onclick="forceConnectFirebase()" style="margin-left:10px;padding:2px 8px;font-size:11px;border:1px solid #f59e0b;background:white;border-radius:4px;cursor:pointer;">🔗 接続実行</button>`;
    } else {
        statusElement.className = 'firebase-status firebase-local';
        statusElement.innerHTML = `💾 ローカルストレージモード <button onclick="forceConnectFirebase()" style="margin-left:10px;padding:2px 8px;font-size:11px;border:1px solid #7c2d12;background:white;border-radius:4px;cursor:pointer;">🚀 Firebase接続</button>`;
    }
}

// グローバル関数として設定
window.forceConnectFirebase = forceConnectFirebase;
window.updatePipelineFirebaseStatus = updatePipelineFirebaseStatus;

// ページ読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Firebase接続状況診断:');
    console.log('- Firebase SDK:', !!window.firebase);
    console.log('- Firestore:', !!window.db);
    console.log('- Auth:', !!window.auth);
    console.log('- FirebaseDataManager:', !!window.FirebaseDataManager);
    console.log('- 認証ユーザー:', window.auth ? !!window.auth.currentUser : 'なし');
    
    setTimeout(() => {
        updatePipelineFirebaseStatus();
        
        // 5秒後に自動接続試行
        setTimeout(() => {
            if (!window.auth || !window.auth.currentUser) {
                console.log('🔄 自動Firebase接続を試行します...');
                forceConnectFirebase();
            }
        }, 5000);
    }, 1000);
});

console.log('✅ Firebase接続強制化スクリプト準備完了');
