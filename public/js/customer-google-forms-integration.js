// 🔗 顧客管理画面 Google Forms統合機能
console.log('🔗 顧客管理画面 Google Forms統合機能初期化中...');

window.CustomerGoogleFormsIntegration = {
    // 初期化
    initialize: function() {
        try {
            console.log('🔗 Google Forms統合機能初期化開始...');
            
            // 既存の顧客管理画面に機能を追加
            this.addGoogleFormsButtons();
            this.updateCustomerCards();
            
            console.log('✅ Google Forms統合機能初期化完了');
            
        } catch (error) {
            console.error('❌ Google Forms統合機能初期化エラー:', error);
        }
    },
    
    // Google Formsボタンを追加
    addGoogleFormsButtons: function() {
        try {
            // 顧客一覧にGoogle Forms関連のボタンを追加
            const customerCards = document.querySelectorAll('.customer-card');
            
            customerCards.forEach(card => {
                const customerId = card.dataset.customerId;
                if (!customerId) return;
                
                // 既存のボタングループを取得
                let buttonGroup = card.querySelector('.card-actions');
                if (!buttonGroup) {
                    buttonGroup = document.createElement('div');
                    buttonGroup.className = 'card-actions';
                    card.appendChild(buttonGroup);
                }
                
                // Google Formsボタンを追加
                this.addFormButtons(buttonGroup, customerId);
            });
            
        } catch (error) {
            console.error('❌ Google Formsボタン追加エラー:', error);
        }
    },
    
    // フォーム関連ボタンを追加
    addFormButtons: function(container, customerId) {
        try {
            // 既存のGoogle Formsボタンがある場合は削除
            const existingButtons = container.querySelectorAll('.google-forms-btn');
            existingButtons.forEach(btn => btn.remove());
            
            // 顧客データを取得
            const customer = this.getCustomerData(customerId);
            if (!customer) return;
            
            // Google認証状態をチェック
            const canUseGoogleForms = window.IntegratedAuthManagerV2 && 
                                    window.IntegratedAuthManagerV2.canUseGoogleForms();
            
            if (!canUseGoogleForms) {
                // Google認証が必要な場合
                const authBtn = document.createElement('button');
                authBtn.className = 'btn btn-outline btn-sm google-forms-btn';
                authBtn.innerHTML = '🔑 Google連携が必要';
                authBtn.onclick = () => this.showGoogleAuthPrompt();
                container.appendChild(authBtn);
                return;
            }
            
            // フォーム状態に応じてボタンを表示
            if (customer.googleForm) {
                this.addExistingFormButtons(container, customer);
            } else {
                this.addCreateFormButton(container, customerId);
            }
            
        } catch (error) {
            console.error('❌ フォームボタン追加エラー:', error);
        }
    },
    
    // フォーム作成ボタンを追加
    addCreateFormButton: function(container, customerId) {
        const createBtn = document.createElement('button');
        createBtn.className = 'btn btn-primary btn-sm google-forms-btn';
        createBtn.innerHTML = '📝 専用フォーム作成';
        createBtn.onclick = () => this.createCustomerForm(customerId);
        container.appendChild(createBtn);
    },
    
    // 既存フォーム用ボタンを追加
    addExistingFormButtons: function(container, customer) {
        const form = customer.googleForm;
        
        // フォーム状態インジケーター
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'form-status-indicator';
        statusIndicator.innerHTML = this.getFormStatusHTML(form.status);
        container.appendChild(statusIndicator);
        
        // フォームURLボタン
        const urlBtn = document.createElement('button');
        urlBtn.className = 'btn btn-success btn-sm google-forms-btn';
        urlBtn.innerHTML = '🔗 フォームURL';
        urlBtn.onclick = () => this.showFormURL(customer);
        container.appendChild(urlBtn);
        
        // 回答確認ボタン（回答がある場合）
        if (form.responseCount > 0) {
            const responseBtn = document.createElement('button');
            responseBtn.className = 'btn btn-info btn-sm google-forms-btn';
            responseBtn.innerHTML = `📊 回答確認 (${form.responseCount})`;
            responseBtn.onclick = () => this.viewFormResponses(customer);
            container.appendChild(responseBtn);
        }
    },
    
    // 顧客専用フォームを作成
    createCustomerForm: async function(customerId) {
        try {
            console.log('📝 顧客専用フォーム作成開始:', customerId);
            
            // 顧客データを取得
            const customer = this.getCustomerData(customerId);
            if (!customer) {
                throw new Error('顧客データが見つかりません');
            }
            
            // 作成中表示
            this.showProgress('フォーム作成中...', `${customer.name}様専用のフォームを作成しています`);
            
            // Google Forms API でフォーム作成
            const result = await window.GoogleFormsAPIv2.createCustomerForm(customer);
            
            if (result.success) {
                console.log('✅ フォーム作成成功:', result.form.id);
                
                // 成功メッセージを表示
                this.showSuccess('フォーム作成完了', {
                    message: `${customer.name}様専用のフォームが作成されました`,
                    form: result.form
                });
                
                // 画面を更新
                this.refreshCustomerDisplay(customerId);
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ フォーム作成エラー:', error);
            this.showError('フォーム作成エラー', error.message);
        } finally {
            this.hideProgress();
        }
    },
    
    // フォームURLを表示
    showFormURL: function(customer) {
        try {
            const form = customer.googleForm;
            if (!form) return;
            
            // モーダルでフォーム情報を表示
            const modalContent = `
                <div class="form-url-modal">
                    <h3>📝 ${customer.name}様専用フォーム</h3>
                    
                    <div class="form-info">
                        <div class="info-item">
                            <label>顧客用フォームURL:</label>
                            <div class="url-container">
                                <input type="text" id="form-url" value="${form.url}" readonly>
                                <button onclick="copyToClipboard('form-url')" class="btn btn-sm btn-outline">📋 コピー</button>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <label>フォーム管理URL:</label>
                            <div class="url-container">
                                <input type="text" id="edit-url" value="${form.editUrl}" readonly>
                                <button onclick="copyToClipboard('edit-url')" class="btn btn-sm btn-outline">📋 コピー</button>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <label>回答確認URL:</label>
                            <div class="url-container">
                                <input type="text" id="responses-url" value="${form.responsesUrl}" readonly>
                                <button onclick="copyToClipboard('responses-url')" class="btn btn-sm btn-outline">📋 コピー</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="qr-code-section">
                        <h4>📱 QRコード</h4>
                        <div id="qr-code"></div>
                        <p class="qr-help">スマートフォンでの回答に便利です</p>
                    </div>
                    
                    <div class="form-actions">
                        <button onclick="window.open('${form.url}', '_blank')" class="btn btn-primary">
                            📝 フォームをプレビュー
                        </button>
                        <button onclick="this.sendFormToCustomer('${customer.id}')" class="btn btn-success">
                            📧 顧客にフォームを送信
                        </button>
                    </div>
                </div>
            `;
            
            this.showModal('フォーム情報', modalContent);
            
            // QRコードを生成
            this.generateQRCode('qr-code', form.url);
            
        } catch (error) {
            console.error('❌ フォームURL表示エラー:', error);
            this.showError('表示エラー', 'フォーム情報の表示に失敗しました');
        }
    },
    
    // フォーム回答を表示
    viewFormResponses: async function(customer) {
        try {
            const form = customer.googleForm;
            if (!form) return;
            
            // 回答データ取得中表示
            this.showProgress('回答データ取得中...', 'Google Formsから最新の回答データを取得しています');
            
            // Google Forms API で回答を取得
            const result = await window.GoogleFormsAPIv2.getFormResponses(form.id);
            
            if (result.success) {
                // 回答データを表示
                this.displayFormResponses(customer, result.responses);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ フォーム回答表示エラー:', error);
            this.showError('回答取得エラー', error.message);
        } finally {
            this.hideProgress();
        }
    },
    
    // ユーティリティ関数
    getCustomerData: function(customerId) {
        // 既存の顧客管理システムからデータを取得
        if (window.customers && Array.isArray(window.customers)) {
            return window.customers.find(c => c.id === customerId);
        }
        
        // FirebaseDataManager から取得を試行
        if (window.FirebaseDataManager && window.FirebaseDataManager.getCustomers) {
            const customers = window.FirebaseDataManager.getCustomers();
            return customers.find(c => c.id === customerId);
        }
        
        return null;
    },
    
    getFormStatusHTML: function(status) {
        const statusConfig = {
            'created': { color: '#3b82f6', text: '作成済み', icon: '📝' },
            'sent': { color: '#f59e0b', text: '送信済み', icon: '📧' },
            'responded': { color: '#10b981', text: '回答済み', icon: '✅' },
            'updated': { color: '#10b981', text: '更新済み', icon: '🔄' }
        };
        
        const config = statusConfig[status] || statusConfig['created'];
        
        return `
            <span class="status-badge" style="background: ${config.color}20; color: ${config.color}; border: 1px solid ${config.color}40;">
                ${config.icon} ${config.text}
            </span>
        `;
    },
    
    refreshCustomerDisplay: function(customerId) {
        // 顧客表示を再読み込み
        if (window.loadCustomers && typeof window.loadCustomers === 'function') {
            window.loadCustomers();
        }
        
        // または特定の顧客カードのみ更新
        this.updateCustomerCard(customerId);
    },
    
    updateCustomerCard: function(customerId) {
        const card = document.querySelector(`[data-customer-id="${customerId}"]`);
        if (card) {
            // カード内のボタンを更新
            const buttonGroup = card.querySelector('.card-actions');
            if (buttonGroup) {
                this.addFormButtons(buttonGroup, customerId);
            }
        }
    },
    
    updateCustomerCards: function() {
        // 全顧客カードを更新
        const customerCards = document.querySelectorAll('.customer-card');
        customerCards.forEach(card => {
            const customerId = card.dataset.customerId;
            if (customerId) {
                this.updateCustomerCard(customerId);
            }
        });
    },
    
    // UI関連のユーティリティ
    showProgress: function(title, message) {
        // プログレス表示の実装
        console.log(`⏳ ${title}: ${message}`);
    },
    
    hideProgress: function() {
        // プログレス非表示の実装
        console.log('✅ プログレス完了');
    },
    
    showSuccess: function(title, data) {
        console.log(`✅ ${title}:`, data);
        alert(`${title}\n${data.message}`);
    },
    
    showError: function(title, message) {
        console.error(`❌ ${title}: ${message}`);
        alert(`エラー: ${title}\n${message}`);
    },
    
    showModal: function(title, content) {
        console.log(`📱 モーダル表示: ${title}`);
        // 実際のモーダル実装は既存のシステムに合わせて調整
        alert(`${title}\n${content.replace(/<[^>]*>/g, '')}`);
    },
    
    showGoogleAuthPrompt: function() {
        const message = 'Google Forms機能を使用するには、Googleアカウントでログインが必要です。';
        if (confirm(`${message}\n\nログインしますか？`)) {
            window.location.href = 'login-google-v2.html';
        }
    },
    
    generateQRCode: function(elementId, url) {
        // QRコード生成の実装（ライブラリを使用）
        console.log(`📱 QRコード生成: ${url}`);
        
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<p>QRコード: ${url}</p>`;
        }
    }
};

// グローバル関数
window.copyToClipboard = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('クリップボードにコピーしました');
    }
};

// 顧客管理画面読み込み時に自動初期化
document.addEventListener('DOMContentLoaded', function() {
    // 顧客管理画面でのみ実行
    if (window.location.pathname.includes('customer.html')) {
        setTimeout(() => {
            window.CustomerGoogleFormsIntegration.initialize();
        }, 1000); // 既存の顧客データ読み込み完了を待つ
    }
});

console.log('✅ 顧客管理画面 Google Forms統合機能準備完了');
