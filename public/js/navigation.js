// RentPipe 共通ナビゲーションコンポーネント
function createNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const navHTML = `
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <span class="logo-icon">🏠</span>
                <span class="logo-text">RentPipe</span>
            </div>
            
            <button class="nav-toggle" id="navToggle" aria-label="メニュー">
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            <div class="nav-menu" id="navMenu">
                <a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}">
                    <span class="nav-icon">📊</span>
                    <span>ダッシュボード</span>
                </a>
                <a href="customer.html" class="nav-link ${currentPage === 'customer.html' ? 'active' : ''}">
                    <span class="nav-icon">👥</span>
                    <span>顧客管理</span>
                </a>
                <a href="pipeline.html" class="nav-link ${currentPage === 'pipeline.html' ? 'active' : ''}">
                    <span class="nav-icon">📈</span>
                    <span>パイプライン</span>
                </a>
                <a href="profile.html" class="nav-link ${currentPage === 'profile.html' ? 'active' : ''}">
                    <span class="nav-icon">👤</span>
                    <span>プロフィール</span>
                </a>
                <button onclick="logout()" class="btn btn-outline nav-logout">ログアウト</button>
            </div>
        </div>
    </nav>`;
    
    // ナビゲーションを挿入
    const navContainer = document.createElement('div');
    navContainer.innerHTML = navHTML;
    document.body.insertBefore(navContainer.firstElementChild, document.body.firstChild);
    
    // モバイルメニューのトグル機能
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // メニューリンククリック時にモバイルメニューを閉じる
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// ログアウト関数（既存のものがない場合のフォールバック）
if (typeof logout === 'undefined') {
    function logout() {
        if (confirm('ログアウトしますか？')) {
            // 全てのローカルストレージデータをクリア
            const keysToKeep = ['rentpipe_user_profile']; // プロフィール情報は保持
            const keysToRemove = [
                'rentpipe_demo_user',
                'rentpipe_current_user',
                'rentpipe_stable_customers',
                'rentpipe_demo_customers'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('✅ ログアウト完了');
            window.location.href = 'login.html';
        }
    }
}

// DOMContentLoadedで実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavigation);
} else {
    createNavigation();
}

console.log('✅ 統一ナビゲーションシステム準備完了（プロフィール対応版）');
