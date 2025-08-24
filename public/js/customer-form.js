// RentPipe 顧客フォーム機能（過去バージョン忠実・統一データ管理対応版）
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

        // 過去バージョンのフォーマットに変換
        this.formData = {
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            currentAddress: customer.currentAddress || '',
            occupation: customer.occupation || '',
            moveDate: customer.moveDate || '',
            moveReason: customer.moveReason || '',
            budgetMin: customer.preferences?.budgetMin ? Math.round(customer.preferences.budgetMin / 10000) : '',
            budgetMax: customer.preferences?.budgetMax ? Math.round(customer.preferences.budgetMax / 10000) : '',
            areas: customer.preferences?.areasText || (customer.preferences?.areas ? customer.preferences.areas.join('、') : ''),
            stationDistance: customer.stationDistance || '',
            buildingAge: customer.buildingAge || '',
            roomType: customer.preferences?.roomType || '',
            requirements: customer.preferences?.requirements || [],
            petInfo: customer.petInfo || '',
            notes: customer.notes || ''
        };

        // フォームに値を設定
        setTimeout(() => {
            this.populateForm();
        }, 100);
    }

    populateForm() {
        console.log('📝 フォームに既存データを入力中...');
        
        // 基本情報・希望条件の設定
        const fields = ['name', 'email', 'phone', 'currentAddress', 'occupation', 'moveDate', 'moveReason', 'budgetMin', 'budgetMax', 'areas', 'stationDistance', 'buildingAge', 'roomType', 'notes'];
        fields.forEach(field => {
            const element = document.querySelector(`[name="${field}"]`);
            if (element && this.formData[field]) {
                element.value = this.formData[field];
            }
        });

        // こだわり条件の設定（チェックボックス）
        if (this.formData.requirements && this.formData.requirements.length > 0) {
            this.formData.requirements.forEach(requirement => {
                const checkbox = document.querySelector(`[name="requirements"][value="${requirement}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    
                    // ペット可がチェックされている場合はペット詳細も表示
                    if (requirement === 'ペット可') {
                        const petDetails = document.getElementById('petDetails');
                        if (petDetails) {
                            petDetails.style.display = 'block';
                            const petInfoElement = document.getElementById('petInfo');
                            if (petInfoElement && this.formData.petInfo) {
                                petInfoElement.value = this.formData.petInfo;
                            }
                        }
                    }
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
                // 基本情報のバリデーション
                const name = document.querySelector('[name="name"]')?.value?.trim();
                const email = document.querySelector('[name="email"]')?.value?.trim();
                const phone = document.querySelector('[name="phone"]')?.value?.trim();
                
                if (!name) {
                    alert('お名前を入力してください。');
                    document.querySelector('[name="name"]')?.focus();
                    return false;
                }
                if (!email || !email.includes('@')) {
                    alert('正しいメールアドレスを入力してください。');
                    document.querySelector('[name="email"]')?.focus();
                    return false;
                }
                if (!phone) {
                    alert('電話番号を入力してください。');
                    document.querySelector('[name="phone"]')?.focus();
                    return false;
                }
                break;
                
            case 2:
                // 希望条件のバリデーション
                const moveDate = document.querySelector('[name="moveDate"]')?.value;
                const budgetMin = document.querySelector('[name="budgetMin"]')?.value;
                const budgetMax = document.querySelector('[name="budgetMax"]')?.value;
                
                if (!moveDate) {
                    alert('入居希望時期を選択してください。');
                    document.querySelector('[name="moveDate"]')?.focus();
                    return false;
                }
                
                if (!budgetMin || !budgetMax) {
                    alert('ご予算を入力してください。');
                    document.querySelector('[name="budgetMin"]')?.focus();
                    return false;
                }
                
                if (parseInt(budgetMin) > parseInt(budgetMax)) {
                    alert('予算の下限が上限を上回っています。');
                    document.querySelector('[name="budgetMin"]')?.focus();
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
        // 過去バージョンと同じデータ収集処理
        this.collectFormData();
    }

    collectFormData() {
        console.log('📊 全フォームデータの収集中...');
        
        // 基本情報
        this.formData.name = document.getElementById('name')?.value?.trim() || '';
        this.formData.email = document.getElementById('email')?.value?.trim() || '';
        this.formData.phone = document.getElementById('phone')?.value?.trim() || '';
        this.formData.currentAddress = document.getElementById('currentAddress')?.value?.trim() || '';
        this.formData.occupation = document.getElementById('occupation')?.value || '';

        // 希望条件
        this.formData.moveDate = document.getElementById('moveDate')?.value || '';
        this.formData.moveReason = document.getElementById('moveReason')?.value?.trim() || '';
        this.formData.budgetMin = parseInt(document.getElementById('budgetMin')?.value) || 0;
        this.formData.budgetMax = parseInt(document.getElementById('budgetMax')?.value) || 0;
        this.formData.areas = document.getElementById('areas')?.value?.trim() || '';
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
            this.formData.petInfo = document.getElementById('petInfo')?.value?.trim() || '';
        }
        
        // その他
        this.formData.notes = document.getElementById('notes')?.value?.trim() || '';
        
        console.log(`📦 データ収集完了:`, this.formData);
    }

    generateConfirmationSummary() {
        console.log('📋 確認画面の概要生成中...');
        
        this.collectFormData();
        const content = document.getElementById('confirmationContent');
        
        if (!content) {
            console.error('❌ 確認コンテンツ要素が見つかりません');
            return;
        }
        
        let html = `
            <div class="confirmation-grid">
                <h3>✅ 基本情報</h3>
                <table class="confirmation-table">
                    <tr><th>お名前</th><td>${this.formData.name}</td></tr>
                    <tr><th>メールアドレス</th><td>${this.formData.email}</td></tr>
                    <tr><th>電話番号</th><td>${this.formData.phone}</td></tr>
                    <tr><th>現住所</th><td>${this.formData.currentAddress || '未入力'}</td></tr>
                    <tr><th>ご職業</th><td>${this.formData.occupation || '未入力'}</td></tr>
                </table>
                
                <h3>🏠 ご希望条件</h3>
                <table class="confirmation-table">
                    <tr><th>入居希望時期</th><td>${this.formData.moveDate}</td></tr>
                    <tr><th>お引越し理由</th><td>${this.formData.moveReason || '未入力'}</td></tr>
                    <tr><th>ご予算</th><td>${this.formData.budgetMin}万円 〜 ${this.formData.budgetMax}万円</td></tr>
                    <tr><th>希望エリア</th><td>${this.formData.areas || '未入力'}</td></tr>
                    <tr><th>駅徒歩</th><td>${this.formData.stationDistance ? this.formData.stationDistance + '分以内' : '未入力'}</td></tr>
                    <tr><th>築年数</th><td>${this.formData.buildingAge ? this.formData.buildingAge + '年以内' : '未入力'}</td></tr>
                    <tr><th>間取り</th><td>${this.formData.roomType || '未入力'}</td></tr>
                </table>
                
                <h3>📝 詳細条件</h3>
                <table class="confirmation-table">
                    <tr><th>こだわり条件</th><td>${this.formData.requirements.length > 0 ? this.formData.requirements.join('、') : '未選択'}</td></tr>
                    ${this.formData.petInfo ? `<tr><th>ペット情報</th><td>${this.formData.petInfo}</td></tr>` : ''}
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
            
            // 統一データ形式に変換
            const customerData = {
                name: this.formData.name,
                email: this.formData.email,
                phone: this.formData.phone,
                currentAddress: this.formData.currentAddress,
                occupation: this.formData.occupation,
                moveDate: this.formData.moveDate,
                moveReason: this.formData.moveReason,
                stationDistance: this.formData.stationDistance,
                buildingAge: this.formData.buildingAge,
                petInfo: this.formData.petInfo,
                notes: this.formData.notes,
                pipelineStatus: this.isEditMode ? undefined : '初回相談', // 編集時はステータス変更しない
                preferences: {
                    budgetMin: this.formData.budgetMin ? this.formData.budgetMin * 10000 : null,
                    budgetMax: this.formData.budgetMax ? this.formData.budgetMax * 10000 : null,
                    areasText: this.formData.areas, // テキストとして保存
                    areas: this.formData.areas ? this.formData.areas.split('、').map(s => s.trim()).filter(s => s) : [], // 配列としても保存
                    roomType: this.formData.roomType || '',
                    requirements: this.formData.requirements || []
                },
                source: 'webform',
                updatedAt: new Date().toISOString()
            };
            
            if (this.isEditMode) {
                console.log('✏️ 編集モード: 顧客更新処理');
                const success = this.dataManager.updateCustomer(this.editCustomerId, customerData);
                
                if (success) {
                    this.showSuccessMessage(`${this.formData.name}様の情報を更新しました！`, true);
                } else {
                    throw new Error('顧客情報の更新に失敗しました');
                }
                
            } else {
                console.log('➕ 新規登録モード: 顧客追加処理');
                customerData.createdAt = new Date().toISOString();
                
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
                <div class="success-content" style="text-align: center; padding: 2rem;">
                    <div class="success-icon" style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                    <h2 style="color: #10b981; margin-bottom: 1rem;">${isEdit ? '更新完了' : '登録完了'}</h2>
                    <p style="margin-bottom: 2rem;">${message}</p>
                    <div class="success-actions" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="customer.html" class="btn btn-primary" style="text-decoration: none;">👥 顧客管理画面へ</a>
                        ${isEdit ? '' : '<button onclick="resetForm()" class="btn btn-secondary">➕ 続けて登録</button>'}
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">3秒後に自動で顧客管理画面に遷移します...</p>
                </div>
            `;
            successDiv.style.display = 'block';
        }
        
        // 3秒後に自動で顧客管理画面に遷移（修正版）
        console.log('⏰ 3秒後の自動遷移を設定...');
        setTimeout(() => {
            console.log('🔄 顧客管理画面に自動遷移中...');
            try {
                window.location.href = 'customer.html';
            } catch (error) {
                console.error('❌ 自動遷移エラー:', error);
                // フォールバック: location.replace を使用
                window.location.replace('customer.html');
            }
        }, 3000);
    }

    resetForm() {
        console.log('🔄 フォームリセット開始');
        
        // フォームをリセット
        document.getElementById('customerForm').reset();
        document.getElementById('customerForm').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'block';
        
        // ペット詳細を非表示に
        const petDetails = document.getElementById('petDetails');
        if (petDetails) {
            petDetails.style.display = 'none';
        }
        
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

console.log('✅ 過去バージョン忠実・統一対応顧客フォームスクリプト準備完了');
