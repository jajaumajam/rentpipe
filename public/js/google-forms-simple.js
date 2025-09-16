// 🎯 Google Forms API シンプル連携（直接使用方式）
console.log('🎯 Google Forms API シンプル連携を初期化中...');

window.GoogleFormsSimple = {
    // 初期化状態
    isInitialized: false,
    isAPIReady: false,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('📚 Google Forms API初期化開始...');
            
            // 認証状態確認
            if (!this.checkAuthentication()) {
                throw new Error('Google認証が必要です');
            }
            
            // Google API Client Library読み込み確認
            if (!window.gapi) {
                console.log('📥 Google API Client Library読み込み中...');
                await this.loadGoogleAPI();
            }
            
            // Google API Client初期化
            await this.initializeGAPIClient();
            
            this.isInitialized = true;
            this.isAPIReady = true;
            
            console.log('✅ Google Forms API初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Forms API初期化エラー:', error);
            this.showError('Google Forms APIの初期化に失敗しました: ' + error.message);
            return false;
        }
    },
    
    // 認証状態チェック
    checkAuthentication: function() {
        const googleAuth = localStorage.getItem('rentpipe_temp_auth');
        const isAuthenticated = (googleAuth === 'google_authenticated');
        
        console.log('🔍 Google認証状態確認:', isAuthenticated);
        
        if (!isAuthenticated) {
            this.showError('Google認証が必要です。まず「Google認証してフォーム機能を利用」ボタンをクリックしてください。');
            return false;
        }
        
        return true;
    },
    
    // Google API Client Library読み込み
    loadGoogleAPI: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('✅ Google API Client Library読み込み完了');
                resolve();
            };
            script.onerror = (error) => {
                console.error('❌ Google API Client Library読み込み失敗:', error);
                reject(new Error('Google API Client Libraryの読み込みに失敗しました'));
            };
            
            document.head.appendChild(script);
        });
    },
    
    // Google API Client初期化
    initializeGAPIClient: function() {
        return new Promise((resolve, reject) => {
            window.gapi.load('client', {
                callback: async () => {
                    try {
                        console.log('🔧 Google API Client設定中...');
                        
                        // Google API Client初期化
                        await window.gapi.client.init({
                            apiKey: 'AIzaSyBvJGdan0lvVSkaAbbSXQkoh6YyPoGyTgM',
                            discoveryDocs: ['https://forms.googleapis.com/$discovery/rest?version=v1']
                        });
                        
                        // アクセストークン設定（localStorage から取得）
                        const accessToken = localStorage.getItem('google_access_token');
                        if (accessToken) {
                            window.gapi.client.setToken({
                                access_token: accessToken
                            });
                            console.log('🔑 アクセストークン設定完了');
                        } else {
                            console.warn('⚠️ アクセストークンが見つかりません');
                        }
                        
                        console.log('✅ Google API Client初期化完了');
                        resolve();
                        
                    } catch (error) {
                        console.error('❌ Google API Client初期化エラー:', error);
                        reject(error);
                    }
                },
                onerror: (error) => {
                    console.error('❌ gapi.client読み込みエラー:', error);
                    reject(error);
                }
            });
        });
    },
    
    // 顧客専用フォームを作成
    createCustomerForm: async function(customerId, customerIndex) {
        try {
            console.log('📝 顧客フォーム作成開始:', customerId);
            
            // 初期化確認
            if (!this.isAPIReady) {
                console.log('🔄 API初期化を実行中...');
                const initResult = await this.initialize();
                if (!initResult) {
                    throw new Error('Google Forms APIの初期化に失敗しました');
                }
            }
            
            // 顧客データ取得
            const customer = this.getCustomerData(customerId);
            if (!customer) {
                throw new Error('顧客データが見つかりません');
            }
            
            // ローディング表示
            this.showLoading(`${customer.name}様の専用フォームを作成中...`);
            
            // フォーム作成
            const formResult = await this.createForm(customer);
            
            if (formResult.success) {
                // フォーム作成成功
                await this.saveFormToCustomer(customerId, formResult);
                this.showSuccess(customer.name, formResult.formUrl, formResult.editUrl);
                
                // 顧客リストを更新
                setTimeout(() => {
                    if (window.loadCustomerData) {
                        window.loadCustomerData();
                    }
                }, 1000);
                
            } else {
                throw new Error(formResult.error || 'フォームの作成に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ 顧客フォーム作成エラー:', error);
            this.showError('フォームの作成中にエラーが発生しました: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },
    
    // 顧客データ取得
    getCustomerData: function(customerId) {
        try {
            // 複数のキーから顧客データを取得
            const possibleKeys = ['customers', 'rentpipe_demo_customers', 'rentpipe_customers'];
            
            for (const key of possibleKeys) {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    const customers = JSON.parse(storedData);
                    const customer = customers.find(c => c.id === customerId);
                    if (customer) {
                        console.log('✅ 顧客データ取得成功:', customer.name);
                        return customer;
                    }
                }
            }
            
            console.error('❌ 顧客データが見つかりません:', customerId);
            return null;
            
        } catch (error) {
            console.error('❌ 顧客データ取得エラー:', error);
            return null;
        }
    },
    
    // Google Forms APIでフォーム作成
    createForm: async function(customer) {
        try {
            console.log('📝 Google Forms APIでフォーム作成:', customer.name);
            
            // フォーム基本情報
            const formTitle = `${customer.name}様専用 物件希望調査フォーム`;
            const formDescription = `
RentPipeをご利用いただき、ありがとうございます。
${customer.name}様専用の物件希望調査フォームです。

以下の項目にご回答いただくことで、より最適な物件をご提案できます。
※このフォームは${customer.name}様専用です。回答内容は担当エージェントのみが確認できます。
            `.trim();
            
            // フォーム作成リクエスト
            const createRequest = {
                info: {
                    title: formTitle,
                    description: formDescription
                }
            };
            
            // Google Forms APIでフォーム作成
            console.log('🚀 Google Forms API呼び出し中...');
            const response = await window.gapi.client.forms.forms.create({
                resource: createRequest
            });
            
            const form = response.result;
            console.log('✅ フォーム作成成功:', form.formId);
            
            // 質問項目を追加
            await this.addQuestionsToForm(form.formId, customer);
            
            // フォーム情報を返却
            return {
                success: true,
                formId: form.formId,
                formUrl: form.responderUri,
                editUrl: `https://docs.google.com/forms/d/${form.formId}/edit`,
                title: formTitle,
                createdAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Google Forms API呼び出しエラー:', error);
            
            // エラー詳細を解析
            let errorMessage = 'フォームの作成に失敗しました';
            
            if (error.result && error.result.error) {
                const apiError = error.result.error;
                console.error('📋 API エラー詳細:', apiError);
                
                if (apiError.code === 401) {
                    errorMessage = 'Google認証の有効期限が切れています。再度認証を行ってください。';
                } else if (apiError.code === 403) {
                    errorMessage = 'Google Forms APIの利用権限がありません。認証時に必要な権限を許可してください。';
                } else {
                    errorMessage = `API エラー (${apiError.code}): ${apiError.message}`;
                }
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    },
    
    // フォームに質問項目を追加
    addQuestionsToForm: async function(formId, customer) {
        try {
            console.log('❓ フォームに質問項目を追加中...');
            
            // 基本的な質問項目
            const questions = [
                {
                    title: '希望予算（月額賃料）',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                        '5万円以下',
                        '5-8万円',
                        '8-12万円',
                        '12-15万円',
                        '15-20万円',
                        '20万円以上'
                    ]
                },
                {
                    title: '希望する間取り',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                        'ワンルーム',
                        '1K',
                        '1DK',
                        '1LDK',
                        '2DK',
                        '2LDK',
                        '3LDK以上'
                    ]
                },
                {
                    title: '希望エリア（複数選択可）',
                    type: 'CHECKBOX',
                    options: [
                        '新宿・渋谷エリア',
                        '池袋・大塚エリア',
                        '上野・浅草エリア',
                        '品川・大井町エリア',
                        '恵比寿・代官山エリア',
                        '吉祥寺・三鷹エリア',
                        'その他（備考欄に記載）'
                    ]
                },
                {
                    title: '重視する条件（複数選択可）',
                    type: 'CHECKBOX',
                    options: [
                        '駅近（徒歩5分以内）',
                        'オートロック',
                        'バス・トイレ別',
                        'ペット可',
                        '楽器可',
                        '駐車場あり',
                        '南向き',
                        '新築・築浅'
                    ]
                },
                {
                    title: '入居希望時期',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                        '即入居可',
                        '1ヶ月以内',
                        '2-3ヶ月以内',
                        '半年以内',
                        '時期未定'
                    ]
                },
                {
                    title: 'その他のご要望・質問',
                    type: 'TEXT',
                    options: []
                }
            ];
            
            // 質問を順番に追加
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                
                const updateRequest = {
                    requests: [{
                        createItem: {
                            item: {
                                title: question.title,
                                questionItem: {
                                    question: this.createQuestionConfig(question.type, question.options),
                                    required: (i < 3) // 最初の3問は必須
                                }
                            },
                            location: {
                                index: i
                            }
                        }
                    }]
                };
                
                await window.gapi.client.forms.forms.batchUpdate({
                    formId: formId,
                    resource: updateRequest
                });
            }
            
            console.log('✅ 質問項目追加完了');
            
        } catch (error) {
            console.error('❌ 質問項目追加エラー:', error);
            // 質問追加エラーは致命的ではないため、継続
        }
    },
    
    // 質問タイプに応じた設定を作成
    createQuestionConfig: function(type, options) {
        switch (type) {
            case 'MULTIPLE_CHOICE':
                return {
                    choiceQuestion: {
                        type: 'RADIO',
                        options: options.map(option => ({ value: option }))
                    }
                };
            
            case 'CHECKBOX':
                return {
                    choiceQuestion: {
                        type: 'CHECKBOX',
                        options: options.map(option => ({ value: option }))
                    }
                };
            
            case 'TEXT':
                return {
                    textQuestion: {
                        paragraph: true
                    }
                };
            
            default:
                return {
                    textQuestion: {
                        paragraph: false
                    }
                };
        }
    },
    
    // フォーム情報を顧客データに保存
    saveFormToCustomer: async function(customerId, formData) {
        try {
            console.log('💾 フォーム情報を顧客データに保存中...');
            
            // 顧客データ更新
            const possibleKeys = ['customers', 'rentpipe_demo_customers', 'rentpipe_customers'];
            
            for (const key of possibleKeys) {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    const customers = JSON.parse(storedData);
                    const customerIndex = customers.findIndex(c => c.id === customerId);
                    
                    if (customerIndex !== -1) {
                        // Google Forms情報を追加
                        customers[customerIndex].googleForm = {
                            formId: formData.formId,
                            formUrl: formData.formUrl,
                            editUrl: formData.editUrl,
                            title: formData.title,
                            status: 'created',
                            createdAt: formData.createdAt,
                            responseCount: 0
                        };
                        
                        // ローカルストレージに保存
                        localStorage.setItem(key, JSON.stringify(customers));
                        console.log('✅ 顧客データ更新完了');
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 顧客データ更新エラー:', error);
        }
    },
    
    // ローディング表示
    showLoading: function(message) {
        // 既存のローディング要素があれば削除
        this.hideLoading();
        
        const overlay = document.createElement('div');
        overlay.id = 'google-forms-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">📝</div>
                <h3 style="margin: 0 0 1rem 0;">Google Forms作成中</h3>
                <p style="margin: 0; color: #666;">${message}</p>
                <div style="margin-top: 1rem;">
                    <div class="loading-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // スピンナーアニメーション
        if (!document.getElementById('loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // ローディング非表示
    hideLoading: function() {
        const overlay = document.getElementById('google-forms-loading');
        if (overlay) {
            overlay.remove();
        }
    },
    
    // 成功メッセージ表示
    showSuccess: function(customerName, formUrl, editUrl) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h3 style="margin: 0 0 1rem 0; color: #059669;">フォーム作成完了！</h3>
                <p style="margin: 0 0 1.5rem 0; color: #374151;">
                    ${customerName}様専用の物件希望調査フォームが作成されました
                </p>
                <div style="margin: 1rem 0; padding: 1rem; background: #f3f4f6; border-radius: 6px; text-align: left;">
                    <p style="margin: 0 0 0.5rem 0; font-weight: bold;">📝 フォームURL:</p>
                    <a href="${formUrl}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 14px; word-break: break-all;">${formUrl}</a>
                    
                    <p style="margin: 1rem 0 0.5rem 0; font-weight: bold;">⚙️ 編集URL:</p>
                    <a href="${editUrl}" target="_blank" style="color: #059669; text-decoration: none; font-size: 14px; word-break: break-all;">${editUrl}</a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    閉じる
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 5秒後に自動で閉じる
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 10000);
    },
    
    // エラーメッセージ表示
    showError: function(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <h3 style="margin: 0 0 1rem 0; color: #dc2626;">エラーが発生しました</h3>
                <p style="margin: 0 0 1.5rem 0; color: #6b7280; font-size: 14px;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    閉じる
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 10秒後に自動で閉じる
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 10000);
    }
};

// グローバル関数として公開
window.createCustomerForm = function(customerId, customerIndex) {
    window.GoogleFormsSimple.createCustomerForm(customerId, customerIndex);
};

console.log('✅ Google Forms API シンプル連携準備完了');
