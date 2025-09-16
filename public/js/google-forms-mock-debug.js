// 🎭 Google Forms API モック版（デバッグ強化版）
console.log('🎭 Google Forms API モック版（デバッグ強化版）を初期化中...');

window.GoogleFormsSimple = {
    // 初期化状態
    isInitialized: false,
    isAPIReady: false,
    
    // デバッグログ
    debugLog: function(message, data = null) {
        console.log(`🎭 [GoogleFormsSimple Debug] ${message}`, data || '');
    },
    
    // 初期化（モック版）
    initialize: async function() {
        try {
            this.debugLog('📚 初期化開始...');
            
            // 認証状態確認
            this.debugLog('🔍 認証状態確認開始...');
            const authCheck = this.checkAuthentication();
            this.debugLog('🔍 認証チェック結果:', authCheck);
            
            if (!authCheck) {
                throw new Error('Google認証が必要です');
            }
            
            this.debugLog('⏳ モック遅延開始（2秒）...');
            // モック：2秒の遅延でAPI接続をシミュレーション
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.debugLog('✅ モック遅延完了');
            
            this.isInitialized = true;
            this.isAPIReady = true;
            
            this.debugLog('✅ 初期化完了');
            console.log('✅ Google Forms API初期化完了（モック版・デバッグ）');
            return true;
            
        } catch (error) {
            this.debugLog('❌ 初期化エラー:', error);
            console.error('❌ Google Forms API初期化エラー（モック版・デバッグ）:', error);
            this.showError('Google Forms APIの初期化に失敗しました: ' + error.message);
            return false;
        }
    },
    
    // 認証状態チェック（デバッグ強化版）
    checkAuthentication: function() {
        try {
            this.debugLog('🔍 認証状態チェック開始...');
            
            // LocalStorageのキーを確認
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                allKeys.push(localStorage.key(i));
            }
            this.debugLog('📋 全LocalStorageキー:', allKeys);
            
            // Google認証関連のキーを確認
            const googleAuth = localStorage.getItem('rentpipe_temp_auth');
            const googleUser = localStorage.getItem('google_user_temp');
            const simpleAuth = localStorage.getItem('rentpipe_auth_simple');
            const simpleUser = localStorage.getItem('rentpipe_user_simple');
            
            this.debugLog('🔍 認証状態詳細:', {
                rentpipe_temp_auth: googleAuth,
                google_user_temp: googleUser ? 'データあり' : 'データなし',
                rentpipe_auth_simple: simpleAuth,
                rentpipe_user_simple: simpleUser ? 'データあり' : 'データなし'
            });
            
            // 複数の認証方式をチェック
            let isAuthenticated = false;
            let authMethod = '';
            
            // 方式1: Google認証フラグ
            if (googleAuth === 'google_authenticated') {
                isAuthenticated = true;
                authMethod = 'google_flag';
                this.debugLog('✅ Google認証フラグで認証確認');
            }
            
            // 方式2: Simple認証
            else if (simpleAuth === 'logged_in') {
                isAuthenticated = true;
                authMethod = 'simple_auth';
                this.debugLog('✅ Simple認証で認証確認');
            }
            
            this.debugLog('🔍 最終認証結果:', { isAuthenticated, authMethod });
            
            if (!isAuthenticated) {
                this.debugLog('❌ 認証失敗: 有効な認証データが見つかりません');
                this.showError('Google認証が必要です。まず「Google認証してフォーム機能を利用」ボタンをクリックしてください。');
                return false;
            }
            
            this.debugLog('✅ 認証チェック成功');
            return true;
            
        } catch (error) {
            this.debugLog('❌ 認証チェックでエラー:', error);
            console.error('❌ 認証チェックエラー:', error);
            this.showError('認証状態の確認中にエラーが発生しました: ' + error.message);
            return false;
        }
    },
    
    // 顧客専用フォームを作成（モック版）
    createCustomerForm: async function(customerId, customerIndex) {
        try {
            this.debugLog('📝 フォーム作成開始:', customerId);
            
            // 初期化確認
            if (!this.isAPIReady) {
                this.debugLog('🔄 API初期化が必要');
                const initResult = await this.initialize();
                if (!initResult) {
                    throw new Error('Google Forms APIの初期化に失敗しました');
                }
            }
            
            // 顧客データ取得
            const customer = this.getCustomerData(customerId);
            if (!customer) {
                throw new Error('顧客データが見つかりません');
            }
            
            this.debugLog('👤 顧客データ取得成功:', customer.name);
            
            // ローディング表示
            this.showLoading(`${customer.name}様の専用フォーム作成中...（モック版）`);
            
            this.debugLog('⏳ フォーム作成処理開始（3秒遅延）');
            // モック：3秒の遅延でフォーム作成をシミュレーション
            await new Promise(resolve => setTimeout(resolve, 3000));
            this.debugLog('✅ フォーム作成処理完了');
            
            // モック：フォーム作成結果
            const formResult = this.createMockForm(customer);
            this.debugLog('📝 モックフォーム作成結果:', formResult);
            
            if (formResult.success) {
                // フォーム作成成功
                await this.saveFormToCustomer(customerId, formResult);
                this.showSuccess(customer.name, formResult.formUrl, formResult.editUrl);
                
                // 顧客リストを更新
                setTimeout(() => {
                    if (window.loadCustomerData) {
                        window.loadCustomerData();
                    }
                }, 1000);
                
                this.debugLog('✅ フォーム作成完了');
            } else {
                throw new Error(formResult.error || 'フォームの作成に失敗しました');
            }
            
        } catch (error) {
            this.debugLog('❌ フォーム作成エラー:', error);
            console.error('❌ 顧客フォーム作成エラー（モック版・デバッグ）:', error);
            this.showError('フォームの作成中にエラーが発生しました: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },
    
    // 顧客データ取得（デバッグ強化版）
    getCustomerData: function(customerId) {
        try {
            this.debugLog('📊 顧客データ取得開始:', customerId);
            
            // 複数のキーから顧客データを取得
            const possibleKeys = ['customers', 'rentpipe_demo_customers', 'rentpipe_customers'];
            
            for (const key of possibleKeys) {
                this.debugLog(`🔍 キー確認中: ${key}`);
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    this.debugLog(`✅ データ発見: ${key}`);
                    const customers = JSON.parse(storedData);
                    this.debugLog(`📊 顧客数: ${customers.length}件`);
                    
                    const customer = customers.find(c => c.id === customerId);
                    if (customer) {
                        this.debugLog('✅ 対象顧客発見:', customer.name);
                        return customer;
                    }
                } else {
                    this.debugLog(`❌ データなし: ${key}`);
                }
            }
            
            this.debugLog('❌ 顧客データが見つかりません:', customerId);
            return null;
            
        } catch (error) {
            this.debugLog('❌ 顧客データ取得エラー:', error);
            console.error('❌ 顧客データ取得エラー（モック版・デバッグ）:', error);
            return null;
        }
    },
    
    // モックフォーム作成
    createMockForm: function(customer) {
        this.debugLog('📝 モックフォーム作成:', customer.name);
        
        // モック：ランダムなフォームID生成
        const mockFormId = 'mock_form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const formTitle = `${customer.name}様専用 物件希望調査フォーム`;
        
        const result = {
            success: true,
            formId: mockFormId,
            formUrl: `https://docs.google.com/forms/d/${mockFormId}/viewform`,
            editUrl: `https://docs.google.com/forms/d/${mockFormId}/edit`,
            title: formTitle,
            createdAt: new Date().toISOString(),
            isMock: true // モック版であることを示すフラグ
        };
        
        this.debugLog('✅ モックフォーム作成完了:', result);
        return result;
    },
    
    // フォーム情報を顧客データに保存
    saveFormToCustomer: async function(customerId, formData) {
        try {
            this.debugLog('💾 顧客データ保存開始:', customerId);
            
            // 顧客データ更新
            const possibleKeys = ['customers', 'rentpipe_demo_customers', 'rentpipe_customers'];
            
            for (const key of possibleKeys) {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    const customers = JSON.parse(storedData);
                    const customerIndex = customers.findIndex(c => c.id === customerId);
                    
                    if (customerIndex !== -1) {
                        this.debugLog(`✅ 顧客発見（インデックス: ${customerIndex}）`);
                        
                        // Google Forms情報を追加
                        customers[customerIndex].googleForm = {
                            formId: formData.formId,
                            formUrl: formData.formUrl,
                            editUrl: formData.editUrl,
                            title: formData.title,
                            status: 'created',
                            createdAt: formData.createdAt,
                            responseCount: 0,
                            isMock: formData.isMock
                        };
                        
                        // ローカルストレージに保存
                        localStorage.setItem(key, JSON.stringify(customers));
                        this.debugLog('✅ データ保存完了');
                        break;
                    }
                }
            }
            
        } catch (error) {
            this.debugLog('❌ データ保存エラー:', error);
            console.error('❌ 顧客データ更新エラー（モック版・デバッグ）:', error);
        }
    },
    
    // ローディング表示
    showLoading: function(message) {
        this.debugLog('🔄 ローディング表示:', message);
        
        // 既存のローディング要素があれば削除
        this.hideLoading();
        
        const overlay = document.createElement('div');
        overlay.id = 'google-forms-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🎭</div>
                <h3 style="margin: 0 0 1rem 0;">フォーム作成中（モック版）</h3>
                <p style="margin: 0; color: #666;">${message}</p>
                <div style="margin-top: 1rem;">
                    <div class="loading-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 1rem;">※これはモック版です。実際のGoogle Formsは作成されません。</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // スピンナーアニメーション
        if (!document.getElementById('loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // ローディング非表示
    hideLoading: function() {
        this.debugLog('❌ ローディング非表示');
        const overlay = document.getElementById('google-forms-loading');
        if (overlay) {
            overlay.remove();
        }
    },
    
    // 成功メッセージ表示
    showSuccess: function(customerName, formUrl, editUrl) {
        this.debugLog('✅ 成功メッセージ表示:', customerName);
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎭✅</div>
                <h3 style="margin: 0 0 1rem 0; color: #059669;">フォーム作成完了！（モック版）</h3>
                <p style="margin: 0 0 1.5rem 0; color: #374151;">
                    ${customerName}様専用の物件希望調査フォームが作成されました<br>
                    <small style="color: #999;">※これはモック版です。実際のフォームは作成されていません。</small>
                </p>
                <div style="margin: 1rem 0; padding: 1rem; background: #f3f4f6; border-radius: 6px; text-align: left;">
                    <p style="margin: 0 0 0.5rem 0; font-weight: bold;">📝 フォームURL（モック）:</p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 0 0 1rem 0;">${formUrl}</p>
                    
                    <p style="margin: 1rem 0 0.5rem 0; font-weight: bold;">⚙️ 編集URL（モック）:</p>
                    <p style="color: #059669; font-size: 14px; word-break: break-all; margin: 0;">${editUrl}</p>
                </div>
                <div style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>🎭 モック版について</strong><br>
                        実際のGoogle Formsは作成されませんが、UIと機能の流れを確認できます。<br>
                        本格実装にはGoogle Cloud Platform設定が必要です。
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    閉じる
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 15秒後に自動で閉じる
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 15000);
    },
    
    // エラーメッセージ表示
    showError: function(message) {
        this.debugLog('❌ エラーメッセージ表示:', message);
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🎭❌</div>
                <h3 style="margin: 0 0 1rem 0; color: #dc2626;">エラーが発生しました（モック版）</h3>
                <p style="margin: 0 0 1.5rem 0; color: #6b7280; font-size: 14px;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    閉じる
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 10秒後に自動で閉じる
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 10000);
    }
};

// グローバル関数として公開
window.createCustomerForm = function(customerId, customerIndex) {
    window.GoogleFormsSimple.createCustomerForm(customerId, customerIndex);
};

console.log('✅ Google Forms API モック版（デバッグ強化版）準備完了');
