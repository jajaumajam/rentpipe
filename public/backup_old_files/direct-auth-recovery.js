// 🎯 直接的な認証状態復元機能
console.log('🎯 直接的な認証状態復元機能初期化中...');

window.DirectAuthRecovery = {
    // LocalStorageから認証情報を直接復元
    recoverAuthFromStorage: function() {
        try {
            console.log('🔄 LocalStorageから直接認証復元開始...');
            
            // 可能性のあるキーを全て確認
            const possibleKeys = [
                'google_identity_data',
                'google_oauth_data',
                'rentpipe_auth',
                'auth_state'
            ];
            
            let foundAuthData = null;
            let foundKey = null;
            
            for (const key of possibleKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsedData = JSON.parse(data);
                        if (parsedData.user || parsedData.accessToken) {
                            foundAuthData = parsedData;
                            foundKey = key;
                            console.log(`✅ 認証データ発見: ${key}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`⚠️ ${key} の解析に失敗:`, e);
                    }
                }
            }
            
            // rentpipe_user_ で始まるキーも確認
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('rentpipe_user_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.isGoogleUser || data.googleAuthData) {
                            foundAuthData = data.googleAuthData || data;
                            foundKey = key;
                            console.log(`✅ Google認証ユーザー発見: ${key}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`⚠️ ${key} の解析に失敗:`, e);
                    }
                }
            }
            
            if (foundAuthData) {
                console.log('✅ 認証データ復元:', foundAuthData);
                return this.applyAuthData(foundAuthData, foundKey);
            } else {
                console.log('❌ 有効な認証データが見つかりません');
                return { success: false, message: '認証データが見つかりません' };
            }
            
        } catch (error) {
            console.error('❌ 認証復元エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 認証データをIntegratedAuthManagerV2に適用
    applyAuthData: function(authData, sourceKey) {
        try {
            console.log('🔧 認証データ適用開始:', sourceKey);
            
            if (!window.IntegratedAuthManagerV2) {
                throw new Error('IntegratedAuthManagerV2が見つかりません');
            }
            
            // 認証データの形式を正規化
            let userEmail = null;
            let userName = null;
            let accessToken = null;
            
            // データ構造を解析
            if (authData.user) {
                // { user: {...}, accessToken: "..." } 形式
                userEmail = authData.user.email;
                userName = authData.user.name || authData.user.displayName;
                accessToken = authData.accessToken || authData.user.accessToken;
            } else if (authData.email) {
                // { email: "...", name: "...", accessToken: "..." } 形式
                userEmail = authData.email;
                userName = authData.name || authData.displayName;
                accessToken = authData.accessToken;
            }
            
            if (!userEmail) {
                throw new Error('ユーザーメールアドレスが見つかりません');
            }
            
            console.log('📧 ユーザー情報:', { userEmail, userName, hasAccessToken: !!accessToken });
            
            // IntegratedAuthManagerV2の状態を直接設定
            const userObject = {
                email: userEmail,
                name: userName || userEmail.split('@')[0],
                accessToken: accessToken,
                expiresAt: authData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            // Google認証状態を設定
            window.IntegratedAuthManagerV2.googleAuth = {
                isSignedIn: true,
                user: userObject,
                accessToken: accessToken
            };
            
            // 統合認証状態を設定
            window.IntegratedAuthManagerV2.isAuthenticated = true;
            window.IntegratedAuthManagerV2.currentUser = {
                ...userObject,
                googleAuth: userObject
            };
            window.IntegratedAuthManagerV2.authMethod = 'google';
            
            console.log('✅ 認証状態適用完了');
            
            // 適用後の状態を確認
            const newAuthState = window.IntegratedAuthManagerV2.getAuthState();
            console.log('📊 適用後の認証状態:', newAuthState);
            
            return {
                success: true,
                message: `認証状態を復元しました (${userEmail})`,
                authState: newAuthState
            };
            
        } catch (error) {
            console.error('❌ 認証データ適用エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // UIを強制更新
    forceUpdateUI: function() {
        try {
            console.log('🎨 UI強制更新開始...');
            
            const authState = window.IntegratedAuthManagerV2?.getAuthState();
            if (!authState) {
                console.log('❌ 認証状態が取得できません');
                return false;
            }
            
            // Google Formsセクションを更新
            let section = document.querySelector('#google-forms-section');
            
            if (authState.googleAuth.isSignedIn) {
                // 認証済み表示
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
                
                console.log('✅ Google認証が必要表示に更新');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ UI更新エラー:', error);
            return false;
        }
    },
    
    // 完全な復元プロセスを実行
    fullRecoveryProcess: async function() {
        try {
            console.log('🚀 完全復元プロセス開始...');
            
            // 1. LocalStorageから認証情報を復元
            const recoveryResult = this.recoverAuthFromStorage();
            
            if (recoveryResult.success) {
                // 2. UIを更新
                this.forceUpdateUI();
                
                // 3. 統合機能を再実行
                if (window.forceIntegration) {
                    setTimeout(() => {
                        window.forceIntegration();
                    }, 500);
                }
                
                console.log('✅ 完全復元プロセス完了');
                return recoveryResult;
            } else {
                console.log('❌ 復元プロセス失敗:', recoveryResult.message);
                return recoveryResult;
            }
            
        } catch (error) {
            console.error('❌ 完全復元プロセスエラー:', error);
            return { success: false, error: error.message };
        }
    }
};

// 自動実行（他の初期化の後に実行）
setTimeout(async () => {
    console.log('🔄 自動復元プロセス開始...');
    const result = await window.DirectAuthRecovery.fullRecoveryProcess();
    console.log('📊 自動復元結果:', result);
    
    if (result.success) {
        // 成功した場合、画面右下に通知を表示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.innerHTML = `
            ✅ Google認証状態を復元しました<br>
            <small>${result.authState?.googleAuth?.user?.email}</small>
        `;
        document.body.appendChild(notification);
        
        // 5秒後に通知を削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}, 4000); // 4秒後に実行

// グローバル関数として追加
window.fullRecovery = () => window.DirectAuthRecovery.fullRecoveryProcess();
window.recoverFromStorage = () => window.DirectAuthRecovery.recoverAuthFromStorage();
window.forceUpdateUI = () => window.DirectAuthRecovery.forceUpdateUI();

console.log('✅ 直接的な認証状態復元機能準備完了');
console.log('💡 コンソールで fullRecovery(), recoverFromStorage(), forceUpdateUI() を実行できます');
