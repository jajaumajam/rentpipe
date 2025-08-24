// RentPipe 統一認証システム（データ保護強化版）
class UnifiedAuth {
    constructor() {
        this.AUTH_KEY = 'rentpipe_auth';
        this.SESSION_KEY = 'rentpipe_session';
        this.DEMO_ACCOUNT = {
            email: 'demo@rentpipe.jp',
            name: 'デモユーザー',
            role: 'agent',
            id: 'demo-user-001'
        };
        
        console.log('🔐 統一認証システム初期化（データ保護強化版）');
        this.init();
    }

    init() {
        // セッション確認時にデータは保護する
        this.checkSession();
        
        // ページリロード時の認証確認
        window.addEventListener('beforeunload', () => {
            console.log('📄 ページリロード中 - データは保護されます');
        });
    }

    // ログイン処理（データ保護）
    login(email, password) {
        console.log('🔑 ログイン試行:', email);
        
        // デモアカウントの認証
        if (email === this.DEMO_ACCOUNT.email && 
            (password === 'demo123' || password === 'password')) {
            
            const authData = {
                user: this.DEMO_ACCOUNT,
                loginTime: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };
            
            // 認証情報のみを保存（顧客データは保護）
            localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
            localStorage.setItem(this.SESSION_KEY, authData.sessionId);
            
            console.log('✅ ログイン成功 - 顧客データは保護されます');
            return true;
        }
        
        console.log('❌ ログイン失敗');
        return false;
    }

    // ログアウト処理（データ保護強化版）
    logout() {
        console.log('🔐 安全なログアウト開始...');
        
        // ⚠️ 重要：顧客データを保護するため、認証データのみ削除
        const protectedKeys = [
            'rentpipe_customers',
            'rentpipe_pipeline_history', 
            'rentpipe_user_profile'
        ];
        
        // 顧客データのバックアップを作成
        const customerBackup = {};
        protectedKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                customerBackup[key] = data;
                console.log(`💾 データ保護: ${key} をバックアップ`);
            }
        });
        
        // 認証関連キーのみ削除
        const authKeys = [
            this.AUTH_KEY,
            this.SESSION_KEY
        ];
        
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ 認証データ削除: ${key}`);
        });
        
        // 顧客データを復元
        Object.keys(customerBackup).forEach(key => {
            localStorage.setItem(key, customerBackup[key]);
            console.log(`🔄 データ復元: ${key}`);
        });
        
        // セッションクリア
        sessionStorage.clear();
        
        console.log('✅ 安全なログアウト完了 - 顧客データは保護されました');
        return true;
    }

    // セッション確認（データ保護）
    checkSession() {
        const authData = localStorage.getItem(this.AUTH_KEY);
        const sessionId = localStorage.getItem(this.SESSION_KEY);
        
        if (!authData || !sessionId) {
            console.log('📋 未認証状態');
            return false;
        }
        
        try {
            const auth = JSON.parse(authData);
            if (auth.sessionId === sessionId) {
                console.log('✅ 認証済み:', auth.user.name);
                return true;
            }
        } catch (error) {
            console.error('❌ 認証データ破損:', error);
        }
        
        return false;
    }

    // 現在のユーザー情報取得
    getCurrentUser() {
        const authData = localStorage.getItem(this.AUTH_KEY);
        if (!authData) return null;
        
        try {
            const auth = JSON.parse(authData);
            return auth.user;
        } catch (error) {
            console.error('❌ ユーザー情報取得エラー:', error);
            return null;
        }
    }

    // 認証が必要なページの保護
    requireAuth() {
        if (!this.checkSession()) {
            console.log('🔒 認証が必要 - ログイン画面にリダイレクト');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // セッションID生成
    generateSessionId() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // パスワード変更
    changePassword(currentPassword, newPassword) {
        if (!this.checkSession()) {
            console.log('❌ パスワード変更: 未認証');
            return false;
        }
        
        const authData = localStorage.getItem(this.AUTH_KEY);
        if (!authData) return false;
        
        try {
            const auth = JSON.parse(authData);
            
            // デモアカウントのパスワード変更をシミュレート
            if (currentPassword === 'demo123' || currentPassword === 'password') {
                // 新しいセッションID生成
                auth.sessionId = this.generateSessionId();
                auth.passwordChanged = new Date().toISOString();
                
                localStorage.setItem(this.AUTH_KEY, JSON.stringify(auth));
                localStorage.setItem(this.SESSION_KEY, auth.sessionId);
                
                console.log('✅ パスワード変更成功');
                return true;
            }
        } catch (error) {
            console.error('❌ パスワード変更エラー:', error);
        }
        
        return false;
    }

    // アカウント削除（データ保護）
    deleteAccount() {
        if (!confirm('本当にアカウントを削除しますか？この操作は取り消しできません。')) {
            return false;
        }
        
        if (!confirm('全ての顧客データも削除されます。本当によろしいですか？')) {
            return false;
        }
        
        console.log('🗑️ アカウント削除開始...');
        
        // 全データを削除（アカウント削除の場合は顧客データも削除）
        const allKeys = Object.keys(localStorage);
        const rentpipeKeys = allKeys.filter(key => key.startsWith('rentpipe_'));
        
        rentpipeKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ データ削除: ${key}`);
        });
        
        // 削除フラグを設定
        localStorage.setItem('rentpipe_account_deleted', new Date().toISOString());
        
        // セッションクリア
        sessionStorage.clear();
        
        console.log('✅ アカウント削除完了');
        return true;
    }
}

// グローバルインスタンスを作成
window.UnifiedAuth = new UnifiedAuth();

// 認証が必要なページでの自動認証確認
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // ログイン画面以外は認証確認
    if (currentPage !== 'login.html' && currentPage !== '') {
        window.UnifiedAuth.requireAuth();
    }
});

// 既存システムとの互換性
if (typeof logout === 'undefined') {
    window.logout = () => window.UnifiedAuth.logout();
}

console.log('✅ 統一認証システム準備完了（データ保護強化版）');
