// 顧客入力フォーム制御
class CustomerFormManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.init();
    }

    init() {
        this.updateProgress();
        this.bindEvents();
        this.updateBudgetDisplay();
        this.loadAgentInfo();
    }

    loadAgentInfo() {
        // URLパラメータからエージェント情報を取得
        const urlParams = new URLSearchParams(window.location.search);
        this.agentId = urlParams.get('agent') || 'demo-agent';
        this.agentName = urlParams.get('name') || 'デモエージェント';
        
        console.log(`エージェント: ${this.agentName} (ID: ${this.agentId})`);
    }

    bindEvents() {
        // 予算入力の監視
        document.getElementById('budgetMin').addEventListener('input', () => this.updateBudgetDisplay());
        document.getElementById('budgetMax').addEventListener('input', () => this.updateBudgetDisplay());

        // フォーム送信
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        // リアルタイムバリデーション
        this.bindValidationEvents();
    }

    bindValidationEvents() {
        // 名前バリデーション
        document.getElementById('name').addEventListener('blur', () => {
            this.validateName();
        });

        // メールバリデーション
        document.getElementById('email').addEventListener('blur', () => {
            this.validateEmail();
        });

        // 電話番号バリデーション
        document.getElementById('phone').addEventListener('blur', () => {
            this.validatePhone();
        });

        // 予算バリデーション
        document.getElementById('budgetMin').addEventListener('blur', () => {
            this.validateBudget();
        });
        document.getElementById('budgetMax').addEventListener('blur', () => {
            this.validateBudget();
        });
    }

    updateBudgetDisplay() {
        const minBudget = parseInt(document.getElementById('budgetMin').value) || 0;
        const maxBudget = parseInt(document.getElementById('budgetMax').value) || 0;
        
        const display = document.getElementById('budgetDisplay');
        if (minBudget && maxBudget) {
            display.textContent = `予算: ${minBudget.toLocaleString()}円 〜 ${maxBudget.toLocaleString()}円`;
        } else if (minBudget) {
            display.textContent = `予算: ${minBudget.toLocaleString()}円以上`;
        } else if (maxBudget) {
            display.textContent = `予算: ${maxBudget.toLocaleString()}円以下`;
        } else {
            display.textContent = '予算: 未入力';
        }
    }

    validateName() {
        const name = document.getElementById('name').value.trim();
        const nameError = document.getElementById('nameError');
        const nameInput = document.getElementById('name');

        if (!name) {
            nameError.textContent = 'お名前は必須です';
            nameInput.classList.add('error');
            return false;
        } else if (name.length < 2) {
            nameError.textContent = 'お名前は2文字以上で入力してください';
            nameInput.classList.add('error');
            return false;
        } else {
            nameError.textContent = '';
            nameInput.classList.remove('error');
            return true;
        }
    }

    validateEmail() {
        const email = document.getElementById('email').value.trim();
        const emailError = document.getElementById('emailError');
        const emailInput = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            emailError.textContent = 'メールアドレスは必須です';
            emailInput.classList.add('error');
            return false;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = '正しいメールアドレスを入力してください';
            emailInput.classList.add('error');
            return false;
        } else {
            emailError.textContent = '';
            emailInput.classList.remove('error');
            return true;
        }
    }

    validatePhone() {
        const phone = document.getElementById('phone').value.trim();
        const phoneError = document.getElementById('phoneError');
        const phoneInput = document.getElementById('phone');
        const phoneRegex = /^[0-9\-\+\(\)\s]+$/;

        if (!phone) {
            phoneError.textContent = '電話番号は必須です';
            phoneInput.classList.add('error');
            return false;
        } else if (!phoneRegex.test(phone) || phone.length < 10) {
            phoneError.textContent = '正しい電話番号を入力してください';
            phoneInput.classList.add('error');
            return false;
        } else {
            phoneError.textContent = '';
            phoneInput.classList.remove('error');
            return true;
        }
    }

    validateBudget() {
        const minBudget = parseInt(document.getElementById('budgetMin').value);
        const maxBudget = parseInt(document.getElementById('budgetMax').value);

        if (minBudget && maxBudget && minBudget >= maxBudget) {
            alert('最低金額は最高金額より低く設定してください');
            return false;
        }
        return true;
    }

    validateAreas() {
        const checkedAreas = document.querySelectorAll('input[name="areas"]:checked');
        const areasError = document.getElementById('areasError');

        if (checkedAreas.length === 0) {
            areasError.textContent = '希望エリアを1つ以上選択してください';
            return false;
        } else {
            areasError.textContent = '';
            return true;
        }
    }

    validateStep(step) {
        switch (step) {
            case 1:
                return this.validateName() && this.validateEmail() && this.validatePhone();
            case 2:
                return this.validateBudget() && this.validateAreas() && 
                       document.getElementById('roomType').value !== '';
            case 3:
                return true; // Step 3 は任意項目のみ
            default:
                return true;
        }
    }

    updateProgress() {
        // プログレスバー更新
        const progressFill = document.getElementById('progressFill');
        const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        progressFill.style.width = `${progress}%`;

        // ステップ表示更新
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepCircle = document.getElementById(`step${i}`);
            const formStep = document.getElementById(`formStep${i}`);

            // フォームステップの表示/非表示
            if (formStep) {
                formStep.classList.toggle('active', i === this.currentStep);
            }

            // ステップサークルの状態
            if (stepCircle) {
                stepCircle.classList.remove('active', 'completed');
                if (i < this.currentStep) {
                    stepCircle.classList.add('completed');
                    stepCircle.textContent = '✓';
                } else if (i === this.currentStep) {
                    stepCircle.classList.add('active');
                    stepCircle.textContent = i;
                } else {
                    stepCircle.textContent = i;
                }
            }
        }
    }

    collectFormData() {
        this.formData = {
            // 基本情報
            name: document.getElementById('name').value.trim(),
            age: parseInt(document.getElementById('age').value) || null,
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            occupation: document.getElementById('occupation').value,
            annualIncome: parseInt(document.getElementById('annualIncome').value) || null,

            // 希望条件
            preferences: {
                budgetMin: parseInt(document.getElementById('budgetMin').value) || null,
                budgetMax: parseInt(document.getElementById('budgetMax').value) || null,
                areas: Array.from(document.querySelectorAll('input[name="areas"]:checked')).map(cb => cb.value),
                roomType: document.getElementById('roomType').value,
                moveInDate: document.getElementById('moveInDate').value,
                requirements: Array.from(document.querySelectorAll('input[name="requirements"]:checked')).map(cb => cb.value)
            },

            // 詳細・要望
            notes: document.getElementById('notes').value.trim(),
            urgency: document.getElementById('urgency').value,
            contactTime: document.getElementById('contactTime').value,

            // システム情報
            agentId: this.agentId,
            agentName: this.agentName,
            pipelineStatus: '初回相談',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'webform'
        };
    }

    generateConfirmationSummary() {
        this.collectFormData();
        const summary = document.getElementById('confirmationSummary');
        
        const formatValue = (value, type = 'text') => {
            if (value === null || value === undefined || value === '') return '未入力';
            if (type === 'array') return value.length > 0 ? value.join(', ') : '未選択';
            if (type === 'currency') return `${value.toLocaleString()}円`;
            return value;
        };

        summary.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #1e293b;">基本情報</h3>
            <div class="summary-item">
                <span class="summary-label">お名前</span>
                <span class="summary-value">${formatValue(this.formData.name)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">年齢</span>
                <span class="summary-value">${formatValue(this.formData.age)}歳</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">メールアドレス</span>
                <span class="summary-value">${formatValue(this.formData.email)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">電話番号</span>
                <span class="summary-value">${formatValue(this.formData.phone)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">職業</span>
                <span class="summary-value">${formatValue(this.formData.occupation)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">年収</span>
                <span class="summary-value">${formatValue(this.formData.annualIncome, 'currency')}</span>
            </div>

            <h3 style="margin: 20px 0 15px 0; color: #1e293b;">希望条件</h3>
            <div class="summary-item">
                <span class="summary-label">予算</span>
                <span class="summary-value">${formatValue(this.formData.preferences.budgetMin, 'currency')} 〜 ${formatValue(this.formData.preferences.budgetMax, 'currency')}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">希望エリア</span>
                <span class="summary-value">${formatValue(this.formData.preferences.areas, 'array')}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">間取り</span>
                <span class="summary-value">${formatValue(this.formData.preferences.roomType)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">入居希望日</span>
                <span class="summary-value">${formatValue(this.formData.preferences.moveInDate)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">こだわり条件</span>
                <span class="summary-value">${formatValue(this.formData.preferences.requirements, 'array')}</span>
            </div>

            <h3 style="margin: 20px 0 15px 0; color: #1e293b;">その他</h3>
            <div class="summary-item">
                <span class="summary-label">ご要望・備考</span>
                <span class="summary-value">${formatValue(this.formData.notes)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">緊急度</span>
                <span class="summary-value">${formatValue(this.formData.urgency)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">連絡希望時間</span>
                <span class="summary-value">${formatValue(this.formData.contactTime)}</span>
            </div>
        `;
    }

    async submitForm() {
        try {
            this.collectFormData();

            // Firebase保存（デモ環境では実際には保存しない）
            if (this.agentId === 'demo-agent') {
                console.log('デモ顧客データ:', this.formData);
                
                // ローカルストレージに保存（デモ用）
                const existingCustomers = JSON.parse(localStorage.getItem('demoCustomers') || '[]');
                this.formData.id = `form-${Date.now()}`;
                existingCustomers.push(this.formData);
                localStorage.setItem('demoCustomers', JSON.stringify(existingCustomers));
            } else {
                await db.collection('customers').add(this.formData);
            }

            // 成功画面表示
            this.showSuccessScreen();

            // 通知メール送信（実際の環境では）
            console.log(`新規顧客登録通知を ${this.agentName} に送信しました`);

        } catch (error) {
            console.error('フォーム送信エラー:', error);
            alert('送信に失敗しました。もう一度お試しください。');
        }
    }

    showSuccessScreen() {
        // 全てのステップを非表示
        for (let i = 1; i <= this.totalSteps; i++) {
            const formStep = document.getElementById(`formStep${i}`);
            if (formStep) {
                formStep.classList.remove('active');
            }
        }

        // 成功画面を表示
        document.getElementById('formStepSuccess').classList.add('active');
        
        // プログレスバーを100%に
        document.getElementById('progressFill').style.width = '100%';
    }

    resetForm() {
        // フォームリセット
        document.getElementById('customerForm').reset();
        
        // ステップ1に戻る
        this.currentStep = 1;
        this.formData = {};
        
        // 成功画面を非表示
        document.getElementById('formStepSuccess').classList.remove('active');
        
        // プログレス更新
        this.updateProgress();
        
        // エラーメッセージクリア
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('.form-input.error').forEach(input => {
            input.classList.remove('error');
        });
        
        // 予算表示更新
        this.updateBudgetDisplay();
    }
}

// ステップ制御関数
function nextStep() {
    if (formManager.validateStep(formManager.currentStep)) {
        if (formManager.currentStep < formManager.totalSteps) {
            formManager.currentStep++;
            
            // 確認画面の場合は概要生成
            if (formManager.currentStep === 4) {
                formManager.generateConfirmationSummary();
            }
            
            formManager.updateProgress();
        }
    }
}

function prevStep() {
    if (formManager.currentStep > 1) {
        formManager.currentStep--;
        formManager.updateProgress();
    }
}

function resetForm() {
    formManager.resetForm();
}

// フォーム管理開始
let formManager;
document.addEventListener('DOMContentLoaded', () => {
    formManager = new CustomerFormManager();
});

// URLコピー機能（エージェント用）
function copyFormURL() {
    const url = `${window.location.origin}/customer-form.html?agent=${formManager.agentId}&name=${encodeURIComponent(formManager.agentName)}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('フォームURLをコピーしました！');
    });
}
