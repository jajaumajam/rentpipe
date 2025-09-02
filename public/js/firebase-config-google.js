// Firebase設定 - Google認証対応版
console.log('🔧 RentPipe Google認証モードで起動中...');

// 設定フラグ
const DEMO_MODE = false; // Google認証モード
const DEBUG_MODE = true;

// Firebase設定（Google認証用）
const firebaseConfig = {
    apiKey: "AIzaSyBvJGdan0lvVSkaAbbSXQkoh6YyPoGyTgM",
    authDomain: "rentpipe-ab04e.firebaseapp.com",
    projectId: "rentpipe-ab04e",
    storageBucket: "rentpipe-ab04e.firebasestorage.app",
    messagingSenderId: "586040985916",
    appId: "1:586040985916:web:3cdb5db072f1a6569fb639"
};

try {
    // Firebase初期化
    if (typeof firebase !== 'undefined') {
        const app = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('✅ Firebase初期化成功');
        console.log(`🏢 Project ID: ${firebaseConfig.projectId}`);
        
        // Google認証プロバイダー設定
        window.googleProvider = new firebase.auth.GoogleAuthProvider();
        window.googleProvider.addScope('email');
        window.googleProvider.addScope('profile');
        
        // カスタムパラメータ設定
        window.googleProvider.setCustomParameters({
            'login_hint': 'user@example.com'
        });
        
        console.log('🔐 Google認証プロバイダー設定完了');
        
        // 認証状態の監視
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ ユーザーログイン済み:', user.email);
                window.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified
                };
                
                // ログイン成功時の処理
                handleAuthSuccess(window.currentUser);
            } else {
                console.log('🔓 ユーザー未認証');
                window.currentUser = null;
                
                // 未認証時の処理
                handleAuthFailure();
            }
        });
        
        // 接続テスト
        window.db.collection('system').doc('connection-test').get()
            .then((doc) => {
                console.log('✅ Firestore接続確認完了');
            })
            .catch(error => {
                console.warn('⚠️ Firestore接続テスト:', error.message);
            });
            
    } else {
        throw new Error('Firebase SDKが読み込まれていません');
    }
    
} catch (error) {
    console.error('❌ Firebase初期化失敗:', error);
    
    // フォールバックモードに切り替え
    console.log('🔄 フォールバックモード（ローカルモード）に切り替え中...');
    
    window.db = null;
    window.auth = null;
    window.currentUser = null;
    
    // ローカルモード警告
    if (DEBUG_MODE) {
        console.warn('⚠️ ローカルモードで動作中。認証機能は制限されます。');
    }
}

// Google認証関数
window.signInWithGoogle = async function() {
    console.log('🔐 Googleログイン開始...');
    
    if (!window.auth || !window.googleProvider) {
        throw new Error('Firebase認証が初期化されていません');
    }
    
    try {
        const result = await window.auth.signInWithPopup(window.googleProvider);
        const user = result.user;
        const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
        
        console.log('✅ Googleログイン成功:', user.email);
        console.log('📧 ユーザー情報:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        });
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            },
            credential: credential
        };
        
    } catch (error) {
        console.error('❌ Googleログインエラー:', error);
        
        let errorMessage = 'ログインに失敗しました';
        switch (error.code) {
            case 'auth/cancelled-popup-request':
            case 'auth/popup-closed-by-user':
                errorMessage = 'ログインがキャンセルされました';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'ネットワークエラーです。接続を確認してください';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'リクエストが多すぎます。しばらく待ってから再度お試しください';
                break;
        }
        
        return {
            success: false,
            error: errorMessage,
            code: error.code
        };
    }
};

// ログアウト関数
window.signOutUser = async function() {
    console.log('🔒 ログアウト開始...');
    
    if (!window.auth) {
        console.warn('⚠️ Firebase認証が初期化されていません');
        return;
    }
    
    try {
        await window.auth.signOut();
        console.log('✅ ログアウト完了');
        
        // ローカルデータもクリア
        const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('rentpipe_auth') || 
            key.startsWith('firebase:')
        );
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        window.currentUser = null;
        
        // ログイン画面にリダイレクト
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
        
    } catch (error) {
        console.error('❌ ログアウトエラー:', error);
    }
};

// 認証成功時の処理
function handleAuthSuccess(user) {
    console.log('🎉 認証成功処理:', user.email);
    
    // ダッシュボードページでない場合はリダイレクト
    if (window.location.pathname.includes('login.html')) {
        console.log('🔄 ダッシュボードにリダイレクト...');
        window.location.href = 'index.html';
    }
    
    // ユーザー情報を表示に反映
    updateUIWithUserInfo(user);
}

// 認証失敗時の処理
function handleAuthFailure() {
    console.log('🔒 未認証状態の処理');
    
    // ログインページでない場合はリダイレクト
    const publicPages = ['login.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!publicPages.includes(currentPage)) {
        console.log('🔄 ログインページにリダイレクト...');
        window.location.href = 'login.html';
    }
}

// UI更新
function updateUIWithUserInfo(user) {
    // ナビゲーションのユーザー情報更新
    const userElements = document.querySelectorAll('.user-email, .user-name');
    userElements.forEach(el => {
        if (el.classList.contains('user-email')) {
            el.textContent = user.email;
        } else if (el.classList.contains('user-name')) {
            el.textContent = user.displayName || user.email.split('@')[0];
        }
    });
    
    // プロフィール画像があれば表示
    if (user.photoURL) {
        const photoElements = document.querySelectorAll('.user-photo');
        photoElements.forEach(el => {
            el.src = user.photoURL;
        });
    }
}

// 現在のユーザー取得
window.getCurrentUser = function() {
    return window.currentUser;
};

// 認証チェック
window.requireAuth = function() {
    if (!window.currentUser) {
        console.log('🔒 認証が必要です');
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

console.log('✅ Google認証システム準備完了');
