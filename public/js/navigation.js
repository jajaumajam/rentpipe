// ナビゲーションシステム - ダッシュボード削除版
window.createNavigation = function() {
    const currentPage = window.location.pathname.split('/').pop() || 'customer.html';
    
    const nav = `
        <nav style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <h1 style="color: white; margin: 0; font-size: 1.25rem; font-weight: 600; letter-spacing: 0.5px;">
                        RentPipe
                    </h1>
                    <div style="display: flex; gap: 0.25rem;">
                        <a href="customer.html" class="nav-link ${currentPage === 'customer.html' ? 'active' : ''}">
                            <span>顧客管理</span>
                        </a>
                        <a href="pipeline.html" class="nav-link ${currentPage === 'pipeline.html' ? 'active' : ''}">
                            <span>パイプライン</span>
                        </a>
                        <a href="forms.html" class="nav-link ${currentPage === 'forms.html' ? 'active' : ''}">
                            <span>フォーム</span>
                        </a>
                        <a href="templates.html" class="nav-link ${currentPage === 'templates.html' ? 'active' : ''}">
                            <span>テンプレート</span>
                        </a>
                        <a href="notifications.html" class="nav-link ${currentPage === 'notifications.html' ? 'active' : ''}">
                            <span>お知らせ</span>
                        </a>
                        <a href="settings.html" class="nav-link ${currentPage === 'settings.html' ? 'active' : ''}">
                            <span>設定</span>
                        </a>
                        <a href="${window.FEEDBACK_LINE_URL || 'https://line.me/ti/g2/YOUR_OPEN_CHAT_ID'}" target="_blank" rel="noopener noreferrer" class="nav-link nav-link-feedback">
                            <span>意見箱</span>
                        </a>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div id="user-info" style="color: white; font-size: 0.9rem;"></div>
                    <button onclick="handleLogout()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                        ログアウト
                    </button>
                </div>
            </div>
        </nav>
        <style>
            .nav-link {
                color: rgba(255,255,255,0.85);
                text-decoration: none;
                padding: 0.4rem 0.75rem;
                border-radius: 6px;
                transition: all 200ms ease;
                font-weight: 500;
                font-size: 0.9rem;
                display: inline-block;
            }
            .nav-link:hover {
                background: rgba(255,255,255,0.12);
                color: white;
            }
            .nav-link.active {
                background: rgba(255,255,255,0.2);
                color: white;
                font-weight: 600;
            }
            .nav-link-feedback {
                border: 1px solid rgba(255,255,255,0.25);
                margin-left: 0.25rem;
            }
            .nav-link-feedback:hover {
                background: rgba(255,255,255,0.2);
                border-color: rgba(255,255,255,0.4);
            }
        </style>
    `;
    
    const navContainer = document.getElementById('navigation');
    if (navContainer) {
        navContainer.innerHTML = nav;
    }
    
    // ユーザー情報表示
    updateUserInfo();
};

// ユーザー情報更新
function updateUserInfo() {
    const authData = localStorage.getItem('google_auth_data');
    if (authData) {
        try {
            const data = JSON.parse(authData);
            const userInfoEl = document.getElementById('user-info');
            if (userInfoEl && data.email) {
                userInfoEl.textContent = data.email;
            }
        } catch (error) {
            console.warn('ユーザー情報表示エラー:', error);
        }
    }
}

// ログアウト処理
function handleLogout() {
    if (confirm('ログアウトしますか？')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// 自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.createNavigation);
} else {
    window.createNavigation();
}

console.log('✅ ナビゲーションシステム準備完了（ダッシュボードなし）');
