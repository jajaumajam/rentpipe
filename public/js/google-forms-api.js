/**
 * Google Forms API マネージャー
 * フォームの自動生成と回答取得を管理
 * タイトルベースの正確なフィールドマッピング
 */

const GoogleFormsManager = {
    STORAGE_KEY: 'rentpipe_google_form',

    // フォーム設定を保存
    formConfig: null,

    // 質問フィールド定義（タイトルとフィールド名の対応）
    QUESTION_FIELDS: [
        { field: 'name', title: 'お名前', type: 'text', required: true },
        { field: 'nameKana', title: 'フリガナ', type: 'text' },
        { field: 'email', title: 'メールアドレス', type: 'text' },
        { field: 'phone', title: '電話番号', type: 'text', required: true },
        { field: 'gender', title: '性別', type: 'choice', options: ['男性', '女性', 'その他', '回答しない'] },
        { field: 'currentAddress', title: '現住所', type: 'text' },
        { field: 'currentHousing', title: '現在の住居形態', type: 'choice', options: ['賃貸', '持家', '実家', '社宅・寮', 'その他'] },
        { field: 'numberOfOccupants', title: '入居人数（人）', type: 'text', description: '半角数字で入力してください（例: 2）' },
        { field: 'occupation', title: 'ご職業', type: 'text' },
        { field: 'companyName', title: '会社名', type: 'text' },
        { field: 'yearsEmployed', title: '勤続年数（年）', type: 'text', description: '半角数字で入力してください（例: 3）' },
        { field: 'annualIncome', title: '年収（税込・万円）', type: 'text', description: '半角数字で入力してください（例: 500）' },
        { field: 'movingReason', title: '引越しの理由', type: 'text' },
        { field: 'budgetMin', title: 'ご予算下限（万円）', type: 'text', description: '半角数字で入力してください（例: 8）' },
        { field: 'budgetMax', title: 'ご予算上限（万円）', type: 'text', description: '半角数字で入力してください（例: 12）' },
        { field: 'moveInDate', title: '入居希望時期', type: 'text', description: '例: 2025年4月、即入居可' },
        { field: 'areas', title: '希望エリア', type: 'paragraph', description: '駅名、路線、地域名など' },
        { field: 'layout', title: '希望間取り', type: 'checkbox', options: ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3K以上'] },
        { field: 'roomSize', title: '希望の広さ（㎡以上）', type: 'text', description: '半角数字で入力してください（例: 25）※この広さ以上を希望' },
        { field: 'stationWalk', title: '駅徒歩（分以内）', type: 'text', description: '半角数字で入力してください（例: 10）※この時間以内を希望' },
        { field: 'buildingAge', title: '築年数の上限（年）', type: 'text', description: '半角数字で入力、こだわりなしは空欄' },
        { field: 'floor', title: '希望階数（階以上）', type: 'text', description: '半角数字で入力してください（例: 2）※この階以上を希望' },
        { field: 'equipment1', title: '希望設備（セキュリティ・水回り）', type: 'checkbox', options: ['オートロック', 'バストイレ別', '洗面所独立', '室内洗濯機置場', '2口以上コンロ'] },
        { field: 'equipment2', title: '希望設備（内装・共用）', type: 'checkbox', options: ['フローリング', '畳NG', 'エレベーター', '宅配ボックス', 'インターネット無料'] },
        { field: 'equipment3', title: '希望設備（駐車・特殊）', type: 'checkbox', options: ['駐車場', 'バイク置場', '駐輪場', 'ペット可', '楽器可', 'SOHO可'] },
        { field: 'notes', title: 'その他ご要望', type: 'paragraph' }
    ],

    /**
     * 初期化
     */
    async initialize() {
        console.log('📋 GoogleFormsManager 初期化中...');
        await this.loadFormConfig();
        console.log('✅ GoogleFormsManager 初期化完了');
        return true;
    },

    /**
     * フォーム設定を読み込み（Google Sheets優先、localStorageフォールバック）
     */
    async loadFormConfig() {
        try {
            // 1. まずlocalStorageから読み込み（キャッシュとして）
            const localSaved = localStorage.getItem(this.STORAGE_KEY);
            if (localSaved) {
                this.formConfig = JSON.parse(localSaved);
                console.log('📋 localStorage から設定読み込み:', this.formConfig?.formId);
            }

            // 2. Google Sheetsから読み込み（認証済みの場合）
            if (window.UnifiedSheetsManager?.isEnabled || window.UnifiedSheetsManager?.spreadsheetId) {
                try {
                    const sheetConfig = await window.UnifiedSheetsManager.loadSetting('formConfig');
                    if (sheetConfig && sheetConfig.formId) {
                        this.formConfig = sheetConfig;
                        // localStorageにもキャッシュ
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheetConfig));
                        console.log('📋 Google Sheets から設定読み込み:', this.formConfig.formId);
                    }
                } catch (e) {
                    console.warn('Google Sheets からの読み込みスキップ:', e.message);
                }
            }
        } catch (error) {
            console.error('フォーム設定読み込みエラー:', error);
        }
    },

    /**
     * フォーム設定を保存（localStorage + Google Sheets両方）
     */
    async saveFormConfig(config) {
        this.formConfig = config;

        // 1. localStorageに保存（即座にアクセス可能）
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        console.log('💾 localStorage に設定保存');

        // 2. Google Sheetsにも保存（永続化）
        if (window.UnifiedSheetsManager) {
            try {
                await window.UnifiedSheetsManager.saveSetting('formConfig', config);
                console.log('💾 Google Sheets に設定保存');
            } catch (e) {
                console.warn('Google Sheets への保存失敗:', e.message);
            }
        }
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
     * localStorage から個人情報設定を読み込む
     */
    loadPrivacySettingsFromStorage() {
        try {
            const raw = localStorage.getItem('rentpipe_privacy_settings');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Google Formを生成
     */
    async createForm() {
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            throw new Error('Google認証が必要です。先にログインしてください。');
        }

        // 個人情報取扱い設定のチェック（所属会社名 または 独自プライバシーポリシーURL のいずれかが必要）
        const privacySettings = this.loadPrivacySettingsFromStorage();
        if (!privacySettings || (!privacySettings.agentCompany && !privacySettings.privacyPolicyUrl)) {
            throw new Error('PRIVACY_NOT_SET');
        }

        // フォーム冒頭説明文を生成
        let description = window.buildPrivacyDescription
            ? window.buildPrivacyDescription(
                privacySettings.agentName || '',
                privacySettings.agentCompany || '',
                privacySettings.thirdParties || []
              )
            : '';

        // 独自プライバシーポリシーURLが設定されている場合は末尾に追記
        if (privacySettings.privacyPolicyUrl) {
            description += (description ? '\n\n' : '') + '▶ 個人情報取扱い方針：' + privacySettings.privacyPolicyUrl;
        }

        console.log('📝 Google Form 生成開始...');

        // 1. 空のフォームを作成（API仕様: 作成時はtitleのみ設定可能）
        const createResponse = await fetch('https://forms.googleapis.com/v1/forms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                info: {
                    title: 'お部屋探しアンケート - RentPipe'
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

        // 2. フォームにdescription・質問を追加（batchUpdateで一括設定）
        const requests = [
            // descriptionとdocumentTitleはbatchUpdateで設定
            {
                updateFormInfo: {
                    info: {
                        description: description,
                        documentTitle: 'お部屋探しアンケート'
                    },
                    updateMask: 'description,documentTitle'
                }
            },
            ...this.buildFormQuestions()
        ];
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

        console.log('✅ 質問追加成功');

        // 3. フォームの詳細を取得して質問IDを保存（タイトルベースでマッピング）
        const formDetailsResponse = await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!formDetailsResponse.ok) {
            throw new Error('フォーム詳細の取得に失敗しました');
        }

        const formDetails = await formDetailsResponse.json();
        console.log('📋 フォーム詳細:', formDetails);

        // 質問IDとフィールドのマッピングをタイトルベースで作成
        const questionMapping = {};
        if (formDetails.items) {
            for (const item of formDetails.items) {
                const questionId = item.questionItem?.question?.questionId;
                const title = item.title;

                if (questionId && title) {
                    // タイトルでフィールドを検索
                    const fieldDef = this.QUESTION_FIELDS.find(f => f.title === title);
                    if (fieldDef) {
                        questionMapping[questionId] = fieldDef.field;
                        console.log(`  マッピング: "${title}" (${questionId}) -> ${fieldDef.field}`);
                    } else {
                        console.warn(`  未知のタイトル: "${title}"`);
                    }
                }
            }
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
        await this.saveFormConfig(config);

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
                    request = this.createTextQuestion(index, fieldDef.title, fieldDef.description, fieldDef.required || false);
                    break;
                case 'paragraph':
                    request = this.createParagraphQuestion(index, fieldDef.title, fieldDef.description, fieldDef.required || false);
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
    createTextQuestion(index, title, description, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    description: description || '',
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
    createParagraphQuestion(index, title, description, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    description: description || '',
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

        // 数値変換ヘルパー（万円を円に変換、空はnull）
        const parseManYen = (val) => {
            if (!val || val.trim() === '') return null;
            const num = parseFloat(val.replace(/[^0-9.]/g, ''));
            return isNaN(num) ? null : num * 10000;
        };

        // 数値変換ヘルパー（そのまま、空はnull）
        const parseNum = (val) => {
            if (!val || val.trim() === '') return null;
            const num = parseFloat(val.replace(/[^0-9.]/g, ''));
            return isNaN(num) ? null : num;
        };

        const genderMap = {
            '男性': 'male', '女性': 'female', 'その他': 'other', '回答しない': 'no_answer'
        };


        // 設備のパース
        const equipment1 = (fieldValues.equipment1 || '').split(', ').filter(v => v);
        const equipment2 = (fieldValues.equipment2 || '').split(', ').filter(v => v);
        const equipment3 = (fieldValues.equipment3 || '').split(', ').filter(v => v);

        // 築年数の処理
        const buildingAgeValue = parseNum(fieldValues.buildingAge);
        const buildingAge = {
            value: buildingAgeValue,
            type: buildingAgeValue !== null ? 'specific' : 'any',
            note: ''
        };

        // 予算の処理
        const budgetMin = parseManYen(fieldValues.budgetMin);
        const budgetMax = parseManYen(fieldValues.budgetMax);

        return {
            basicInfo: {
                name: fieldValues.name || '',
                nameKana: fieldValues.nameKana || '',
                email: fieldValues.email || '',
                phone: fieldValues.phone || '',
                birthday: '',
                gender: genderMap[fieldValues.gender] || 'no_answer',
                currentAddress: fieldValues.currentAddress || '',
                currentHousing: fieldValues.currentHousing || '',
                numberOfOccupants: parseNum(fieldValues.numberOfOccupants),
                occupation: fieldValues.occupation || '',
                companyName: fieldValues.companyName || '',
                yearsEmployed: parseNum(fieldValues.yearsEmployed),
                annualIncome: parseManYen(fieldValues.annualIncome),
                movingReason: fieldValues.movingReason || ''
            },
            preferences: {
                budget: {
                    min: budgetMin,
                    max: budgetMax,
                    note: ''
                },
                moveInDate: fieldValues.moveInDate || '',
                areas: fieldValues.areas || '',
                layout: fieldValues.layout || '',
                roomSize: parseNum(fieldValues.roomSize),
                stationWalk: parseNum(fieldValues.stationWalk),
                buildingAge: buildingAge,
                floor: parseNum(fieldValues.floor)
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

                // 電話番号がない場合はスキップ
                if (!customerData.basicInfo.phone) {
                    errors.push(`回答ID ${response.responseId}: 電話番号が入力されていません`);
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
        await this.saveFormConfig(this.formConfig);

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
     * フォーム設定をリセット（localStorage + Google Sheets両方）
     */
    async resetFormConfig() {
        this.formConfig = null;

        // 1. localStorageから削除
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('🗑️ localStorage からフォーム設定削除');

        // 2. Google Sheetsからも削除
        if (window.UnifiedSheetsManager) {
            try {
                await window.UnifiedSheetsManager.deleteSetting('formConfig');
                console.log('🗑️ Google Sheets からフォーム設定削除');
            } catch (e) {
                console.warn('Google Sheets からの削除失敗:', e.message);
            }
        }
    }
};

// グローバルに公開
window.GoogleFormsManager = GoogleFormsManager;

console.log('✅ GoogleFormsManager loaded');
