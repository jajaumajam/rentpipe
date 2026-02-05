/**
 * Google Forms API マネージャー
 * フォームの自動生成と回答取得を管理
 */

const GoogleFormsManager = {
    STORAGE_KEY: 'rentpipe_google_form',

    // フォーム設定を保存
    formConfig: null,

    /**
     * 初期化
     */
    async initialize() {
        console.log('📋 GoogleFormsManager 初期化中...');

        // 保存されたフォーム設定を読み込み
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
        // GoogleDriveAPIv2から取得（メイン認証マネージャー）
        if (window.GoogleDriveAPIv2 && window.GoogleDriveAPIv2.accessToken) {
            return window.GoogleDriveAPIv2.accessToken;
        }
        // フォールバック: IntegratedAuthManager
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
        const updateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: this.buildFormQuestions()
            })
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            console.error('質問追加エラー:', error);
            throw new Error(`質問の追加に失敗しました: ${error.error?.message || 'Unknown error'}`);
        }

        const updatedForm = await updateResponse.json();
        console.log('✅ 質問追加成功');

        // 3. フォーム設定を保存
        const config = {
            formId: form.formId,
            responderUri: form.responderUri,
            title: 'お部屋探しアンケート - RentPipe',
            createdAt: new Date().toISOString(),
            lastFetchedAt: null,
            fetchedResponseIds: []
        };
        this.saveFormConfig(config);

        return config;
    },

    /**
     * フォームの質問を構築
     */
    buildFormQuestions() {
        const requests = [];
        let index = 0;

        // セクション1: 基本情報
        requests.push(this.createTextQuestion(index++, 'お名前', '例: 山田太郎', true));
        requests.push(this.createTextQuestion(index++, 'フリガナ', '例: ヤマダタロウ', false));
        requests.push(this.createTextQuestion(index++, 'メールアドレス', '例: yamada@example.com', false));
        requests.push(this.createTextQuestion(index++, '電話番号', '例: 090-1234-5678', false));
        requests.push(this.createDateQuestion(index++, '生年月日', false));
        requests.push(this.createChoiceQuestion(index++, '性別', ['男性', '女性', 'その他', '回答しない'], false));
        requests.push(this.createTextQuestion(index++, '現住所', '例: 東京都渋谷区〇〇1-2-3', false));
        requests.push(this.createChoiceQuestion(index++, '現在の住居形態', ['賃貸', '持家', '実家', '社宅・寮', 'その他'], false));
        requests.push(this.createChoiceQuestion(index++, '入居人数', ['1人', '2人', '3人', '4人', '5人以上'], false));
        requests.push(this.createTextQuestion(index++, 'ご職業', '例: 会社員（IT関連）、フリーランス', false));
        requests.push(this.createTextQuestion(index++, '会社名', '例: 株式会社〇〇（任意）', false));
        requests.push(this.createChoiceQuestion(index++, '勤続年数', ['1年未満', '1年', '2年', '3年', '5年', '10年以上'], false));
        requests.push(this.createChoiceQuestion(index++, '年収（税込）', [
            '200万円未満', '200万円〜300万円', '300万円〜400万円', '400万円〜500万円',
            '500万円〜600万円', '600万円〜700万円', '700万円〜800万円', '800万円〜1000万円', '1000万円以上'
        ], false));
        requests.push(this.createTextQuestion(index++, '引越しの理由', '例: 転勤、結婚、更新時期', false));

        // セクション2: 希望条件
        requests.push(this.createChoiceQuestion(index++, 'ご予算（下限）', [
            '3万円', '4万円', '5万円', '6万円', '7万円', '8万円', '9万円', '10万円',
            '12万円', '15万円', '20万円', '30万円以上'
        ], false));
        requests.push(this.createChoiceQuestion(index++, 'ご予算（上限）', [
            '5万円', '6万円', '7万円', '8万円', '9万円', '10万円', '12万円', '15万円',
            '20万円', '30万円', '50万円', '上限なし'
        ], false));
        requests.push(this.createTextQuestion(index++, '入居希望時期', '例: 2025年4月上旬、即入居可、3ヶ月以内', false));
        requests.push(this.createParagraphQuestion(index++, '希望エリア', '駅名、路線、地域名、通勤先からの所要時間など', false));
        requests.push(this.createCheckboxQuestion(index++, '希望間取り', ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3K以上'], false));
        requests.push(this.createChoiceQuestion(index++, '部屋の広さ', ['15㎡以上', '20㎡以上', '25㎡以上', '30㎡以上', '40㎡以上', '50㎡以上', 'こだわらない'], false));
        requests.push(this.createChoiceQuestion(index++, '駅からの徒歩', ['5分以内', '7分以内', '10分以内', '15分以内', '20分以内', 'こだわらない'], false));
        requests.push(this.createChoiceQuestion(index++, '築年数', ['新築のみ', '5年以内', '10年以内', '15年以内', '20年以内', 'こだわらない'], false));
        requests.push(this.createChoiceQuestion(index++, '希望階数', ['1階希望', '2階以上', '3階以上', '5階以上', '10階以上', 'こだわらない'], false));

        // セクション3: 設備・条件
        requests.push(this.createCheckboxQuestion(index++, '希望設備（セキュリティ・水回り）', [
            'オートロック', 'バストイレ別', '洗面所独立', '室内洗濯機置場', '2口以上コンロ'
        ], false));
        requests.push(this.createCheckboxQuestion(index++, '希望設備（内装・共用）', [
            'フローリング', '畳NG', 'エレベーター', '宅配ボックス', 'インターネット無料'
        ], false));
        requests.push(this.createCheckboxQuestion(index++, '希望設備（駐車・特殊）', [
            '駐車場', 'バイク置場', '駐輪場', 'ペット可', '楽器可', 'SOHO可'
        ], false));

        // セクション4: その他
        requests.push(this.createParagraphQuestion(index++, 'その他ご要望・ご質問', 'その他のご要望やご質問があればご自由にお書きください', false));

        return requests;
    },

    /**
     * テキスト質問を作成
     */
    createTextQuestion(index, title, placeholder, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    questionItem: {
                        question: {
                            required: required,
                            textQuestion: {
                                paragraph: false
                            }
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
    createParagraphQuestion(index, title, placeholder, required) {
        return {
            createItem: {
                item: {
                    title: title,
                    description: placeholder,
                    questionItem: {
                        question: {
                            required: required,
                            textQuestion: {
                                paragraph: true
                            }
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
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
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

        // 質問IDとタイトルのマッピングを取得するため、回答からデータを抽出
        const getValue = (questionTitle) => {
            for (const [questionId, answer] of Object.entries(answers)) {
                // テキスト回答
                if (answer.textAnswers?.answers?.[0]?.value) {
                    return answer.textAnswers.answers[0].value;
                }
            }
            return '';
        };

        // 回答を配列として取得して順番にマッピング
        const answerValues = Object.values(answers).map(a => {
            if (a.textAnswers?.answers) {
                return a.textAnswers.answers.map(ans => ans.value).join(', ');
            }
            return '';
        });

        // インデックスベースでマッピング（フォーム質問の順序に対応）
        const getByIndex = (idx) => answerValues[idx] || '';
        const getCheckboxByIndex = (idx) => {
            const val = answerValues[idx];
            return val ? val.split(', ') : [];
        };

        // 予算の変換
        const budgetMap = {
            '3万円': 30000, '4万円': 40000, '5万円': 50000, '6万円': 60000,
            '7万円': 70000, '8万円': 80000, '9万円': 90000, '10万円': 100000,
            '12万円': 120000, '15万円': 150000, '20万円': 200000, '30万円以上': 300000,
            '30万円': 300000, '50万円': 500000, '上限なし': 1000000
        };

        // 年収の変換
        const incomeMap = {
            '200万円未満': 2000000, '200万円〜300万円': 3000000, '300万円〜400万円': 4000000,
            '400万円〜500万円': 5000000, '500万円〜600万円': 6000000, '600万円〜700万円': 7000000,
            '700万円〜800万円': 8000000, '800万円〜1000万円': 10000000, '1000万円以上': 12000000
        };

        // 性別の変換
        const genderMap = {
            '男性': 'male', '女性': 'female', 'その他': 'other', '回答しない': 'no_answer'
        };

        // 勤続年数の変換
        const yearsMap = {
            '1年未満': 0, '1年': 1, '2年': 2, '3年': 3, '5年': 5, '10年以上': 10
        };

        // 部屋の広さの変換
        const roomSizeMap = {
            '15㎡以上': 15, '20㎡以上': 20, '25㎡以上': 25, '30㎡以上': 30,
            '40㎡以上': 40, '50㎡以上': 50, 'こだわらない': 15
        };

        // 駅徒歩の変換
        const walkMap = {
            '5分以内': 5, '7分以内': 7, '10分以内': 10, '15分以内': 15, '20分以内': 20, 'こだわらない': 30
        };

        // 築年数の変換
        const ageMap = {
            '新築のみ': 0, '5年以内': 5, '10年以内': 10, '15年以内': 15, '20年以内': 20, 'こだわらない': 999
        };

        // 階数の変換
        const floorMap = {
            '1階希望': 1, '2階以上': 2, '3階以上': 3, '5階以上': 5, '10階以上': 10, 'こだわらない': 1
        };

        // 設備のマッピング
        const equipment1 = getCheckboxByIndex(23); // セキュリティ・水回り
        const equipment2 = getCheckboxByIndex(24); // 内装・共用
        const equipment3 = getCheckboxByIndex(25); // 駐車・特殊

        return {
            basicInfo: {
                name: getByIndex(0),
                nameKana: getByIndex(1),
                email: getByIndex(2),
                phone: getByIndex(3),
                birthday: getByIndex(4),
                gender: genderMap[getByIndex(5)] || 'no_answer',
                currentAddress: getByIndex(6),
                currentHousing: getByIndex(7),
                numberOfOccupants: parseInt(getByIndex(8)) || 1,
                occupation: getByIndex(9),
                companyName: getByIndex(10),
                yearsEmployed: yearsMap[getByIndex(11)] || 0,
                annualIncome: incomeMap[getByIndex(12)] || 0,
                movingReason: getByIndex(13)
            },
            preferences: {
                budget: {
                    min: budgetMap[getByIndex(14)] || 80000,
                    max: budgetMap[getByIndex(15)] || 100000,
                    note: ''
                },
                moveInDate: getByIndex(16),
                areas: getByIndex(17),
                layout: getCheckboxByIndex(18).join(', '),
                roomSize: roomSizeMap[getByIndex(19)] || 25,
                stationWalk: walkMap[getByIndex(20)] || 10,
                buildingAge: {
                    value: ageMap[getByIndex(21)] || 999,
                    type: getByIndex(21) === 'こだわらない' ? 'any' : 'specific',
                    note: ''
                },
                floor: floorMap[getByIndex(22)] || 1
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
                notes: getByIndex(26)
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
