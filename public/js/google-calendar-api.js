/**
 * Google Calendar API 連携モジュール
 * フォローアップイベントの自動作成機能
 */

const GoogleCalendarAPI = {
    CALENDAR_SCOPE: 'https://www.googleapis.com/auth/calendar',
    isInitialized: false,

    /**
     * Calendar APIを初期化
     */
    init: async function() {
        if (this.isInitialized) {
            return { success: true };
        }

        try {
            // gapi.client.calendarが利用可能か確認
            if (!gapi.client.calendar) {
                await gapi.client.load('calendar', 'v3');
            }
            this.isInitialized = true;
            console.log('✅ Google Calendar API initialized');
            return { success: true };
        } catch (error) {
            console.error('❌ Calendar API初期化エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * カレンダーへのアクセス権限を確認
     */
    checkCalendarAccess: async function() {
        try {
            // カレンダーリストを取得してアクセス確認
            const response = await gapi.client.calendar.calendarList.list({
                maxResults: 1
            });
            return { success: true, hasAccess: true };
        } catch (error) {
            console.error('カレンダーアクセス確認エラー:', error);
            return { success: false, hasAccess: false, error: error.message };
        }
    },

    /**
     * アプリケーションのベースURLを取得
     */
    getBaseUrl: function() {
        return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    },

    /**
     * フォローアップイベントを作成（成約時に呼び出し）
     * @param {Object} customer - 顧客データ
     * @returns {Object} - 作成結果
     */
    createFollowUpEvents: async function(customer) {
        const initResult = await this.init();
        if (!initResult.success) {
            return initResult;
        }

        const contractInfo = customer.contractInfo || {};
        const moveInDate = contractInfo.moveInDate;
        const contractEndDate = contractInfo.contractEndDate;
        const contractType = contractInfo.contractType || '普通借家';

        if (!moveInDate) {
            return { success: false, error: '入居日が設定されていません' };
        }

        const customerName = customer.basicInfo?.name || '顧客';
        const createdEvents = [];
        const errors = [];

        // フォローアップタイミングを計算
        const followUpTimings = this.calculateFollowUpTimings(moveInDate, contractEndDate, contractType);

        for (const timing of followUpTimings) {
            try {
                const event = await this.createCalendarEvent({
                    summary: `📞 ${timing.label}: ${customerName}様`,
                    description: this.generateEventDescription(customer, timing),
                    startDate: timing.date,
                    reminderDays: timing.reminderDays
                });

                createdEvents.push({
                    eventId: event.id,
                    timing: timing.label,
                    date: timing.date
                });

                console.log(`✅ イベント作成: ${timing.label} - ${timing.date}`);
            } catch (error) {
                console.error(`❌ イベント作成エラー (${timing.label}):`, error);
                errors.push({ timing: timing.label, error: error.message });
            }
        }

        return {
            success: errors.length === 0,
            createdEvents,
            errors,
            totalCreated: createdEvents.length,
            totalFailed: errors.length
        };
    },

    /**
     * フォローアップタイミングを計算
     * @param {string} moveInDate - 入居日 (YYYY-MM-DD)
     * @param {string} contractEndDate - 契約終了日 (YYYY-MM-DD)
     * @param {string} contractType - 契約種別
     * @returns {Array} - フォローアップタイミングの配列
     */
    calculateFollowUpTimings: function(moveInDate, contractEndDate, contractType) {
        const timings = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ===== 全案件共通: 入居日基準 =====
        if (moveInDate) {
            const moveIn = new Date(moveInDate);

            // 入居日の翌日: 入居後のお礼（前日にリマインド）
            const thankYouDate = this.addDays(moveIn, 1);
            timings.push({
                label: '入居後のお礼',
                date: thankYouDate,
                type: 'move_in_thanks',
                reminderDays: 1,
                templateId: 'move-in-thanks'
            });

            // 入居日の1ヶ月後: 1ヶ月後フォロー（3日前にリマインド）
            const oneMonthDate = this.addMonths(moveIn, 1);
            timings.push({
                label: '1ヶ月後フォロー',
                date: oneMonthDate,
                type: 'one_month_followup',
                reminderDays: 3,
                templateId: 'one-month-followup'
            });

            // 入居日の6ヶ月後: 6ヶ月後フォロー（7日前にリマインド）
            const sixMonthDate = this.addMonths(moveIn, 6);
            timings.push({
                label: '6ヶ月後フォロー',
                date: sixMonthDate,
                type: 'six_month_followup',
                reminderDays: 7,
                templateId: 'six-month-followup'
            });

            // 入居日の1年後: 1年後フォロー（7日前にリマインド）
            const oneYearDate = this.addMonths(moveIn, 12);
            timings.push({
                label: '1年後フォロー',
                date: oneYearDate,
                type: 'one_year_followup',
                reminderDays: 7,
                templateId: 'one-year-followup'
            });
        }

        // ===== 契約種別に応じたフォロー: 契約終了日基準 =====
        if (contractEndDate) {
            const endDate = new Date(contractEndDate);

            if (contractType === '定期借家') {
                // 定期借家: 6ヶ月前に転居先検討開始の案内（7日前にリマインド）
                const sixMonthsBefore = this.addMonths(endDate, -6);
                timings.push({
                    label: '【定期】契約満了6ヶ月前連絡',
                    date: sixMonthsBefore,
                    type: 'fixed_term_notice',
                    reminderDays: 7,
                    templateId: 'moving-consultation'
                });
            } else {
                // 普通借家: 4ヶ月前に更新意向確認（7日前にリマインド）
                const fourMonthsBefore = this.addMonths(endDate, -4);
                timings.push({
                    label: '更新意向確認（4ヶ月前）',
                    date: fourMonthsBefore,
                    type: 'renewal_check',
                    reminderDays: 7,
                    templateId: 'moving-consultation'
                });
            }
        }

        // 過去の日付は除外
        return timings.filter(t => new Date(t.date) > today);
    },

    /**
     * 日を加算
     */
    addDays: function(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return this.formatDate(result);
    },

    /**
     * 月を加算/減算
     */
    addMonths: function(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return this.formatDate(result);
    },

    /**
     * 日付をYYYY-MM-DD形式にフォーマット
     */
    formatDate: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * イベント説明文を生成
     */
    generateEventDescription: function(customer, timing) {
        const basicInfo = customer.basicInfo || {};
        const contractInfo = customer.contractInfo || {};
        const baseUrl = this.getBaseUrl();

        let description = `【フォローアップ連絡】\n\n`;
        description += `■ 顧客情報\n`;
        description += `  氏名: ${basicInfo.name || '未設定'}\n`;
        description += `  電話: ${basicInfo.phone || '未設定'}\n`;
        description += `  メール: ${basicInfo.email || '未設定'}\n\n`;

        description += `■ 契約情報\n`;
        description += `  物件: ${contractInfo.propertyName || contractInfo.propertyAddress || '未設定'}\n`;
        description += `  契約種別: ${contractInfo.contractType || '未設定'}\n`;
        description += `  入居日: ${contractInfo.moveInDate || '未設定'}\n`;
        description += `  契約終了日: ${contractInfo.contractEndDate || '未設定'}\n`;
        description += `  月額賃料: ${contractInfo.monthlyRent ? contractInfo.monthlyRent.toLocaleString() + '円' : '未設定'}\n\n`;

        description += `■ 連絡目的\n`;
        description += `  ${this.getTimingPurpose(timing)}\n\n`;

        description += `■ メッセージテンプレート\n`;
        description += `  以下のリンクからテンプレートを確認してください:\n`;

        // 顧客IDとテンプレートIDをURLパラメータに付与（ディープリンク）
        // カレンダーからアクセスすると、該当テンプレートが自動選択・スクロールされる
        const customerId = customer.id || '';
        if (timing.templateId && customerId) {
            description += `  ${baseUrl}/templates.html?templateId=${timing.templateId}&customerId=${encodeURIComponent(customerId)}\n\n`;
        } else if (timing.templateId) {
            description += `  ${baseUrl}/templates.html?templateId=${timing.templateId}\n\n`;
        } else if (customerId) {
            description += `  ${baseUrl}/templates.html?customerId=${encodeURIComponent(customerId)}\n\n`;
        } else {
            description += `  ${baseUrl}/templates.html\n\n`;
        }

        if (timing.templateId) {
            description += `  推奨テンプレート: ${this.getTemplateTitle(timing.templateId)}\n`;
        }

        description += `\n---\nRentPipeで自動作成されました`;

        return description;
    },

    /**
     * タイミングの目的を取得
     */
    getTimingPurpose: function(timing) {
        const purposes = {
            'move_in_thanks': '入居後のお礼とご挨拶',
            'one_month_followup': '入居1ヶ月後のフォローアップ',
            'six_month_followup': '入居6ヶ月後のフォローアップ・ご紹介依頼',
            'one_year_followup': '入居1年後のフォローアップ・住み替え相談',
            'fixed_term_notice': '定期借家契約満了に向けた転居先検討の案内',
            'renewal_check': '更新意向の確認と転居希望のヒアリング',
            'custom_followup': 'カスタムフォローアップ'
        };
        return purposes[timing.type] || '定期フォローアップ';
    },

    /**
     * テンプレートタイトルを取得
     */
    getTemplateTitle: function(templateId) {
        const titles = {
            'move-in-thanks': 'ご入居後のお礼',
            'one-month-followup': '1ヶ月後フォロー',
            'six-month-followup': '6ヶ月後フォロー',
            'one-year-followup': '1年後フォロー',
            'moving-consultation': '住み替えのご相談案内',
            'referral-request': 'ご紹介のお願い'
        };
        return titles[templateId] || templateId;
    },

    /**
     * Googleカレンダーにイベントを作成
     */
    createCalendarEvent: async function(eventData) {
        const event = {
            summary: eventData.summary,
            description: eventData.description,
            start: {
                date: eventData.startDate,
                timeZone: 'Asia/Tokyo'
            },
            end: {
                date: eventData.startDate,
                timeZone: 'Asia/Tokyo'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: eventData.reminderDays * 24 * 60 },
                    { method: 'popup', minutes: eventData.reminderDays * 24 * 60 }
                ]
            }
        };

        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        return response.result;
    },

    /**
     * 単一のカスタムフォローアップイベントを作成（追加フォローアップ用）
     * @param {Object} customer - 顧客データ
     * @param {string} followUpDate - フォロー日付 (YYYY-MM-DD)
     * @param {string} label - イベントのラベル
     * @param {number} reminderDays - リマインド日数
     * @returns {Object} - 作成結果
     */
    createSingleFollowUpEvent: async function(customer, followUpDate, label, reminderDays = 3) {
        const initResult = await this.init();
        if (!initResult.success) {
            return initResult;
        }

        const customerName = customer.basicInfo?.name || '顧客';

        const timing = {
            label: label || 'フォローアップ',
            date: followUpDate,
            type: 'custom_followup',
            reminderDays: reminderDays,
            templateId: 'moving-consultation'
        };

        try {
            const event = await this.createCalendarEvent({
                summary: `📞 ${timing.label}: ${customerName}様`,
                description: this.generateEventDescription(customer, timing),
                startDate: followUpDate,
                reminderDays: reminderDays
            });

            console.log(`✅ 追加フォローアップイベント作成: ${label} - ${followUpDate}`);

            return {
                success: true,
                eventId: event.id,
                timing: label,
                date: followUpDate
            };
        } catch (error) {
            console.error('❌ 追加フォローアップイベント作成エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * イベントを削除
     */
    deleteCalendarEvent: async function(eventId) {
        try {
            await gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });
            return { success: true };
        } catch (error) {
            console.error('イベント削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 内見予定をGoogleカレンダーに登録（時刻指定イベント）
     * @param {Object} customer - 顧客データ
     * @param {Object} viewingData - 内見情報
     * @param {string} viewingData.dateTime     - 内見日時 (ISO8601: "2025-03-15T14:00")
     * @param {string} viewingData.propertyName - 物件名・住所
     * @param {string} viewingData.meetingPlace - 集合場所（デフォルト：現地集合）
     * @param {string} viewingData.propertyUrl  - 物件リンク（省略可）
     * @param {string} viewingData.contactInfo  - 予約先・管理会社情報（省略可）
     * @param {number} viewingData.reminderHours - リマインド時間数（1/3/24/48）
     * @returns {Object} { success, eventId, dateTime, propertyName }
     */
    createViewingEvent: async function(customer, viewingData) {
        const initResult = await this.init();
        if (!initResult.success) {
            return initResult;
        }

        const customerName = customer.basicInfo?.name || '顧客';
        const phone = customer.basicInfo?.phone || '';
        const { dateTime, propertyName, meetingPlace, propertyUrl, contactInfo, reminderHours } = viewingData;

        // 開始・終了時刻（1時間ブロック）
        const startDt = new Date(dateTime);
        const endDt = new Date(startDt.getTime() + 60 * 60 * 1000);
        const toIso = (d) => d.toISOString().replace('.000Z', '+09:00')
            // JST オフセット付きISO8601に変換
            .replace(/\.\d{3}Z$/, '+09:00');

        // JST で正確に変換（datetime-local は UTC ではなくローカル時刻）
        const startIso = dateTime + ':00+09:00'; // "2025-03-15T14:00" → "2025-03-15T14:00:00+09:00"
        const endDate = new Date(dateTime);
        endDate.setHours(endDate.getHours() + 1);
        const endPad = (n) => String(n).padStart(2, '0');
        const endIso = `${endDate.getFullYear()}-${endPad(endDate.getMonth()+1)}-${endPad(endDate.getDate())}T${endPad(endDate.getHours())}:${endPad(endDate.getMinutes())}:00+09:00`;

        // 説明欄の組み立て
        let description = `【内見予定】\n\n■ 顧客情報\n  氏名: ${customerName}`;
        if (phone) description += `\n  電話: ${phone}`;
        description += `\n\n■ 物件情報\n  物件名: ${propertyName || '（未入力）'}`;
        description += `\n  集合場所: ${meetingPlace || '現地集合'}`;
        if (propertyUrl) description += `\n  物件リンク: ${propertyUrl}`;
        if (contactInfo) description += `\n\n■ 予約先・管理会社\n  ${contactInfo.replace(/\n/g, '\n  ')}`;
        description += '\n\n---\nRentPipeで作成されました';

        const reminderMinutes = (reminderHours || 3) * 60;

        try {
            const response = await gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: {
                    summary: `🏠 内見: ${customerName}様 - ${propertyName || '物件'}`,
                    description: description,
                    start: { dateTime: startIso, timeZone: 'Asia/Tokyo' },
                    end:   { dateTime: endIso,   timeZone: 'Asia/Tokyo' },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email',  minutes: reminderMinutes },
                            { method: 'popup',  minutes: reminderMinutes }
                        ]
                    }
                }
            });

            const event = response.result;
            console.log(`✅ 内見予定をカレンダーに登録: ${propertyName} - ${dateTime}`);
            return {
                success: true,
                eventId: event.id,
                dateTime: dateTime,
                propertyName: propertyName
            };
        } catch (error) {
            console.error('❌ 内見予定カレンダー登録エラー:', error);
            return { success: false, error: error.message || '登録に失敗しました' };
        }
    },

    /**
     * 顧客のフォローアップイベントをすべて削除
     */
    deleteAllFollowUpEvents: async function(customer) {
        const eventIds = customer.followUpSettings?.calendarEventIds || [];
        const results = [];

        for (const eventId of eventIds) {
            const result = await this.deleteCalendarEvent(eventId);
            results.push({ eventId, ...result });
        }

        return {
            success: results.every(r => r.success),
            results
        };
    }
};

// グローバルに公開
window.GoogleCalendarAPI = GoogleCalendarAPI;

console.log('✅ GoogleCalendarAPI loaded');
