// 🎯 RentPipe Google Forms 完全統合ソリューション
console.log('🚀 RentPipe Google Forms 完全統合ソリューション初期化中...');

window.RentPipeCompleteFormsSystem = {
    // 初期化状態
    isInitialized: false,
    isGoogleAPIReady: false,
    isFormsAPIReady: false,
    
    // 初期化プロセス
    initialize: async function() {
        try {
            console.log('🔧 完全統合システム初期化開始...');
            
            // 1. 認証状態復元
            await this.restoreAuthState();
            
            // 2. Google APIライブラリの確実な読み込み
            await this.ensureGoogleAPIs();
            
            // 3. Google Forms APIの初期化
            await this.initializeFormsAPI();
            
            // 4. UIの正常化
            this.normalizeUI();
            
            // 5. 顧客カードの設定
            this.setupCustomerCards();
            
            this.isInitialized = true;
            console.log('✅ 完全統合システム初期化完了');
            
            // 成功通知
            this.showNotification('✅ Google Forms連携システム準備完了', 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ 完全統合システム初期化エラー:', error);
            this.showNotification(`❌ 初期化エラー: ${error.message}`, 'error');
            return false;
        }
    },
    
    // 認証状態復元
    restoreAuthState: async function() {
        console.log('🔄 認証状態復元開始...');
        
        try {
            // LocalStorageから認証データを取得
            const googleIdentityData = localStorage.getItem('google_identity_data');
            const rentpipeAuth = localStorage.getItem('rentpipe_auth');
            
            if (!googleIdentityData && !rentpipeAuth) {
                throw new Error('認証データが見つかりません');
            }
            
            let authData = null;
            
            if (googleIdentityData) {
                authData = JSON.parse(googleIdentityData);
                console.log('✅ google_identity_dataから認証データ取得');
            } else if (rentpipeAuth) {
                const rentData = JSON.parse(rentpipeAuth);
                authData = {
                    user: rentData.user.googleAuth,
                    accessToken: rentData.user.googleAuth.accessToken
                };
                console.log('✅ rentpipe_authから認証データ取得');
            }
            
            if (!authData || !authData.user) {
                throw new Error('有効な認証データが見つかりません');
            }
            
            // 有効期限チェック
            if (authData.user.expiresAt && new Date(authData.user.expiresAt) <= new Date()) {
                throw new Error('認証トークンの有効期限切れ');
            }
            
            // IntegratedAuthManagerV2の状態を設定
            if (window.IntegratedAuthManagerV2) {
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
                
                console.log('✅ 認証状態復元完了:', authData.user.email);
                return true;
            }
            
        } catch (error) {
            console.log('❌ 認証状態復元失敗:', error.message);
            return false;
        }
    },
    
    // Google APIライブラリの確実な読み込み
    ensureGoogleAPIs: async function() {
        console.log('📚 Google APIライブラリ読み込み確認中...');
        
        // Google Identity Services読み込み
        if (!window.google?.accounts) {
            console.log('🔄 Google Identity Services読み込み中...');
            await this.loadScript('https://accounts.google.com/gsi/client');
            
            // 読み込み確認
            let attempts = 0;
            while (!window.google?.accounts && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            if (!window.google?.accounts) {
                throw new Error('Google Identity Services読み込み失敗');
            }
        }
        
        // Google API Client Library読み込み
        if (!window.gapi) {
            console.log('🔄 Google API Client Library読み込み中...');
            await this.loadScript('https://apis.google.com/js/api.js');
            
            // gapi読み込み確認
            let attempts = 0;
            while (!window.gapi && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            if (!window.gapi) {
                throw new Error('Google API Client Library読み込み失敗');
            }
        }
        
        console.log('✅ Google APIライブラリ読み込み完了');
        this.isGoogleAPIReady = true;
        return true;
    },
    
    // スクリプト読み込みヘルパー
    loadScript: function(src) {
        return new Promise((resolve, reject) => {
            // 既存のスクリプトをチェック
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.remove();
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Google Forms API初期化
    initializeFormsAPI: async function() {
        console.log('📝 Google Forms API初期化開始...');
        
        if (!this.isGoogleAPIReady) {
            throw new Error('Google APIライブラリが準備されていません');
        }
        
        // 認証状態確認
        const authState = window.IntegratedAuthManagerV2?.getAuthState();
        if (!authState?.googleAuth?.isSignedIn) {
            throw new Error('Google認証が必要です');
        }
        
        const accessToken = authState.googleAuth.accessToken;
        
        // gapi.clientを読み込み
        await new Promise((resolve, reject) => {
            window.gapi.load('client', {
                callback: resolve,
                onerror: reject
            });
        });
        
        console.log('✅ gapi.client読み込み完了');
        
        // Google API Client初期化
        await window.gapi.client.init({
            apiKey: 'AIzaSyBvJGdan0lvVSkaAbbSXQkoh6YyPoGyTgM',
            discoveryDocs: ['https://forms.googleapis.com/$discovery/rest?version=v1']
        });
        
        console.log('✅ Google API Client初期化完了');
        
        // アクセストークンを設定
        window.gapi.client.setToken({
            access_token: accessToken
        });
        
        console.log('✅ アクセストークン設定完了');
        
        // Forms APIの利用可能性確認
        if (!window.gapi.client.forms) {
            throw new Error('Google Forms APIが利用できません');
        }
        
        this.isFormsAPIReady = true;
        console.log('✅ Google Forms API初期化完了');
        return true;
    },
    
    // UIの正常化
    normalizeUI: function() {
        console.log('🎨 UI正常化開始...');
        
        // 重複するGoogle Formsセクションを削除
        const existingSections = document.querySelectorAll('#google-forms-section');
        existingSections.forEach((section, index) => {
            if (index > 0) section.remove();
        });
        
        // 重複するボタンを削除
        document.querySelectorAll('[class*="google-forms"], [onclick*="フォーム"], [onclick*="Google"]').forEach(btn => {
            btn.remove();
        });
        
        // Google Forms統合セクションを作成/更新
        let section = document.querySelector('#google-forms-section');
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
        
        // 認証済み表示
        section.style.cssText = `
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1rem 0 2rem 0;
            text-align: center;
        `;
        
        const authState = window.IntegratedAuthManagerV2?.getAuthState();
        section.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">✅ Google Forms連携済み</h3>
            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                ログイン中: ${authState?.googleAuth?.user?.email} | 各顧客カードから専用フォームを作成できます
            </p>
        `;
        
        console.log('✅ UI正常化完了');
    },
    
    // 顧客カードの設定
    setupCustomerCards: function() {
        console.log('📋 顧客カード設定開始...');
        
        const customerCards = document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]');
        console.log('顧客カード数:', customerCards.length);
        
        customerCards.forEach((card, index) => {
            // 既存のGoogle Formsボタンコンテナを削除
            const existingContainers = card.querySelectorAll('.google-forms-final-container, .google-forms-container');
            existingContainers.forEach(container => container.remove());
            
            // 新しいボタンコンテナを作成
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'google-forms-final-container';
            buttonContainer.style.cssText = `
                margin-top: 15px;
                padding: 15px;
                border-top: 1px solid #e5e7eb;
                background: #f8f9fa;
                border-radius: 8px;
                text-align: center;
            `;
            
            buttonContainer.innerHTML = `
                <div style="margin-bottom: 8px; color: #10b981; font-size: 0.9rem; font-weight: 600;">
                    ✅ Google Forms連携済み
                </div>
                <button 
                    onclick="window.RentPipeCompleteFormsSystem.createCustomerForm(${index})"
                    style="
                        background: #3b82f6; color: white; border: none;
                        padding: 10px 20px; border-radius: 6px;
                        font-size: 14px; font-weight: 600; cursor: pointer;
                        transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='#2563eb'"
                    onmouseout="this.style.background='#3b82f6'"
                >
                    📝 専用フォーム作成
                </button>
            `;
            
            card.appendChild(buttonContainer);
        });
        
        console.log('✅ 顧客カード設定完了');
    },
    
    // 顧客データ取得
    getCustomerData: function(index) {
        console.log('👤 顧客データ取得:', index);
        
        // LocalStorageから取得
        const storedCustomers = localStorage.getItem('rentpipe_customers');
        if (storedCustomers) {
            try {
                const customers = JSON.parse(storedCustomers);
                if (customers[index]) {
                    console.log('✅ LocalStorageから取得成功');
                    return customers[index];
                }
            } catch (error) {
                console.log('❌ LocalStorage解析エラー:', error);
            }
        }
        
        // DOMから抽出
        const customerCards = document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]');
        const targetCard = customerCards[index];
        
        if (targetCard) {
            const nameElement = targetCard.querySelector('h3, .customer-name, [class*="name"]');
            const emailElement = targetCard.querySelector('[href^="mailto:"], .email, [class*="email"]');
            
            const customer = {
                id: `extracted-${index}`,
                name: nameElement?.textContent?.trim() || `顧客${index + 1}`,
                email: emailElement?.textContent?.trim() || emailElement?.href?.replace('mailto:', '') || `customer${index + 1}@example.com`,
                phone: '03-0000-0000'
            };
            
            console.log('✅ DOM抽出成功:', customer);
            return customer;
        }
        
        return null;
    },
    
    // Google Forms作成メイン関数
    createCustomerForm: async function(customerIndex) {
        try {
            console.log('📝 Google Forms作成開始:', customerIndex);
            
            // 初期化確認
            if (!this.isInitialized || !this.isFormsAPIReady) {
                console.log('🔄 システム再初期化中...');
                const initResult = await this.initialize();
                if (!initResult) {
                    throw new Error('システムの初期化に失敗しました');
                }
            }
            
            // 顧客データ取得
            const customer = this.getCustomerData(customerIndex);
            if (!customer) {
                throw new Error(`顧客データが見つかりません (インデックス: ${customerIndex})`);
            }
            
            console.log('👤 対象顧客:', customer.name);
            
            // ローディング表示
            this.showLoading(`${customer.name}様専用フォームを作成中...`);
            
            // フォーム作成
            const formTitle = `${customer.name}様専用 物件希望調査フォーム - RentPipe`;
            const formDescription = `${customer.name}様専用の物件希望調査フォームです。ご希望の条件をお聞かせください。`;
            
            console.log('🚀 Google Forms作成リクエスト送信...');
            
            const createResponse = await window.gapi.client.forms.forms.create({
                resource: {
                    info: {
                        title: formTitle,
                        description: formDescription
                    }
                }
            });
            
            const form = createResponse.result;
            console.log('✅ フォーム作成成功:', form.formId);
            
            // 詳細項目を追加
            await this.addFormQuestions(form.formId, customer);
            
            // ローディング非表示
            this.hideLoading();
            
            // 成功メッセージ
            const result = {
                success: true,
                form: {
                    id: form.formId,
                    title: formTitle,
                    url: form.responderUri,
                    editUrl: `https://docs.google.com/forms/d/${form.formId}/edit`,
                    responsesUrl: `https://docs.google.com/forms/d/${form.formId}/responses`
                }
            };
            
            this.showSuccessDialog(customer, result.form);
            
            return result;
            
        } catch (error) {
            this.hideLoading();
            console.error('❌ フォーム作成エラー:', error);
            this.showNotification(`❌ フォーム作成エラー: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    },
    
    // フォームに質問項目を追加
    addFormQuestions: async function(formId, customer) {
        console.log('📝 フォーム詳細項目追加中...');
        
        const questions = [
            {
                title: "お名前の確認",
                type: "textQuestion",
                required: true
            },
            {
                title: "メールアドレス",
                type: "textQuestion", 
                required: true
            },
            {
                title: "電話番号",
                type: "textQuestion",
                required: true
            },
            {
                title: "希望予算（月額家賃）",
                type: "choiceQuestion",
                required: true,
                choices: ["5万円以下", "5-8万円", "8-12万円", "12-15万円", "15-20万円", "20万円以上"]
            },
            {
                title: "希望エリア（3つまで選択可）",
                type: "choiceQuestion",
                required: true,
                choices: ["渋谷区", "新宿区", "港区", "品川区", "目黒区", "世田谷区", "中野区", "杉並区", "練馬区", "その他"]
            },
            {
                title: "希望間取り",
                type: "choiceQuestion", 
                required: true,
                choices: ["ワンルーム", "1K", "1DK", "1LDK", "2K", "2DK", "2LDK", "3LDK以上"]
            },
            {
                title: "駅からの徒歩時間",
                type: "choiceQuestion",
                required: true,
                choices: ["5分以内", "10分以内", "15分以内", "20分以内", "時間は気にしない"]
            },
            {
                title: "重視する設備・条件（複数選択可）",
                type: "choiceQuestion",
                required: false,
                choices: ["オートロック", "バス・トイレ別", "エアコン付き", "駐車場付き", "ペット可", "楽器可", "インターネット無料", "宅配ボックス"]
            },
            {
                title: "入居希望時期",
                type: "choiceQuestion",
                required: true,
                choices: ["すぐに", "1ヶ月以内", "2-3ヶ月以内", "半年以内", "時期は決まっていない"]
            },
            {
                title: "その他のご希望・ご質問",
                type: "textQuestion",
                required: false
            }
        ];
        
        // 質問項目を一括で追加
        const requests = questions.map((question, index) => ({
            createItem: {
                item: {
                    title: question.title,
                    questionItem: {
                        question: {
                            required: question.required,
                            [question.type]: question.type === "choiceQuestion" && question.choices ? {
                                type: "CHECKBOX",
                                options: question.choices.map(choice => ({ value: choice }))
                            } : {}
                        }
                    }
                },
                location: {
                    index: index
                }
            }
        }));
        
        await window.gapi.client.forms.forms.batchUpdate({
            formId: formId,
            resource: {
                requests: requests
            }
        });
        
        console.log('✅ フォーム詳細項目追加完了');
    },
    
    // ローディング表示
    showLoading: function(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'form-creation-loading';
        loadingDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        `;
        loadingDiv.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; min-width: 300px;">
                <div style="width: 50px; height: 50px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">フォーム作成中...</h3>
                <p style="margin: 0; color: #6b7280;">${message}</p>
                <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                </style>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    },
    
    // ローディング非表示
    hideLoading: function() {
        const loadingDiv = document.getElementById('form-creation-loading');
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
    },
    
    // 成功ダイアログ
    showSuccessDialog: function(customer, form) {
        const message = `🎉 ${customer.name}様専用フォーム作成成功！

📝 フォームURL:
${form.url}

🔗 管理URL:
${form.editUrl}

📊 回答確認URL:
${form.responsesUrl}

10項目の詳細な物件希望調査フォームが作成されました。
フォームを確認しますか？`;
        
        alert(message);
        
        if (confirm('フォームを新しいタブで開きますか？')) {
            window.open(form.url, '_blank');
        }
    },
    
    // 通知表示
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${bgColor}; color: white;
            padding: 15px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000; font-size: 14px; max-width: 350px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transition = 'opacity 0.5s ease';
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.parentNode.removeChild(notification);
                }, 500);
            }
        }, 5000);
    }
};

// DOMContentLoadedで自動初期化
document.addEventListener('DOMContentLoaded', function() {
    // 2秒後に初期化開始（他のスクリプトの読み込み完了を待つ）
    setTimeout(() => {
        console.log('🚀 完全統合システム自動初期化開始...');
        window.RentPipeCompleteFormsSystem.initialize().then(success => {
            if (success) {
                console.log('✅ 完全統合システム自動初期化成功');
            } else {
                console.log('❌ 完全統合システム自動初期化失敗');
            }
        });
    }, 2000);
});

// バックアップとして5秒後にも実行
setTimeout(() => {
    if (!window.RentPipeCompleteFormsSystem.isInitialized) {
        console.log('🔄 バックアップ初期化実行...');
        window.RentPipeCompleteFormsSystem.initialize();
    }
}, 5000);

// グローバル関数として追加
window.createCustomerForm = (index) => window.RentPipeCompleteFormsSystem.createCustomerForm(index);

console.log('✅ RentPipe Google Forms 完全統合ソリューション準備完了');
