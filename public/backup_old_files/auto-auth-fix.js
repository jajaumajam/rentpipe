// 🎯 自動認証修正機能（確実版）
console.log('🎯 自動認証修正機能初期化中...');

window.AutoAuthFix = {
    // 確実な認証状態修正
    fixAuthState: function() {
        try {
            console.log('🔧 認証状態自動修正開始...');
            
            // LocalStorageから認証データを取得
            const googleIdentityData = localStorage.getItem('google_identity_data');
            const rentpipeAuth = localStorage.getItem('rentpipe_auth');
            
            if (!googleIdentityData && !rentpipeAuth) {
                console.log('❌ 認証データが見つかりません');
                return { success: false, message: '認証データなし' };
            }
            
            let authData = null;
            
            // google_identity_dataを優先
            if (googleIdentityData) {
                try {
                    authData = JSON.parse(googleIdentityData);
                    console.log('✅ google_identity_dataから認証情報を取得');
                } catch (e) {
                    console.error('❌ google_identity_data解析エラー:', e);
                }
            }
            
            // rentpipe_authからも試行
            if (!authData && rentpipeAuth) {
                try {
                    const rentpipeData = JSON.parse(rentpipeAuth);
                    if (rentpipeData.user && rentpipeData.user.googleAuth) {
                        authData = {
                            user: rentpipeData.user.googleAuth,
                            accessToken: rentpipeData.user.googleAuth.accessToken
                        };
                        console.log('✅ rentpipe_authから認証情報を取得');
                    }
                } catch (e) {
                    console.error('❌ rentpipe_auth解析エラー:', e);
                }
            }
            
            if (!authData || !authData.user) {
                console.log('❌ 有効な認証データが見つかりません');
                return { success: false, message: '有効な認証データなし' };
            }
            
            // 有効期限チェック
            if (authData.user.expiresAt && new Date(authData.user.expiresAt) <= new Date()) {
                console.log('⏰ 認証トークンの有効期限切れ');
                return { success: false, message: 'トークン有効期限切れ', needReauth: true };
            }
            
            console.log('📊 取得した認証データ:', {
                email: authData.user.email,
                expiresAt: authData.user.expiresAt,
                hasAccessToken: !!authData.accessToken
            });
            
            // IntegratedAuthManagerV2が存在するかチェック
            if (!window.IntegratedAuthManagerV2) {
                console.log('❌ IntegratedAuthManagerV2が見つかりません');
                return { success: false, message: 'AuthManagerが見つからない' };
            }
            
            // 認証状態を直接設定（緊急修正と同じロジック）
            window.IntegratedAuthManagerV2.googleAuth = {
                isSignedIn: true,
                user: authData.user,
                accessToken: authData.accessToken || authData.user.accessToken
            };
            
            window.IntegratedAuthManagerV2.isAuthenticated = true;
            window.IntegratedAuthManagerV2.currentUser = {
                ...authData.user,
                googleAuth: authData.user
            };
            window.IntegratedAuthManagerV2.authMethod = 'google';
            
            console.log('✅ 認証状態自動修正完了');
            
            // 修正後の状態確認
            const newAuthState = window.IntegratedAuthManagerV2.getAuthState();
            console.log('📊 修正後の認証状態:', newAuthState);
            
            return {
                success: true,
                message: `認証状態を修正しました (${authData.user.email})`,
                authState: newAuthState
            };
            
        } catch (error) {
            console.error('❌ 認証状態修正エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // UIを自動更新
    updateUI: function() {
        try {
            console.log('🎨 UI自動更新開始...');
            
            const authState = window.IntegratedAuthManagerV2?.getAuthState();
            if (!authState) {
                console.log('❌ 認証状態が取得できません');
                return false;
            }
            
            // Google Formsセクションの更新
            let section = document.querySelector('#google-forms-section');
            
            if (authState.googleAuth.isSignedIn) {
                // セクションが存在しない場合は作成
                if (!section) {
                    section = document.createElement('div');
                    section.id = 'google-forms-section';
                    const main = document.querySelector('main, .main-content, .container') || document.body;
                    const firstChild = main.firstElementChild;
                    if (firstChild) {
                        main.insertBefore(section, firstChild);
                    } else {
                        main.appendChild(section);
                    }
                }
                
                // 認証済み表示に更新
                section.style.cssText = `
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin: 1rem 0 2rem 0;
                    text-align: center;
                `;
                section.innerHTML = `
                    <h3 style="margin: 0 0 0.5rem 0;">✅ Google Forms連携済み</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                        ログイン中: ${authState.googleAuth.user?.email} | 各顧客カードから専用フォームを作成できます
                    </p>
                `;
                
                console.log('✅ Google Forms連携済み表示に更新');
            } else {
                // 未認証表示
                if (section) {
                    section.style.cssText = `
                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                        color: white;
                        padding: 1.5rem;
                        border-radius: 12px;
                        margin: 1rem 0 2rem 0;
                        text-align: center;
                    `;
                    section.innerHTML = `
                        <h3 style="margin: 0 0 1rem 0;">📝 Google Forms連携</h3>
                        <p style="margin: 0 0 1rem 0; opacity: 0.9;">
                            顧客専用の物件希望調査フォームを自動作成できます
                        </p>
                        <button onclick="window.location.href='login-google-v2.html'" style="background: white; color: #1e40af; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                            🔑 Google認証してフォーム機能を利用
                        </button>
                    `;
                }
                
                console.log('✅ Google認証が必要表示に更新');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ UI更新エラー:', error);
            return false;
        }
    },
    
    // 完全な自動修正プロセス
    fullAutoFix: function() {
        try {
            console.log('🚀 完全自動修正プロセス開始...');
            
            // 1. 認証状態を修正
            const fixResult = this.fixAuthState();
            
            if (fixResult.success) {
                console.log('✅ 認証状態修正成功');
                
                // 2. UIを更新
                this.updateUI();
                
                // 3. 統合機能を実行
                if (window.forceIntegration) {
                    setTimeout(() => {
                        console.log('🔄 統合機能を再実行中...');
                        window.forceIntegration();
                    }, 500);
                }
                
                // 4. 成功通知を表示
                this.showSuccessNotification(fixResult.authState.googleAuth.user.email);
                
                return fixResult;
            } else {
                console.log('❌ 認証状態修正失敗:', fixResult.message);
                
                if (fixResult.needReauth) {
                    this.showReauthNotification();
                }
                
                return fixResult;
            }
            
        } catch (error) {
            console.error('❌ 完全自動修正エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 成功通知を表示
    showSuccessNotification: function(email) {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 14px;
                max-width: 350px;
                border-left: 4px solid #059669;
            `;
            notification.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 5px;">✅ Google認証状態を復元しました</div>
                <div style="opacity: 0.9; font-size: 13px;">${email}</div>
                <div style="opacity: 0.7; font-size: 12px; margin-top: 5px;">Google Forms機能が利用可能です</div>
            `;
            
            document.body.appendChild(notification);
            
            // 5秒後に自動削除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.transition = 'opacity 0.5s ease';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.parentNode.removeChild(notification);
                    }, 500);
                }
            }, 5000);
            
        } catch (error) {
            console.error('❌ 成功通知表示エラー:', error);
        }
    },
    
    // 再認証通知を表示
    showReauthNotification: function() {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f59e0b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 14px;
                max-width: 350px;
                border-left: 4px solid #d97706;
            `;
            notification.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px;">⚠️ 認証の有効期限が切れています</div>
                <button onclick="window.location.href='login-google-v2.html'" style="background: white; color: #d97706; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    再ログイン
                </button>
            `;
            
            document.body.appendChild(notification);
            
            // 10秒後に自動削除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.transition = 'opacity 0.5s ease';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.parentNode.removeChild(notification);
                    }, 500);
                }
            }, 10000);
            
        } catch (error) {
            console.error('❌ 再認証通知表示エラー:', error);
        }
    }
};

// 自動実行（ページ読み込み後に確実に実行）
document.addEventListener('DOMContentLoaded', function() {
    // 複数のタイミングで実行して確実に動作させる
    setTimeout(() => {
        console.log('🔄 自動修正プロセス開始（3秒後）...');
        window.AutoAuthFix.fullAutoFix();
    }, 3000);
    
    // バックアップとして5秒後にも実行
    setTimeout(() => {
        if (window.IntegratedAuthManagerV2 && !window.IntegratedAuthManagerV2.isAuthenticated) {
            console.log('🔄 バックアップ自動修正実行（5秒後）...');
            window.AutoAuthFix.fullAutoFix();
        }
    }, 5000);
});

// グローバル関数として追加
window.autoFixAuth = () => window.AutoAuthFix.fullAutoFix();

console.log('✅ 自動認証修正機能準備完了');
console.log('💡 手動実行: autoFixAuth()');
