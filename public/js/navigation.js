// ナビゲーションシステム - モバイル対応ハンバーガーメニュー版
window.createNavigation = function() {
    const currentPage = window.location.pathname.split('/').pop() || 'customer.html';

    const nav = `
        <nav style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0.75rem 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative;">
            <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                <!-- ロゴ -->
                <h1 style="color: white; margin: 0; font-size: 1.25rem; font-weight: 600; letter-spacing: 0.5px;">
                    RentPipe
                </h1>

                <!-- デスクトップメニュー -->
                <div class="nav-desktop" style="display: flex; align-items: center; gap: 2rem;">
                    <div style="display: flex; gap: 0.25rem;">
                        <a href="customer.html" class="nav-link ${currentPage === 'customer.html' ? 'active' : ''}">
                            顧客管理
                        </a>
                        <a href="pipeline.html" class="nav-link ${currentPage === 'pipeline.html' ? 'active' : ''}">
                            パイプライン
                        </a>
                        <a href="forms.html" class="nav-link ${currentPage === 'forms.html' ? 'active' : ''}" onclick="return handleRestrictedNav(event, 'googleForms')">
                            ${getMenuLabel('フォーム', 'googleForms')}
                        </a>
                        <a href="templates.html" class="nav-link ${currentPage === 'templates.html' ? 'active' : ''}" onclick="return handleRestrictedNav(event, 'templates')">
                            ${getMenuLabel('テンプレート', 'templates')}
                        </a>
                        <a href="notifications.html" class="nav-link ${currentPage === 'notifications.html' ? 'active' : ''}">
                            お知らせ
                        </a>
                        <a href="settings.html" class="nav-link ${currentPage === 'settings.html' ? 'active' : ''}">
                            設定
                        </a>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div id="user-info" style="color: white; font-size: 0.85rem; white-space: nowrap;"></div>
                        <button onclick="handleLogout()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; white-space: nowrap;">
                            ログアウト
                        </button>
                    </div>
                </div>

                <!-- モバイルメニューボタン -->
                <div class="nav-mobile-controls" style="display: none; align-items: center; gap: 0.5rem;">
                    <div id="user-info-mobile" style="color: white; font-size: 0.75rem;"></div>
                    <button id="mobile-menu-toggle" onclick="toggleMobileMenu()" style="background: none; border: none; color: white; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- モバイルドロワーメニュー -->
            <div id="mobile-menu" class="mobile-menu" style="display: none;">
                <div class="mobile-menu-content">
                    <a href="customer.html" class="mobile-menu-link ${currentPage === 'customer.html' ? 'active' : ''}">
                        顧客管理
                    </a>
                    <a href="pipeline.html" class="mobile-menu-link ${currentPage === 'pipeline.html' ? 'active' : ''}">
                        パイプライン
                    </a>
                    <a href="forms.html" class="mobile-menu-link ${currentPage === 'forms.html' ? 'active' : ''}" onclick="return handleRestrictedNav(event, 'googleForms')">
                        ${getMenuLabel('フォーム', 'googleForms')}
                    </a>
                    <a href="templates.html" class="mobile-menu-link ${currentPage === 'templates.html' ? 'active' : ''}" onclick="return handleRestrictedNav(event, 'templates')">
                        ${getMenuLabel('テンプレート', 'templates')}
                    </a>
                    <a href="notifications.html" class="mobile-menu-link ${currentPage === 'notifications.html' ? 'active' : ''}">
                        お知らせ
                    </a>
                    <a href="settings.html" class="mobile-menu-link ${currentPage === 'settings.html' ? 'active' : ''}">
                        設定
                    </a>
                    <div style="border-top: 1px solid rgba(255,255,255,0.2); margin: 0.5rem 0; padding-top: 0.5rem;">
                        <button onclick="handleLogout()" style="width: 100%; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <style>
            /* デスクトップメニュー */
            .nav-link {
                color: rgba(255,255,255,0.85);
                text-decoration: none;
                padding: 0.4rem 0.75rem;
                border-radius: 6px;
                transition: all 200ms ease;
                font-weight: 500;
                font-size: 0.9rem;
                display: inline-block;
                white-space: nowrap;
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

            /* モバイルメニュー */
            .mobile-menu {
                background: rgba(102, 126, 234, 0.98);
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                z-index: 999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: slideDown 0.2s ease-out;
            }
            .mobile-menu-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0.5rem;
            }
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .mobile-menu-link {
                display: block;
                color: white;
                text-decoration: none;
                padding: 0.75rem 1rem;
                border-radius: 6px;
                transition: background 200ms ease;
                font-size: 0.95rem;
            }
            .mobile-menu-link:hover {
                background: rgba(255,255,255,0.15);
            }
            .mobile-menu-link.active {
                background: rgba(255,255,255,0.25);
                font-weight: 600;
            }

            /* レスポンシブ */
            @media (max-width: 1024px) {
                .nav-desktop {
                    gap: 1rem !important;
                }
                .nav-link {
                    font-size: 0.85rem;
                    padding: 0.35rem 0.6rem;
                }
            }

            @media (max-width: 768px) {
                .nav-desktop {
                    display: none !important;
                }
                .nav-mobile-controls {
                    display: flex !important;
                }
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

// モバイルメニュー開閉
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    console.log('Toggle mobile menu:', menu);
    if (menu) {
        const isHidden = menu.style.display === 'none' || menu.style.display === '';
        menu.style.display = isHidden ? 'block' : 'none';
        console.log('Menu display:', menu.style.display);
    } else {
        console.error('Mobile menu element not found');
    }
};

// ユーザー情報更新
function updateUserInfo() {
    const authData = localStorage.getItem('google_auth_data');
    if (authData) {
        try {
            const data = JSON.parse(authData);
            const userInfoEl = document.getElementById('user-info');
            const userInfoMobileEl = document.getElementById('user-info-mobile');

            if (data.email) {
                const emailShort = data.email.split('@')[0];
                if (userInfoEl) userInfoEl.textContent = emailShort;
                if (userInfoMobileEl) userInfoMobileEl.textContent = emailShort;
            }
        } catch (e) {
            console.error('Failed to parse auth data:', e);
        }
    }
}

// ログアウト処理
window.handleLogout = function() {
    if (confirm('ログアウトしますか？')) {
        // すべての認証情報をクリア
        localStorage.removeItem('google_auth_data');
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        localStorage.removeItem('rentpipe_auth');
        localStorage.removeItem('rentpipe_auth_simple');
        localStorage.removeItem('rentpipe_user_info');

        // ログアウトフラグをセット（login.htmlで自動ログインを防ぐ）
        sessionStorage.setItem('just_logged_out', 'true');

        window.location.href = 'login.html';
    }
};

// ナビゲーション読み込み（互換性のため）
window.loadNavigation = function() {
    window.createNavigation();
};

// メニューラベルのロック表示ヘルパー（BETA_MODE=false かつ無料プランの場合のみ🔒を付与）
function getMenuLabel(label, featureName) {
    if (window.featureFlags && !window.featureFlags.isBetaMode()) {
        const plan = localStorage.getItem('user_plan') || 'free';
        if (!window.featureFlags.hasAccess(featureName, plan)) {
            return `${label} 🔒`;
        }
    }
    return label;
}

// 制限機能のナビゲーションハンドラ（BETA_MODE=false かつ無料プランの場合はモーダルを表示）
window.handleRestrictedNav = function(event, featureName) {
    if (window.featureFlags && !window.featureFlags.isBetaMode()) {
        const plan = localStorage.getItem('user_plan') || 'free';
        if (!window.featureFlags.hasAccess(featureName, plan)) {
            event.preventDefault();
            window.featureFlags.showUpgradeModal(featureName);
            return false;
        }
    }
    return true;
};

// フッター生成（全認証後ページ共通）
window.createFooter = function() {
    const isBeta = window.featureFlags ? window.featureFlags.isBetaMode() : true;
    const tokushohoLink = isBeta
        ? ''
        : '<a href="tokushoho.html">特定商取引法に基づく表記</a>';

    const footerHTML = `
<footer style="margin-top:40px;padding:24px 20px;text-align:center;border-top:1px solid #e5e7eb;background:#f9fafb;">
    <style>
        .app-footer a{color:#6b7280;text-decoration:none;font-size:13px;margin:0 10px;}
        .app-footer a:hover{color:#374151;}
        .app-footer-links{margin-bottom:8px;}
        .app-footer-copy{font-size:12px;color:#9ca3af;}
    </style>
    <div class="app-footer">
        <div class="app-footer-links">
            <a href="about.html">RentPipeについて</a>
            <a href="help.html">よくある質問</a>
            <a href="privacy.html">プライバシーポリシー</a>
            <a href="terms.html">利用規約</a>
            ${tokushohoLink}
        </div>
        <div class="app-footer-copy">&copy; 2025 RentPipe. All rights reserved.</div>
    </div>
</footer>`;

    document.body.insertAdjacentHTML('beforeend', footerHTML);
};

// フッターを描画
window.createFooter();

// 法的ページ用ヘッダー（認証状態に応じてヘッダーを切り替え）
window.createLegalHeader = function() {
    const authData = localStorage.getItem('google_auth_data');
    const isLoggedIn = !!authData;

    if (isLoggedIn) {
        // ログイン済み → 通常ナビバーを #navigation に挿入
        window.createNavigation();
    } else {
        // 未ログイン → ロゴ＋ログインリンクのシンプルヘッダーに置き換え
        const headerEl = document.getElementById('navigation');
        if (headerEl) {
            headerEl.style.cssText =
                'background:#1e40af;color:white;padding:16px 24px;' +
                'display:flex;align-items:center;justify-content:space-between;';
            headerEl.innerHTML =
                '<span style="font-size:20px;font-weight:700;">🏠 RentPipe</span>' +
                '<a href="login.html" style="color:white;background:rgba(255,255,255,0.2);' +
                'border:1px solid rgba(255,255,255,0.4);padding:6px 14px;border-radius:6px;' +
                'font-size:13px;text-decoration:none;">ログイン →</a>';
        }
    }
};
