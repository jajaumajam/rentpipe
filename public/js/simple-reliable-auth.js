// シンプル・確実認証システム（強制表示版）
console.log('🔐 シンプル認証システム開始');

// 認証状態管理
const AUTH_KEY = 'rentpipe_auth_simple';
const USER_KEY = 'rentpipe_user_simple';

// 認証状態チェック
function isLoggedIn() {
    const authStatus = localStorage.getItem(AUTH_KEY);
    return authStatus === 'logged_in';
}

// ユーザー情報取得
function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ログイン状態保存
function saveLogin(userData) {
    localStorage.setItem(AUTH_KEY, 'logged_in');
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('✅ ログイン状態保存:', userData.email);
}

// ログアウト
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('🔒 ログアウト完了');
}

// ページアクセス制御
function checkPageAccess() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html', 'profile.html'];
    
    console.log(`🔍 アクセスチェック: ${currentPage}`);
    
    // 保護対象外ページ
    if (!protectedPages.includes(currentPage)) {
        console.log('📄 保護対象外');
        return;
    }
    
    // 認証状態チェック
    if (isLoggedIn()) {
        console.log('✅ ログイン済み - アクセス許可');
        
        // 強制的なユーザー情報表示
        startUserInfoDisplayLoop();
        
        return;
    }
    
    // 未ログイン - ログインページにリダイレクト
    console.log('🔒 未ログイン - リダイレクト');
    if (currentPage !== 'login.html') {
        window.location.href = 'login.html';
    }
}

// ユーザー情報表示のループ開始
function startUserInfoDisplayLoop() {
    const user = getUser();
    if (!user) return;
    
    console.log('🔄 ユーザー情報表示ループ開始:', user.email);
    
    // 継続的に試行するループ
    const displayInterval = setInterval(() => {
        const success = forceDisplayUserInfo(user);
        if (success) {
            console.log('✅ ユーザー情報表示成功 - ループ停止');
            clearInterval(displayInterval);
        }
    }, 500);
    
    // 10秒後にループ停止（無限ループ防止）
    setTimeout(() => {
        clearInterval(displayInterval);
        console.log('⏰ ユーザー情報表示ループ終了（タイムアウト）');
    }, 10000);
}

// 強制的にユーザー情報表示
function forceDisplayUserInfo(user) {
    // 複数の方法でナビゲーション要素を取得
    const navSelectors = [
        '.navbar .nav-container',
        '.navbar',
        '.nav-container',
        'nav',
        '[class*="nav"]',
        'header nav',
        'header'
    ];
    
    let navbar = null;
    for (const selector of navSelectors) {
        navbar = document.querySelector(selector);
        if (navbar) {
            console.log(`📍 ナビゲーション発見: ${selector}`);
            break;
        }
    }
    
    if (!navbar) {
        console.log('⚠️ ナビゲーション要素未発見');
        return false;
    }
    
    // 既存のユーザー情報表示をチェック・削除
    const existingUserInfo = navbar.querySelector('.user-display-simple, .user-info-display, [class*="user-display"]');
    if (existingUserInfo) {
        console.log('🗑️ 既存ユーザー情報を更新');
        existingUserInfo.remove();
    }
    
    // ユーザー情報要素を作成
    const userDisplay = document.createElement('div');
    userDisplay.className = 'user-display-simple';
    userDisplay.style.cssText = `
        display: inline-flex !important;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 14px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        margin: 0 10px;
        white-space: nowrap;
        vertical-align: middle;
    `;
    
    userDisplay.innerHTML = `
        ${user.photoURL ? 
            `<img src="${user.photoURL}" style="width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;" alt="User">` : 
            '<span style="font-size: 14px;">👤</span>'
        }
        <span style="font-weight: 500;">${user.displayName || user.email.split('@')[0]}</span>
    `;
    
    // 複数の挿入方法を試行
    let inserted = false;
    
    // 方法1: ログアウトボタンの前に挿入
    const logoutBtn = navbar.querySelector('.nav-logout, [onclick*="logout"], [onclick*="secureLogout"], button');
    if (logoutBtn && !inserted) {
        try {
            navbar.insertBefore(userDisplay, logoutBtn);
            console.log('✅ ログアウトボタン前に挿入');
            inserted = true;
            
            // ログアウトボタンの動作更新
            logoutBtn.onclick = function() {
                if (confirm('ログアウトしますか？')) {
                    logout();
                    window.location.href = 'login.html';
                }
            };
        } catch (e) {
            console.log('⚠️ 挿入方法1失敗:', e.message);
        }
    }
    
    // 方法2: navbarの最後に追加
    if (!inserted) {
        try {
            navbar.appendChild(userDisplay);
            console.log('✅ navbar末尾に追加');
            inserted = true;
        } catch (e) {
            console.log('⚠️ 挿入方法2失敗:', e.message);
        }
    }
    
    // 方法3: flexの場合は適切な位置に挿入
    if (!inserted && window.getComputedStyle(navbar).display.includes('flex')) {
        try {
            // flexboxレイアウトの場合は margin-left: auto で右寄せ
            userDisplay.style.marginLeft = 'auto';
            userDisplay.style.order = '999';
            navbar.appendChild(userDisplay);
            console.log('✅ flexレイアウトで右寄せ追加');
            inserted = true;
        } catch (e) {
            console.log('⚠️ 挿入方法3失敗:', e.message);
        }
    }
    
    if (inserted) {
        console.log('✅ ユーザー情報表示完了:', user.displayName || user.email);
        return true;
    } else {
        console.log('❌ ユーザー情報表示失敗');
        return false;
    }
}

// 手動でユーザー情報表示を試行する関数（デバッグ用）
window.forceShowUserInfo = function() {
    const user = getUser();
    if (user) {
        console.log('🔧 手動でユーザー情報表示試行');
        return forceDisplayUserInfo(user);
    } else {
        console.log('❌ ユーザー情報が見つかりません');
        return false;
    }
};

// 既存のナビゲーション生成関数をフック
if (typeof createNavigation === 'function') {
    const originalCreateNavigation = createNavigation;
    window.createNavigation = function() {
        console.log('🔄 ナビゲーション生成開始');
        originalCreateNavigation.call(this);
        
        // 少し待ってからユーザー情報表示
        setTimeout(() => {
            if (isLoggedIn()) {
                startUserInfoDisplayLoop();
            }
        }, 300);
    };
}

// DOM変更を監視してナビゲーション生成を検知
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE && 
                    (node.classList?.contains('navbar') || node.querySelector?.('.navbar'))) {
                    console.log('🔄 ナビゲーション要素追加検知');
                    setTimeout(() => {
                        if (isLoggedIn()) {
                            startUserInfoDisplayLoop();
                        }
                    }, 100);
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// グローバル関数として公開
window.saveLogin = saveLogin;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.getUser = getUser;

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', checkPageAccess);

console.log('✅ シンプル認証システム準備完了');
