// RentPipe プロフィール管理機能
class ProfileManager {
    constructor() {
        this.PROFILE_KEY = 'rentpipe_user_profile';
        this.AUTH_KEY = 'rentpipe_auth';  // 統一された認証キー
        this.init();
    }

    init() {
        console.log('👤 プロフィール管理システム初期化中...');
        
        // DOMが読み込まれてから実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.loadProfile();
            });
        } else {
            this.setupEventListeners();
            this.loadProfile();
        }
    }

    setupEventListeners() {
        // プロフィール更新フォーム
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        // パスワード変更フォーム
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        console.log('✅ プロフィール管理イベントリスナー設定完了');
    }

    // 現在の認証データを取得
    getCurrentAuthData() {
        // 複数の認証キーをチェック
        const possibleKeys = [
            'rentpipe_auth',
            'rentpipe_demo_user', 
            'rentpipe_current_user'
        ];
        
        for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    console.log(`🔑 認証データ発見: ${key}`, data);
                    return { key, data };
                } catch (error) {
                    console.warn(`❌ ${key} の解析に失敗:`, error);
                }
            }
        }
        
        return null;
    }

    // プロフィール情報を読み込み
    loadProfile() {
        try {
            const savedProfile = localStorage.getItem(this.PROFILE_KEY);
            const authResult = this.getCurrentAuthData();
            
            let profile = {};
            
            if (savedProfile) {
                profile = JSON.parse(savedProfile);
            } else if (authResult) {
                // 既存の認証情報からデフォルトプロフィールを作成
                const authData = authResult.data;
                profile = {
                    agentName: authData.name || authData.displayName || 'デモエージェント',
                    email: authData.email || 'demo@rentpipe.jp',
                    phone: authData.phone || '090-0000-0000',
                    company: authData.company || 'デモ不動産',
                    businessAreas: authData.businessAreas || '渋谷区、港区、新宿区'
                };
                this.saveProfile(profile);
            } else {
                // デフォルトプロフィール
                profile = {
                    agentName: 'デモエージェント',
                    email: 'demo@rentpipe.jp',
                    phone: '090-0000-0000',
                    company: 'デモ不動産',
                    businessAreas: '渋谷区、港区、新宿区'
                };
            }

            this.populateForm(profile);
            console.log('📊 プロフィール情報読み込み完了');
            
        } catch (error) {
            console.error('❌ プロフィール読み込みエラー:', error);
            this.showError('プロフィール情報の読み込みに失敗しました');
        }
    }

    // フォームにプロフィール情報を設定
    populateForm(profile) {
        const fields = ['agentName', 'email', 'phone', 'company', 'businessAreas'];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && profile[field]) {
                element.value = profile[field];
            }
        });
    }

    // プロフィール情報を保存
    saveProfile(profile) {
        try {
            localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error('❌ プロフィール保存エラー:', error);
            return false;
        }
    }

    // プロフィール更新
    updateProfile() {
        try {
            // フォームデータの取得
            const formData = new FormData(document.getElementById('profileForm'));
            const profile = {};
            
            for (const [key, value] of formData.entries()) {
                profile[key] = value.trim();
            }

            // バリデーション
            if (!this.validateProfileData(profile)) {
                return false;
            }

            // 更新日時を追加
            profile.updatedAt = new Date().toISOString();

            // 保存
            if (this.saveProfile(profile)) {
                // 認証情報も更新
                this.updateAuthInfo(profile);
                
                this.showSuccess('プロフィールを更新しました');
                console.log('✅ プロフィール更新完了');
                return true;
            } else {
                this.showError('プロフィールの保存に失敗しました');
                return false;
            }

        } catch (error) {
            console.error('❌ プロフィール更新エラー:', error);
            this.showError('プロフィール更新中にエラーが発生しました');
            return false;
        }
    }

    // 認証情報の更新
    updateAuthInfo(profile) {
        try {
            const authResult = this.getCurrentAuthData();
            if (authResult) {
                const { key, data } = authResult;
                data.name = profile.agentName;
                data.email = profile.email;
                data.updatedAt = new Date().toISOString();
                localStorage.setItem(key, JSON.stringify(data));
                console.log('✅ 認証情報更新完了');
            }
        } catch (error) {
            console.error('❌ 認証情報更新エラー:', error);
        }
    }

    // プロフィールデータのバリデーション
    validateProfileData(profile) {
        // 必須項目のチェック
        if (!profile.agentName || profile.agentName.length < 2) {
            this.showError('エージェント名は2文字以上で入力してください');
            return false;
        }

        if (!profile.email || !this.isValidEmail(profile.email)) {
            this.showError('有効なメールアドレスを入力してください');
            return false;
        }

        // 電話番号の形式チェック（入力がある場合のみ）
        if (profile.phone && !this.isValidPhoneNumber(profile.phone)) {
            this.showError('有効な電話番号を入力してください');
            return false;
        }

        return true;
    }

    // パスワード変更
    changePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // バリデーション
            if (!this.validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
                return false;
            }

            // 現在のパスワードの確認（デモモード対応強化）
            if (!this.verifyCurrentPassword(currentPassword)) {
                this.showError('現在のパスワードが正しくありません');
                return false;
            }

            // パスワード更新
            if (this.updatePassword(newPassword)) {
                // フォームをクリア
                document.getElementById('passwordForm').reset();
                this.showSuccess('パスワードを変更しました');
                console.log('✅ パスワード変更完了');
                return true;
            } else {
                this.showError('パスワードの変更に失敗しました');
                return false;
            }

        } catch (error) {
            console.error('❌ パスワード変更エラー:', error);
            this.showError('パスワード変更中にエラーが発生しました');
            return false;
        }
    }

    // 現在のパスワードを確認
    verifyCurrentPassword(inputPassword) {
        const authResult = this.getCurrentAuthData();
        
        if (authResult) {
            const { data } = authResult;
            
            // パスワードが保存されている場合
            if (data.password) {
                return data.password === inputPassword;
            }
            
            // パスワードハッシュが保存されている場合
            if (data.passwordHash) {
                return data.passwordHash === btoa(inputPassword);
            }
            
            // デモアカウントの場合、demo123を許可
            if (data.email === 'demo@rentpipe.jp' && inputPassword === 'demo123') {
                return true;
            }
        }
        
        // デフォルトのデモパスワードも許可
        return inputPassword === 'demo123';
    }

    // パスワード変更のバリデーション
    validatePasswordChange(currentPassword, newPassword, confirmPassword) {
        if (!currentPassword) {
            this.showError('現在のパスワードを入力してください');
            return false;
        }

        if (!newPassword || newPassword.length < 8) {
            this.showError('新しいパスワードは8文字以上で入力してください');
            return false;
        }

        if (newPassword !== confirmPassword) {
            this.showError('新しいパスワードが一致しません');
            return false;
        }

        if (currentPassword === newPassword) {
            this.showError('現在のパスワードと同じパスワードは使用できません');
            return false;
        }

        return true;
    }

    // パスワード更新（統一対応版）
    updatePassword(newPassword) {
        try {
            const authResult = this.getCurrentAuthData();
            
            if (authResult) {
                const { key, data } = authResult;
                data.password = newPassword;
                data.passwordHash = btoa(newPassword);
                data.passwordUpdatedAt = new Date().toISOString();
                
                localStorage.setItem(key, JSON.stringify(data));
                console.log('✅ パスワード保存完了:', key);
                return true;
            } else {
                // 認証データが見つからない場合、新しく作成
                const newAuthData = {
                    password: newPassword,
                    passwordHash: btoa(newPassword),
                    email: 'demo@rentpipe.jp',
                    passwordUpdatedAt: new Date().toISOString()
                };
                localStorage.setItem(this.AUTH_KEY, JSON.stringify(newAuthData));
                console.log('✅ 新規認証データ作成完了');
                return true;
            }
        } catch (error) {
            console.error('❌ パスワード保存エラー:', error);
            return false;
        }
    }

    // メールアドレスの形式チェック
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 電話番号の形式チェック
    isValidPhoneNumber(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/[\D]/g, '').length >= 10;
    }

    // 成功メッセージの表示
    showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        const errorElement = document.getElementById('errorMessage');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            
            // スクロールしてメッセージを見えるようにする
            successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // 5秒後に自動で隠す
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 5000);
        }
    }

    // エラーメッセージの表示
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const successElement = document.getElementById('successMessage');
        
        if (successElement) {
            successElement.style.display = 'none';
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // スクロールしてメッセージを見えるようにする
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // 8秒後に自動で隠す
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 8000);
        }
    }
}

// アカウント削除の確認
function confirmAccountDeletion() {
    const confirmation = confirm(
        'アカウントを削除すると、すべての顧客データ、パイプライン情報、プロフィール情報が完全に削除されます。\n\nこの操作は元に戻すことができません。\n\n本当にアカウントを削除しますか？'
    );
    
    if (confirmation) {
        const finalConfirmation = prompt(
            'アカウント削除を確実に実行するため、「削除する」と入力してください:'
        );
        
        if (finalConfirmation === '削除する') {
            deleteAccount();
        } else {
            alert('入力が正しくありません。アカウント削除をキャンセルしました。');
        }
    }
}

// アカウント削除の実行（自動ログイン防止対応）
function deleteAccount() {
    try {
        console.log('⚠️ アカウント削除処理開始...');
        
        // すべてのローカルストレージデータを削除
        const keysToDelete = [
            'rentpipe_user_profile',
            'rentpipe_demo_user',
            'rentpipe_auth',
            'rentpipe_current_user',
            'rentpipe_stable_customers',
            'rentpipe_pipeline_history',
            'rentpipe_demo_customers',
            'customers',
            'rentpipe_customers',
            'rentpipe_redirect_after_login'
        ];
        
        keysToDelete.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ ${key} を削除しました`);
            }
        });
        
        // セッションストレージもクリア
        sessionStorage.clear();
        console.log('🗑️ セッションストレージをクリア');
        
        // アカウント削除フラグを設定（自動ログイン防止）
        localStorage.setItem('rentpipe_account_deleted', 'true');
        
        alert('アカウントとすべてのデータを削除しました。ログイン画面に移動します。');
        
        // ログイン画面にリダイレクト（少し遅延を入れる）
        setTimeout(() => {
            window.location.replace('login.html');
        }, 1000);
        
    } catch (error) {
        console.error('❌ アカウント削除エラー:', error);
        alert('アカウント削除中にエラーが発生しました。管理者にお問い合わせください。');
    }
}

// プロフィールマネージャーのインスタンス化
const profileManager = new ProfileManager();

// デバッグ用のグローバルアクセス
window.ProfileManager = profileManager;

console.log('✅ プロフィール管理システム準備完了');
