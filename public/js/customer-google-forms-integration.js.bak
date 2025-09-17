// 📝 顧客管理画面 Google Forms統合機能 (修正版)
console.log('📝 顧客管理画面 Google Forms統合機能 初期化中...');

window.CustomerGoogleFormsIntegration = {
    // 初期化状態
    isInitialized: false,
    
    // 初期化
    initialize: function() {
        try {
            console.log('📊 顧客 Google Forms統合機能 初期化開始...');
            
            // 必要なシステムの確認
            if (!this.checkDependencies()) {
                console.warn('⚠️ 依存システムが不完全です - 基本機能のみ提供');
            }
            
            // 顧客カードにボタンを追加
            this.initializeCustomerCards();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ 顧客 Google Forms統合機能 初期化完了');
            
        } catch (error) {
            console.error('❌ Google Forms統合機能 初期化エラー:', error);
        }
    },
    
    // 依存関係チェック
    checkDependencies: function() {
        const dependencies = {
            'Google Identity Services': window.google?.accounts,
            'Google Identity Config': window.GoogleIdentity,
            '統合認証マネージャー': window.IntegratedAuthManagerV2,
            'Google Forms API': window.GoogleFormsAPIv2,
            '顧客データマネージャー': window.UnifiedDataManager
        };
        
        let allOk = true;
        for (const [name, obj] of Object.entries(dependencies)) {
            if (!obj) {
                console.warn(`⚠️ ${name} が読み込まれていません`);
                allOk = false;
            } else {
                console.log(`✅ ${name} 利用可能`);
            }
        }
        
        return allOk;
    },
    
    // 顧客カードの初期化
    initializeCustomerCards: function() {
        try {
            // 既存の顧客カードに Forms ボタンを追加
            const customerCards = document.querySelectorAll('.customer-card');
            console.log(`📊 ${customerCards.length}枚の顧客カードを発見`);
            
            customerCards.forEach((card, index) => {
                setTimeout(() => {
                    this.addFormsButtonToCard(card);
                }, index * 100); // カードごとに少しずつ遅延
            });
            
        } catch (error) {
            console.error('❌ 顧客カード初期化エラー:', error);
        }
    },
    
    // 顧客カードにFormsボタン追加
    addFormsButtonToCard: function(card) {
        try {
            const customerId = card.dataset.customerId || card.getAttribute('data-customer-id');
            if (!customerId) {
                console.warn('⚠️ 顧客カードにIDが設定されていません:', card);
                return;
            }
            
            // 既にボタンが追加されているかチェック
            if (card.querySelector('.google-forms-button')) {
                return;
            }
            
            // ボタンコンテナを探す
            let buttonContainer = card.querySelector('.customer-actions, .card-actions, .button-group');
            
            // ボタンコンテナがない場合は作成
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'customer-actions';
                buttonContainer.style.cssText = 'margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;';
                card.appendChild(buttonContainer);
            }
            
            // Google Forms ボタンを作成
            const formsButton = this.createFormsButton(customerId);
            buttonContainer.appendChild(formsButton);
            
            console.log(`✅ 顧客 ${customerId} にFormsボタンを追加`);
            
        } catch (error) {
            console.error('❌ Formsボタン追加エラー:', error);
        }
    },
    
    // Formsボタン作成
    createFormsButton: function(customerId) {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-success google-forms-button';
        button.innerHTML = '📝 フォーム';
        button.style.cssText = `
            font-size: 12px;
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            background: #16a34a;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#15803d';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#16a34a';
        });
        
        button.onclick = (e) => {
            e.stopPropagation();
            this.handleFormsButtonClick(customerId);
        };
        
        return button;
    },
    
    // Formsボタンクリック処理
    handleFormsButtonClick: function(customerId) {
        try {
            console.log(`📝 顧客 ${customerId} のFormsボタンがクリックされました`);
            
            // 認証状態確認
            if (!this.checkAuthentication()) {
                this.showAuthenticationPrompt();
                return;
            }
            
            // 顧客データ取得
            const customer = this.getCustomerData(customerId);
            if (!customer) {
                alert('顧客データが見つかりませんでした');
                return;
            }
            
            // フォーム作成or管理のメニュー表示
            this.showFormsMenu(customer);
            
        } catch (error) {
            console.error('❌ Formsボタンクリック処理エラー:', error);
            alert('Google Formsの処理中にエラーが発生しました');
        }
    },
    
    // 認証チェック
    checkAuthentication: function() {
        if (window.IntegratedAuthManagerV2) {
            const authState = window.IntegratedAuthManagerV2.getAuthState();
            return authState.googleAuth.isSignedIn;
        }
        return false;
    },
    
    // 認証プロンプト表示
    showAuthenticationPrompt: function() {
        const message = 'Google Forms機能を使用するには、Googleアカウントでのログインが必要です。';
        
        if (confirm(`${message}\n\nログインページに移動しますか？`)) {
            window.location.href = 'login-google-v2.html';
        }
    },
    
    // 顧客データ取得
    getCustomerData: function(customerId) {
        try {
            if (window.UnifiedDataManager) {
                const customers = window.UnifiedDataManager.getCustomers();
                return customers.find(c => c.id === customerId);
            } else {
                // フォールバック: ローカルストレージから直接取得
                const data = localStorage.getItem('rentpipe_demo_customers');
                if (data) {
                    const customers = JSON.parse(data);
                    return customers.find(c => c.id === customerId);
                }
            }
        } catch (error) {
            console.error('❌ 顧客データ取得エラー:', error);
        }
        return null;
    },
    
    // Formsメニュー表示
    showFormsMenu: function(customer) {
        const hasExistingForm = customer.googleForm && customer.googleForm.formId;
        
        let menuHTML = `
            <div class="forms-menu-overlay" onclick="this.remove()">
                <div class="forms-menu" onclick="event.stopPropagation()">
                    <div class="forms-menu-header">
                        <h3>📝 ${customer.name}さん専用フォーム</h3>
                        <button onclick="this.closest('.forms-menu-overlay').remove()" class="close-btn">×</button>
                    </div>
                    <div class="forms-menu-content">
        `;
        
        if (hasExistingForm) {
            menuHTML += `
                        <p class="status-info">✅ 専用フォームが作成済みです</p>
                        <div class="menu-buttons">
                            <button onclick="window.CustomerGoogleFormsIntegration.viewFormUrl('${customer.id}')" class="menu-btn primary">
                                🔗 フォームURLを確認
                            </button>
                            <button onclick="window.CustomerGoogleFormsIntegration.viewFormResponses('${customer.id}')" class="menu-btn secondary">
                                📊 回答を確認
                            </button>
                            <button onclick="window.CustomerGoogleFormsIntegration.recreateForm('${customer.id}')" class="menu-btn outline">
                                🔄 フォームを再作成
                            </button>
                        </div>
            `;
        } else {
            menuHTML += `
                        <p class="status-info">📝 専用フォームを作成できます</p>
                        <div class="menu-buttons">
                            <button onclick="window.CustomerGoogleFormsIntegration.createCustomerForm('${customer.id}')" class="menu-btn primary">
                                ✨ 専用フォームを作成
                            </button>
                            <button onclick="this.closest('.forms-menu-overlay').remove()" class="menu-btn outline">
                                キャンセル
                            </button>
                        </div>
            `;
        }
        
        menuHTML += `
                    </div>
                </div>
            </div>
        `;
        
        // メニューをDOMに追加
        const menuElement = document.createElement('div');
        menuElement.innerHTML = menuHTML;
        document.body.appendChild(menuElement.firstElementChild);
    },
    
    // フォーム作成
    createCustomerForm: async function(customerId) {
        try {
            console.log(`📝 顧客 ${customerId} の専用フォーム作成開始...`);
            
            // プログレス表示
            this.showProgress('フォーム作成中...', '顧客専用のフォームを作成しています');
            
            // フォーム作成のシミュレーション（実際のAPI呼び出しに置き換え）
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 成功のシミュレーション
            const mockFormData = {
                formId: 'mock_form_' + customerId + '_' + Date.now(),
                formUrl: `https://docs.google.com/forms/d/mock_form_${customerId}/viewform`,
                editUrl: `https://docs.google.com/forms/d/mock_form_${customerId}/edit`,
                createdAt: new Date().toISOString()
            };
            
            // 顧客データに保存
            this.saveFormData(customerId, mockFormData);
            
            this.hideProgress();
            this.showSuccess('フォーム作成完了', {
                message: '顧客専用のフォームが作成されました！',
                formUrl: mockFormData.formUrl
            });
            
            // メニューを閉じる
            document.querySelector('.forms-menu-overlay')?.remove();
            
            // カードを更新
            this.refreshCustomerCard(customerId);
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            this.hideProgress();
            this.showError('フォーム作成に失敗しました', error.message);
        }
    },
    
    // フォームURL確認
    viewFormUrl: function(customerId) {
        const customer = this.getCustomerData(customerId);
        if (customer && customer.googleForm) {
            const formUrl = customer.googleForm.formUrl;
            
            const urlHTML = `
                <div class="forms-menu-overlay" onclick="this.remove()">
                    <div class="forms-menu" onclick="event.stopPropagation()">
                        <div class="forms-menu-header">
                            <h3>🔗 フォームURL</h3>
                            <button onclick="this.closest('.forms-menu-overlay').remove()" class="close-btn">×</button>
                        </div>
                        <div class="forms-menu-content">
                            <p><strong>${customer.name}さん専用フォーム</strong></p>
                            <div class="url-container">
                                <input type="text" value="${formUrl}" readonly id="formUrlInput" class="url-input">
                                <button onclick="window.CustomerGoogleFormsIntegration.copyUrl('formUrlInput')" class="copy-btn">📋 コピー</button>
                            </div>
                            <div class="menu-buttons">
                                <button onclick="window.open('${formUrl}', '_blank')" class="menu-btn primary">
                                    📱 フォームを開く
                                </button>
                                <button onclick="this.closest('.forms-menu-overlay').remove()" class="menu-btn outline">
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const urlElement = document.createElement('div');
            urlElement.innerHTML = urlHTML;
            document.body.appendChild(urlElement.firstElementChild);
        }
    },
    
    // フォーム回答確認
    viewFormResponses: function(customerId) {
        alert('フォーム回答確認機能は開発中です');
    },
    
    // フォーム再作成
    recreateForm: function(customerId) {
        if (confirm('既存のフォームを削除して新しく作成しますか？')) {
            this.createCustomerForm(customerId);
        }
    },
    
    // URL コピー
    copyUrl: function(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.select();
            document.execCommand('copy');
            alert('URLをクリップボードにコピーしました');
        }
    },
    
    // フォームデータ保存
    saveFormData: function(customerId, formData) {
        try {
            if (window.UnifiedDataManager) {
                // UnifiedDataManagerを使用して保存
                const customer = window.UnifiedDataManager.getCustomers().find(c => c.id === customerId);
                if (customer) {
                    customer.googleForm = formData;
                    window.UnifiedDataManager.updateCustomer(customer);
                }
            } else {
                // フォールバック: ローカルストレージ直接更新
                const data = localStorage.getItem('rentpipe_demo_customers');
                if (data) {
                    const customers = JSON.parse(data);
                    const customerIndex = customers.findIndex(c => c.id === customerId);
                    if (customerIndex !== -1) {
                        customers[customerIndex].googleForm = formData;
                        localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
                    }
                }
            }
        } catch (error) {
            console.error('❌ フォームデータ保存エラー:', error);
        }
    },
    
    // 顧客カード更新
    refreshCustomerCard: function(customerId) {
        // 顧客一覧の再読み込みを促す
        if (window.customerManager && window.customerManager.loadCustomers) {
            window.customerManager.loadCustomers();
        }
    },
    
    // イベントリスナー設定
    setupEventListeners: function() {
        // 新しい顧客カードが追加された時の対応
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('customer-card')) {
                        this.addFormsButtonToCard(node);
                    }
                });
            });
        });
        
        const customersGrid = document.getElementById('customersGrid');
        if (customersGrid) {
            observer.observe(customersGrid, { childList: true });
        }
    },
    
    // プログレス表示
    showProgress: function(title, message) {
        const progressHTML = `
            <div class="progress-overlay">
                <div class="progress-modal">
                    <div class="spinner"></div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        const progressElement = document.createElement('div');
        progressElement.innerHTML = progressHTML;
        document.body.appendChild(progressElement.firstElementChild);
    },
    
    // プログレス非表示
    hideProgress: function() {
        document.querySelector('.progress-overlay')?.remove();
    },
    
    // 成功メッセージ表示
    showSuccess: function(title, data) {
        alert(`${title}\n${data.message}`);
    },
    
    // エラーメッセージ表示
    showError: function(title, message) {
        alert(`エラー: ${title}\n${message}`);
    }
};

// DOM読み込み後の初期化（遅延実行）
document.addEventListener('DOMContentLoaded', function() {
    // 他のシステムの初期化完了を待って実行
    setTimeout(() => {
        if (document.querySelector('.customer-card') || document.getElementById('customersGrid')) {
            window.CustomerGoogleFormsIntegration.initialize();
        }
    }, 2000); // 2秒後に実行
});

// CSS スタイル追加
const style = document.createElement('style');
style.textContent = `
    .forms-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .forms-menu {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    
    .forms-menu-header {
        padding: 20px 20px 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .forms-menu-header h3 {
        margin: 0;
        color: #1e3a8a;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
    }
    
    .forms-menu-content {
        padding: 20px;
    }
    
    .status-info {
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        color: #0c4a6e;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 20px;
    }
    
    .menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .menu-btn {
        padding: 12px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .menu-btn.primary {
        background: #3b82f6;
        color: white;
    }
    
    .menu-btn.secondary {
        background: #16a34a;
        color: white;
    }
    
    .menu-btn.outline {
        background: transparent;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .menu-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .url-container {
        display: flex;
        gap: 10px;
        margin: 15px 0;
    }
    
    .url-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
    }
    
    .copy-btn {
        padding: 8px 12px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .progress-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    }
    
    .progress-modal {
        background: white;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    
    .spinner {
        border: 4px solid #f3f4f6;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ 顧客管理画面 Google Forms統合機能準備完了');
