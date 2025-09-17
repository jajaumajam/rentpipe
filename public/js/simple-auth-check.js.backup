// シンプル認証チェック
console.log('🔐 シンプル認証チェック開始');

// 一時的なデバッグモードチェック
function checkTempAuth() {
    const tempAuth = localStorage.getItem('rentpipe_temp_auth');
    if (tempAuth === 'debug_mode') {
        console.log('🔧 デバッグモードで認証スキップ');
        return true;
    }
    return false;
}

// 認証チェック
function simpleAuthCheck() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html'];
    
    if (!protectedPages.includes(currentPage)) {
        return;
    }
    
    // デバッグモードチェック
    if (checkTempAuth()) {
        return;
    }
    
    // Firebase認証チェック
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ 認証済み:', user.email);
            } else {
                console.log('🔒 未認証 - ログインページにリダイレクト');
                window.location.href = 'login.html';
            }
        });
    } else {
        // Firebase未初期化の場合は少し待つ
        setTimeout(() => {
            if (!checkTempAuth()) {
                window.location.href = 'login.html';
            }
        }, 2000);
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', simpleAuthCheck);

console.log('✅ シンプル認証チェック準備完了');

// Google認証済みユーザーの認証許可
function checkGoogleAuth() {
    const tempAuth = localStorage.getItem('rentpipe_temp_auth');
    const userInfo = localStorage.getItem('rentpipe_user_info');
    
    if (tempAuth === 'google_authenticated' && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            console.log('✅ Google認証済みユーザー:', user.email);
            
            // ナビゲーションにユーザー情報を表示
            setTimeout(() => {
                updateNavWithUserInfo(user);
            }, 500);
            
            return true;
        } catch (e) {
            console.warn('ユーザー情報のパースエラー:', e);
        }
    }
    return false;
}

// ナビゲーションのユーザー情報更新
function updateNavWithUserInfo(user) {
    const navContainer = document.querySelector('.nav-container, .navbar');
    if (navContainer && !navContainer.querySelector('.user-info-display')) {
        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-info-display';
        userDisplay.style.cssText = `
            color: white;
            font-size: 14px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        userDisplay.innerHTML = `
            ${user.photoURL ? `<img src="${user.photoURL}" style="width: 24px; height: 24px; border-radius: 50%;" alt="User">` : '👤'}
            <span>${user.displayName || user.email.split('@')[0]}</span>
        `;
        
        const logoutBtn = navContainer.querySelector('.nav-logout, button');
        if (logoutBtn) {
            navContainer.insertBefore(userDisplay, logoutBtn);
        } else {
            navContainer.appendChild(userDisplay);
        }
    }
}

// 認証チェック関数を拡張
const originalSimpleAuthCheck = simpleAuthCheck;
simpleAuthCheck = function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html'];
    
    if (!protectedPages.includes(currentPage)) {
        return;
    }
    
    console.log('🔍 拡張認証チェック:', currentPage);
    
    // デバッグモードチェック
    if (checkTempAuth() || checkGoogleAuth()) {
        console.log('✅ 認証OK');
        return;
    }
    
    // Firebase認証チェック
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ Firebase認証済み:', user.email);
                // ローカルストレージにも保存
                localStorage.setItem('rentpipe_temp_auth', 'google_authenticated');
                localStorage.setItem('rentpipe_user_info', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }));
            } else {
                console.log('🔒 未認証 - ログインページにリダイレクト');
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    } else {
        // Firebase未初期化の場合
        setTimeout(() => {
            if (!checkTempAuth() && !checkGoogleAuth()) {
                console.log('🔒 Firebase未初期化 - ログインページにリダイレクト');
                window.location.href = 'login.html';
            }
        }, 2000);
    }
};

console.log('✅ Google認証対応を追加しました');
