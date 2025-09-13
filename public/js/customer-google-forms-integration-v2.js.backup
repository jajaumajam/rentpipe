// 🔗 顧客管理画面 Google Forms統合機能 v2（既存システム対応版）
console.log('🔗 顧客管理画面 Google Forms統合機能 v2 初期化中...');

window.CustomerGoogleFormsIntegrationV2 = {
    // 初期化
    initialize: function() {
        try {
            console.log('🔗 Google Forms統合機能 v2 初期化開始...');
            
            // DOM読み込み完了を待つ
            if (document.readyState !== 'complete') {
                setTimeout(() => this.initialize(), 500);
                return;
            }
            
            // 既存の顧客データ読み込み完了を待つ
            this.waitForCustomerData();
            
        } catch (error) {
            console.error('❌ Google Forms統合機能初期化エラー:', error);
        }
    },
    
    // 顧客データの読み込み完了を待機
    waitForCustomerData: function() {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkData = () => {
            attempts++;
            
            // 顧客データまたは顧客カードの存在を確認
            const hasCustomerData = window.customers && window.customers.length > 0;
            const hasCustomerCards = document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]').length > 0;
            
            console.log(`🔍 データ確認試行 ${attempts}:`, {
                hasCustomerData,
                hasCustomerCards,
                customersLength: window.customers?.length || 0
            });
            
            if (hasCustomerData || hasCustomerCards || attempts >= maxAttempts) {
                console.log('✅ 顧客データ確認完了 - 統合機能を開始');
                this.addGoogleFormsFeatures();
                return;
            }
            
            setTimeout(checkData, 500);
        };
        
        checkData();
    },
    
    // Google Forms機能を追加
    addGoogleFormsFeatures: function() {
        try {
            console.log('🛠️ Google Forms機能追加開始...');
            
            // 1. 顧客カードを検索（複数のセレクターを試行）
            const customerCards = this.findCustomerCards();
            console.log('🔍 発見された顧客カード:', customerCards.length, '個');
            
            if (customerCards.length === 0) {
                console.warn('⚠️ 顧客カードが見つかりません - 手動追加を試行');
                this.addGoogleFormsSection();
                return;
            }
            
            // 2. 各顧客カードにボタンを追加
            customerCards.forEach((card, index) => {
                this.addButtonsToCard(card, index);
            });
            
            // 3. Google Formsセクションも追加
            this.addGoogleFormsSection();
            
            console.log('✅ Google Forms機能追加完了');
            
        } catch (error) {
            console.error('❌ Google Forms機能追加エラー:', error);
        }
    },
    
    // 顧客カードを検索（複数の方法を試行）
    findCustomerCards: function() {
        const selectors = [
            '.customer-card',
            '.customer-item',
            '[data-customer-id]',
            '.card[data-customer-id]',
            '.customer',
            '[class*="customer"]',
            '.card'
        ];
        
        let cards = [];
        
        for (const selector of selectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                console.log(`✅ セレクター "${selector}" で ${found.length} 個発見`);
                cards = Array.from(found);
                break;
            }
        }
        
        // 顧客データがある場合は、データに基づいてカードを特定
        if (cards.length === 0 && window.customers && window.customers.length > 0) {
            console.log('🔍 顧客データから要素を検索中...');
            
            window.customers.forEach((customer, index) => {
                // IDでの検索
                let element = document.querySelector(`[data-customer-id="${customer.id}"]`);
                if (!element) {
                    // インデックスでの検索
                    element = document.querySelector(`.customer-item:nth-child(${index + 1})`);
                }
                if (element && !cards.includes(element)) {
                    cards.push(element);
                }
            });
        }
        
        return cards;
    },
    
    // 個別の顧客カードにボタンを追加
    addButtonsToCard: function(card, index) {
        try {
            console.log(`🔧 カード ${index + 1} にボタン追加中...`);
            
            // 顧客IDを取得（複数の方法を試行）
            let customerId = card.dataset.customerId;
            if (!customerId && window.customers && window.customers[index]) {
                customerId = window.customers[index].id;
                card.dataset.customerId = customerId; // 後で使用するために設定
            }
            
            // 既存のGoogle Formsボタンがある場合は削除
            const existingBtns = card.querySelectorAll('.google-forms-btn-v2');
            existingBtns.forEach(btn => btn.remove());
            
            // ボタンコンテナを作成または取得
            let buttonContainer = card.querySelector('.google-forms-container');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'google-forms-container';
                buttonContainer.style.cssText = 'margin-top: 10px; padding: 10px; border-top: 1px solid #e5e7eb;';
                card.appendChild(buttonContainer);
            }
            
            // Google認証状態をチェック
            const canUseGoogleForms = window.IntegratedAuthManagerV2 && 
                                    window.IntegratedAuthManagerV2.canUseGoogleForms();
            
            if (!canUseGoogleForms) {
                // Google認証が必要な場合
                buttonContainer.innerHTML = `
                    <div style="text-align: center; color: #6b7280; font-size: 0.9rem;">
                        <p>🔑 Google Forms機能</p>
                        <button class="btn btn-outline btn-sm google-forms-btn-v2" onclick="window.CustomerGoogleFormsIntegrationV2.showGoogleAuthPrompt()">
                            Google連携が必要
                        </button>
                    </div>
                `;
                return;
            }
            
            // 顧客データを取得
            const customer = this.getCustomerData(customerId, index);
            
            if (customer && customer.googleForm) {
                // 既存フォーム用のボタン
                buttonContainer.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 8px; color: #10b981; font-size: 0.9rem;">
                            ✅ 専用フォーム作成済み
                        </div>
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button class="btn btn-success btn-sm google-forms-btn-v2" onclick="window.CustomerGoogleFormsIntegrationV2.showFormURL('${customer.id}', ${index})">
                                🔗 フォーム確認
                            </button>
                            <button class="btn btn-info btn-sm google-forms-btn-v2" onclick="window.CustomerGoogleFormsIntegrationV2.viewFormResponses('${customer.id}', ${index})">
                                📊 回答確認
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // フォーム作成用のボタン
                buttonContainer.innerHTML = `
                    <div style="text-align: center;">
                        <button class="btn btn-primary btn-sm google-forms-btn-v2" onclick="window.CustomerGoogleFormsIntegrationV2.createCustomerForm('${customerId}', ${index})">
                            📝 専用フォーム作成
                        </button>
                    </div>
                `;
            }
            
            console.log(`✅ カード ${index + 1} にボタン追加完了`);
            
        } catch (error) {
            console.error(`❌ カード ${index + 1} ボタン追加エラー:`, error);
        }
    },
    
    // Google Formsセクションを追加（ページ上部に）
    addGoogleFormsSection: function() {
        try {
            // 既存のGoogle Formsセクションがある場合は削除
            const existingSection = document.querySelector('#google-forms-section');
            if (existingSection) existingSection.remove();
            
            // Google認証状態をチェック
            const authState = window.IntegratedAuthManagerV2 ? 
                            window.IntegratedAuthManagerV2.getAuthState() : null;
            
            let sectionHTML = '';
            
            if (!authState || !authState.googleAuth.isSignedIn) {
                // Google認証が必要
                sectionHTML = `
                    <div id="google-forms-section" class="google-forms-section" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                        <h3 style="margin: 0 0 1rem 0;">📝 Google Forms連携</h3>
                        <p style="margin: 0 0 1rem 0; opacity: 0.9;">
                            顧客専用の物件希望調査フォームを自動作成できます
                        </p>
                        <button onclick="window.location.href='login-google-v2.html'" class="btn" style="background: white; color: #1e40af; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600;">
                            🔑 Google認証してフォーム機能を利用
                        </button>
                    </div>
                `;
            } else {
                // Google認証済み
                sectionHTML = `
                    <div id="google-forms-section" class="google-forms-section" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                        <h3 style="margin: 0 0 0.5rem 0;">✅ Google Forms連携済み</h3>
                        <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                            ログイン中: ${authState.googleAuth.user?.email} | 各顧客カードから専用フォームを作成できます
                        </p>
                    </div>
                `;
            }
            
            // セクションを挿入
            const mainContent = document.querySelector('main, .main-content, .container, body');
            if (mainContent) {
                const firstChild = mainContent.firstElementChild;
                if (firstChild) {
                    firstChild.insertAdjacentHTML('beforebegin', sectionHTML);
                } else {
                    mainContent.insertAdjacentHTML('afterbegin', sectionHTML);
                }
            } else {
                document.body.insertAdjacentHTML('afterbegin', sectionHTML);
            }
            
            console.log('✅ Google Formsセクション追加完了');
            
        } catch (error) {
            console.error('❌ Google Formsセクション追加エラー:', error);
        }
    },
    
    // 顧客データを取得
    getCustomerData: function(customerId, index) {
        // IDで検索
        if (customerId && window.customers) {
            const customer = window.customers.find(c => c.id === customerId);
            if (customer) return customer;
        }
        
        // インデックスで検索
        if (typeof index === 'number' && window.customers && window.customers[index]) {
            return window.customers[index];
        }
        
        return null;
    },
    
    // 顧客専用フォームを作成
    createCustomerForm: async function(customerId, index) {
        try {
            console.log('📝 顧客専用フォーム作成開始:', customerId, index);
            
            // 顧客データを取得
            const customer = this.getCustomerData(customerId, index);
            if (!customer) {
                throw new Error('顧客データが見つかりません');
            }
            
            // プログレス表示
            this.showProgress(`${customer.name}様専用フォーム作成中...`);
            
            // Google Forms API でフォーム作成
            const result = await window.GoogleFormsAPIv2.createCustomerForm(customer);
            
            if (result.success) {
                console.log('✅ フォーム作成成功:', result.form.id);
                
                // 成功メッセージ
                alert(`✅ フォーム作成完了\n\n${customer.name}様専用のフォームが作成されました！\n\nフォームURL:\n${result.form.url}`);
                
                // 画面を更新
                setTimeout(() => {
                    this.addGoogleFormsFeatures();
                }, 1000);
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            alert(`❌ フォーム作成エラー\n\n${error.message}`);
        } finally {
            this.hideProgress();
        }
    },
    
    // フォームURLを表示
    showFormURL: function(customerId, index) {
        try {
            const customer = this.getCustomerData(customerId, index);
            if (!customer || !customer.googleForm) {
                alert('❌ フォーム情報が見つかりません');
                return;
            }
            
            const form = customer.googleForm;
            const message = `📝 ${customer.name}様専用フォーム\n\n` +
                          `顧客用URL:\n${form.url}\n\n` +
                          `管理用URL:\n${form.editUrl}\n\n` +
                          `回答確認URL:\n${form.responsesUrl}`;
            
            alert(message);
            
            // クリップボードにコピー
            if (navigator.clipboard) {
                navigator.clipboard.writeText(form.url).then(() => {
                    console.log('✅ フォームURLをクリップボードにコピー');
                });
            }
            
        } catch (error) {
            console.error('❌ フォームURL表示エラー:', error);
            alert(`❌ エラー\n${error.message}`);
        }
    },
    
    // フォーム回答を表示
    viewFormResponses: async function(customerId, index) {
        try {
            const customer = this.getCustomerData(customerId, index);
            if (!customer || !customer.googleForm) {
                alert('❌ フォーム情報が見つかりません');
                return;
            }
            
            this.showProgress('フォーム回答取得中...');
            
            const result = await window.GoogleFormsAPIv2.getFormResponses(customer.googleForm.id);
            
            if (result.success) {
                const message = `📊 ${customer.name}様のフォーム回答\n\n` +
                              `回答数: ${result.count}件\n\n` +
                              `詳細は Google Forms で確認してください:\n${customer.googleForm.responsesUrl}`;
                alert(message);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ フォーム回答確認エラー:', error);
            alert(`❌ エラー\n${error.message}`);
        } finally {
            this.hideProgress();
        }
    },
    
    // Google認証プロンプト
    showGoogleAuthPrompt: function() {
        const message = 'Google Forms機能を使用するには、Googleアカウントでのログインが必要です。';
        if (confirm(`${message}\n\nログインページに移動しますか？`)) {
            window.location.href = 'login-google-v2.html';
        }
    },
    
    // UI ユーティリティ
    showProgress: function(message) {
        console.log(`⏳ ${message}`);
        // 実際のプログレス表示は省略（alertで代用）
    },
    
    hideProgress: function() {
        console.log('✅ プログレス終了');
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', function() {
    // 顧客管理ページでのみ実行
    if (window.location.pathname.includes('customer.html')) {
        console.log('📄 顧客管理ページ検出 - Google Forms統合機能を開始');
        setTimeout(() => {
            window.CustomerGoogleFormsIntegrationV2.initialize();
        }, 1000);
    }
});

console.log('✅ 顧客管理画面 Google Forms統合機能 v2 準備完了');
