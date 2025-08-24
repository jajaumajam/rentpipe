// RentPipe 顧客フォーム機能（統一データ管理対応版）
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
        return new Promise((resolve) => {
            if (window.UnifiedDataManager) {
                this.dataManager = window.UnifiedDataManager;
                resolve();
            } else {
                setTimeout(() => {
                    this.dataManager = window.UnifiedDataManager;
                    resolve();
                }, 500);
            }
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
                header.textContent = '顧客情報編集';
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
            annualIncome: customer.annualIncome || '',
            budgetMin: customer.preferences?.budgetMin || '',
            budgetMax: customer.preferences?.budgetMax || '',
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
        // 基本情報の設定
        const fields = ['name', 'email', 'phone', 'age', 'occupation', 'annualIncome', 'notes', 'contactTime'];
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

        // エリアの設定
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

        // こだわり条件の設定
        if (this.formData.requirements && this.formData.requirements.length > 0) {
            this.formData.requirements.forEach(requirement => {
                const checkbox = document.querySelector(`[name="requirements"][value="${requirement}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // 緊急度の設定
        const urgencyElement = document.querySelector('[name="urgency"]');
        if (urgencyElement && this.formData.urgency) {
            urgencyElement.value = this.formData.urgency;
        }
    }

    updateProgress() {
        // プログレスバーの更新
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepCircle = document.querySelector(`.step-circle[data-step="${i}"]`);
            const stepElement = document.querySelector(`[data-step="${i}"]`);
            
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
        switch (step) {
            case 1:
                const name = document.querySelector('[name="name"]')?.value;
                const email = document.querySelector('[name="email"]')?.value;
                const phone = document.querySelector('[name="phone"]')?.value;
                
                if (!name) {
                    alert('お名前を入力してください。');
                    return false;
                }
                if (!email) {
                    alert('メールアドレスを入力してください。');
                    return false;
                }
                if (!phone) {
                    alert('電話番号を入力してください。');
                    return false;
                }
                break;
            case 2:
                // 希望条件は任意項目のため、バリデーション無し
                break;
            case 3:
                // 詳細条件は任意項目のため、バリデーション無し
                break;
        }
        return true;
    }

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            this.collectStepData();
            
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                
                // 確認画面の場合は概要生成
                if (this.currentStep === 4) {
                    this.generateConfirmationSummary();
                }
                
                this.updateProgress();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
        }
    }

    collectStepData() {
        // 現在のステップのデータを収集
        const currentSection = document.querySelector('.form-section.active');
        if (!currentSection) return;

        const inputs = currentSection.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (input.name === 'areas' || input.name === 'requirements') {
                    if (!this.formData[input.name]) {
                        this.formData[input.name] = [];
                    }
                    if (input.checked) {
                        if (!this.formData[input.name].includes(input.value)) {
                            this.formData[input.name].push(input.value);
                        }
                    } else {
                        const index = this.formData[input.name].indexOf(input.value);
                        if (index > -1) {
                            this.formData[input.name].splice(index, 1);
                        }
                    }
                }
            } else {
                this.formData[input.name] = input.value;
            }
        });
    }

    collectFormData() {
        // 全フォームデータの収集
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type === 'checkbox') {
                if (input.name === 'areas' || input.name === 'requirements') {
                    if (!this.formData[input.name]) {
                        this.formData[input.name] = [];
                    }
                    if (input.checked && !this.formData[input.name].includes(input.value)) {
                        this.formData[input.name].push(input.value);
                    }
                }
            } else if (input.name) {
                this.formData[input.name] = input.value;
            }
        });
    }

    generateConfirmationSummary() {
        const content = document.querySelector('#confirmationContent');
        if (!content) return;

        const budgetText = this.formData.budgetMin && this.formData.budgetMax ? 
            `${parseInt(this.formData.budgetMin).toLocaleString()}円 ～ ${parseInt(this.formData.budgetMax).toLocaleString()}円` : 
            '未入力';

        const html = `
            <div class="confirmation-summary">
                <h3>基本情報</h3>
                <table class="confirmation-table">
                    <tr><th>お名前</th><td>${this.formData.name || '未入力'}</td></tr>
                    <tr><th>メールアドレス</th><td>${this.formData.email || '未入力'}</td></tr>
                    <tr><th>電話番号</th><td>${this.formData.phone || '未入力'}</td></tr>
                    <tr><th>年齢</th><td>${this.formData.age ? this.formData.age + '歳' : '未入力'}</td></tr>
                    <tr><th>職業</th><td>${this.formData.occupation || '未入力'}</td></tr>
                    <tr><th>年収</th><td>${this.formData.annualIncome ? parseInt(this.formData.annualIncome).toLocaleString() + '円' : '未入力'}</td></tr>
                </table>
                
                <h3>希望条件</h3>
                <table class="confirmation-table">
                    <tr><th>予算</th><td>${budgetText}</td></tr>
                    <tr><th>希望エリア</th><td>${this.formData.areas && this.formData.areas.length > 0 ? this.formData.areas.join('、') : '未選択'}</td></tr>
                    <tr><th>間取り</th><td>${this.formData.roomType || '未入力'}</td></tr>
                </table>
                
                <h3>詳細条件</h3>
                <table class="confirmation-table">
                    <tr><th>こだわり条件</th><td>${this.formData.requirements && this.formData.requirements.length > 0 ? this.formData.requirements.join('、') : '未選択'}</td></tr>
                    <tr><th>連絡希望時間</th><td>${this.formData.contactTime || '未入力'}</td></tr>
                    <tr><th>緊急度</th><td>${this.formData.urgency || '中'}</td></tr>
                    <tr><th>その他ご要望</th><td>${this.formData.notes || '未入力'}</td></tr>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
    }

    async submitForm() {
        if (!this.dataManager) {
            alert('システムエラーが発生しました。ページを再読み込みしてください。');
            return;
        }

        try {
            // フォームデータを収集
            this.collectFormData();
            
            if (this.isEditMode) {
                // 編集モード：既存顧客を更新
                const updateData = {
                    name: this.formData.name,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    age: this.formData.age ? parseInt(this.formData.age) : null,
                    occupation: this.formData.occupation,
                    annualIncome: this.formData.annualIncome ? parseInt(this.formData.annualIncome) : null,
                    preferences: {
                        budgetMin: this.formData.budgetMin ? parseInt(this.formData.budgetMin) : null,
                        budgetMax: this.formData.budgetMax ? parseInt(this.formData.budgetMax) : null,
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
                    this.showSuccessMessage(`${this.formData.name}様の情報を更新しました！`);
                } else {
                    throw new Error('顧客情報の更新に失敗しました');
                }
                
            } else {
                // 新規登録モード：新しい顧客を追加
                const customerData = {
                    name: this.formData.name,
                    email: this.formData.email,
                    phone: this.formData.phone,
                    age: this.formData.age ? parseInt(this.formData.age) : null,
                    occupation: this.formData.occupation,
                    annualIncome: this.formData.annualIncome ? parseInt(this.formData.annualIncome) : null,
                    pipelineStatus: '初回相談',
                    preferences: {
                        budgetMin: this.formData.budgetMin ? parseInt(this.formData.budgetMin) : null,
                        budgetMax: this.formData.budgetMax ? parseInt(this.formData.budgetMax) : null,
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
                    this.showSuccessMessage(`${this.formData.name}様を顧客リストに追加しました！`);
                } else {
                    throw new Error('顧客登録に失敗しました');
                }
            }
            
        } catch (error) {
            console.error('❌ 顧客フォーム送信エラー:', error);
            alert(`${this.isEditMode ? '更新' : '登録'}に失敗しました。もう一度お試しください。`);
        }
    }

    showSuccessMessage(message) {
        // フォームを隠す
        document.getElementById('customerForm').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
        
        // 成功メッセージを表示
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.innerHTML = `
                <div class="success-content">
                    <div class="success-icon">✅</div>
                    <h2>${this.isEditMode ? '更新完了' : '登録完了'}</h2>
                    <p>${message}</p>
                    <div class="success-actions">
                        <a href="customer.html" class="btn btn-primary">顧客管理画面へ</a>
                        ${this.isEditMode ? '' : '<button onclick="resetForm()" class="btn btn-secondary">続けて登録</button>'}
                    </div>
                </div>
            `;
            successDiv.style.display = 'block';
        }
    }

    resetForm() {
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
            header.textContent = '顧客情報登録';
        }
        const description = document.querySelector('.form-header p');
        if (description) {
            description.textContent = '詳細な顧客情報を登録します';
        }
        
        this.updateProgress();
    }
}

// グローバル関数として定義
function nextStep() {
    if (window.formManager) {
        window.formManager.nextStep();
    }
}

function previousStep() {
    if (window.formManager) {
        window.formManager.previousStep();
    }
}

function prevStep() {
    previousStep();
}

function submitForm() {
    if (window.formManager) {
        window.formManager.submitForm();
    }
}

function resetForm() {
    if (window.formManager) {
        window.formManager.resetForm();
    }
}

// フォーム管理開始
let formManager;
document.addEventListener('DOMContentLoaded', () => {
    formManager = new CustomerFormManager();
    window.formManager = formManager;
});

console.log('✅ 統一対応顧客フォームスクリプト準備完了');
