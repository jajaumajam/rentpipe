// 🧭 RentPipe 統一ナビゲーションシステム（完全版）
console.log('🧭 ナビゲーションシステム初期化中...');

// ナビゲーション作成関数
function createNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log(`📄 現在のページ: ${currentPage}`);
    
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
                <button onclick="secureLogout()" class="btn btn-outline nav-logout">
                    <span class="nav-icon">🚪</span>
                    <span>ログアウト</span>
                </button>
            </div>
        </div>
    </nav>`;
    
    // 既存のナビゲーションを削除（重複防止）
    const existingNav = document.querySelector('nav.navbar');
    if (existingNav) {
        existingNav.remove();
    }
    
    // ナビゲーションを挿入
    const navContainer = document.createElement('div');
    navContainer.innerHTML = navHTML;
    
    // main-navクラスのある要素に挿入、なければbodyの最初に挿入
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
        mainNav.appendChild(navContainer.firstElementChild);
    } else {
        document.body.insertBefore(navContainer.firstElementChild, document.body.firstChild);
    }
    
    // モバイルメニューのトグル機能を設定
    setupMobileMenu();
    
    // 開発者モードショートカットを設定
    setupDeveloperMode();
    
    console.log('✅ ナビゲーション作成完了');
}

// モバイルメニューの設定
function setupMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        // メニュートグルイベント
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
        
        // 画面クリック時にメニューを閉じる
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
        
        console.log('✅ モバイルメニュー設定完了');
    }
}

// 開発者モード設定
function setupDeveloperMode() {
    document.addEventListener('keydown', function(e) {
        if (e.shiftKey && e.ctrlKey && e.key === 'D') {
            console.log('🔧 開発者モード：データヘルス画面へ');
            if (confirm('開発者モードでデータヘルス画面に移動しますか？')) {
                window.location.href = 'data-health.html';
            }
        }
    });
}

// セキュアログアウト関数
function secureLogout() {
    if (!confirm('ログアウトしますか？')) {
        return;
    }
    
    console.log('🔒 完全ログアウト実行中...');
    
    try {
        // 1. 統合認証マネージャーのログアウト
        if (window.IntegratedAuthManagerV2 && typeof window.IntegratedAuthManagerV2.performFullLogout === 'function') {
            console.log('🔄 統合認証マネージャーでログアウト...');
            window.IntegratedAuthManagerV2.performFullLogout();
            return; // 統合認証マネージャーがリダイレクトを行う
        }
        
        // 2. Firebase認証ログアウト（利用可能な場合）
        if (window.firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                console.log('✅ Firebase認証ログアウト完了');
            }).catch(error => {
                console.warn('⚠️ Firebase認証ログアウトエラー:', error);
            });
        }
        
        // 3. LocalStorageの認証データクリア
        const authKeys = [
            'rentpipe_auth_simple',
            'rentpipe_user_simple', 
            'rentpipe_temp_auth',
            'rentpipe_user_info',
            'rentpipe_authenticated',
            'rentpipe_user',
            'rentpipe_auth',
            'google_auth_data',
            'google_access_token',
            'google_token_expiry'
        ];
        
        authKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ ${key} 削除完了`);
            }
        });
        
        // 4. SessionStorageクリア
        sessionStorage.clear();
        console.log('🗑️ SessionStorage クリア完了');
        
        console.log('✅ 完全ログアウト完了');
        
        // 5. ログイン画面にリダイレクト
        window.location.replace('login.html');
        
    } catch (error) {
        console.error('❌ ログアウトエラー:', error);
        
        // フォールバック: 強制的にLocalStorageをクリアしてリダイレクト
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('login.html');
    }
}

// ナビゲーション生成関数をグローバルに公開
window.generateNavigation = createNavigation;
window.createNavigation = createNavigation;
window.secureLogout = secureLogout;

// 互換性のため
if (typeof logout === 'undefined') {
    window.logout = secureLogout;
}

// 自動初期化
function initializeNavigation() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // 少し遅延させてナビゲーションを生成（CSSの読み込み完了を待つ）
            setTimeout(createNavigation, 100);
        });
    } else {
        // 既に読み込み完了している場合
        setTimeout(createNavigation, 100);
    }
}

// 初期化実行
initializeNavigation();

console.log('✅ 統一ナビゲーションシステム準備完了');
console.log('💡 使用方法: createNavigation() または generateNavigation()');
console.log('🔑 ショートカット: Shift+Ctrl+D で開発者モード');
