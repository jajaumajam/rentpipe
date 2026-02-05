/**
 * Google Forms API マネージャー
 * フォームの自動生成と回答取得を管理
 * 質問IDマッピングによる正確なデータ変換
 */

const GoogleFormsManager = {
    STORAGE_KEY: 'rentpipe_google_form',

    // フォーム設定を保存
    formConfig: null,

    // 質問フィールド定義（順序と名前）
    QUESTION_FIELDS: [
        { field: 'name', title: 'お名前', type: 'text', required: true },
        { field: 'nameKana', title: 'フリガナ', type: 'text' },
        { field: 'email', title: 'メールアドレス', type: 'text' },
        { field: 'phone', title: '電話番号', type: 'text' },
        { field: 'birthday', title: '生年月日', type: 'date' },
        { field: 'gender', title: '性別', type: 'choice', options: ['男性', '女性', 'その他', '回答しない'] },
        { field: 'currentAddress', title: '現住所', type: 'text' },
        { field: 'currentHousing', title: '現在の住居形態', type: 'choice', options: ['賃貸', '持家', '実家', '社宅・寮', 'その他'] },
        { field: 'numberOfOccupants', title: '入居人数', type: 'choice', options: ['1人', '2人', '3人', '4人', '5人以上'] },
        { field: 'occupation', title: 'ご職業', type: 'text' },
        { field: 'companyName', title: '会社名', type: 'text' },
        { field: 'yearsEmployed', title: '勤続年数', type: 'choice', options: ['1年未満', '1年', '2年', '3年', '5年', '10年以上'] },
        { field: 'annualIncome', title: '年収（税込）', type: 'choice', options: ['200万円未満', '200万円〜300万円', '300万円〜400万円', '400万円〜500万円', '500万円〜600万円', '600万円〜700万円', '700万円〜800万円', '800万円〜1000万円', '1000万円以上'] },
        { field: 'movingReason', title: '引越しの理由', type: 'text' },
        { field: 'budgetMin', title: 'ご予算（下限）', type: 'choice', options: ['3万円', '4万円', '5万円', '6万円', '7万円', '8万円', '9万円', '10万円', '12万円', '15万円', '20万円', '30万円以上'] },
        { field: 'budgetMax', title: 'ご予算（上限）', type: 'choice', options: ['5万円', '6万円', '7万円', '8万円', '9万円', '10万円', '12万円', '15万円', '20万円', '30万円', '50万円', '上限なし'] },
        { field: 'moveInDate', title: '入居希望時期', type: 'text' },
        { field: 'areas', title: '希望エリア', type: 'paragraph' },
        { field: 'layout', title: '希望間取り', type: 'checkbox', options: ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3K以上'] },
        { field: 'roomSize', title: '部屋の広さ', type: 'choice', options: ['15㎡以上', '20㎡以上', '25㎡以上', '30㎡以上', '40㎡以上', '50㎡以上', 'こだわらない'] },
        { field: 'stationWalk', title: '駅からの徒歩', type: 'choice', options: ['5分以内', '7分以内', '10分以内', '15分以内', '20分以内', 'こだわらない'] },
        { field: 'buildingAge', title: '築年数', type: 'choice', options: ['新築のみ', '5年以内', '10年以内', '15年以内', '20年以内', 'こだわらない'] },
        { field: 'floor', title: '希望階数', type: 'choice', options: ['1階希望', '2階以上', '3階以上', '5階以上', '10階以上', 'こだわらない'] },
        { field: 'equipment1', title: '希望設備（セキュリティ・水回り）', type: 'checkbox', options: ['オートロック', 'バストイレ別', '洗面所独立', '室内洗濯機置場', '2口以上コンロ'] },
        { field: 'equipment2', title: '希望設備（内装・共用）', type: 'checkbox', options: ['フローリング', '畳NG', 'エレベーター', '宅配ボックス', 'インターネット無料'] },
        { field: 'equipment3', title: '希望設備（駐車・特殊）', type: 'checkbox', options: ['駐車場', 'バイク置場', '駐輪場', 'ペット可', '楽器可', 'SOHO可'] },
        { field: 'notes', title: 'その他ご要望・ご質問', type: 'paragraph' }
    ],

    /**
     * 初期化
     */
    async initialize() {
        console.log('📋 GoogleFormsManager 初期化中...');
        this.loadFormConfig();
        console.log('✅ GoogleFormsManager 初期化完了');
        return true;
    },

    /**
     * フォーム設定を読み込み
     */
    loadFormConfig() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.formConfig = JSON.parse(saved);
                console.log('📋 保存済みフォーム設定:', this.formConfig);
            }
        } catch (error) {
            console.error('フォーム設定読み込みエラー:', error);
        }
    },

    /**
     * フォーム設定を保存
     */
    saveFormConfig(config) {
        this.formConfig = config;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    },

    /**
     * アクセストークンを取得
     */
    getAccessToken() {
        if (window.GoogleDriveAPIv2 && window.GoogleDriveAPIv2.accessToken) {
            return window.GoogleDriveAPIv2.accessToken;
        }
        if (window.IntegratedAuthManager && window.IntegratedAuthManager.accessToken) {
            return window.IntegratedAuthManager.accessToken;
        }
        return null;
    },

    /**
     * Google Formを生成
     */
    async createForm() {
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            throw new Error('Google認証が必要です。先にログインしてください。');
        }

        console.log('📝 Google Form 生成開始...');

        // 1. 空のフォームを作成
        const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                info: {
                    title: 'お部屋探しアンケート - RentPipe',
                    documentTitle: 'お部屋探しアンケート'
                }
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.json();
            console.error('フォーム作成エラー:', error);
            throw new Error(`フォーム作成に失敗しました: ${error.error?.message || 'Unknown error'}`);
        }

        const form = await createResponse.json();
        console.log('✅ フォーム作成成功:', form);

        // 2. フォームに質問を追加
        const requests = this.buildFormQuestions();
        const updateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            console.error('質問追加エラー:', error);
            throw new Error(`質問の追加に失敗しました: ${error.error?.message || 'Unknown error'}`);
        }

        const updateResult = await updateResponse.json();
        console.log('✅ 質問追加成功:', updateResult);

        // 3. フォームの詳細を取得して質問IDを保存
        const formDetailsResponse = await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!formDetailsResponse.ok) {
            throw new Error('フォーム詳細の取得に失敗しました');
        }

        const formDetails = await formDetailsResponse.json();
        console.log('📋 フォーム詳細:', formDetails);

        // 質問IDとフィールドのマッピングを作成
        const questionMapping = {};
        if (formDetails.items) {
            formDetails.items.forEach((item, index) => {
                if (index < this.QUESTION_FIELDS.length) {
                    const fieldDef = this.QUESTION_FIELDS[index];
                    const questionId = item.questionItem?.question?.questionId;
                    if (questionId) {
                        questionMapping[questionId] = fieldDef.field;
                        console.log(`  マッピング: ${questionId} -> ${fieldDef.field} (${item.title})`);
                    }
                }
            });
        }

        // 4. フォーム設定を保存
        const config = {
            formId: form.formId,
            responderUri: form.responderUri,
            title: 'お部屋探しアンケート - RentPipe',
            createdAt: new Date().toISOString(),
            lastFetchedAt: null,
            fetchedResponseIds: [],
            questionMapping: questionMapping
        };
        this.saveFormConfig(config);

        console.log('✅ フォーム設定保存完了:', config);
        return config;
    },

    /**
     * フォームの質問を構築
     */
    buildFormQuestions() {
        const requests = [];

        this.QUESTION_FIELDS.forEach((fieldDef, index) => {
            let request;

            switch (fieldDef.type) {
                case 'text':
                    request = this.createTextQuestion(index, fieldDef.title, fieldDef.required || false);
                    break;
                case 'paragraph':
                    request = this.createParagraphQuestion(index, fieldDef.title, fieldDef.required || false);
                    break;
                case 'date':
                    request = this.createDateQuestion(index, fieldDef.title, fieldDef.required || false);
                    break;
                case 'choice':
                    request = this.createChoiceQuestion(index, fieldDef.title, fieldDef.options, fieldDef.required || false);
                    break;
                case 'checkbox':
                    request = this.createCheckboxQuestion(index, fieldDef.title, fieldDef.options, fieldDef.required || false);
                    break;
            }

            if (request) {
                requests.push(request);
            }
        });

        return requests;
    },

    /**
     * テキスト質問を作成
     */
    createTextQuestion(index, title, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            textQuestion: { paragraph: false }
                        }
                    }
                },
                location: { index: index }
            }
        };
    },

    /**
     * 段落質問を作成
     */
    createParagraphQuestion(index, title, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            textQuestion: { paragraph: true }
                        }
                    }
                },
                location: { index: index }
            }
        };
    },

    /**
     * 日付質問を作成
     */
    createDateQuestion(index, title, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            dateQuestion: {
                                includeYear: true,
                                includeTime: false
                            }
                        }
                    }
                },
                location: { index: index }
            }
        };
    },

    /**
     * 選択質問を作成（ラジオボタン）
     */
    createChoiceQuestion(index, title, options, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            choiceQuestion: {
                                type: 'RADIO',
                                options: options.map(opt => ({ value: opt }))
                            }
                        }
                    }
                },
                location: { index: index }
            }
        };
    },

    /**
     * チェックボックス質問を作成
     */
    createCheckboxQuestion(index, title, options, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            choiceQuestion: {
                                type: 'CHECKBOX',
                                options: options.map(opt => ({ value: opt }))
                            }
                        }
                    }
                },
                location: { index: index }
            }
        };
    },

    /**
     * フォーム回答を取得
     */
    async fetchResponses() {
        if (!this.formConfig || !this.formConfig.formId) {
            throw new Error('フォームが設定されていません。先にフォームを生成してください。');
        }

        const accessToken = this.getAccessToken();
        if (!accessToken) {
            throw new Error('Google認証が必要です。');
        }

        console.log('📥 フォーム回答取得中...');

        const response = await fetch(`https://forms.googleapis.com/v1/forms/${this.formConfig.formId}/responses`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`回答取得に失敗しました: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const responses = data.responses || [];

        console.log(`✅ ${responses.length}件の回答を取得`);

        // 新しい回答のみをフィルタリング
        const fetchedIds = this.formConfig.fetchedResponseIds || [];
        const newResponses = responses.filter(r => !fetchedIds.includes(r.responseId));

        console.log(`📋 新着回答: ${newResponses.length}件`);

        return {
            total: responses.length,
            newResponses: newResponses
        };
    },

    /**
     * フォーム回答を顧客データに変換
     */
    convertResponseToCustomer(response) {
        const answers = response.answers || {};
        const mapping = this.formConfig?.questionMapping || {};

        // 質問IDからフィールド名への逆引きで値を取得
        const fieldValues = {};

        for (const [questionId, answer] of Object.entries(answers)) {
            const fieldName = mapping[questionId];
            if (!fieldName) {
                console.warn(`未知の質問ID: ${questionId}`);
                continue;
            }

            // 回答値を抽出
            let value = '';
            if (answer.textAnswers?.answers) {
                value = answer.textAnswers.answers.map(a => a.value).join(', ');
            }

            fieldValues[fieldName] = value;
            console.log(`  ${fieldName}: ${value}`);
        }

        // 変換マップ
        const budgetMap = {
            '3万円': 30000, '4万円': 40000, '5万円': 50000, '6万円': 60000,
            '7万円': 70000, '8万円': 80000, '9万円': 90000, '10万円': 100000,
            '12万円': 120000, '15万円': 150000, '20万円': 200000, '30万円以上': 300000,
            '30万円': 300000, '50万円': 500000, '上限なし': 1000000
        };

        const incomeMap = {
            '200万円未満': 2000000, '200万円〜300万円': 3000000, '300万円〜400万円': 4000000,
            '400万円〜500万円': 5000000, '500万円〜600万円': 6000000, '600万円〜700万円': 7000000,
            '700万円〜800万円': 8000000, '800万円〜1000万円': 10000000, '1000万円以上': 12000000
        };

        const genderMap = {
            '男性': 'male', '女性': 'female', 'その他': 'other', '回答しない': 'no_answer'
        };

        const yearsMap = {
            '1年未満': 0, '1年': 1, '2年': 2, '3年': 3, '5年': 5, '10年以上': 10
        };

        const roomSizeMap = {
            '15㎡以上': 15, '20㎡以上': 20, '25㎡以上': 25, '30㎡以上': 30,
            '40㎡以上': 40, '50㎡以上': 50, 'こだわらない': 15
        };

        const walkMap = {
            '5分以内': 5, '7分以内': 7, '10分以内': 10, '15分以内': 15, '20分以内': 20, 'こだわらない': 30
        };

        const ageMap = {
            '新築のみ': 0, '5年以内': 5, '10年以内': 10, '15年以内': 15, '20年以内': 20, 'こだわらない': 999
        };

        const floorMap = {
            '1階希望': 1, '2階以上': 2, '3階以上': 3, '5階以上': 5, '10階以上': 10, 'こだわらない': 1
        };

        const occupantsMap = {
            '1人': 1, '2人': 2, '3人': 3, '4人': 4, '5人以上': 5
        };

        // 設備のパース
        const equipment1 = (fieldValues.equipment1 || '').split(', ').filter(v => v);
        const equipment2 = (fieldValues.equipment2 || '').split(', ').filter(v => v);
        const equipment3 = (fieldValues.equipment3 || '').split(', ').filter(v => v);

        return {
            basicInfo: {
                name: fieldValues.name || '',
                nameKana: fieldValues.nameKana || '',
                email: fieldValues.email || '',
                phone: fieldValues.phone || '',
                birthday: fieldValues.birthday || '',
                gender: genderMap[fieldValues.gender] || 'no_answer',
                currentAddress: fieldValues.currentAddress || '',
                currentHousing: fieldValues.currentHousing || '',
                numberOfOccupants: occupantsMap[fieldValues.numberOfOccupants] || 1,
                occupation: fieldValues.occupation || '',
                companyName: fieldValues.companyName || '',
                yearsEmployed: yearsMap[fieldValues.yearsEmployed] || 0,
                annualIncome: incomeMap[fieldValues.annualIncome] || 0,
                movingReason: fieldValues.movingReason || ''
            },
            preferences: {
                budget: {
                    min: budgetMap[fieldValues.budgetMin] || 80000,
                    max: budgetMap[fieldValues.budgetMax] || 100000,
                    note: ''
                },
                moveInDate: fieldValues.moveInDate || '',
                areas: fieldValues.areas || '',
                layout: fieldValues.layout || '',
                roomSize: roomSizeMap[fieldValues.roomSize] || 25,
                stationWalk: walkMap[fieldValues.stationWalk] || 10,
                buildingAge: {
                    value: ageMap[fieldValues.buildingAge] || 999,
                    type: fieldValues.buildingAge === 'こだわらない' ? 'any' : 'specific',
                    note: ''
                },
                floor: floorMap[fieldValues.floor] || 1
            },
            equipment: {
                autoLock: equipment1.includes('オートロック'),
                separateBath: equipment1.includes('バストイレ別'),
                separateWashroom: equipment1.includes('洗面所独立'),
                indoorWashing: equipment1.includes('室内洗濯機置場'),
                twoGasStove: equipment1.includes('2口以上コンロ'),
                flooring: equipment2.includes('フローリング'),
                noTatami: equipment2.includes('畳NG'),
                elevator: equipment2.includes('エレベーター'),
                deliveryBox: equipment2.includes('宅配ボックス'),
                internet: equipment2.includes('インターネット無料'),
                parking: equipment3.includes('駐車場'),
                bike: equipment3.includes('バイク置場'),
                bicycle: equipment3.includes('駐輪場'),
                petAllowed: equipment3.includes('ペット可'),
                instrumentAllowed: equipment3.includes('楽器可'),
                sohoAllowed: equipment3.includes('SOHO可')
            },
            additionalInfo: {
                notes: fieldValues.notes || ''
            },
            pipelineStatus: '初回相談',
            isActive: true,
            source: 'google_form',
            formResponseId: response.responseId,
            formSubmittedAt: response.lastSubmittedTime
        };
    },

    /**
     * 回答を顧客として登録
     */
    async importResponses() {
        const result = await this.fetchResponses();

        if (result.newResponses.length === 0) {
            return { success: true, imported: 0, message: '新着回答はありません' };
        }

        const importedCustomers = [];
        const errors = [];

        for (const response of result.newResponses) {
            try {
                console.log('📝 回答を変換中:', response.responseId);
                const customerData = this.convertResponseToCustomer(response);

                // 名前がない場合はスキップ
                if (!customerData.basicInfo.name) {
                    errors.push(`回答ID ${response.responseId}: 名前が入力されていません`);
                    continue;
                }

                // 連絡先がない場合はスキップ
                if (!customerData.basicInfo.email && !customerData.basicInfo.phone) {
                    errors.push(`回答ID ${response.responseId}: 連絡先が入力されていません`);
                    continue;
                }

                // 顧客として登録
                const addResult = await window.UnifiedDataManager.addCustomer(customerData);

                if (addResult.success) {
                    importedCustomers.push(addResult.customer);

                    // 取得済みIDに追加
                    if (!this.formConfig.fetchedResponseIds) {
                        this.formConfig.fetchedResponseIds = [];
                    }
                    this.formConfig.fetchedResponseIds.push(response.responseId);
                } else {
                    errors.push(`回答ID ${response.responseId}: ${addResult.error}`);
                }
            } catch (error) {
                console.error('回答変換エラー:', error);
                errors.push(`回答ID ${response.responseId}: ${error.message}`);
            }
        }

        // 設定を保存
        this.formConfig.lastFetchedAt = new Date().toISOString();
        this.saveFormConfig(this.formConfig);

        return {
            success: true,
            imported: importedCustomers.length,
            total: result.newResponses.length,
            errors: errors,
            customers: importedCustomers
        };
    },

    /**
     * フォームURLを取得
     */
    getFormUrl() {
        if (!this.formConfig || !this.formConfig.responderUri) {
            return null;
        }
        return this.formConfig.responderUri;
    },

    /**
     * フォーム設定をリセット
     */
    resetFormConfig() {
        this.formConfig = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// グローバルに公開
window.GoogleFormsManager = GoogleFormsManager;

console.log('✅ GoogleFormsManager loaded');
