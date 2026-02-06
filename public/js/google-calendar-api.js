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
     * フォローアップイベントを作成
     * @param {Object} customer - 顧客データ
     * @returns {Object} - 作成結果
     */
    createFollowUpEvents: async function(customer) {
        const initResult = await this.init();
        if (!initResult.success) {
            return initResult;
        }

        const contractInfo = customer.contractInfo || {};
        const contractEndDate = contractInfo.contractEndDate;

        if (!contractEndDate) {
            return { success: false, error: '契約終了日が設定されていません' };
        }

        const customerName = customer.basicInfo?.name || '顧客';
        const propertyAddress = contractInfo.propertyAddress || '物件';
        const contractType = contractInfo.contractType || '普通借家';
        const monthlyRent = contractInfo.monthlyRent;

        const createdEvents = [];
        const errors = [];

        // フォローアップタイミングを計算
        const followUpTimings = this.calculateFollowUpTimings(contractEndDate, contractType);

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
     * @param {string} contractEndDate - 契約終了日 (YYYY-MM-DD)
     * @param {string} contractType - 契約種別
     * @returns {Array} - フォローアップタイミングの配列
     */
    calculateFollowUpTimings: function(contractEndDate, contractType) {
        const endDate = new Date(contractEndDate);
        const timings = [];

        if (contractType === '定期借家') {
            // 定期借家: 期間満了型のため、より早めに連絡
            // 6ヶ月前: 転居先検討開始の案内
            timings.push({
                label: '【定期】6ヶ月前連絡',
                date: this.addMonths(endDate, -6),
                type: 'early_notice',
                reminderDays: 7,
                messageTemplate: 'fixed_term_6months'
            });

            // 4ヶ月前: 具体的な物件提案
            timings.push({
                label: '【定期】4ヶ月前フォロー',
                date: this.addMonths(endDate, -4),
                type: 'property_proposal',
                reminderDays: 3,
                messageTemplate: 'fixed_term_4months'
            });

            // 2ヶ月前: 最終確認
            timings.push({
                label: '【定期】2ヶ月前最終確認',
                date: this.addMonths(endDate, -2),
                type: 'final_check',
                reminderDays: 1,
                messageTemplate: 'fixed_term_2months'
            });
        } else {
            // 普通借家: 更新型
            // 4ヶ月前: 更新意向確認
            timings.push({
                label: '更新4ヶ月前連絡',
                date: this.addMonths(endDate, -4),
                type: 'renewal_check',
                reminderDays: 7,
                messageTemplate: 'regular_4months'
            });

            // 2ヶ月前: 転居希望者へのフォロー
            timings.push({
                label: '更新2ヶ月前フォロー',
                date: this.addMonths(endDate, -2),
                type: 'follow_up',
                reminderDays: 3,
                messageTemplate: 'regular_2months'
            });
        }

        // 過去の日付は除外
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return timings.filter(t => new Date(t.date) > today);
    },

    /**
     * 月を加算/減算
     */
    addMonths: function(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);

        // YYYY-MM-DD形式で返す
        const year = result.getFullYear();
        const month = String(result.getMonth() + 1).padStart(2, '0');
        const day = String(result.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * イベント説明文を生成
     */
    generateEventDescription: function(customer, timing) {
        const basicInfo = customer.basicInfo || {};
        const contractInfo = customer.contractInfo || {};

        let description = `【フォローアップ連絡】\n\n`;
        description += `■ 顧客情報\n`;
        description += `  氏名: ${basicInfo.name || '未設定'}\n`;
        description += `  電話: ${basicInfo.phone || '未設定'}\n`;
        description += `  メール: ${basicInfo.email || '未設定'}\n\n`;

        description += `■ 契約情報\n`;
        description += `  物件: ${contractInfo.propertyAddress || '未設定'}\n`;
        description += `  契約種別: ${contractInfo.contractType || '未設定'}\n`;
        description += `  契約終了日: ${contractInfo.contractEndDate || '未設定'}\n`;
        description += `  月額賃料: ${contractInfo.monthlyRent ? contractInfo.monthlyRent.toLocaleString() + '円' : '未設定'}\n\n`;

        description += `■ 連絡目的\n`;
        description += `  ${this.getTimingPurpose(timing)}\n\n`;

        description += `■ トークスクリプト\n`;
        description += this.getMessageTemplate(timing, customer);

        description += `\n\n---\nRentPipeで自動作成されました`;

        return description;
    },

    /**
     * タイミングの目的を取得
     */
    getTimingPurpose: function(timing) {
        const purposes = {
            'early_notice': '契約満了に向けた転居先検討の案内',
            'property_proposal': '具体的な物件提案',
            'final_check': '最終的な意向確認と手続き案内',
            'renewal_check': '更新意向の確認と転居希望のヒアリング',
            'follow_up': '転居希望者への物件提案'
        };
        return purposes[timing.type] || '定期フォローアップ';
    },

    /**
     * メッセージテンプレートを取得
     */
    getMessageTemplate: function(timing, customer) {
        const name = customer.basicInfo?.name || 'お客様';
        const contractEnd = customer.contractInfo?.contractEndDate || '';

        const templates = {
            'fixed_term_6months': `
「${name}様、お世話になっております。
以前お住まいをご紹介させていただきました○○です。

お住まいの定期借家契約が${contractEnd}に満了となりますので、
そろそろ次のお住まい探しを始められてはいかがでしょうか。

ご希望のエリアや条件などお聞かせいただければ、
ご要望に合った物件をお探しいたします。

お忙しいところ恐れ入りますが、ご都合の良いお時間を
お知らせいただけますでしょうか。」`,

            'fixed_term_4months': `
「${name}様、先日はお電話ありがとうございました。

お伝えいただいたご希望条件をもとに、
いくつか物件をピックアップいたしました。

[物件リストを添付]

ご興味のある物件がございましたら、
内見のご案内をさせていただきます。」`,

            'fixed_term_2months': `
「${name}様、契約満了まで残り2ヶ月となりました。

次のお住まいの準備は順調でしょうか。
まだお探し中でしたら、引き続きお手伝いいたします。

退去手続きについてもご不明点があれば
お気軽にお問い合わせください。」`,

            'regular_4months': `
「${name}様、お世話になっております。

契約更新時期（${contractEnd}）が近づいてまいりました。
つきましては、更新のご意向をお伺いしたく
ご連絡いたしました。

もし転居をご検討されている場合は、
物件探しのお手伝いをさせていただきます。

ご都合の良いお時間をお知らせください。」`,

            'regular_2months': `
「${name}様、先日のご連絡の件でお電話いたしました。

転居をご検討とのことでしたので、
ご希望条件に合いそうな物件をいくつか
ピックアップいたしました。

[物件リストを準備]

ご興味のある物件がございましたら、
内見のご手配をいたします。」`
        };

        return templates[timing.messageTemplate] || '※定型メッセージなし';
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
