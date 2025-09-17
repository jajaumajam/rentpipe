// RentPipe 統一ナビゲーションシステム（エンドユーザー向け最終版）
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

    // 開発者モード：Shift+Ctrl+D でデータヘルス画面にアクセス
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.ctrlKey && e.key === 'D') {
            console.log('🔧 開発者モード：データヘルス画面へ');
            window.location.href = 'data-health.html';
        }
    });
}

// セキュアログアウト関数
// セキュアログアウト関数（完全版）
function secureLogout() {
    if (confirm("ログアウトしますか？")) {
        console.log("🔒 完全ログアウト実行中...");
        
        // 1. Firebase認証の完全ログアウト
        if (window.firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                console.log("✅ Firebase認証ログアウト完了");
            }).catch(error => {
                console.warn("⚠️ Firebase認証ログアウトエラー:", error);
            });
        }
        
        // 2. LocalStorageの全認証データクリア
        const authKeys = [
            "rentpipe_auth_simple",
            "rentpipe_user_simple", 
            "rentpipe_temp_auth",
            "rentpipe_user_info",
            "rentpipe_authenticated",
            "rentpipe_user"
        ];
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ ${key} 削除`);
        });
        
        // 3. SessionStorageもクリア
        sessionStorage.clear();
        
        // 4. Firebase関連のIndexedDBクリア（可能な場合）
        try {
            const firebaseKeys = Object.keys(localStorage).filter(key => 
                key.startsWith("firebase:") || key.startsWith("firebaseui")
            );
            firebaseKeys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn("Firebase IndexedDB クリア警告:", e);
        }
        
        console.log("✅ 全認証データクリア完了");
        
        // 5. ログインページに強制リダイレクト（履歴クリア）
        setTimeout(() => {
            window.location.replace("login.html");
        }, 500);
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

console.log('✅ エンドユーザー向け最終版ナビゲーションシステム準備完了');
console.log('💡 開発者向け：Shift+Ctrl+D でデータヘルス画面にアクセス可能');

// 顧客詳細ページ専用の追加機能
function enhanceNavigationForCustomerDetail() {
    const currentPath = window.location.pathname;
    
    // customer-detail.htmlの場合のみ実行
    if (currentPath.includes('customer-detail.html')) {
        console.log('🎯 顧客詳細ページ: ナビゲーション調整中...');
        
        // 顧客管理をアクティブに設定
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // customer.htmlリンクを見つけてアクティブにする
            if (link.href.includes('customer.html')) {
                link.classList.add('active');
                console.log('✅ 顧客管理メニューをアクティブに設定');
            }
        });
        
        // ページタイトルも調整
        document.title = '顧客詳細 - RentPipe';
    }
}

// 既存のcreateNavigation関数実行後に追加処理を実行
const originalCreateNavigation = createNavigation;
createNavigation = function() {
    // 既存の処理を実行
    originalCreateNavigation();
    
    // customer-detail.html用の追加処理
    setTimeout(enhanceNavigationForCustomerDetail, 100);
};

// 既にナビゲーションが作成済みの場合は即座に実行
if (document.querySelector('.navbar')) {
    enhanceNavigationForCustomerDetail();
}

console.log('✅ 顧客詳細ページ対応を追加しました');
