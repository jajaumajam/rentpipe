// RentPipe 統一認証システム
class UnifiedAuthManager {
    constructor() {
        this.AUTH_KEY = 'rentpipe_auth'; // 統一認証キー
        this.init();
    }

    init() {
        console.log('🔐 統一認証システム初期化中...');
        this.migrateOldAuthData();
        this.setupPeriodicCleanup();
    }

    // 古い認証データを新しい統一キーに移行
    migrateOldAuthData() {
        const oldKeys = [
            'rentpipe_demo_user',
            'rentpipe_current_user',
            'rentpipe_user_auth'
        ];

        let migratedData = null;

        // 古いキーからデータを探す
        for (const oldKey of oldKeys) {
            const oldData = localStorage.getItem(oldKey);
            if (oldData && !migratedData) {
                try {
                    const parsedData = JSON.parse(oldData);
                    if (parsedData.email) {
                        migratedData = parsedData;
                        console.log(`📦 ${oldKey} から認証データを移行`);
                        break;
                    }
                } catch (error) {
                    console.warn(`❌ ${oldKey} の解析に失敗:`, error);
                }
            }
        }

        // 新しい統一キーに移行
        if (migratedData) {
            migratedData.migratedAt = new Date().toISOString();
            localStorage.setItem(this.AUTH_KEY, JSON.stringify(migratedData));
            console.log('✅ 認証データの移行完了');
        }

        // 古いキーをクリーンアップ
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ 古い認証キー削除: ${key}`);
            }
        });
    }

    // 定期的なクリーンアップ
    setupPeriodicCleanup() {
        setInterval(() => {
            this.cleanupOldKeys();
        }, 60000); // 1分ごと
    }

    // 古いキーのクリーンアップ
    cleanupOldKeys() {
        const oldKeys = [
            'rentpipe_demo_user',
            'rentpipe_current_user',
            'rentpipe_user_auth',
            'customers', // 古い顧客データキー
            'rentpipe_customers' // 古い顧客データキー
        ];

        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 定期クリーンアップ: ${key}`);
            }
        });
    }

    // ログイン処理
    login(email, password, userData = {}) {
        try {
            const authData = {
                email: email,
                password: password,
                passwordHash: btoa(password),
                name: userData.name || email.split('@')[0],
                company: userData.company || '',
                phone: userData.phone || '',
                loginAt: new Date().toISOString(),
                isDemoUser: true,
                ...userData
            };

            localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
            console.log('✅ ログイン成功:', email);
            return { success: true, user: authData };

        } catch (error) {
            console.error('❌ ログイン処理エラー:', error);
            return { success: false, error: 'ログイン処理中にエラーが発生しました' };
        }
    }

    // ログアウト処理（完全版）
    logout() {
        try {
            // すべての認証関連キーを削除
            const allPossibleKeys = [
                'rentpipe_auth',           // 統一認証キー
                'rentpipe_demo_user',      // 古いキー1
                'rentpipe_current_user',   // 古いキー2
                'rentpipe_user_auth',      // 古いキー3
                'rentpipe_redirect_after_login', // リダイレクト情報
                'rentpipe_session_token'   // セッション情報
            ];

            allPossibleKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ ログアウト時削除: ${key}`);
                }
            });

            // セッションストレージもクリア
            sessionStorage.clear();
            
            console.log('✅ 完全ログアウト完了');
            return true;

        } catch (error) {
            console.error('❌ ログアウト処理エラー:', error);
            return false;
        }
    }

    // 認証状態の確認
    isAuthenticated() {
        const authData = localStorage.getItem(this.AUTH_KEY);
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                return !!(parsed.email);
            } catch (error) {
                console.error('❌ 認証データ解析エラー:', error);
                return false;
            }
        }
        return false;
    }

    // ユーザー情報の取得
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const authData = localStorage.getItem(this.AUTH_KEY);
            return JSON.parse(authData);
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            return null;
        }
    }

    // パスワード更新
    updatePassword(newPassword) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                return false;
            }

            currentUser.password = newPassword;
            currentUser.passwordHash = btoa(newPassword);
            currentUser.passwordUpdatedAt = new Date().toISOString();

            localStorage.setItem(this.AUTH_KEY, JSON.stringify(currentUser));
            console.log('✅ パスワード更新完了');
            return true;

        } catch (error) {
            console.error('❌ パスワード更新エラー:', error);
            return false;
        }
    }

    // プロフィール更新
    updateProfile(profileData) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                return false;
            }

            // プロフィールデータをマージ
            Object.assign(currentUser, profileData);
            currentUser.profileUpdatedAt = new Date().toISOString();

            localStorage.setItem(this.AUTH_KEY, JSON.stringify(currentUser));
            console.log('✅ プロフィール更新完了');
            return true;

        } catch (error) {
            console.error('❌ プロフィール更新エラー:', error);
            return false;
        }
    }

    // パスワード照合
    verifyPassword(inputPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return false;
        }

        // 複数の形式で照合
        return (
            currentUser.password === inputPassword ||
            currentUser.passwordHash === btoa(inputPassword) ||
            (currentUser.email === 'demo@rentpipe.jp' && inputPassword === 'demo123')
        );
    }

    // アカウント完全削除
    deleteAccount() {
        try {
            // 全データ削除
            const allKeys = Object.keys(localStorage);
            const rentpipeKeys = allKeys.filter(key => key.startsWith('rentpipe_'));
            
            rentpipeKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ アカウント削除: ${key}`);
            });

            // 削除フラグ設定
            localStorage.setItem('rentpipe_account_deleted', 'true');
            sessionStorage.clear();

            console.log('✅ アカウント完全削除完了');
            return true;

        } catch (error) {
            console.error('❌ アカウント削除エラー:', error);
            return false;
        }
    }
}

// グローバルインスタンス
window.UnifiedAuth = new UnifiedAuthManager();

// 既存のコードとの互換性のための関数
window.logout = function() {
    if (confirm('ログアウトしますか？')) {
        if (window.UnifiedAuth.logout()) {
            console.log('✅ ログアウト完了、ログイン画面にリダイレクト');
            window.location.replace('login.html');
        } else {
            alert('ログアウト処理でエラーが発生しました');
        }
    }
};

console.log('✅ 統一認証システム準備完了');
