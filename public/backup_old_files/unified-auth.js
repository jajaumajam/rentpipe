// 📝 統一認証システム（Google認証対応版）
console.log('🔐 統一認証システム（Google認証対応版）初期化中...');

window.UnifiedAuth = {
    AUTH_KEY: 'rentpipe_unified_auth',
    SESSION_KEY: 'rentpipe_session',

    // 認証チェック（複数の認証システム対応）
    checkSession: function() {
        console.log('🔍 マルチ認証チェック開始...');
        
        // 1. Google認証データをチェック
        const googleAuth = this.checkGoogleAuth();
        if (googleAuth) {
            console.log('✅ Google認証で認証済み:', googleAuth.email);
            return true;
        }
        
        // 2. 既存の統一認証データをチェック
        const unifiedAuth = this.checkUnifiedAuth();
        if (unifiedAuth) {
            console.log('✅ 統一認証で認証済み:', unifiedAuth.email);
            return true;
        }
        
        // 3. シンプル認証データをチェック
        const simpleAuth = this.checkSimpleAuth();
        if (simpleAuth) {
            console.log('✅ シンプル認証で認証済み:', simpleAuth.email);
            return true;
        }
        
        // 4. レガシー認証データをチェック
        const legacyAuth = this.checkLegacyAuth();
        if (legacyAuth) {
            console.log('✅ レガシー認証で認証済み:', legacyAuth.email);
            return true;
        }
        
        console.log('❌ 全ての認証システムで未認証');
        return false;
    },
    
    // Google認証チェック
    checkGoogleAuth: function() {
        try {
            const googleAuthData = localStorage.getItem('google_auth_simple');
            if (googleAuthData) {
                const googleAuth = JSON.parse(googleAuthData);
                const now = Date.now();
                
                if (!googleAuth.expires || now < googleAuth.expires) {
                    return {
                        email: googleAuth.email,
                        name: googleAuth.name,
                        source: 'google'
                    };
                } else {
                    console.warn('⚠️ Google認証トークンが期限切れ');
                    localStorage.removeItem('google_auth_simple');
                }
            }
        } catch (error) {
            console.warn('⚠️ Google認証データ確認エラー:', error);
        }
        return null;
    },
    
    // 統一認証チェック
    checkUnifiedAuth: function() {
        try {
            const authData = localStorage.getItem(this.AUTH_KEY);
            if (authData) {
                const auth = JSON.parse(authData);
                if (auth.isAuthenticated && auth.user) {
                    return {
                        email: auth.user.email,
                        name: auth.user.displayName || auth.user.email,
                        source: 'unified'
                    };
                }
            }
        } catch (error) {
            console.warn('⚠️ 統一認証データ確認エラー:', error);
        }
        return null;
    },
    
    // シンプル認証チェック
    checkSimpleAuth: function() {
        try {
            const simpleAuth = localStorage.getItem('rentpipe_auth_simple');
            const simpleUser = localStorage.getItem('rentpipe_user_simple');
            
            if (simpleAuth === 'logged_in' && simpleUser) {
                const user = JSON.parse(simpleUser);
                return {
                    email: user.email,
                    name: user.name,
                    source: 'simple'
                };
            }
        } catch (error) {
            console.warn('⚠️ シンプル認証データ確認エラー:', error);
        }
        return null;
    },
    
    // レガシー認証チェック
    checkLegacyAuth: function() {
        try {
            const legacyAuth = localStorage.getItem('rentpipe_authenticated');
            const legacyUser = localStorage.getItem('rentpipe_user');
            
            if (legacyAuth === 'true' && legacyUser) {
                const user = JSON.parse(legacyUser);
                return {
                    email: user.email,
                    name: user.displayName || user.email,
                    source: 'legacy'
                };
            }
        } catch (error) {
            console.warn('⚠️ レガシー認証データ確認エラー:', error);
        }
        return null;
    },

    // ユーザー情報取得
    getCurrentUser: function() {
        // 最初に見つかった有効な認証データを返す
        return this.checkGoogleAuth() || 
               this.checkUnifiedAuth() || 
               this.checkSimpleAuth() || 
               this.checkLegacyAuth() || 
               null;
    },

    // 認証が必要なページの保護
    requireAuth: function() {
        console.log('🔒 認証必須ページ - 認証チェック実行中...');
        
        if (!this.checkSession()) {
            console.log('❌ 未認証のためログインページにリダイレクト');
            
            // 現在のページをセッションに保存（認証後に戻るため）
            sessionStorage.setItem('rentpipe_return_url', window.location.href);
            
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('✅ 認証OK - ページアクセス許可');
        return true;
    },

    // ログイン処理
    login: function(userData, authMethod = 'default') {
        const authData = {
            isAuthenticated: true,
            user: {
                id: userData.id || userData.uid,
                email: userData.email,
                displayName: userData.name || userData.displayName,
                photoURL: userData.picture || userData.photoURL
            },
            sessionId: this.generateSessionId(),
            loginTime: Date.now(),
            authMethod: authMethod
        };

        localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
        localStorage.setItem(this.SESSION_KEY, authData.sessionId);

        console.log('✅ ログイン成功:', userData.email);
        
        // 保存されたリターンURLがあれば、そこにリダイレクト
        const returnUrl = sessionStorage.getItem('rentpipe_return_url');
        if (returnUrl) {
            sessionStorage.removeItem('rentpipe_return_url');
            window.location.href = returnUrl;
        }
        
        return true;
    },

    // ログアウト処理
    logout: function() {
        console.log('🔒 統一認証ログアウト開始...');
        
        // 全ての認証データをクリア
        const authKeys = [
            'google_auth_simple',
            'rentpipe_authenticated', 
            'rentpipe_user',
            'rentpipe_auth_simple',
            'rentpipe_user_simple',
            this.AUTH_KEY,
            this.SESSION_KEY
        ];
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        console.log('✅ 全認証データクリア完了');
        window.location.href = 'login.html';
    },

    // セッションID生成
    generateSessionId: function() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    // パスワード変更（デモ）
    changePassword: function(currentPassword, newPassword) {
        if (!this.checkSession()) {
            console.log('❌ パスワード変更: 未認証');
            return false;
        }
        
        // デモ実装
        console.log('✅ パスワード変更成功（デモ）');
        return true;
    },

    // 認証状態の詳細取得
    getAuthDetails: function() {
        const googleAuth = this.checkGoogleAuth();
        const unifiedAuth = this.checkUnifiedAuth();
        const simpleAuth = this.checkSimpleAuth();
        const legacyAuth = this.checkLegacyAuth();
        
        return {
            isAuthenticated: !!(googleAuth || unifiedAuth || simpleAuth || legacyAuth),
            activeAuth: googleAuth || unifiedAuth || simpleAuth || legacyAuth || null,
            availableAuths: {
                google: !!googleAuth,
                unified: !!unifiedAuth,
                simple: !!simpleAuth,
                legacy: !!legacyAuth
            }
        };
    }
};

// ページ保護機能（自動実行しない版）
function initPageProtection() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'customer.html', 'pipeline.html', 'customer-detail.html'];
    
    console.log(`🔍 ページ保護チェック: ${currentPage}`);
    
    if (protectedPages.includes(currentPage)) {
        // 認証チェックを実行するが、即座にリダイレクトしない
        setTimeout(() => {
            if (!window.UnifiedAuth.checkSession()) {
                console.log('⚠️ 未認証ページアクセス検出 - 3秒後にログインページへ');
                
                // 3秒の猶予を与える（他のスクリプトが認証データを設定する時間）
                setTimeout(() => {
                    if (!window.UnifiedAuth.checkSession()) {
                        window.UnifiedAuth.requireAuth();
                    }
                }, 3000);
            }
        }, 1000);
    }
}

// ナビゲーション更新
function updateNavigation() {
    const user = window.UnifiedAuth.getCurrentUser();
    if (user) {
        console.log('👤 ナビゲーション更新:', user.name);
        
        // ユーザー情報をナビゲーションに表示
        const navbar = document.querySelector('.navbar .nav-container, .nav-container');
        if (navbar && !navbar.querySelector('.user-info')) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.style.cssText = 'display: flex; align-items: center; gap: 8px; color: white; font-size: 14px; margin-left: auto;';
            userInfo.innerHTML = `
                <span>👤 ${user.name}</span>
                <button onclick="window.UnifiedAuth.logout()" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">ログアウト</button>
            `;
            navbar.appendChild(userInfo);
        }
    }
}

// グローバルオブジェクトとして公開
window.AuthManager = window.UnifiedAuth; // 後方互換性

// DOMが読み込まれてから初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 統一認証システム（Google認証対応版）準備完了');
    
    // ページ保護機能を初期化（遅延実行）
    setTimeout(initPageProtection, 500);
    
    // ナビゲーション更新
    setTimeout(updateNavigation, 1000);
});

console.log('✅ 統一認証システム（Google認証対応版）読み込み完了');
