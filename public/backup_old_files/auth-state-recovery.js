// 🔄 認証状態復元機能
console.log('🔄 認証状態復元機能初期化中...');

window.AuthStateRecovery = {
    // localStorage内の認証情報を確認
    checkStoredAuthData: function() {
        console.log('🔍 localStorage認証情報確認中...');
        
        const keys = [
            'google_identity_data',
            'google_oauth_data', 
            'rentpipe_auth',
            'rentpipe_user_'
        ];
        
        const authData = {};
        
        for (const key of keys) {
            if (key.endsWith('_')) {
                // rentpipe_user_ で始まるキーを検索
                Object.keys(localStorage).forEach(storageKey => {
                    if (storageKey.startsWith(key)) {
                        try {
                            authData[storageKey] = JSON.parse(localStorage.getItem(storageKey));
                            console.log(`✅ 発見: ${storageKey}`);
                        } catch (e) {
                            authData[storageKey] = localStorage.getItem(storageKey);
                        }
                    }
                });
            } else {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        authData[key] = JSON.parse(data);
                        console.log(`✅ 発見: ${key}`);
                    } catch (e) {
                        authData[key] = data;
                    }
                }
            }
        }
        
        console.log('📊 保存された認証情報:', authData);
        return authData;
    },
    
    // Google Identity Servicesの状態を直接確認
    checkGoogleIdentityStatus: function() {
        console.log('🔍 Google Identity Services状態確認中...');
        
        if (window.GoogleIdentity) {
            const status = window.GoogleIdentity.checkAuthStatus();
            console.log('📊 Google Identity状態:', status);
            return status;
        } else {
            console.log('❌ GoogleIdentityオブジェクトが見つかりません');
            return null;
        }
    },
    
    // 強制的に認証状態を復元
    forceAuthStateRecovery: async function() {
        try {
            console.log('🚀 認証状態強制復元開始...');
            
            // 1. localStorage内の認証情報を確認
            const storedData = this.checkStoredAuthData();
            
            // 2. Google Identity Servicesの状態を確認
            const googleStatus = this.checkGoogleIdentityStatus();
            
            // 3. 保存された認証情報があるかチェック
            let recoveredAuthData = null;
            
            if (storedData.google_identity_data) {
                console.log('🔍 Google Identity認証データ発見');
                recoveredAuthData = storedData.google_identity_data;
            } else if (storedData.google_oauth_data) {
                console.log('🔍 Google OAuth認証データ発見');
                recoveredAuthData = storedData.google_oauth_data;
            }
            
            if (recoveredAuthData && recoveredAuthData.user && recoveredAuthData.accessToken) {
                console.log('✅ 有効な認証データを発見:', recoveredAuthData.user.email);
                
                // 有効期限をチェック
                if (recoveredAuthData.expiresAt && new Date(recoveredAuthData.expiresAt) > new Date()) {
                    console.log('✅ トークンは有効期限内');
                    
                    // IntegratedAuthManagerV2の状態を手動で更新
                    if (window.IntegratedAuthManagerV2) {
                        // Google認証状態を復元
                        window.IntegratedAuthManagerV2.googleAuth = {
                            isSignedIn: true,
                            user: recoveredAuthData.user,
                            accessToken: recoveredAuthData.accessToken
                        };
                        
                        // RentPipe認証状態も復元
                        window.IntegratedAuthManagerV2.isAuthenticated = true;
                        window.IntegratedAuthManagerV2.currentUser = {
                            ...recoveredAuthData.user,
                            googleAuth: recoveredAuthData.user
                        };
                        window.IntegratedAuthManagerV2.authMethod = 'google';
                        
                        console.log('✅ 認証状態復元完了');
                        
                        // 認証状態確認
                        const newAuthState = window.IntegratedAuthManagerV2.getAuthState();
                        console.log('📊 復元後の認証状態:', newAuthState);
                        
                        return {
                            success: true,
                            message: '認証状態が復元されました',
                            authState: newAuthState
                        };
                    }
                } else {
                    console.log('⏰ トークンの有効期限切れ');
                    return {
                        success: false,
                        message: 'トークンの有効期限が切れています',
                        needReauth: true
                    };
                }
            } else {
                console.log('❌ 有効な認証データが見つかりません');
                return {
                    success: false,
                    message: '認証データが見つかりません',
                    needReauth: true
                };
            }
            
        } catch (error) {
            console.error('❌ 認証状態復元エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // 認証状態を強制的に更新してUIを再描画
    refreshAuthUI: function() {
        try {
            console.log('🎨 認証UI更新開始...');
            
            if (window.IntegratedAuthManagerV2) {
                const authState = window.IntegratedAuthManagerV2.getAuthState();
                console.log('📊 現在の認証状態:', authState);
                
                // Google Formsセクションを更新
                const existingSection = document.querySelector('#google-forms-section');
                if (existingSection) {
                    if (authState.googleAuth.isSignedIn) {
                        // 認証済みの表示に更新
                        existingSection.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        existingSection.innerHTML = `
                            <h3 style="margin: 0 0 0.5rem 0;">✅ Google Forms連携済み</h3>
                            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                                ログイン中: ${authState.googleAuth.user?.email} | 各顧客カードから専用フォームを作成できます
                            </p>
                        `;
                    } else {
                        // 未認証の表示に更新
                        existingSection.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
                        existingSection.innerHTML = `
                            <h3 style="margin: 0 0 1rem 0;">📝 Google Forms連携</h3>
                            <p style="margin: 0 0 1rem 0; opacity: 0.9;">
                                顧客専用の物件希望調査フォームを自動作成できます
                            </p>
                            <button onclick="window.location.href='login-google-v2.html'" style="background: white; color: #1e40af; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                                🔑 Google認証してフォーム機能を利用
                            </button>
                        `;
                    }
                }
                
                console.log('✅ 認証UI更新完了');
                return true;
            }
            
        } catch (error) {
            console.error('❌ 認証UI更新エラー:', error);
            return false;
        }
    }
};

// 自動実行
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        console.log('🔄 自動認証状態復元開始...');
        
        const recoveryResult = await window.AuthStateRecovery.forceAuthStateRecovery();
        console.log('📊 復元結果:', recoveryResult);
        
        if (recoveryResult.success) {
            // UIを更新
            window.AuthStateRecovery.refreshAuthUI();
            
            // 統合機能を再実行
            if (window.forceIntegration) {
                setTimeout(() => {
                    window.forceIntegration();
                }, 1000);
            }
        }
    }, 3000);
});

// グローバル関数として追加
window.checkStoredAuth = () => window.AuthStateRecovery.checkStoredAuthData();
window.recoverAuth = () => window.AuthStateRecovery.forceAuthStateRecovery();
window.refreshAuthUI = () => window.AuthStateRecovery.refreshAuthUI();

console.log('✅ 認証状態復元機能準備完了');
console.log('💡 コンソールで checkStoredAuth(), recoverAuth(), refreshAuthUI() を実行できます');
