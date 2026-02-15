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
                        <a href="forms.html" class="nav-link ${currentPage === 'forms.html' ? 'active' : ''}">
                            フォーム
                        </a>
                        <a href="templates.html" class="nav-link ${currentPage === 'templates.html' ? 'active' : ''}">
                            テンプレート
                        </a>
                        <a href="notifications.html" class="nav-link ${currentPage === 'notifications.html' ? 'active' : ''}">
                            お知らせ
                        </a>
                        <a href="settings.html" class="nav-link ${currentPage === 'settings.html' ? 'active' : ''}">
                            設定
                        </a>
                        <a href="${window.FEEDBACK_LINE_URL || 'https://line.me/ti/g2/YOUR_OPEN_CHAT_ID'}" target="_blank" rel="noopener noreferrer" class="nav-link nav-link-feedback">
                            意見箱
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
                    <a href="forms.html" class="mobile-menu-link ${currentPage === 'forms.html' ? 'active' : ''}">
                        フォーム
                    </a>
                    <a href="templates.html" class="mobile-menu-link ${currentPage === 'templates.html' ? 'active' : ''}">
                        テンプレート
                    </a>
                    <a href="notifications.html" class="mobile-menu-link ${currentPage === 'notifications.html' ? 'active' : ''}">
                        お知らせ
                    </a>
                    <a href="settings.html" class="mobile-menu-link ${currentPage === 'settings.html' ? 'active' : ''}">
                        設定
                    </a>
                    <a href="${window.FEEDBACK_LINE_URL || 'https://line.me/ti/g2/YOUR_OPEN_CHAT_ID'}" target="_blank" rel="noopener noreferrer" class="mobile-menu-link">
                        意見箱
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
            .nav-link-feedback {
                border: 1px solid rgba(255,255,255,0.25);
                margin-left: 0.25rem;
            }
            .nav-link-feedback:hover {
                background: rgba(255,255,255,0.2);
                border-color: rgba(255,255,255,0.4);
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
