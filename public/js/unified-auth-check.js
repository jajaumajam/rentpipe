// 統一認証チェック - index.htmlと同じレベル
console.log('🔐 統一認証チェック開始');

function isAuthenticated() {
    // 複数の場所から認証状態をチェック
    const localAuth = localStorage.getItem('rentpipe_authenticated');
    const sessionAuth = sessionStorage.getItem('rentpipe_authenticated');
    const localUser = localStorage.getItem('rentpipe_user');
    
    if (localAuth === 'true' || sessionAuth === 'true' || localUser) {
        console.log('✅ 認証状態確認済み');
        return true;
    }
    
    return false;
}

function getUserInfo() {
    const localUser = localStorage.getItem('rentpipe_user');
    const sessionUser = sessionStorage.getItem('rentpipe_user');
    
    const userStr = localUser || sessionUser;
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.warn('ユーザー情報パースエラー:', e);
        }
    }
    
    return null;
}

function updateNavigation() {
    const user = getUserInfo();
    if (!user) return;
    
    console.log('👤 ナビゲーション更新:', user.email || user.displayName);
    
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.querySelector('.current-user-info')) {
        const userInfo = document.createElement('div');
        userInfo.className = 'current-user-info';
        userInfo.style.cssText = `
            color: white;
            font-size: 14px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        userInfo.innerHTML = `
            ${user.photoURL ? `<img src="${user.photoURL}" style="width: 24px; height: 24px; border-radius: 50%;">` : '👤'}
            <span>${user.displayName || user.email?.split('@')[0] || 'ユーザー'}</span>
        `;
        
        const logoutBtn = navbar.querySelector('[onclick*="logout"], .nav-logout');
        if (logoutBtn) {
            navbar.insertBefore(userInfo, logoutBtn);
        } else {
            navbar.appendChild(userInfo);
        }
    }
}

function checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html'];
    
    console.log(`🔍 ページアクセスチェック: ${currentPage}`);
    
    if (!protectedPages.includes(currentPage)) {
        console.log('📄 保護対象外ページ');
        return;
    }
    
    if (isAuthenticated()) {
        console.log('✅ 認証済み - アクセス許可');
        
        // ナビゲーション更新
        setTimeout(updateNavigation, 100);
        
        return;
    }
    
    console.log('❌ 未認証 - ログインページにリダイレクト');
    
    // Firebase認証の確認も行う（念のため）
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ Firebase認証確認 - 認証状態を保存');
                saveAuthState(user);
                location.reload(); // ページをリロードして再チェック
            } else if (!isAuthenticated()) {
                window.location.href = 'login.html';
            }
        });
    } else {
        // Firebase未初期化でも認証状態がない場合はリダイレクト
        setTimeout(() => {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
            }
        }, 1000);
    }
}

function saveAuthState(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
    };
    
    localStorage.setItem('rentpipe_authenticated', 'true');
    localStorage.setItem('rentpipe_user', JSON.stringify(userData));
    sessionStorage.setItem('rentpipe_authenticated', 'true');
    sessionStorage.setItem('rentpipe_user', JSON.stringify(userData));
}

// ログアウト関数
window.handleLogout = function() {
    if (confirm('ログアウトしますか？')) {
        console.log('🔒 ログアウト実行');
        
        // 認証状態をクリア
        localStorage.removeItem('rentpipe_authenticated');
        localStorage.removeItem('rentpipe_user');
        sessionStorage.removeItem('rentpipe_authenticated');
        sessionStorage.removeItem('rentpipe_user');
        
        // Firebase ログアウト
        if (window.firebase && firebase.auth) {
            firebase.auth().signOut();
        }
        
        window.location.href = 'login.html';
    }
};

// ページ読み込み時に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPageAccess);
} else {
    checkPageAccess();
}

console.log('✅ 統一認証チェック準備完了');
