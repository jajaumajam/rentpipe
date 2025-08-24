// RentPipe 顧客フォーム機能（統一データ管理対応版・最終修正版）
class CustomerFormManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.dataManager = null;
        this.isEditMode = false;
        this.editCustomerId = null;
        
        this.init();
    }

    async init() {
        console.log('📝 顧客フォーム管理システム初期化中...');
        
        // 統一データ管理システムの準備を待つ
        await this.waitForDataManager();
        
        // URLパラメータをチェック（編集モード判定）
        this.checkEditMode();
        
        // プログレスバーを初期化
        this.updateProgress();
        
        console.log('✅ 統一対応顧客フォーム準備完了');
    }

    async waitForDataManager() {
        let attempts = 0;
        const maxAttempts = 10;
        
        return new Promise((resolve) => {
            const check = () => {
                attempts++;
                if (window.UnifiedDataManager) {
                    this.dataManager = window.UnifiedDataManager;
                    console.log('✅ 統一データ管理システム接続完了');
                    resolve();
                } else if (attempts < maxAttempts) {
                    console.log(`⏳ 統一データ管理システム待機中... (${attempts}/${maxAttempts})`);
                    setTimeout(check, 500);
                } else {
                    console.error('❌ 統一データ管理システムに接続できませんでした');
                    alert('システムエラーが発生しました。ページを再読み込みしてください。');
                    resolve();
                }
            };
            check();
        });
    }

    checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId) {
            this.isEditMode = true;
            this.editCustomerId = editId;
            this.loadCustomerForEdit(editId);
            
            // ページタイトルを更新
            const header = document.querySelector('.form-header h1');
            if (header) {
                header.textContent = '✏️ 顧客情報編集';
            }
            const description = document.querySelector('.form-header p');
            if (description) {
                description.textContent = '顧客情報を編集してください';
            }
        }
    }

    loadCustomerForEdit(customerId) {
        if (!this.dataManager) {
            console.error('❌ 統一データ管理システムが利用できません');
            return;
        }

        const customer = this.dataManager.getCustomerById(customerId);
        if (!customer) {
            alert('顧客情報が見つかりません。顧客管理画面に戻ります。');
            window.location.href = 'customer.html';
            return;
        }

        // フォームデータに設定
        this.formData = {
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            age: customer.age || '',
            occupation: customer.occupation || '',
            annualIncome: customer.annualIncome ? Math.round(customer.annualIncome / 10000) : '',
            budgetMin: customer.preferences?.budgetMin ? Math.round(customer.preferences.budgetMin / 10000) : '',
            budgetMax: customer.preferences?.budgetMax ? Math.round(customer.preferences.budgetMax / 10000) : '',
            areas: customer.preferences?.areas || [],
            roomType: customer.preferences?.roomType || '',
            requirements: customer.preferences?.requirements || [],
            notes: customer.notes || '',
            contactTime: customer.contactTime || '',
            urgency: customer.urgency || '中'
        };

        // フォームに値を設定
        setTimeout(() => {
            this.populateForm();
        }, 100);
    }

    populateForm() {
        console.log('📝 フォームに既存データを入力中...');
        
        // 基本情報の設定
        const fields = ['name', 'email', 'phone', 'age', 'occupation', 'annualIncome', 'notes', 'contactTime', 'urgency'];
        fields.forEach(field => {
            const element = document.querySelector(`[name="${field}"]`);
            if (element && this.formData[field]) {
                element.value = this.formData[field];
            }
        });

        // 予算の設定
        const budgetMinElement = document.querySelector('[name="budgetMin"]');
        const budgetMaxElement = document.querySelector('[name="budgetMax"]');
        if (budgetMinElement && this.formData.budgetMin) {
            budgetMinElement.value = this.formData.budgetMin;
        }
        if (budgetMaxElement && this.formData.budgetMax) {
            budgetMaxElement.value = this.formData.budgetMax;
        }

        // エリアの設定（チェックボックス）
        if (this.formData.areas && this.formData.areas.length > 0) {
            this.formData.areas.forEach(area => {
                const checkbox = document.querySelector(`[name="areas"][value="${area}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // 間取りの設定
        const roomTypeElement = document.querySelector('[name="roomType"]');
        if (roomTypeElement && this.formData.roomType) {
            roomTypeElement.value = this.formData.roomType;
        }

        // こだわり条件の設定（チェックボックス）
        if (this.formData.requirements && this.formData.requirements.length > 0) {
            this.formData.requirements.forEach(requirement => {
                const checkbox = document.querySelector(`[name="requirements"][value="${requirement}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    updateProgress() {
        console.log(`📊 プログレス更新: ステップ ${this.currentStep}/${this.totalSteps}`);
        
        // プログレスバーの更新
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepCircle = document.querySelector(`.step-circle[data-step="${i}"]`);
            
            if (stepCircle) {
                stepCircle.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    stepCircle.classList.add('active');
                } else if (i < this.currentStep) {
                    stepCircle.classList.add('completed');
                }
            }
        }

        // フォームセクションの表示切り替え
        document.querySelectorAll('.form-section').forEach((section, index) => {
            section.classList.remove('active');
            if (index + 1 === this.currentStep) {
                section.classList.add('active');
            }
        });

        // ボタンの表示制御
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');
        const submitBtn = document.querySelector('.btn-submit');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
        }

        if (nextBtn && submitBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
                submitBtn.textContent = this.isEditMode ? '✅ 更新する' : '✅ 登録する';
            } else {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            }
        }
    }

    validateStep(step) {
        console.log(`🔍 ステップ${step}のバリデーション開始`);
        
        switch (step) {
            case 1:
                const name = document.querySelector('[name="name"]')?.value?.trim();
                const email = document.querySelector('[name="email"]')?.value?.trim();
                const phone = document.querySelector('[name="phone"]')?.value?.trim();
                
                if (!name) {
                    alert('お名前を入力してください。');
                    console.log('❌ バリデーションエラー: 名前未入力');
                    return false;
                }
                if (!email) {
                    alert('メールアドレスを入力してください。');
                    console.log('❌ バリデーションエラー: メール未入力');
                    return false;
                }
                if (!phone) {
                    alert('電話番号を入力してください。');
                    console.log('❌ バリデーションエラー: 電話番号未入力');
                    return false;
                }
                break;
            case 2:
                const budgetMin = document.querySelector('[name="budgetMin"]')?.value;
                const budgetMax = document.querySelector('[name="budgetMax"]')?.value;
                
                if (!budgetMin || !budgetMax) {
                    alert('予算の下限と上限を入力してください。');
                    console.log('❌ バリデーションエラー: 予算未入力');
                    return false;
                }
                
                if (parseInt(budgetMin) > parseInt(budgetMax)) {
                    alert('予算の下限が上限を上回っています。');
                    console.log('❌ バリデーションエラー: 予算設定が不正');
                    return false;
                }
                break;
            case 3:
                // ステップ3は任意項目のため、バリデーション無し
                console.log('✅ ステップ3: バリデーション不要（任意項目）');
                break;
        }
        
        console.log(`✅ ステップ${step}: バリデーション通過`);
        return true;
    }

    nextStep() {
        console.log('👆 次へボタンクリック - 現在のステップ:', this.currentStep);
        
        if (this.validateStep(this.currentStep)) {
            console.log('✅ バリデーション通過 - ステップデータ収集中');
            this.collectStepData();
            
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                console.log('📈 次のステップに進む:', this.currentStep);
                
                // 確認画面の場合は概要生成
                if (this.currentStep === 4) {
                    console.log('📋 確認画面: 概要生成中');
                    this.generateConfirmationSummary();
                }
                
                this.updateProgress();
            }
        } else {
            console.log('❌ バリデーション失敗 - ステップ進行停止');
        }
    }

    previousStep() {
        console.log('👈 戻るボタンクリック - 現在のステップ:', this.currentStep);
        
        if (this.currentStep > 1) {
            this.currentStep--;
            console.log('📉 前のステップに戻る:', this.currentStep);
            this.updateProgress();
        }
    }

    collectStepData() {
        console.log('📊 現在ステップのデータ収集中...');
        
        // 現在のステップのデータを収集
        const currentSection = document.querySelector('.form-section.active');
        if (!currentSection) {
            console.warn('⚠️ アクティブなセクションが見つかりません');
            return;
        }

        const inputs = currentSection.querySelectorAll('input, select, textarea');
        let collectedCount = 0;
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (input.name === 'areas' || input.name === 'requirements') {
                    if (!this.formData[input.name]) {
                        this.formData[input.name] = [];
                    }
                    if (input.checked) {
                        if (!this.formData[input.name].includes(input.value)) {
                            this.formData[input.name].push(input.value);
                            collectedCount++;
                        }
                    } else {
                        const index = this.formData[input.name].indexOf(input.value);
                        if (index > -1) {
                            this.formData[input.name].splice(index, 1);
                        }
                    }
                }
            } else if (input.name) {
                this.formData[input.name] = input.value;
                collectedCount++;
            }
        });
        
        console.log(`📦 ${collectedCount}項目のデータを収集完了`);
    }

    collectFormData() {
        console.log('📊 全フォームデータの最終収集中...');
        
        // 全フォームデータの収集
        const allInputs = document.querySelectorAll('#customerForm input, #customerForm select, #customerForm textarea');
        let totalCollected = 0;
        
        // 配列フィールドを初期化
        this.formData.areas = [];
        this.formData.requirements = [];
        
        allInputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (input.name === 'areas' || input.name === 'requirements') {
                    if (input.checked) {
                        this.formData[input.name].push(input.value);
                        totalCollected++;
                    }
                }
            } else if (input.name) {
                this.formData[input.name] = input.value;
                if (input.value) totalCollected++;
            }
        });
        
        console.log(`📦 最終データ収集完了: ${totalCollected}項目`);
        console.log('📋 収集データ:', this.formData);
    }

    generateConfirmationSummary() {
        console.log('📋 確認画面の概要生成中...');
        
        const content = document.querySelector('#confirmationContent');
        if (!content) {
            console.error('❌ 確認コンテンツ要素が見つかりません');
            return;
        }

        const budgetText = this.formData.budgetMin && this.formData.budgetMax ? 
            `${parseInt(this.formData.budgetMin).toLocaleString()}万円 ～ ${parseInt(this.formData.budgetMax).toLocaleString()}万円` : 
            '未入力';

        const areasText = this.formData.areas && this.formData.areas.length > 0 ? 
            this.formData.areas.join('、') : '未選択';

        const requirementsText = this.formData.requirements && this.formData.requirements.length > 0 ? 
            this.formData.requirements.join('、') : '未選択';

        const html = `
            <div class="confirmation-summary">
                <h3>✅ 基本情報</h3>
                <table class="confirmation-table">
                    <tr><th>お名前</th><td>${this.formData.name || '未入力'}</td></tr>
                    <tr><th>メールアドレス</th><td>${this.formData.email || '未入力'}</td></tr>
                    <tr><th>電話番号</th><td>${this.formData.phone || '未入力'}</td></tr>
                    <tr><th>年齢</th><td>${this.formData.age ? this.formData.age + '歳' : '未入力'}</td></tr>
                    <tr><th>職業</th><td>${this.formData.occupation || '未入力'}</td></tr>
                    <tr><th>年収</th><td>${this.formData.annualIncome ? parseInt(this.formData.annualIncome).toLocaleString() + '万円' : '未入力'}</td></tr>
                </table>
                
                <h3>🏠 希望条件</h3>
                <table class="confirmation-table">
                    <tr><th>予算</th><td>${budgetText}</td></tr>
                    <tr><th>希望エリア</th><td>${areasText}</td></tr>
                    <tr><th>間取り</th><td>${this.formData.roomType || '未入力'}</td></tr>
                </table>
                
                <h3>📝 詳細条件</h3>
                <table class="confirmation-table">
                    <tr><th>こだわり条件</th><td>${requirementsText}</td></tr>
                    <tr><th>連絡希望時間</th><td>${this.formData.contactTime || '未入力'}</td></tr>
                    <tr><th>緊急度</th><td>${this.formData.urgency || '中'}</td></tr>
                    <tr><th>その他ご要望</th><td>${this.formData.notes || '未入力'}</td></tr>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
        console.log('✅ 確認画面の概要生成完了');
    }

    async submitForm() {
        console.log('🚀 フォーム送信開始...');
        
        if (!this.dataManager) {
            alert('システムエラーが発生しました。ページを再読み込みしてください。');
            return;
        }

        try {
            // フォームデータを収集
            this.collectFormData();
            
            if (this.isEditMode) {
                console.log('✏️ 編集モード: 顧客更新処理');
                // 編集モード：既存顧客を更新
                const updateData = {
                    name: this.formData.name,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    age: this.formData.age ? parseInt(this.formData.age) : null,
                    occupation: this.formData.occupation,
                    annualIncome: this.formData.annualIncome ? parseInt(this.formData.annualIncome) * 10000 : null,
                    preferences: {
                        budgetMin: this.formData.budgetMin ? parseInt(this.formData.budgetMin) * 10000 : null,
                        budgetMax: this.formData.budgetMax ? parseInt(this.formData.budgetMax) * 10000 : null,
                        areas: this.formData.areas || [],
                        roomType: this.formData.roomType || '',
                        requirements: this.formData.requirements || []
                    },
                    notes: this.formData.notes || '',
                    contactTime: this.formData.contactTime || '',
                    urgency: this.formData.urgency || '中',
                    updatedAt: new Date().toISOString()
                };

                const success = this.dataManager.updateCustomer(this.editCustomerId, updateData);
                
                if (success) {
                    this.showSuccessMessage(`${this.formData.name}様の情報を更新しました！`, true);
                } else {
                    throw new Error('顧客情報の更新に失敗しました');
                }
                
            } else {
                console.log('➕ 新規登録モード: 顧客追加処理');
                // 新規登録モード：新しい顧客を追加
                const customerData = {
                    name: this.formData.name,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    age: this.formData.age ? parseInt(this.formData.age) : null,
                    occupation: this.formData.occupation,
                    annualIncome: this.formData.annualIncome ? parseInt(this.formData.annualIncome) * 10000 : null,
                    pipelineStatus: '初回相談',
                    preferences: {
                        budgetMin: this.formData.budgetMin ? parseInt(this.formData.budgetMin) * 10000 : null,
                        budgetMax: this.formData.budgetMax ? parseInt(this.formData.budgetMax) * 10000 : null,
                        areas: this.formData.areas || [],
                        roomType: this.formData.roomType || '',
                        requirements: this.formData.requirements || []
                    },
                    notes: this.formData.notes || '',
                    contactTime: this.formData.contactTime || '',
                    urgency: this.formData.urgency || '中',
                    source: 'webform',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                const newCustomer = this.dataManager.addCustomer(customerData);
                
                if (newCustomer) {
                    this.showSuccessMessage(`${this.formData.name}様を顧客リストに追加しました！`, false);
                    console.log('✅ 新規顧客登録完了:', newCustomer.id);
                } else {
                    throw new Error('顧客登録に失敗しました');
                }
            }
            
        } catch (error) {
            console.error('❌ 顧客フォーム送信エラー:', error);
            alert(`${this.isEditMode ? '更新' : '登録'}に失敗しました。もう一度お試しください。`);
        }
    }

    showSuccessMessage(message, isEdit) {
        console.log('🎉 成功メッセージ表示:', message);
        
        // フォームを隠す
        document.getElementById('customerForm').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
        
        // 成功メッセージを表示
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.innerHTML = `
                <div class="success-content">
                    <div class="success-icon">✅</div>
                    <h2>${isEdit ? '更新完了' : '登録完了'}</h2>
                    <p>${message}</p>
                    <div class="success-actions">
                        <a href="customer.html" class="btn btn-primary">👥 顧客管理画面へ</a>
                        ${isEdit ? '' : '<button onclick="resetForm()" class="btn btn-secondary">➕ 続けて登録</button>'}
                    </div>
                </div>
            `;
            successDiv.style.display = 'block';
        }
        
        // 3秒後に自動で顧客管理画面に遷移
        setTimeout(() => {
            window.location.href = 'customer.html';
        }, 3000);
    }

    resetForm() {
        console.log('🔄 フォームリセット開始');
        
        // フォームをリセット
        document.getElementById('customerForm').reset();
        document.getElementById('customerForm').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'block';
        
        // ステップ1に戻る
        this.currentStep = 1;
        this.formData = {};
        this.isEditMode = false;
        this.editCustomerId = null;
        
        // URLをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // ページタイトルを復元
        const header = document.querySelector('.form-header h1');
        if (header) {
            header.textContent = '🏠 顧客情報登録';
        }
        const description = document.querySelector('.form-header p');
        if (description) {
            description.textContent = '詳細な顧客情報を登録します';
        }
        
        this.updateProgress();
        console.log('✅ フォームリセット完了');
    }
}

// グローバル関数として定義（HTMLから呼び出し可能）
function nextStep() {
    console.log('🔄 グローバル nextStep() 呼び出し');
    if (window.formManager) {
        window.formManager.nextStep();
    } else {
        console.error('❌ formManager が存在しません');
        alert('システムエラーが発生しました。ページを再読み込みしてください。');
    }
}

function previousStep() {
    console.log('🔄 グローバル previousStep() 呼び出し');
    if (window.formManager) {
        window.formManager.previousStep();
    } else {
        console.error('❌ formManager が存在しません');
    }
}

function prevStep() {
    previousStep();
}

function submitForm() {
    console.log('🔄 グローバル submitForm() 呼び出し');
    if (window.formManager) {
        window.formManager.submitForm();
    } else {
        console.error('❌ formManager が存在しません');
        alert('システムエラーが発生しました。ページを再読み込みしてください。');
    }
}

function resetForm() {
    console.log('🔄 グローバル resetForm() 呼び出し');
    if (window.formManager) {
        window.formManager.resetForm();
    } else {
        console.error('❌ formManager が存在しません');
    }
}

// フォーム管理開始
let formManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM読み込み完了 - FormManager初期化開始');
    formManager = new CustomerFormManager();
    window.formManager = formManager;
});

console.log('✅ 統一対応顧客フォームスクリプト準備完了（最終版）');
