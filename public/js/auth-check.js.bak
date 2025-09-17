// RentPipe 認証チェックスクリプト
console.log('🔒 認証チェックを実行中...');

// ログアウト関数（グローバル）
window.logout = function() {
    if (confirm('ログアウトしますか？')) {
        if (window.AuthManager) {
            window.AuthManager.logout();
        } else {
            // フォールバック
            localStorage.removeItem('rentpipe_auth');
            window.location.href = 'login.html';
        }
    }
};

// 認証チェック実行
document.addEventListener('DOMContentLoaded', function() {
    // ログインページは除外
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // 顧客フォームページも除外（外部公開用）
    if (window.location.pathname.includes('customer-form.html')) {
        return;
    }
    
    // 認証マネージャーが読み込まれるまで少し待つ
    setTimeout(() => {
        if (window.AuthManager) {
            // 認証チェック
            if (!window.AuthManager.requireAuth()) {
                console.log('❌ 未認証のためログインページにリダイレクトします');
                return;
            }
            
            // 認証済みの場合、ユーザー情報を表示
            const user = window.AuthManager.getUserInfo();
            if (user) {
                console.log('✅ 認証済みユーザー:', user.email);
                
                // ナビゲーションにユーザー情報を表示（オプション）
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && !document.getElementById('userInfo')) {
                    const userInfo = document.createElement('div');
                    userInfo.id = 'userInfo';
                    userInfo.style.cssText = 'padding: 10px; color: #666; font-size: 12px;';
                    userInfo.innerHTML = `👤 ${user.email}`;
                    navMenu.insertBefore(userInfo, navMenu.querySelector('button'));
                }
            }
        } else {
            console.error('❌ 認証マネージャーが読み込まれていません');
            // 安全のためログインページにリダイレクト
            window.location.href = 'login.html';
        }
    }, 100);
});
