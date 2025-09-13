// 📝 Google Forms API v2（Google Identity Services対応）
console.log('📝 Google Forms API v2 初期化中...');

window.GoogleFormsAPIv2 = {
    // 初期化状態
    isInitialized: false,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('📚 Google Forms API v2 初期化開始...');
            
            // Google認証状態チェック
            if (!window.IntegratedAuthManagerV2 || !window.IntegratedAuthManagerV2.canUseGoogleForms()) {
                throw new Error('Google認証が必要です');
            }
            
            // Google API Client Library の確認
            if (!window.gapi) {
                // Google API Client Library を動的読み込み
                await this.loadGoogleAPIClient();
            }
            
            // Google API Client を初期化
            await new Promise((resolve, reject) => {
                window.gapi.load('client', {
                    callback: resolve,
                    onerror: reject
                });
            });
            
            // Google Forms API クライアント初期化
            const accessToken = window.IntegratedAuthManagerV2.googleAuth.accessToken;
            
            await window.gapi.client.init({
                apiKey: 'AIzaSyBvJGdan0lvVSkaAbbSXQkoh6YyPoGyTgM', // 必要に応じて変更
                discoveryDocs: ['https://forms.googleapis.com/$discovery/rest?version=v1']
            });
            
            // アクセストークン設定
            window.gapi.client.setToken({
                access_token: accessToken
            });
            
            this.isInitialized = true;
            console.log('✅ Google Forms API v2 初期化完了');
            
            return true;
            
        } catch (error) {
            console.error('❌ Google Forms API v2 初期化エラー:', error);
            return false;
        }
    },
    
    // Google API Client Library の動的読み込み
    loadGoogleAPIClient: function() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('📚 Google API Client Library 読み込み完了');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Google API Client Library の読み込みに失敗'));
            };
            
            document.head.appendChild(script);
        });
    },
    
    // 顧客専用フォームを作成
    createCustomerForm: async function(customerData) {
        try {
            if (!this.isInitialized) {
                const initResult = await this.initialize();
                if (!initResult) {
                    throw new Error('Google Forms API初期化に失敗しました');
                }
            }
            
            console.log('📝 顧客専用フォーム作成開始:', customerData.name);
            
            // フォーム基本情報
            const formTitle = `${customerData.name}様専用 物件希望調査フォーム - RentPipe`;
            const formDescription = this.generateFormDescription(customerData);
            
            // フォーム作成リクエスト
            const createRequest = {
                info: {
                    title: formTitle,
                    description: formDescription
                }
            };
            
            // Google Forms APIでフォーム作成
            const createResponse = await window.gapi.client.forms.forms.create({
                resource: createRequest
            });
            
            const form = createResponse.result;
            console.log('✅ フォーム作成成功:', form.formId);
            
            // フォームに質問項目を追加
            await this.addFormQuestions(form.formId, customerData);
            
            // フォーム設定を更新（回答収集設定など）
            await this.updateFormSettings(form.formId, customerData);
            
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
                    createdBy: window.IntegratedAuthManagerV2.googleAuth.user.email
                }
            };
            
            // RentPipe顧客データにフォーム情報を保存
            await this.saveFormInfoToCustomer(customerData.id, formInfo.form);
            
            return formInfo;
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            return {
                success: false,
                error: 'フォームの作成に失敗しました: ' + (error.message || error)
            };
        }
    },
    
    // フォーム説明文を生成
    generateFormDescription: function(customerData) {
        return `
🏠 RentPipe 物件希望調査フォーム

${customerData.name}様、いつもお世話になっております。
より最適な物件をご提案するため、詳しいご希望条件をお聞かせください。

📋 このフォームについて
- ${customerData.name}様専用のフォームです
- 回答内容は担当エージェントのみが確認できます
- 後からいつでも内容を変更できます
- 回答にはおよそ5-10分程度かかります

🔒 プライバシー保護
お客様の個人情報は厳重に管理し、物件紹介以外の目的では使用いたしません。

ご質問がございましたら、担当エージェントまでお気軽にお声がけください。

---
作成日: ${new Date().toLocaleDateString('ja-JP')}
作成者: RentPipeシステム
        `.trim();
    },
    
    // フォームに質問項目を追加
    addFormQuestions: async function(formId, customerData) {
        try {
            console.log('📝 フォーム質問項目追加中:', formId);
            
            // 質問項目の定義
            const questionSections = this.getQuestionSections(customerData);
            
            // バッチリクエストを構築
            const batchRequests = [];
            let requestIndex = 0;
            
            questionSections.forEach((section) => {
                // セクション見出しを追加（ページブレイク）
                if (section.title && section.description) {
                    batchRequests.push({
                        createItem: {
                            item: {
                                title: section.title,
                                description: section.description,
                                pageBreakItem: {}
                            },
                            location: {
                                index: requestIndex++
                            }
                        }
                    });
                }
                
                // セクション内の質問を追加
                section.questions.forEach((q) => {
                    const questionItem = this.buildQuestionItem(q);
                    
                    batchRequests.push({
                        createItem: {
                            item: {
                                title: q.title,
                                description: q.description || '',
                                questionItem: questionItem
                            },
                            location: {
                                index: requestIndex++
                            }
                        }
                    });
                });
            });
            
            // バッチリクエスト実行
            if (batchRequests.length > 0) {
                await window.gapi.client.forms.forms.batchUpdate({
                    formId: formId,
                    resource: {
                        requests: batchRequests
                    }
                });
            }
            
            console.log('✅ フォーム質問項目追加完了:', batchRequests.length, '件');
            
        } catch (error) {
            console.error('❌ 質問項目追加エラー:', error);
            throw error;
        }
    },
    
    // 質問セクションの定義
    getQuestionSections: function(customerData) {
        return [
            {
                title: '📝 基本情報確認',
                description: 'ご契約者様の基本情報をご確認ください',
                questions: [
                    {
                        title: 'お名前（確認用）',
                        type: 'TEXT',
                        required: true,
                        description: '確認のためお名前をご入力ください'
                    },
                    {
                        title: 'メールアドレス（確認用）',
                        type: 'TEXT',
                        required: true,
                        description: '確認のためメールアドレスをご入力ください'
                    },
                    {
                        title: '電話番号',
                        type: 'TEXT',
                        required: true,
                        description: '緊急時の連絡先として使用します'
                    },
                    {
                        title: '現在のご住所',
                        type: 'TEXT',
                        required: false,
                        description: 'おおよその地域で構いません'
                    },
                    {
                        title: 'ご職業',
                        type: 'MULTIPLE_CHOICE',
                        required: true,
                        options: [
                            '会社員（正社員）',
                            '会社員（契約・派遣）',
                            '公務員',
                            '自営業・フリーランス',
                            '学生',
                            'その他'
                        ]
                    },
                    {
                        title: '年収概算',
                        type: 'MULTIPLE_CHOICE',
                        required: true,
                        description: '審査の参考にさせていただきます',
                        options: [
                            '200万円未満',
                            '200万円〜300万円',
                            '300万円〜400万円',
                            '400万円〜500万円',
                            '500万円〜700万円',
                            '700万円〜1000万円',
                            '1000万円以上'
                        ]
                    }
                ]
            },
            {
                title: '🏠 住居希望条件',
                description: 'ご希望の住居条件について詳しくお聞かせください',
                questions: [
                    {
                        title: '希望予算（月額家賃）',
                        type: 'MULTIPLE_CHOICE',
                        required: true,
                        description: '管理費・共益費込みでの概算',
                        options: [
                            '5万円以下',
                            '5万円〜7万円',
                            '7万円〜10万円',
                            '10万円〜15万円',
                            '15万円〜20万円',
                            '20万円以上'
                        ]
                    },
                    {
                        title: '希望エリア（3つまで選択可）',
                        type: 'CHECKBOX',
                        required: true,
                        description: 'お住まいになりたいエリアを3つまでお選びください',
                        options: [
                            '渋谷区', '新宿区', '港区', '中央区', '千代田区',
                            '品川区', '目黒区', '世田谷区', '杉並区', '中野区',
                            '練馬区', '板橋区', '豊島区', '文京区', '台東区',
                            '江東区', '墨田区', '荒川区', '足立区', '葛飾区',
                            '江戸川区', '北区', '大田区',
                            'その他23区外（詳細は備考欄に記載）'
                        ]
                    },
                    {
                        title: '希望間取り',
                        type: 'CHECKBOX',
                        required: true,
                        description: '複数選択可',
                        options: [
                            'ワンルーム',
                            '1K',
                            '1DK',
                            '1LDK',
                            '2K',
                            '2DK',
                            '2LDK',
                            '3K以上'
                        ]
                    },
                    {
                        title: '入居希望時期',
                        type: 'MULTIPLE_CHOICE',
                        required: true,
                        options: [
                            '1ヶ月以内',
                            '2ヶ月以内',
                            '3ヶ月以内',
                            '6ヶ月以内',
                            '時期は未定'
                        ]
                    }
                ]
            },
            {
                title: '🔍 詳細条件・こだわり',
                description: 'より詳しいご希望条件をお聞かせください',
                questions: [
                    {
                        title: '駅からの徒歩時間（上限）',
                        type: 'MULTIPLE_CHOICE',
                        required: false,
                        options: [
                            '5分以内',
                            '10分以内',
                            '15分以内',
                            '20分以内',
                            '特に制限なし'
                        ]
                    },
                    {
                        title: '築年数の希望',
                        type: 'MULTIPLE_CHOICE',
                        required: false,
                        options: [
                            '新築・築浅（5年以内）',
                            '築10年以内',
                            '築20年以内',
                            '築年数は問わない'
                        ]
                    },
                    {
                        title: '重視する設備・条件（複数選択可）',
                        type: 'CHECKBOX',
                        required: false,
                        description: 'ご希望の設備をお選びください',
                        options: [
                            'バス・トイレ別',
                            'エアコン付き',
                            'オートロック',
                            '宅配ボックス',
                            'ペット可',
                            '楽器可',
                            '駐車場',
                            '駐輪場',
                            '南向き',
                            '2階以上',
                            'フローリング',
                            'システムキッチン',
                            '独立洗面台',
                            'ウォークインクローゼット',
                            'インターネット無料',
                            'その他'
                        ]
                    },
                    {
                        title: 'ペットについて',
                        type: 'MULTIPLE_CHOICE',
                        required: false,
                        options: [
                            'ペットは飼っていない',
                            '犬を飼っている（小型）',
                            '犬を飼っている（中〜大型）',
                            '猫を飼っている',
                            'その他のペット',
                            '今後ペットを飼う予定'
                        ]
                    },
                    {
                        title: '楽器演奏について',
                        type: 'MULTIPLE_CHOICE',
                        required: false,
                        options: [
                            '楽器は演奏しない',
                            'ピアノ・電子ピアノ',
                            'ギター・ベース',
                            '管楽器',
                            'ドラム・打楽器',
                            'その他楽器'
                        ]
                    }
                ]
            },
            {
                title: '💭 その他ご希望・ご質問',
                description: '自由にご記載ください',
                questions: [
                    {
                        title: 'その他のご希望やこだわり条件',
                        type: 'PARAGRAPH_TEXT',
                        required: false,
                        description: '上記以外でご希望やこだわりがございましたら、自由にご記載ください'
                    },
                    {
                        title: '現在のお住まいでのお困りごと',
                        type: 'PARAGRAPH_TEXT',
                        required: false,
                        description: '現在のお住まいで困っていること、解決したいことがあればご記載ください'
                    },
                    {
                        title: 'エージェントへの質問・要望',
                        type: 'PARAGRAPH_TEXT',
                        required: false,
                        description: 'お部屋探しや契約について、ご不明な点やご要望がございましたらお聞かせください'
                    },
                    {
                        title: '物件見学のご都合',
                        type: 'PARAGRAPH_TEXT',
                        required: false,
                        description: '物件見学可能な曜日・時間帯があれば教えてください'
                    }
                ]
            }
        ];
    },
    
    // 質問項目を構築
    buildQuestionItem: function(question) {
        const questionItem = {
            required: question.required || false
        };
        
        switch (question.type) {
            case 'TEXT':
                questionItem.textQuestion = {};
                break;
                
            case 'PARAGRAPH_TEXT':
                questionItem.textQuestion = {
                    paragraph: true
                };
                break;
                
            case 'MULTIPLE_CHOICE':
                questionItem.choiceQuestion = {
                    type: 'RADIO',
                    options: question.options.map(option => ({ value: option }))
                };
                break;
                
            case 'CHECKBOX':
                questionItem.choiceQuestion = {
                    type: 'CHECKBOX',
                    options: question.options.map(option => ({ value: option }))
                };
                break;
                
            default:
                questionItem.textQuestion = {};
        }
        
        return questionItem;
    },
    
    // フォーム設定を更新
    updateFormSettings: async function(formId, customerData) {
        try {
            console.log('⚙️ フォーム設定更新中:', formId);
            
            const updateRequest = {
                requests: [
                    {
                        updateSettings: {
                            settings: {
                                quizSettings: {
                                    isQuiz: false
                                }
                            },
                            updateMask: 'quizSettings.isQuiz'
                        }
                    }
                ]
            };
            
            await window.gapi.client.forms.forms.batchUpdate({
                formId: formId,
                resource: updateRequest
            });
            
            console.log('✅ フォーム設定更新完了');
            
        } catch (error) {
            console.error('❌ フォーム設定更新エラー:', error);
            // 設定更新エラーは致命的でないため、継続
        }
    },
    
    // RentPipe顧客データにフォーム情報を保存
    saveFormInfoToCustomer: async function(customerId, formInfo) {
        try {
            console.log('💾 顧客データにフォーム情報保存中:', customerId);
            
            // 既存の顧客データを取得
            const customers = await window.FirebaseDataManager.getCustomers();
            const customer = customers.find(c => c.id === customerId);
            
            if (customer) {
                // Google Forms情報を追加
                customer.googleForm = {
                    ...formInfo,
                    status: 'created', // created, sent, responded, updated
                    sentAt: null,
                    lastResponseAt: null,
                    responseCount: 0
                };
                
                // 顧客データを更新
                await window.FirebaseDataManager.updateCustomer(customerId, customer);
                
                console.log('✅ 顧客データにフォーム情報保存完了');
            } else {
                console.warn('⚠️ 対象の顧客が見つかりません:', customerId);
            }
            
        } catch (error) {
            console.error('❌ フォーム情報保存エラー:', error);
            // 保存エラーは致命的でないため、継続
        }
    },
    
    // フォーム回答を取得
    getFormResponses: async function(formId) {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Forms API が初期化されていません');
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

console.log('✅ Google Forms API v2 準備完了');
