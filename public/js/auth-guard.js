// RentPipe 認証ガード（Google認証専用）
console.log('🔐 認証ガードシステム初期化中...');

// 認証が必要なページのリスト
const protectedPages = [
    'index.html',
    'customer.html', 
    'pipeline.html',
    'customer-form.html',
    'customer-detail.html',
    'profile.html'
];

// 認証チェック
function checkAuthentication() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    console.log(`🔍 認証チェック: ${currentPage}`);
    
    // 保護対象ページかチェック
    if (!protectedPages.includes(currentPage)) {
        console.log('📄 保護対象外のページです');
        return true;
    }
    
    // Firebase認証状態をチェック
    if (window.auth) {
        return new Promise((resolve) => {
            const unsubscribe = window.auth.onAuthStateChanged((user) => {
                unsubscribe(); // リスナーを解除
                
                if (user) {
                    console.log('✅ 認証済みユーザー:', user.email);
                    
                    // ユーザー情報をグローバルに設定
                    window.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        emailVerified: user.emailVerified
                    };
                    
                    // UI更新
                    updateAuthenticatedUI(window.currentUser);
                    resolve(true);
                    
                } else {
                    console.log('❌ 未認証ユーザー');
                    redirectToLogin();
                    resolve(false);
                }
            });
        });
    } else {
        // Firebase未初期化の場合は少し待ってから再チェック
        console.log('⏳ Firebase初期化待機中...');
        setTimeout(() => {
            if (window.auth) {
                checkAuthentication();
            } else {
                console.warn('⚠️ Firebase認証が利用できません。ログインページにリダイレクト');
                redirectToLogin();
            }
        }, 2000);
        return false;
    }
}

// ログインページにリダイレクト
function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        console.log('🔄 ログインページにリダイレクト中...');
        
        // 現在のページをリダイレクト先として保存
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('rentpipe_redirect_after_login', currentPath);
        
        window.location.href = 'login.html';
    }
}

// 認証済みUIの更新
function updateAuthenticatedUI(user) {
    console.log('🎨 認証済みUI更新中...');
    
    // ユーザー情報表示要素の更新
    const userNameElements = document.querySelectorAll('.user-name, .current-user-name');
    const userEmailElements = document.querySelectorAll('.user-email, .current-user-email');
    const userPhotoElements = document.querySelectorAll('.user-photo, .current-user-photo');
    
    userNameElements.forEach(el => {
        el.textContent = user.displayName || user.email.split('@')[0];
    });
    
    userEmailElements.forEach(el => {
        el.textContent = user.email;
    });
    
    if (user.photoURL) {
        userPhotoElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = user.photoURL;
                el.style.borderRadius = '50%';
                el.style.width = '32px';
                el.style.height = '32px';
            } else {
                el.style.backgroundImage = `url(${user.photoURL})`;
                el.style.backgroundSize = 'cover';
                el.style.borderRadius = '50%';
            }
        });
    }
    
    // ログイン後のリダイレクト処理
    const redirectPath = localStorage.getItem('rentpipe_redirect_after_login');
    if (redirectPath && !window.location.pathname.includes('login.html')) {
        localStorage.removeItem('rentpipe_redirect_after_login');
        if (redirectPath !== window.location.pathname + window.location.search) {
            console.log(`🔄 リダイレクト実行: ${redirectPath}`);
            window.location.href = redirectPath;
        }
    }
}

// ログアウト関数（グローバル）
window.handleLogout = function() {
    if (!confirm('ログアウトしますか？')) {
        return;
    }
    
    console.log('🔒 ログアウト処理開始...');
    
    if (window.signOutUser) {
        window.signOutUser().then(() => {
            console.log('✅ ログアウト完了');
        }).catch(error => {
            console.error('❌ ログアウトエラー:', error);
            // エラーでも強制的にログイン画面に
            window.location.href = 'login.html';
        });
    } else {
        // フォールバック
        localStorage.clear();
        window.location.href = 'login.html';
    }
};

// ページ読み込み時の認証チェック実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 ページ読み込み完了 - 認証チェック実行');
    
    // Firebase初期化を少し待つ
    setTimeout(() => {
        checkAuthentication();
    }, 500);
});

// Firebase初期化完了後にも実行
window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.auth && !window.currentUser) {
            console.log('🔄 Window load後の認証チェック');
            checkAuthentication();
        }
    }, 1000);
});

console.log('✅ 認証ガードシステム準備完了');
