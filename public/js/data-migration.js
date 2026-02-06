/**
 * データマイグレーション関数
 * 既存の顧客データを新しい拡張構造に変換
 */

const DataMigration = {
    /**
     * 旧形式データを新形式に変換
     */
    migrateCustomer: function(oldCustomer) {
        // すでに新形式かチェック
        if (this.isNewFormat(oldCustomer)) {
            return oldCustomer;
        }

        console.log('マイグレーション実行:', oldCustomer.name);

        return {
            id: oldCustomer.id,
            
            // 基本情報(拡張版)
            basicInfo: {
                name: oldCustomer.name || "",
                nameKana: "", // 新規項目
                email: oldCustomer.email || "",
                phone: oldCustomer.phone || "",
                birthday: "",
                gender: "no_answer",
                currentAddress: "",
                currentHousing: "",
                occupation: "",
                companyName: "",
                yearsEmployed: 0,
                annualIncome: 0,
                movingReason: "",
                numberOfOccupants: 1
            },
            
            // 希望条件(拡張版)
            preferences: {
                budget: {
                    min: oldCustomer.preferences?.budgetMin || oldCustomer.budgetMin || 0,
                    max: oldCustomer.preferences?.budgetMax || oldCustomer.budgetMax || 0,
                    note: ""
                },
                moveInDate: "",
                moveInDateNote: "",
                areas: oldCustomer.preferences?.areas || oldCustomer.areas || "",
                areasNote: "",
                layout: "",
                layoutNote: "",
                roomSize: 0,
                roomSizeNote: "",
                stationWalk: 0,
                stationWalkNote: "",
                buildingAge: {
                    value: 999,
                    type: "any",
                    note: ""
                },
                floor: 1,
                floorNote: ""
            },
            
            // 設備条件(新規)
            equipment: {
                autoLock: false,
                separateBath: false,
                separateWashroom: false,
                indoorWashing: false,
                twoGasStove: false,
                flooring: false,
                noTatami: false,
                elevator: false,
                deliveryBox: false,
                internet: false,
                parking: false,
                bike: false,
                bicycle: false,
                petAllowed: false,
                instrumentAllowed: false,
                sohoAllowed: false,
                equipmentNote: ""
            },
            
            // 追加情報
            additionalInfo: {
                notes: oldCustomer.notes || oldCustomer.preferences?.notes || ""
            },
            
            // エージェントメモ(新規)
            agentMemo: oldCustomer.agentMemo || "",

            // 契約・成約情報
            contractInfo: {
                contractDate: oldCustomer.contractInfo?.contractDate || oldCustomer.contractStartDate || null,
                contractType: oldCustomer.contractInfo?.contractType || "普通借家",
                contractPeriodMonths: oldCustomer.contractInfo?.contractPeriodMonths || 24,
                contractEndDate: oldCustomer.contractInfo?.contractEndDate || null,
                propertyAddress: oldCustomer.contractInfo?.propertyAddress || "",
                monthlyRent: oldCustomer.contractInfo?.monthlyRent || null,
                moveInDate: oldCustomer.contractInfo?.moveInDate || null
            },

            // フォローアップ設定
            followUpSettings: {
                enabled: oldCustomer.followUpSettings?.enabled !== false,
                calendarEventsCreated: oldCustomer.followUpSettings?.calendarEventsCreated || false,
                calendarEventIds: oldCustomer.followUpSettings?.calendarEventIds || []
            },

            // フォローアップ履歴
            followUpHistory: oldCustomer.followUpHistory || [],

            // パイプライン情報
            pipelineStatus: oldCustomer.pipelineStatus || "初回相談",
            isActive: oldCustomer.isActive !== false,
            archivedAt: oldCustomer.archivedAt || null,
            createdAt: oldCustomer.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    /**
     * 新形式かどうか判定
     */
    isNewFormat: function(customer) {
        // 新形式の必須条件：basicInfoとcontractInfoが存在すること
        return customer.basicInfo &&
               typeof customer.basicInfo === 'object' &&
               customer.basicInfo.nameKana !== undefined &&
               customer.contractInfo !== undefined;
    },

    /**
     * 全顧客データをマイグレーション
     */
    migrateAllCustomers: function(customers) {
        if (!Array.isArray(customers)) {
            console.error('顧客データが配列ではありません');
            return [];
        }

        console.log(`マイグレーション開始: ${customers.length}件`);
        
        const migrated = customers.map(customer => this.migrateCustomer(customer));
        
        console.log('マイグレーション完了');
        return migrated;
    },

    /**
     * データ構造のバリデーション
     */
    validateCustomer: function(customer) {
        const errors = [];

        // 必須項目チェック
        if (!customer.id) errors.push('IDが必要です');
        if (!customer.basicInfo?.name) errors.push('名前が必要です');
        if (!customer.basicInfo?.email && !customer.basicInfo?.phone) {
            errors.push('メールアドレスまたは電話番号が必要です');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// グローバルに公開
window.DataMigration = DataMigration;
