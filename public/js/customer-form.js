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
        // フォーム送信
        const form = document.getElementById('customerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }

    updateProgress() {
        // プログレスバーの更新
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;
            const circle = step.querySelector('.step-circle');
            
            if (stepNum < this.currentStep) {
                circle.classList.add('completed');
                circle.classList.remove('active');
            } else if (stepNum === this.currentStep) {
                circle.classList.add('active');
                circle.classList.remove('completed');
            } else {
                circle.classList.remove('active', 'completed');
            }
        });

        // フォームセクションの表示/非表示
        document.querySelectorAll('.form-section').forEach((section) => {
            const sectionStep = parseInt(section.getAttribute('data-section'));
            if (sectionStep === this.currentStep) {
                section.classList.add('active');
                section.style.display = 'block';
            } else {
                section.classList.remove('active');
                section.style.display = 'none';
            }
        });
    }

    validateStep(step) {
        let isValid = true;
        
        if (step === 1) {
            // Step 1: 基本情報のバリデーション
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            
            if (!name.value.trim()) {
                alert('お名前を入力してください');
                name.focus();
                return false;
            }
            
            if (!email.value.trim() || !email.validity.valid) {
                alert('正しいメールアドレスを入力してください');
                email.focus();
                return false;
            }
            
            if (!phone.value.trim()) {
                alert('電話番号を入力してください');
                phone.focus();
                return false;
            }
        } else if (step === 2) {
            // Step 2: 希望条件のバリデーション
            const moveDate = document.getElementById('moveDate');
            const budgetMin = document.getElementById('budgetMin');
            const budgetMax = document.getElementById('budgetMax');
            
            if (!moveDate.value) {
                alert('入居希望時期を選択してください');
                moveDate.focus();
                return false;
            }
            
            if (!budgetMin.value || !budgetMax.value) {
                alert('ご予算を入力してください');
                budgetMin.focus();
                return false;
            }
            
            if (parseInt(budgetMin.value) > parseInt(budgetMax.value)) {
                alert('予算の下限は上限より小さくしてください');
                budgetMin.focus();
                return false;
            }
        }
        
        return isValid;
    }

    collectFormData() {
        // 基本情報
        this.formData.name = document.getElementById('name').value.trim();
        this.formData.email = document.getElementById('email').value.trim();
        this.formData.phone = document.getElementById('phone').value.trim();
        this.formData.currentAddress = document.getElementById('currentAddress')?.value.trim() || '';
        this.formData.occupation = document.getElementById('occupation')?.value || '';

        // 希望条件
        this.formData.moveDate = document.getElementById('moveDate').value;
        this.formData.moveReason = document.getElementById('moveReason')?.value.trim() || '';
        this.formData.budgetMin = parseInt(document.getElementById('budgetMin').value) || 0;
        this.formData.budgetMax = parseInt(document.getElementById('budgetMax').value) || 0;
        this.formData.areas = document.getElementById('areas')?.value.trim() || '';
        this.formData.stationDistance = document.getElementById('stationDistance')?.value || '';
        this.formData.buildingAge = document.getElementById('buildingAge')?.value || '';
        this.formData.roomType = document.getElementById('roomType')?.value || '';

        // 詳細条件
        const requirements = [];
        document.querySelectorAll('input[name="requirements"]:checked').forEach(cb => {
            requirements.push(cb.value);
        });
        this.formData.requirements = requirements;
        
        // ペット情報
        const petCheckbox = document.getElementById('req_pet');
        if (petCheckbox && petCheckbox.checked) {
            this.formData.petInfo = document.getElementById('petInfo')?.value.trim() || '';
        }
        
        // その他
        this.formData.notes = document.getElementById('notes')?.value.trim() || '';
    }

    generateConfirmationSummary() {
        this.collectFormData();
        const content = document.getElementById('confirmationContent');
        
        if (!content) return;
        
        let html = `
            <div class="confirmation-grid">
                <h3>基本情報</h3>
                <table class="confirmation-table">
                    <tr><th>お名前</th><td>${this.formData.name}</td></tr>
                    <tr><th>メールアドレス</th><td>${this.formData.email}</td></tr>
                    <tr><th>電話番号</th><td>${this.formData.phone}</td></tr>
                    <tr><th>現住所</th><td>${this.formData.currentAddress || '未入力'}</td></tr>
                    <tr><th>ご職業</th><td>${this.formData.occupation || '未入力'}</td></tr>
                </table>
                
                <h3>ご希望条件</h3>
                <table class="confirmation-table">
                    <tr><th>入居希望時期</th><td>${this.formData.moveDate}</td></tr>
                    <tr><th>お引越し理由</th><td>${this.formData.moveReason || '未入力'}</td></tr>
                    <tr><th>ご予算</th><td>${this.formData.budgetMin}万円 〜 ${this.formData.budgetMax}万円</td></tr>
                    <tr><th>希望エリア</th><td>${this.formData.areas || '未入力'}</td></tr>
                    <tr><th>駅徒歩</th><td>${this.formData.stationDistance ? this.formData.stationDistance + '分以内' : '未入力'}</td></tr>
                    <tr><th>築年数</th><td>${this.formData.buildingAge ? this.formData.buildingAge + '年以内' : '未入力'}</td></tr>
                    <tr><th>間取り</th><td>${this.formData.roomType || '未入力'}</td></tr>
                </table>
                
                <h3>詳細条件</h3>
                <table class="confirmation-table">
                    <tr><th>こだわり条件</th><td>${this.formData.requirements.length > 0 ? this.formData.requirements.join('、') : '未選択'}</td></tr>
                    ${this.formData.petInfo ? `<tr><th>ペット情報</th><td>${this.formData.petInfo}</td></tr>` : ''}
                    <tr><th>その他ご要望</th><td>${this.formData.notes || '未入力'}</td></tr>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
    }

    async submitForm() {
        // フォームデータを収集
        this.collectFormData();
        
        // データを保存
        const customerData = {
            id: `customer_${Date.now()}`,
            ...this.formData,
            pipelineStatus: '初回相談',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'webform'
        };
        
        // ローカルストレージに保存
        const customers = JSON.parse(localStorage.getItem('rentpipe_demo_customers') || '[]');
        customers.push(customerData);
        localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
        
        // 成功メッセージを表示
        document.getElementById('customerForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        document.querySelector('.progress-bar').style.display = 'none';
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
        this.updateProgress();
    }
}

// グローバル関数として定義
function nextStep() {
    if (!window.formManager) {
        console.error('FormManager not initialized');
        return;
    }
    
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

// previousStepとprevStepの両方を定義
function previousStep() {
    if (!window.formManager) {
        console.error('FormManager not initialized');
        return;
    }
    
    if (formManager.currentStep > 1) {
        formManager.currentStep--;
        formManager.updateProgress();
    }
}

function prevStep() {
    previousStep();
}

function resetForm() {
    if (!window.formManager) {
        console.error('FormManager not initialized');
        return;
    }
    formManager.resetForm();
}

// フォーム管理開始
let formManager;
document.addEventListener('DOMContentLoaded', () => {
    formManager = new CustomerFormManager();
    window.formManager = formManager; // グローバルに公開
});
