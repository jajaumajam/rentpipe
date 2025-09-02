// 緩い認証チェック - 認証状態を優先的に許可
console.log('🔓 緩い認証チェック開始');

function checkAllAuthMethods() {
    // 1. localStorage チェック
    const authStatus = localStorage.getItem('rentpipe_auth_status');
    const tempAuth = localStorage.getItem('rentpipe_temp_auth'); 
    const userInfo = localStorage.getItem('rentpipe_user_info');
    
    if (authStatus === 'authenticated' || tempAuth === 'google_authenticated' || userInfo) {
        console.log('✅ ローカル認証状態確認済み');
        return true;
    }
    
    // 2. sessionStorage チェック
    const sessionAuth = sessionStorage.getItem('rentpipe_auth_status');
    if (sessionAuth === 'authenticated') {
        console.log('✅ セッション認証状態確認済み');
        return true;
    }
    
    // 3. デバッグモード
    if (tempAuth === 'debug_mode') {
        console.log('🔧 デバッグモード認証');
        return true;
    }
    
    return false;
}

function looseAuthCheck() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html'];
    
    console.log('🔍 認証チェック対象ページ:', currentPage);
    
    if (!protectedPages.includes(currentPage)) {
        console.log('📄 保護対象外ページ');
        return;
    }
    
    // 全ての認証方法をチェック
    if (checkAllAuthMethods()) {
        console.log('✅ 認証OK - ページアクセス許可');
        
        // ユーザー情報表示
        const userInfo = localStorage.getItem('rentpipe_user_info') || localStorage.getItem('rentpipe_user_data');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                setTimeout(() => updatePageWithUser(user), 500);
            } catch (e) {
                console.warn('ユーザー情報解析エラー:', e);
            }
        }
        
        return;
    }
    
    console.log('❌ 認証状態未確認');
    
    // Firebase認証の最終チェック（5秒待機）
    let firebaseChecked = false;
    
    setTimeout(() => {
        if (!firebaseChecked) {
            if (window.firebase && firebase.auth) {
                firebase.auth().onAuthStateChanged((user) => {
                    firebaseChecked = true;
                    if (user) {
                        console.log('✅ Firebase認証確認');
                        // 認証状態を保存
                        localStorage.setItem('rentpipe_auth_status', 'authenticated');
                        localStorage.setItem('rentpipe_user_data', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL
                        }));
                    } else {
                        console.log('🔒 Firebase未認証 - ログインページにリダイレクト');
                        redirectToLogin();
                    }
                });
            } else {
                console.log('🔒 Firebase未初期化 - ログインページにリダイレクト');
                redirectToLogin();
            }
        }
    }, 1000);
}

function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        console.log('🔄 ログインページにリダイレクト');
        window.location.href = 'login.html';
    }
}

function updatePageWithUser(user) {
    console.log('👤 ユーザー情報でページ更新:', user.email || user.displayName);
    
    // ナビゲーション更新
    const navContainer = document.querySelector('.navbar, .nav-container');
    if (navContainer && !navContainer.querySelector('.user-display')) {
        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-display';
        userDisplay.style.cssText = `
            color: white;
            font-size: 14px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        userDisplay.innerHTML = `
            ${user.photoURL ? `<img src="${user.photoURL}" style="width: 24px; height: 24px; border-radius: 50%;">` : '👤'}
            <span>${user.displayName || user.email?.split('@')[0] || 'ユーザー'}</span>
        `;
        
        navContainer.appendChild(userDisplay);
    }
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', looseAuthCheck);
} else {
    looseAuthCheck();
}

console.log('✅ 緩い認証チェック準備完了');
