// RentPipe 認証管理システム（修正版）
console.log('🔐 認証管理システム初期化中...');

window.AuthManager = {
    // 現在のユーザー情報
    currentUser: null,
    
    // 認証状態
    isAuthenticated: false,
    
    // デモモードフラグ
    isDemoMode: true,
    
    // デモアカウント定義（厳格化）
    demoAccounts: {
        'demo@rentpipe.jp': {
            password: 'demo123',
            displayName: 'デモユーザー'
        },
        'test@rentpipe.jp': {
            password: 'test123',
            displayName: 'テストユーザー'
        },
        'agent@rentpipe.jp': {
            password: 'agent123',
            displayName: 'エージェント'
        }
    },
    
    // 初期化
    initialize: function() {
        console.log('🔐 認証システムを初期化しています...');
        
        // デモモードの場合
        if (this.isDemoMode) {
            this.initializeDemoAuth();
        } else {
            // Phase2で実際のFirebase認証を使用
            this.initializeFirebaseAuth();
        }
        
        // 認証状態の監視
        this.watchAuthState();
        
        return this.isAuthenticated;
    },
    
    // デモ認証の初期化
    initializeDemoAuth: function() {
        // ローカルストレージから認証情報を取得
        const savedAuth = localStorage.getItem('rentpipe_auth');
        
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                // セッションの有効期限チェック
                if (authData.expiresAt && new Date(authData.expiresAt) > new Date()) {
                    this.currentUser = authData.user;
                    this.isAuthenticated = true;
                    console.log('✅ 認証セッション復元:', this.currentUser.email);
                } else {
                    console.log('⏰ セッションの有効期限が切れています');
                    this.logout();
                }
            } catch (error) {
                console.error('認証情報の復元エラー:', error);
                this.logout();
            }
        } else {
            console.log('🔓 未認証状態です');
        }
    },
    
    // Firebase認証の初期化（Phase2用）
    initializeFirebaseAuth: function() {
        if (window.firebase && window.firebase.auth) {
            window.firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    };
                    this.isAuthenticated = true;
                    console.log('✅ Firebase認証成功:', user.email);
                } else {
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    console.log('🔓 Firebase未認証');
                }
            });
        }
    },
    
    // ログイン処理
    login: async function(email, password) {
        console.log('🔑 ログイン処理を開始:', email);
        
        // デモモードの場合
        if (this.isDemoMode) {
            return await this.demoLogin(email, password);
        }
        
        // 本番モード（Firebase認証）
        try {
            const result = await window.firebase.auth()
                .signInWithEmailAndPassword(email, password);
            
            this.currentUser = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName
            };
            this.isAuthenticated = true;
            
            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            console.error('ログインエラー:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },
    
    // デモログイン（厳格化版）
    demoLogin: async function(email, password) {
        // メールアドレスの検証
        if (!email || !email.includes('@')) {
            return {
                success: false,
                error: '有効なメールアドレスを入力してください'
            };
        }
        
        // パスワードの検証
        if (!password || password.length < 6) {
            return {
                success: false,
                error: 'パスワードは6文字以上で入力してください'
            };
        }
        
        // デモアカウントの検証（厳格化）
        const account = this.demoAccounts[email.toLowerCase()];
        
        if (!account) {
            // 新規登録されたアカウントをチェック
            const savedUser = localStorage.getItem(`rentpipe_user_${email}`);
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    // 保存されたパスワードと照合
                    if (userData.passwordHash === btoa(password)) {
                        // 登録済みユーザーでログイン成功
                        const user = userData.user;
                        user.isDemoUser = true;
                        
                        this.saveAuthSession(user);
                        this.currentUser = user;
                        this.isAuthenticated = true;
                        
                        console.log('✅ 登録済みユーザーログイン成功:', email);
                        return {
                            success: true,
                            user: user
                        };
                    }
                } catch (error) {
                    console.error('ユーザーデータ読み込みエラー:', error);
                }
            }
            
            return {
                success: false,
                error: 'メールアドレスまたはパスワードが正しくありません'
            };
        }
        
        // パスワード検証
        if (account.password !== password) {
            return {
                success: false,
                error: 'メールアドレスまたはパスワードが正しくありません'
            };
        }
        
        // ログイン成功
        const user = {
            uid: `demo_user_${Date.now()}`,
            email: email,
            displayName: account.displayName,
            isDemoUser: true
        };
        
        this.saveAuthSession(user);
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // ログイン成功をログに記録
        if (window.DemoDataManager) {
            window.DemoDataManager.addHistory({
                type: 'user_login',
                note: `ユーザー「${email}」がログインしました`
            });
        }
        
        console.log('✅ デモログイン成功:', email);
        
        return {
            success: true,
            user: user
        };
    },
    
    // 認証セッションの保存
    saveAuthSession: function(user) {
        // セッション情報を保存（24時間有効）
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        const authData = {
            user: user,
            loginAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        localStorage.setItem('rentpipe_auth', JSON.stringify(authData));
    },
    
    // ログアウト処理
    logout: async function() {
        console.log('🚪 ログアウト処理を開始');
        
        // ログアウト前にユーザー情報を保存
        const userEmail = this.currentUser?.email;
        
        if (this.isDemoMode) {
            // デモモードのログアウト
            localStorage.removeItem('rentpipe_auth');
        } else {
            // Firebase認証のログアウト
            try {
                await window.firebase.auth().signOut();
            } catch (error) {
                console.error('ログアウトエラー:', error);
            }
        }
        
        // ログアウトをログに記録
        if (userEmail && window.DemoDataManager) {
            window.DemoDataManager.addHistory({
                type: 'user_logout',
                note: `ユーザー「${userEmail}」がログアウトしました`
            });
        }
        
        this.currentUser = null;
        this.isAuthenticated = false;
        
        console.log('✅ ログアウト完了');
        
        // ログインページにリダイレクト
        window.location.href = 'login.html';
    },
    
    // 新規登録処理
    register: async function(email, password, displayName) {
        console.log('📝 新規登録処理を開始:', email);
        
        if (this.isDemoMode) {
            // デモモードの新規登録
            return await this.demoRegister(email, password, displayName);
        }
        
        // Firebase認証での新規登録
        try {
            const result = await window.firebase.auth()
                .createUserWithEmailAndPassword(email, password);
            
            // プロフィール更新
            if (displayName) {
                await result.user.updateProfile({
                    displayName: displayName
                });
            }
            
            // 新規テナント作成
            if (window.TenantManager) {
                window.TenantManager.createTenant({
                    name: displayName || email.split('@')[0],
                    email: email,
                    plan: 'free'
                });
            }
            
            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            console.error('登録エラー:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },
    
    // デモ新規登録
    demoRegister: async function(email, password, displayName) {
        // メールアドレスの重複チェック
        const existingAuth = localStorage.getItem(`rentpipe_user_${email}`);
        if (existingAuth) {
            return {
                success: false,
                error: 'このメールアドレスは既に登録されています'
            };
        }
        
        // デモアカウントとの重複チェック
        if (this.demoAccounts[email.toLowerCase()]) {
            return {
                success: false,
                error: 'このメールアドレスは既に使用されています'
            };
        }
        
        // バリデーション
        if (!email || !email.includes('@')) {
            return {
                success: false,
                error: '有効なメールアドレスを入力してください'
            };
        }
        
        if (!password || password.length < 6) {
            return {
                success: false,
                error: 'パスワードは6文字以上で入力してください'
            };
        }
        
        // ユーザー情報を作成
        const user = {
            uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: email,
            displayName: displayName || email.split('@')[0],
            createdAt: new Date().toISOString()
        };
        
        // ユーザー情報を保存
        const userData = {
            user: user,
            passwordHash: btoa(password), // デモ用の簡易暗号化
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(`rentpipe_user_${email}`, JSON.stringify(userData));
        
        // 新規テナント作成
        if (window.TenantManager) {
            window.TenantManager.createTenant({
                name: displayName || email.split('@')[0],
                email: email,
                plan: 'free'
            });
        }
        
        console.log('✅ デモ新規登録成功:', email);
        
        // 自動ログイン
        return await this.demoLogin(email, password);
    },
    
    // パスワードリセット
    resetPassword: async function(email) {
        console.log('🔑 パスワードリセット:', email);
        
        if (this.isDemoMode) {
            // デモモードでは常に成功
            console.log('📧 パスワードリセットメール送信（デモ）:', email);
            return {
                success: true,
                message: `${email} にパスワードリセットメールを送信しました（デモモード）`
            };
        }
        
        // Firebase認証でのパスワードリセット
        try {
            await window.firebase.auth().sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'パスワードリセットメールを送信しました'
            };
        } catch (error) {
            console.error('パスワードリセットエラー:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },
    
    // 認証状態の監視
    watchAuthState: function() {
        // 5分ごとにセッションの有効期限をチェック
        setInterval(() => {
            if (this.isDemoMode && this.isAuthenticated) {
                const savedAuth = localStorage.getItem('rentpipe_auth');
                if (savedAuth) {
                    try {
                        const authData = JSON.parse(savedAuth);
                        if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
                            console.log('⏰ セッションの有効期限が切れました');
                            this.logout();
                        }
                    } catch (error) {
                        console.error('セッションチェックエラー:', error);
                    }
                }
            }
        }, 5 * 60 * 1000); // 5分
    },
    
    // 認証が必要なページのチェック
    requireAuth: function() {
        if (!this.isAuthenticated) {
            console.log('🔒 認証が必要です');
            
            // ログインページ以外からアクセスした場合
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login.html')) {
                // 元のページをセッションに保存
                sessionStorage.setItem('rentpipe_redirect_after_login', currentPath);
                
                // ログインページにリダイレクト
                window.location.href = 'login.html';
                return false;
            }
        }
        return true;
    },
    
    // エラーメッセージの取得
    getErrorMessage: function(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
            'auth/invalid-email': '無効なメールアドレスです',
            'auth/operation-not-allowed': 'この操作は許可されていません',
            'auth/weak-password': 'パスワードが弱すぎます（6文字以上）',
            'auth/user-disabled': 'このアカウントは無効化されています',
            'auth/user-not-found': 'ユーザーが見つかりません',
            'auth/wrong-password': 'パスワードが間違っています',
            'auth/too-many-requests': 'リクエストが多すぎます。しばらく待ってから再試行してください'
        };
        
        return messages[errorCode] || 'エラーが発生しました';
    },
    
    // ユーザー情報の取得
    getUserInfo: function() {
        return this.currentUser;
    },
    
    // 認証状態の取得
    getAuthState: function() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.currentUser,
            isDemoMode: this.isDemoMode
        };
    }
};

// ページ読み込み時に認証システムを初期化
document.addEventListener('DOMContentLoaded', function() {
    window.AuthManager.initialize();
    
    // 認証状態をコンソールに表示
    const authState = window.AuthManager.getAuthState();
    console.log('🔐 認証状態:', authState);
});

console.log('✅ 認証管理システム準備完了');
