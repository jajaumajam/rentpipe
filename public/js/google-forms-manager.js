// 📝 Google Forms連携マネージャー
console.log('📝 Google Forms連携マネージャー初期化中...');

window.GoogleFormsManager = {
    // 初期化状態
    isInitialized: false,
    
    // Google Forms APIクライアント
    formsClient: null,
    
    // 初期化
    initialize: async function() {
        try {
            console.log('📚 Google Forms API初期化中...');
            
            // Google OAuth認証チェック
            if (!window.GoogleOAuth || !window.GoogleOAuth.isSignedIn) {
                throw new Error('Google認証が必要です');
            }
            
            // Google API Client Library読み込み
            if (!window.gapi) {
                throw new Error('Google API Client Libraryが読み込まれていません');
            }
            
            // Google Forms API Discovery Document読み込み
            await window.gapi.client.load('forms', 'v1');
            
            this.formsClient = window.gapi.client.forms;
            this.isInitialized = true;
            
            console.log('✅ Google Forms API初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Forms API初期化エラー:', error);
            return false;
        }
    },
    
    // 顧客専用フォームを作成
    createCustomerForm: async function(customerData) {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Forms APIが初期化されていません');
            }
            
            console.log('📝 顧客専用フォーム作成開始:', customerData.name);
            
            // フォーム基本情報
            const formTitle = `${customerData.name}様専用 物件希望調査フォーム`;
            const formDescription = `
RentPipeをご利用いただき、ありがとうございます。
${customerData.name}様専用の物件希望調査フォームです。
以下の項目にご回答いただくことで、より最適な物件をご提案できます。

※このフォームは${customerData.name}様専用です。回答内容は担当エージェントのみが確認できます。
            `.trim();
            
            // フォーム作成リクエスト
            const formRequest = {
                info: {
                    title: formTitle,
                    description: formDescription
                }
            };
            
            // Google Forms APIでフォーム作成
            const response = await this.formsClient.forms.create({
                resource: formRequest
            });
            
            const form = response.result;
            console.log('✅ フォーム作成成功:', form.formId);
            
            // フォームに質問項目を追加
            await this.addFormQuestions(form.formId, customerData);
            
            // フォーム情報を返却
            return {
                success: true,
                form: {
                    id: form.formId,
                    title: formTitle,
                    url: form.responderUri,
                    editUrl: `https://docs.google.com/forms/d/${form.formId}/edit`,
                    customerData: customerData,
                    createdAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            return {
                success: false,
                error: 'フォームの作成に失敗しました: ' + error.message
            };
        }
    },
    
    // フォームに質問項目を追加
    addFormQuestions: async function(formId, customerData) {
        try {
            console.log('📝 フォーム質問項目追加中:', formId);
            
            // 質問項目の定義
            const questions = [
                // 基本情報セクション
                {
                    title: '基本情報',
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
                        }
                    ]
                },
                
                // 住居希望条件セクション
                {
                    title: '住居希望条件',
                    description: 'ご希望の住居条件について詳しくお聞かせください',
                    questions: [
                        {
                            title: '希望予算（月額家賃）',
                            type: 'MULTIPLE_CHOICE',
                            required: true,
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
                                'その他（詳細は備考欄に記載）'
                            ]
                        },
                        {
                            title: '希望間取り',
                            type: 'MULTIPLE_CHOICE',
                            required: true,
                            options: [
                                'ワンルーム',
                                '1K',
                                '1DK',
                                '1LDK',
                                '2K',
                                '2DK',
                                '2LDK',
                                'その他'
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
                
                // 詳細条件セクション
                {
                    title: '詳細条件・こだわり',
                    description: 'より詳しいご希望条件をお聞かせください',
                    questions: [
                        {
                            title: '駅からの徒歩時間（上限）',
                            type: 'MULTIPLE_CHOICE',
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
                                'その他'
                            ]
                        }
                    ]
                },
                
                // 自由記載セクション
                {
                    title: 'その他ご希望・ご質問',
                    questions: [
                        {
                            title: 'その他のご希望やこだわり条件',
                            type: 'PARAGRAPH_TEXT',
                            description: '上記以外でご希望やこだわりがございましたら、自由にご記載ください'
                        },
                        {
                            title: '現在のお住まいでのお困りごと',
                            type: 'PARAGRAPH_TEXT',
                            description: '現在のお住まいで困っていること、解決したいことがあればご記載ください'
                        },
                        {
                            title: 'エージェントへの質問・要望',
                            type: 'PARAGRAPH_TEXT',
                            description: 'お部屋探しや契約について、ご不明な点やご要望がございましたらお聞かせください'
                        }
                    ]
                }
            ];
            
            // バッチリクエストで質問を追加
            let requestIndex = 0;
            const batchRequests = [];
            
            questions.forEach((section, sectionIndex) => {
                // セクション見出し追加
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
                    const questionItem = {
                        title: q.title,
                        required: q.required || false
                    };
                    
                    if (q.description) {
                        questionItem.description = q.description;
                    }
                    
                    // 質問タイプ別の設定
                    switch (q.type) {
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
                                options: q.options.map(opt => ({ value: opt }))
                            };
                            break;
                        case 'CHECKBOX':
                            questionItem.choiceQuestion = {
                                type: 'CHECKBOX',
                                options: q.options.map(opt => ({ value: opt }))
                            };
                            break;
                    }
                    
                    batchRequests.push({
                        createItem: {
                            item: {
                                title: q.title,
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
            await this.formsClient.forms.batchUpdate({
                formId: formId,
                resource: {
                    requests: batchRequests
                }
            });
            
            console.log('✅ フォーム質問項目追加完了:', requestIndex, '件');
            
        } catch (error) {
            console.error('❌ 質問項目追加エラー:', error);
            throw error;
        }
    },
    
    // フォーム回答を取得
    getFormResponses: async function(formId) {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Forms APIが初期化されていません');
            }
            
            console.log('📊 フォーム回答取得中:', formId);
            
            const response = await this.formsClient.forms.responses.list({
                formId: formId
            });
            
            console.log('✅ フォーム回答取得完了:', response.result.responses?.length || 0, '件');
            
            return {
                success: true,
                responses: response.result.responses || []
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

console.log('✅ Google Forms連携マネージャー準備完了');
