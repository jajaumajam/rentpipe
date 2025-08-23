// RentPipe 統一ナビゲーションシステム（データヘルス管理対応版）
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
                <a href="data-health.html" class="nav-link ${currentPage === 'data-health.html' ? 'active' : ''}">
                    <span class="nav-icon">🔍</span>
                    <span>データヘルス</span>
                </a>
                <a href="profile.html" class="nav-link ${currentPage === 'profile.html' ? 'active' : ''}">
                    <span class="nav-icon">👤</span>
                    <span>プロフィール</span>
                </a>
                <button onclick="secureLogout()" class="btn btn-outline nav-logout">ログアウト</button>
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

// セキュアログアウト関数
function secureLogout() {
    if (confirm('ログアウトしますか？')) {
        console.log('🔒 セキュアログアウト開始...');
        
        // 統一認証システムを使用してログアウト
        if (window.UnifiedAuth) {
            if (window.UnifiedAuth.logout()) {
                console.log('✅ 統一認証システムでログアウト完了');
            }
        }
        
        // フォールバック: 手動で全キー削除
        const allKeys = Object.keys(localStorage);
        const authKeys = allKeys.filter(key => 
            key.startsWith('rentpipe_') && 
            !key.includes('account_deleted') && 
            !key.includes('user_profile')
        );
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ フォールバック削除: ${key}`);
        });
        
        // セッションクリア
        sessionStorage.clear();
        
        // ログイン画面にリダイレクト（replaceを使用して履歴をクリア）
        console.log('🔄 ログイン画面にリダイレクト...');
        window.location.replace('login.html');
    }
}

// 既存関数との互換性
if (typeof logout === 'undefined') {
    window.logout = secureLogout;
}

// DOMContentLoadedで実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavigation);
} else {
    createNavigation();
}

console.log('✅ データヘルス対応統一ナビゲーションシステム準備完了');
