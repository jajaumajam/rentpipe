// RentPipe プロフィール管理機能（統一認証対応版）
class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('👤 プロフィール管理システム初期化中...');
        
        // 統一認証システムの準備を待つ
        if (window.UnifiedAuth) {
            this.setupEventListeners();
            this.loadProfile();
        } else {
            // 統一認証システムが読み込まれるまで待機
            setTimeout(() => {
                this.setupEventListeners();
                this.loadProfile();
            }, 500);
        }
    }

    setupEventListeners() {
        // DOMが読み込まれてから実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
            });
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
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

    // プロフィール情報を読み込み
    loadProfile() {
        try {
            const currentUser = window.UnifiedAuth ? window.UnifiedAuth.getCurrentUser() : null;
            
            let profile = {};
            
            if (currentUser) {
                profile = {
                    agentName: currentUser.name || currentUser.displayName || 'デモエージェント',
                    email: currentUser.email || 'demo@rentpipe.jp',
                    phone: currentUser.phone || '090-0000-0000',
                    company: currentUser.company || 'デモ不動産',
                    businessAreas: currentUser.businessAreas || '渋谷区、港区、新宿区'
                };
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

            // 統一認証システムを使用して更新
            if (window.UnifiedAuth && window.UnifiedAuth.updateProfile(profile)) {
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

            // 現在のパスワードの確認
            if (!window.UnifiedAuth || !window.UnifiedAuth.verifyPassword(currentPassword)) {
                this.showError('現在のパスワードが正しくありません');
                return false;
            }

            // パスワード更新
            if (window.UnifiedAuth.updatePassword(newPassword)) {
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

// アカウント削除の実行（統一認証対応版）
function deleteAccount() {
    try {
        console.log('⚠️ アカウント削除処理開始...');
        
        if (window.UnifiedAuth && window.UnifiedAuth.deleteAccount()) {
            alert('アカウントとすべてのデータを削除しました。ログイン画面に移動します。');
            
            // ログイン画面にリダイレクト
            setTimeout(() => {
                window.location.replace('login.html');
            }, 1000);
        } else {
            alert('アカウント削除中にエラーが発生しました。管理者にお問い合わせください。');
        }
        
    } catch (error) {
        console.error('❌ アカウント削除エラー:', error);
        alert('アカウント削除中にエラーが発生しました。管理者にお問い合わせください。');
    }
}

// プロフィールマネージャーのインスタンス化
const profileManager = new ProfileManager();

// デバッグ用のグローバルアクセス
window.ProfileManager = profileManager;

console.log('✅ 統一認証対応プロフィール管理システム準備完了');
