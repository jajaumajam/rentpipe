/**
 * 統合データマネージャー (拡張版)
 * ローカルストレージとGoogle Sheetsの統合管理
 * 顧客入力項目拡充に対応
 */

const UnifiedDataManager = {
    STORAGE_KEY: 'rentpipe_customers',

    /**
     * 顧客データを取得
     */
    getCustomers: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];
            
            const customers = JSON.parse(data);
            
            // データマイグレーション実行
            if (window.DataMigration) {
                return DataMigration.migrateAllCustomers(customers);
            }
            
            return customers;
        } catch (error) {
            console.error('顧客データ取得エラー:', error);
            return [];
        }
    },

    /**
     * 顧客データを保存
     */
    saveCustomers: function(customers) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customers));
            return true;
        } catch (error) {
            console.error('顧客データ保存エラー:', error);
            return false;
        }
    },

    /**
     * 新規顧客を追加
     */
    addCustomer: async function(customerData) {
        try {
            const customers = this.getCustomers();

            // 新しいデータ構造で顧客を作成
            const customer = {
                id: this.generateCustomerId(),
                
                basicInfo: {
                    name: customerData.basicInfo?.name || "",
                    nameKana: customerData.basicInfo?.nameKana || "",
                    email: customerData.basicInfo?.email || "",
                    phone: customerData.basicInfo?.phone || "",
                    birthday: customerData.basicInfo?.birthday || "",
                    gender: customerData.basicInfo?.gender || "no_answer",
                    currentAddress: customerData.basicInfo?.currentAddress || "",
                    currentHousing: customerData.basicInfo?.currentHousing || "",
                    occupation: customerData.basicInfo?.occupation || "",
                    companyName: customerData.basicInfo?.companyName || "",
                    yearsEmployed: customerData.basicInfo?.yearsEmployed || 0,
                    annualIncome: customerData.basicInfo?.annualIncome || 0,
                    movingReason: customerData.basicInfo?.movingReason || "",
                    numberOfOccupants: customerData.basicInfo?.numberOfOccupants || 1
                },
                
                preferences: {
                    budget: {
                        min: customerData.preferences?.budget?.min || 0,
                        max: customerData.preferences?.budget?.max || 0,
                        note: customerData.preferences?.budget?.note || ""
                    },
                    moveInDate: customerData.preferences?.moveInDate || "",
                    moveInDateNote: customerData.preferences?.moveInDateNote || "",
                    areas: customerData.preferences?.areas || "",
                    areasNote: customerData.preferences?.areasNote || "",
                    layout: customerData.preferences?.layout || "",
                    layoutNote: customerData.preferences?.layoutNote || "",
                    roomSize: customerData.preferences?.roomSize || 0,
                    roomSizeNote: customerData.preferences?.roomSizeNote || "",
                    stationWalk: customerData.preferences?.stationWalk || 0,
                    stationWalkNote: customerData.preferences?.stationWalkNote || "",
                    buildingAge: {
                        value: customerData.preferences?.buildingAge?.value || 999,
                        type: customerData.preferences?.buildingAge?.type || "any",
                        note: customerData.preferences?.buildingAge?.note || ""
                    },
                    floor: customerData.preferences?.floor || 1,
                    floorNote: customerData.preferences?.floorNote || ""
                },
                
                equipment: {
                    autoLock: customerData.equipment?.autoLock || false,
                    separateBath: customerData.equipment?.separateBath || false,
                    separateWashroom: customerData.equipment?.separateWashroom || false,
                    indoorWashing: customerData.equipment?.indoorWashing || false,
                    twoGasStove: customerData.equipment?.twoGasStove || false,
                    flooring: customerData.equipment?.flooring || false,
                    noTatami: customerData.equipment?.noTatami || false,
                    elevator: customerData.equipment?.elevator || false,
                    deliveryBox: customerData.equipment?.deliveryBox || false,
                    internet: customerData.equipment?.internet || false,
                    parking: customerData.equipment?.parking || false,
                    bike: customerData.equipment?.bike || false,
                    bicycle: customerData.equipment?.bicycle || false,
                    petAllowed: customerData.equipment?.petAllowed || false,
                    instrumentAllowed: customerData.equipment?.instrumentAllowed || false,
                    sohoAllowed: customerData.equipment?.sohoAllowed || false,
                    equipmentNote: customerData.equipment?.equipmentNote || ""
                },
                
                additionalInfo: {
                    notes: customerData.additionalInfo?.notes || ""
                },

                agentMemo: customerData.agentMemo || "",

                // 成約・契約情報
                contractInfo: {
                    contractDate: customerData.contractInfo?.contractDate || null,           // 成約日
                    contractType: customerData.contractInfo?.contractType || "普通借家",      // 契約種別（普通借家/定期借家）
                    contractPeriodMonths: customerData.contractInfo?.contractPeriodMonths || 24,  // 契約期間（月数）
                    contractEndDate: customerData.contractInfo?.contractEndDate || null,     // 契約終了日
                    propertyAddress: customerData.contractInfo?.propertyAddress || "",       // 成約物件住所
                    monthlyRent: customerData.contractInfo?.monthlyRent || null,             // 月額賃料
                    moveInDate: customerData.contractInfo?.moveInDate || null                // 入居日
                },

                // フォローアップ設定
                followUpSettings: {
                    enabled: customerData.followUpSettings?.enabled !== false,               // フォローアップ有効/無効
                    calendarEventsCreated: customerData.followUpSettings?.calendarEventsCreated || false,  // カレンダー予定作成済み
                    calendarEventIds: customerData.followUpSettings?.calendarEventIds || []  // 作成した予定のID配列
                },

                // フォローアップ履歴
                followUpHistory: customerData.followUpHistory || [],

                pipelineStatus: customerData.pipelineStatus || "初回相談",
                isActive: customerData.isActive !== false,
                archivedAt: customerData.archivedAt || null,
                archiveReason: customerData.archiveReason || null,  // "成約" | "失注" | "その他" | null
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // バリデーション
            if (window.DataMigration) {
                const validation = DataMigration.validateCustomer(customer);
                if (!validation.isValid) {
                    console.error('バリデーションエラー:', validation.errors);
                    return { success: false, error: validation.errors.join(', ') };
                }
            }

            customers.push(customer);
            this.saveCustomers(customers);

            // データ更新イベントを発火
            window.dispatchEvent(new CustomEvent('rentpipe-data-updated', {
                detail: { source: 'add-customer', customerId: customer.id }
            }));

            // Google Sheetsに同期
            if (window.UnifiedSheetsManager) {
                await UnifiedSheetsManager.syncToSheets(customers);
            }

            return { success: true, customer: customer };
        } catch (error) {
            console.error('顧客追加エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 顧客情報を更新
     */
    updateCustomer: async function(customerIdOrObject, updates) {
        try {
            const customers = this.getCustomers();
            let customerId, customerUpdates;
            
            // 引数の形式を判定
            if (typeof customerIdOrObject === 'string') {
                // 従来の形式: updateCustomer(customerId, updates)
                customerId = customerIdOrObject;
                customerUpdates = updates;
            } else if (typeof customerIdOrObject === 'object' && customerIdOrObject.id) {
                // 新しい形式: updateCustomer(customer)
                customerId = customerIdOrObject.id;
                customerUpdates = customerIdOrObject;
            } else {
                return { success: false, error: '無効な引数です' };
            }
            
            const index = customers.findIndex(c => c.id === customerId);

            if (index === -1) {
                return { success: false, error: '顧客が見つかりません' };
            }

            // 更新データをマージ
            const customer = customers[index];
            
            if (customerUpdates.basicInfo) {
                customer.basicInfo = { ...customer.basicInfo, ...customerUpdates.basicInfo };
            }
            if (customerUpdates.preferences) {
                customer.preferences = { ...customer.preferences, ...customerUpdates.preferences };
            }
            if (customerUpdates.equipment) {
                customer.equipment = { ...customer.equipment, ...customerUpdates.equipment };
            }
            if (customerUpdates.additionalInfo) {
                customer.additionalInfo = { ...customer.additionalInfo, ...customerUpdates.additionalInfo };
            }
            if (customerUpdates.agentMemo !== undefined) {
                customer.agentMemo = customerUpdates.agentMemo;
            }
            if (customerUpdates.pipelineStatus) {
                customer.pipelineStatus = customerUpdates.pipelineStatus;
            }
            if (customerUpdates.isActive !== undefined) {
                customer.isActive = customerUpdates.isActive;
            }
            if (customerUpdates.archivedAt !== undefined) {
                customer.archivedAt = customerUpdates.archivedAt;
            }
            if (customerUpdates.archiveReason !== undefined) {
                customer.archiveReason = customerUpdates.archiveReason;
            }
            // 契約情報の更新
            if (customerUpdates.contractInfo) {
                customer.contractInfo = { ...customer.contractInfo, ...customerUpdates.contractInfo };
            }

            // フォローアップ設定の更新
            if (customerUpdates.followUpSettings) {
                customer.followUpSettings = { ...customer.followUpSettings, ...customerUpdates.followUpSettings };
            }

            // フォローアップ履歴の更新
            if (customerUpdates.followUpHistory) {
                customer.followUpHistory = customerUpdates.followUpHistory;
            }

            customer.updatedAt = new Date().toISOString();
            customers[index] = customer;

            this.saveCustomers(customers);

            // データ更新イベントを発火
            window.dispatchEvent(new CustomEvent('rentpipe-data-updated', {
                detail: { source: 'update-customer', customerId: customer.id }
            }));

            // Google Sheetsに同期
            if (window.UnifiedSheetsManager) {
                await UnifiedSheetsManager.syncToSheets(customers);
            }

            return { success: true, customer: customer };
        } catch (error) {
            console.error('顧客更新エラー:', error);
            return { success: false, error: error.message };
        }
    },


    /**
     * 顧客を削除
     */
    deleteCustomer: async function(customerId) {
        try {
            let customers = this.getCustomers();
            customers = customers.filter(c => c.id !== customerId);

            this.saveCustomers(customers);

            // Google Sheetsに同期
            if (window.UnifiedSheetsManager) {
                await UnifiedSheetsManager.syncToSheets(customers);
            }

            return { success: true };
        } catch (error) {
            console.error('顧客削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 顧客を非アクティブ化（アーカイブ）
     */
    deactivateCustomer: async function(customerId, reason) {
        return await this.updateCustomer(customerId, {
            isActive: false,
            archivedAt: new Date().toISOString(),
            archiveReason: reason || '失注',
            pipelineStatus: '完了'
        });
    },

    /**
     * 顧客を再アクティブ化
     */
    reactivateCustomer: async function(customerId) {
        return await this.updateCustomer(customerId, {
            isActive: true,
            archivedAt: null
        });
    },

    /**
     * IDで顧客を取得
     */
    getCustomerById: function(customerId) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === customerId);
    },

    /**
     * ユニークなIDを生成
     */
    generateCustomerId: function() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `customer_${timestamp}_${random}`;
    },

    /**
     * パイプライン状態で絞り込み
     */
    getCustomersByPipeline: function(status) {
        const customers = this.getCustomers();
        return customers.filter(c => c.pipelineStatus === status);
    },

    /**
     * アクティブ顧客のみ取得
     */
    getActiveCustomers: function() {
        const customers = this.getCustomers();
        return customers.filter(c => c.isActive !== false);
    },

    /**
     * 非アクティブ顧客のみ取得
     */
    getInactiveCustomers: function() {
        const customers = this.getCustomers();
        return customers.filter(c => c.isActive === false);
    },

    /**
     * 統計情報を取得
     */
    getStats: function() {
        const customers = this.getCustomers();
        const activeCustomers = this.getActiveCustomers();
        const inactiveCustomers = this.getInactiveCustomers();

        const pipelineCounts = {
            '初回相談': 0,
            '物件紹介': 0,
            '内見調整': 0,
            '申込準備': 0,
            '審査中': 0,
            '契約手続き': 0,
            '完了': 0
        };

        activeCustomers.forEach(customer => {
            if (pipelineCounts.hasOwnProperty(customer.pipelineStatus)) {
                pipelineCounts[customer.pipelineStatus]++;
            }
        });

        return {
            total: customers.length,
            active: activeCustomers.length,
            inactive: inactiveCustomers.length,
            pipeline: pipelineCounts
        };
    },

    /**
     * Google Sheetsから即座に同期
     */
    syncFromSheetsImmediately: async function() {
        if (!window.UnifiedSheetsManager) {
            console.error('UnifiedSheetsManager が利用できません');
            return { success: false, error: 'Sheets Manager not available' };
        }

        try {
            const result = await UnifiedSheetsManager.loadFromSheets();
            if (result.success && result.customers) {
                this.saveCustomers(result.customers);
                return { success: true, customers: result.customers };
            }
            return result;
        } catch (error) {
            console.error('同期エラー:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Google Sheetsへ即座に同期
     */
    syncToSheetsImmediately: async function(customers) {
        if (!window.UnifiedSheetsManager) {
            console.error('UnifiedSheetsManager が利用できません');
            return { success: false, error: 'Sheets Manager not available' };
        }

        try {
            return await UnifiedSheetsManager.syncToSheets(customers);
        } catch (error) {
            console.error('同期エラー:', error);
            return { success: false, error: error.message };
        }
    }
};

// グローバルに公開
window.UnifiedDataManager = UnifiedDataManager;

console.log('✅ UnifiedDataManager (拡張版) loaded');
