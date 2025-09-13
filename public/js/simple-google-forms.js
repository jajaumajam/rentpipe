// 🎯 シンプルで確実なGoogle Forms連携システム
console.log('🎯 シンプルGoogle Forms連携システム初期化中...');

window.SimpleGoogleForms = {
    // 初期化状態
    isInitialized: false,
    isAPIReady: false,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('🔧 Google Forms API初期化開始...');
            
            // 認証状態確認
            if (!window.IntegratedAuthManagerV2 || !window.IntegratedAuthManagerV2.canUseGoogleForms()) {
                throw new Error('Google認証が必要です');
            }
            
            // Google API Client Library確認
            if (!window.gapi) {
                console.log('📚 Google API Client Library読み込み中...');
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
            this.isInitialized = false;
            this.isAPIReady = false;
            return false;
        }
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
                reject(error);
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
                        
                        // アクセストークン取得
                        const authState = window.IntegratedAuthManagerV2.getAuthState();
                        const accessToken = authState.googleAuth.accessToken;
                        
                        if (!accessToken) {
                            throw new Error('アクセストークンが見つかりません');
                        }
                        
                        // API Client初期化
                        await window.gapi.client.init({
                            discoveryDocs: ['https://forms.googleapis.com/$discovery/rest?version=v1']
                        });
                        
                        // アクセストークン設定
                        window.gapi.client.setToken({
                            access_token: accessToken
                        });
                        
                        console.log('✅ Google API Client設定完了');
                        resolve();
                        
                    } catch (error) {
                        console.error('❌ Google API Client設定エラー:', error);
                        reject(error);
                    }
                },
                onerror: (error) => {
                    console.error('❌ Google API Client読み込みエラー:', error);
                    reject(error);
                }
            });
        });
    },
    
    // 顧客専用フォーム作成
    createCustomerForm: async function(customerData) {
        try {
            console.log('📝 顧客専用フォーム作成開始:', customerData.name);
            
            // 初期化確認
            if (!this.isAPIReady) {
                console.log('🔄 API初期化中...');
                const initResult = await this.initialize();
                if (!initResult) {
                    throw new Error('Google Forms APIの初期化に失敗しました');
                }
            }
            
            // フォーム基本情報
            const formTitle = `${customerData.name}様専用 物件希望調査フォーム - RentPipe`;
            const formDescription = this.generateFormDescription(customerData);
            
            console.log('🚀 Google Formsでフォーム作成中...');
            
            // フォーム作成リクエスト
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
            
            // フォームに質問項目を追加
            await this.addFormQuestions(form.formId, customerData);
            
            // フォーム情報を返却
            const formInfo = {
                success: true,
                form: {
                    id: form.formId,
                    title: formTitle,
                    url: form.responderUri,
                    editUrl: `https://docs.google.com/forms/d/${form.formId}/edit`,
                    responsesUrl: `https://docs.google.com/forms/d/${form.formId}/responses`,
                    customerData: customerData,
                    createdAt: new Date().toISOString(),
                    createdBy: window.IntegratedAuthManagerV2.getAuthState().googleAuth.user.email
                }
            };
            
            // 顧客データにフォーム情報を保存
            this.saveFormToCustomer(customerData.id, formInfo.form);
            
            return formInfo;
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            return {
                success: false,
                error: 'フォームの作成に失敗しました: ' + (error.message || error)
            };
        }
    },
    
    // フォーム説明文生成
    generateFormDescription: function(customerData) {
        return `🏠 RentPipe 物件希望調査フォーム

${customerData.name}様、いつもお世話になっております。
より最適な物件をご提案するため、詳しいご希望条件をお聞かせください。

📋 このフォームについて
- ${customerData.name}様専用のフォームです
- 回答内容は担当エージェントのみが確認できます
- 何度でも回答を修正していただけます
- ご不明な点がございましたら、お気軽にお問い合わせください

🔒 プライバシー保護
お客様の個人情報は適切に管理され、物件ご提案以外の目的では使用いたしません。`;
    },
    
    // フォームに質問項目を追加
    addFormQuestions: async function(formId, customerData) {
        try {
            console.log('📋 フォームに質問項目を追加中...');
            
            const questions = [
                {
                    title: "【基本情報】お名前",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "【基本情報】メールアドレス",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "【基本情報】電話番号",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "【住居希望】予算（下限）",
                    description: "月額家賃の下限をお教えください（万円）",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "【住居希望】予算（上限）",
                    description: "月額家賃の上限をお教えください（万円）",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "【住居希望】希望エリア",
                    description: "希望する地域・駅名などをお教えください",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: true
                            }
                        }
                    }
                },
                {
                    title: "【住居希望】間取り",
                    questionItem: {
                        question: {
                            required: true,
                            choiceQuestion: {
                                type: "RADIO",
                                options: [
                                    { value: "ワンルーム・1K" },
                                    { value: "1DK・1LDK" },
                                    { value: "2K・2DK" },
                                    { value: "2LDK・3K" },
                                    { value: "3DK・3LDK" },
                                    { value: "4LDK以上" },
                                    { value: "その他・相談" }
                                ]
                            }
                        }
                    }
                },
                {
                    title: "【詳細条件】その他ご希望・ご質問",
                    description: "駅徒歩時間、築年数、ペット、楽器、駐車場など、その他のご希望がありましたら自由にお書きください",
                    questionItem: {
                        question: {
                            required: false,
                            textQuestion: {
                                paragraph: true
                            }
                        }
                    }
                }
            ];
            
            // 質問を一つずつ追加
            for (let i = 0; i < questions.length; i++) {
                const questionData = questions[i];
                
                await window.gapi.client.forms.forms.batchUpdate({
                    formId: formId,
                    resource: {
                        requests: [{
                            createItem: {
                                item: {
                                    title: questionData.title,
                                    description: questionData.description,
                                    questionItem: questionData.questionItem
                                },
                                location: {
                                    index: i
                                }
                            }
                        }]
                    }
                });
                
                console.log(`✅ 質問 ${i + 1}/${questions.length} 追加完了: ${questionData.title}`);
            }
            
            console.log('✅ 全質問項目の追加完了');
            
        } catch (error) {
            console.error('❌ 質問項目追加エラー:', error);
            // 質問追加エラーは致命的でないため、継続
        }
    },
    
    // 顧客データにフォーム情報を保存
    saveFormToCustomer: function(customerId, formInfo) {
        try {
            console.log('💾 顧客データにフォーム情報保存中:', customerId);
            
            // 既存の顧客データを取得
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex !== -1) {
                // Google Forms情報を追加
                customers[customerIndex].googleForm = {
                    ...formInfo,
                    status: 'created',
                    sentAt: null,
                    lastResponseAt: null,
                    responseCount: 0
                };
                
                // ローカルストレージに保存
                localStorage.setItem('customers', JSON.stringify(customers));
                
                console.log('✅ 顧客データにフォーム情報保存完了');
            } else {
                console.warn('⚠️ 対象の顧客が見つかりません:', customerId);
            }
            
        } catch (error) {
            console.error('❌ フォーム情報保存エラー:', error);
        }
    },
    
    // フォーム回答を取得
    getFormResponses: async function(formId) {
        try {
            if (!this.isAPIReady) {
                await this.initialize();
            }
            
            console.log('📊 フォーム回答取得中:', formId);
            
            const response = await window.gapi.client.forms.forms.responses.list({
                formId: formId
            });
            
            const responses = response.result.responses || [];
            console.log('✅ フォーム回答取得完了:', responses.length, '件');
            
            return {
                success: true,
                responses: responses,
                count: responses.length
            };
            
        } catch (error) {
            console.error('❌ フォーム回答取得エラー:', error);
            return {
                success: false,
                error: 'フォーム回答の取得に失敗しました: ' + error.message
            };
        }
    }
};

console.log('✅ シンプルGoogle Forms連携システム準備完了');
