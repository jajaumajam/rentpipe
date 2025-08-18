
// フォームURL生成機能
function showFormURLModal() {
    const modal = document.createElement('div');
    modal.id = 'formURLModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;

    const agentName = 'デモエージェント'; // 実際はログイン情報から取得
    const agentId = 'demo-agent';
    const formURL = `${window.location.origin}/customer-form.html?agent=${agentId}&name=${encodeURIComponent(agentName)}`;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
        ">
            <h2 style="margin-bottom: 20px; color: #1e293b;">顧客入力フォーム URL</h2>
            
            <p style="color: #64748b; margin-bottom: 20px;">
                このURLを顧客に送信すると、顧客が直接情報を入力できます。<br>
                入力された情報は自動的にあなたの顧客リストに追加されます。
            </p>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">フォームURL</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" 
                           id="formURLInput" 
                           value="${formURL}"
                           readonly
                           style="
                               flex: 1;
                               padding: 12px 16px;
                               border: 2px solid #e2e8f0;
                               border-radius: 8px;
                               background: #f8fafc;
                               font-family: monospace;
                               font-size: 14px;
                           ">
                    <button onclick="copyFormURL()" style="
                        padding: 12px 20px;
                        background: #1e3a8a;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">コピー</button>
                </div>
            </div>

            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px; color: #1e293b;">使用方法</h4>
                <ol style="margin: 0; padding-left: 20px; color: #64748b;">
                    <li>上記URLをコピー</li>
                    <li>メール、LINE、SMSで顧客に送信</li>
                    <li>顧客が情報を入力・送信</li>
                    <li>自動的に顧客管理に追加</li>
                </ol>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeFormURLModal()" style="
                    padding: 10px 20px;
                    border: 2px solid #e2e8f0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">閉じる</button>
                <a href="${formURL}" target="_blank" style="
                    padding: 10px 20px;
                    background: #22c55e;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                ">プレビュー</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function copyFormURL() {
    const input = document.getElementById('formURLInput');
    input.select();
    document.execCommand('copy');
    
    // コピー完了通知
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'コピー完了！';
    button.style.background = '#22c55e';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#1e3a8a';
    }, 2000);
}

function closeFormURLModal() {
    const modal = document.getElementById('formURLModal');
    if (modal) {
        modal.remove();
    }
}

// 新規顧客登録モーダル表示
function showAddCustomerModal() {
    const modal = document.createElement('div');
    modal.id = 'addCustomerModal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>新規顧客登録</h2>
                <button onclick="closeAddCustomerModal()" class="btn-close">×</button>
            </div>
            
            <form id="addCustomerForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="customerName" class="form-label required">お名前</label>
                        <input type="text" id="customerName" name="name" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerEmail" class="form-label required">メールアドレス</label>
                        <input type="email" id="customerEmail" name="email" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerPhone" class="form-label required">電話番号</label>
                        <input type="tel" id="customerPhone" name="phone" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerAge" class="form-label">年齢</label>
                        <input type="number" id="customerAge" name="age" class="form-input" min="18" max="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="customerOccupation" class="form-label">職業</label>
                        <select id="customerOccupation" name="occupation" class="form-input">
                            <option value="">選択してください</option>
                            <option value="会社員">会社員</option>
                            <option value="公務員">公務員</option>
                            <option value="自営業">自営業</option>
                            <option value="フリーランス">フリーランス</option>
                            <option value="学生">学生</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerIncome" class="form-label">年収（万円）</label>
                        <input type="number" id="customerIncome" name="annualIncome" class="form-input" min="0">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="customerBudgetMin" class="form-label">予算（家賃）</label>
                        <div class="budget-inputs">
                            <input type="number" id="customerBudgetMin" name="budgetMin" class="form-input" placeholder="最低金額">
                            <span>〜</span>
                            <input type="number" id="customerBudgetMax" name="budgetMax" class="form-input" placeholder="最高金額">
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="customerNotes" class="form-label">備考</label>
                        <textarea id="customerNotes" name="notes" class="form-input" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" onclick="closeAddCustomerModal()" class="btn btn-outline">キャンセル</button>
                    <button type="submit" class="btn btn-primary">顧客を登録</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // フォーム送信イベント
    document.getElementById('addCustomerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitNewCustomer();
    });
}

// 新規顧客登録モーダルを閉じる
function closeAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.remove();
    }
}

// 新規顧客データ送信
async function submitNewCustomer() {
    try {
        const formData = new FormData(document.getElementById('addCustomerForm'));
        
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            age: parseInt(formData.get('age')) || null,
            occupation: formData.get('occupation'),
            annualIncome: parseInt(formData.get('annualIncome')) || null,
            preferences: {
                budgetMin: parseInt(formData.get('budgetMin')) || null,
                budgetMax: parseInt(formData.get('budgetMax')) || null,
                areas: [],
                roomType: '',
                requirements: []
            },
            notes: formData.get('notes'),
            pipelineStatus: '初回相談',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'manual'
        };

        // バリデーション
        if (!customerData.name || !customerData.email || !customerData.phone) {
            alert('名前、メールアドレス、電話番号は必須です。');
            return;
        }

        // データ保存（デモ環境では実際には保存しない）
        console.log('新規顧客データ:', customerData);
        
        // ローカルストレージに保存（デモ用）
        const existingCustomers = JSON.parse(localStorage.getItem('demoCustomers') || '[]');
        customerData.id = `manual-${Date.now()}`;
        existingCustomers.push(customerData);
        localStorage.setItem('demoCustomers', JSON.stringify(existingCustomers));

        // 顧客リストを更新
        if (window.customerManager) {
            customerManager.customers.push(customerData);
            customerManager.renderCustomers();
            customerManager.updateStats();
        }

        // 成功メッセージ
        alert(`${customerData.name} 様を顧客リストに追加しました！`);
        
        // モーダルを閉じる
        closeAddCustomerModal();

    } catch (error) {
        console.error('顧客登録エラー:', error);
        alert('顧客登録に失敗しました。もう一度お試しください。');
    }
}

// モバイル対応の新規顧客登録機能
function showAddCustomerModalMobile() {
    console.log('showAddCustomerModal called on mobile');
    
    try {
        // 既存のモーダルがあれば削除
        const existingModal = document.getElementById('addCustomerModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'addCustomerModal';
        modal.className = 'modal mobile-modal';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-content mobile-modal-content">
                <div class="modal-header mobile-modal-header">
                    <h2>新規顧客登録</h2>
                    <button onclick="closeAddCustomerModal()" class="btn-close mobile-btn-close" type="button">×</button>
                </div>
                
                <form id="addCustomerForm" class="mobile-form">
                    <div class="form-grid mobile-form-grid">
                        <div class="form-group">
                            <label for="customerName" class="form-label required">お名前</label>
                            <input type="text" id="customerName" name="name" class="form-input mobile-form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="customerEmail" class="form-label required">メールアドレス</label>
                            <input type="email" id="customerEmail" name="email" class="form-input mobile-form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="customerPhone" class="form-label required">電話番号</label>
                            <input type="tel" id="customerPhone" name="phone" class="form-input mobile-form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="customerAge" class="form-label">年齢</label>
                            <input type="number" id="customerAge" name="age" class="form-input mobile-form-input" min="18" max="100">
                        </div>
                        
                        <div class="form-group">
                            <label for="customerOccupation" class="form-label">職業</label>
                            <select id="customerOccupation" name="occupation" class="form-input mobile-form-input">
                                <option value="">選択してください</option>
                                <option value="会社員">会社員</option>
                                <option value="公務員">公務員</option>
                                <option value="自営業">自営業</option>
                                <option value="フリーランス">フリーランス</option>
                                <option value="学生">学生</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="customerIncome" class="form-label">年収（万円）</label>
                            <input type="number" id="customerIncome" name="annualIncome" class="form-input mobile-form-input" min="0">
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="customerBudgetMin" class="form-label">予算（家賃）</label>
                            <div class="budget-inputs mobile-budget-inputs">
                                <input type="number" id="customerBudgetMin" name="budgetMin" class="form-input mobile-form-input" placeholder="最低金額">
                                <span>〜</span>
                                <input type="number" id="customerBudgetMax" name="budgetMax" class="form-input mobile-form-input" placeholder="最高金額">
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="customerNotes" class="form-label">備考</label>
                            <textarea id="customerNotes" name="notes" class="form-input mobile-form-input" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-actions mobile-modal-actions">
                        <button type="button" onclick="closeAddCustomerModal()" class="btn btn-outline mobile-btn">キャンセル</button>
                        <button type="submit" class="btn btn-primary mobile-btn">顧客を登録</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        
        // フォーム送信イベント（タッチデバイス対応）
        const form = document.getElementById('addCustomerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted on mobile');
            await submitNewCustomer();
        });
        
        // モーダル外タップで閉じる（モバイル対応）
        modal.addEventListener('touchstart', (e) => {
            if (e.target === modal) {
                closeAddCustomerModal();
            }
        });
        
        console.log('Mobile modal created successfully');
        
    } catch (error) {
        console.error('Error creating mobile modal:', error);
        alert('モーダルの表示に失敗しました: ' + error.message);
    }
}

// デバイス判定
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// 統一された新規顧客登録関数（デバイス自動判定）
function showAddCustomerModalUnified() {
    console.log('Device check:', isMobileDevice() ? 'Mobile' : 'Desktop');
    
    if (isMobileDevice()) {
        showAddCustomerModalMobile();
    } else {
        showAddCustomerModal();
    }
}

// デバッグ用：ボタンクリックテスト
function testButtonClick() {
    console.log('Button clicked!');
    alert('ボタンが正常にクリックされました！');
}

// モバイル用のタッチイベント改善
document.addEventListener('DOMContentLoaded', function() {
    // モバイルデバイスかどうかをチェック
    if (isMobileDevice()) {
        console.log('Mobile device detected, applying mobile enhancements');
        
        // すべてのボタンにタッチ対応を追加
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // 新規顧客登録ボタンがあれば、イベントリスナーを追加
        setTimeout(() => {
            const addCustomerBtn = document.querySelector('button[onclick*="showAddCustomerModal"]');
            if (addCustomerBtn) {
                console.log('Found add customer button, adding mobile events');
                
                // 既存のonclick属性を削除して、新しいイベントリスナーを追加
                addCustomerBtn.removeAttribute('onclick');
                addCustomerBtn.addEventListener('click', showAddCustomerModalUnified);
                addCustomerBtn.addEventListener('touchend', showAddCustomerModalUnified);
                
                console.log('Mobile events added to add customer button');
            }
        }, 1000);
    }
});

// モバイルデバッグ機能
function initMobileDebug() {
    const debugElement = document.getElementById('mobileDebug');
    const deviceType = document.getElementById('deviceType');
    const screenSize = document.getElementById('screenSize');
    
    if (debugElement && deviceType && screenSize) {
        deviceType.textContent = isMobileDevice() ? 'Mobile' : 'Desktop';
        screenSize.textContent = `${window.innerWidth}x${window.innerHeight}`;
        
        // URLパラメータでデバッグ表示
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            debugElement.classList.add('show');
        }
        
        // 画面サイズ変更時に更新
        window.addEventListener('resize', () => {
            screenSize.textContent = `${window.innerWidth}x${window.innerHeight}`;
        });
    }
}

// タッチイベントテスト
function testTouchEvents() {
    console.log('Testing touch events on mobile');
    
    const testButton = document.createElement('button');
    testButton.textContent = 'タッチテスト';
    testButton.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        padding: 20px;
        background: red;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
    `;
    
    testButton.addEventListener('click', () => {
        alert('タッチイベント正常動作！');
        testButton.remove();
    });
    
    testButton.addEventListener('touchstart', () => {
        console.log('Touch start detected');
    });
    
    testButton.addEventListener('touchend', () => {
        console.log('Touch end detected');
    });
    
    document.body.appendChild(testButton);
    
    // 5秒後に自動削除
    setTimeout(() => {
        if (testButton.parentNode) {
            testButton.remove();
        }
    }, 5000);
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing mobile features');
    
    // デバッグ機能初期化
    setTimeout(initMobileDebug, 100);
    
    // モバイルデバイスの場合、追加の初期化
    if (isMobileDevice()) {
        console.log('Mobile device detected, initializing mobile-specific features');
        
        // URLに ?test=true が含まれている場合、タッチテストを表示
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true') {
            setTimeout(testTouchEvents, 2000);
        }
    }
});

// クイック登録モーダル（エージェント用）
function showQuickRegisterModal() {
    const modal = document.createElement('div');
    modal.id = 'quickRegisterModal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>⚡ クイック登録</h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">
                    電話中に素早く基本情報を登録できます
                </p>
                <button onclick="closeQuickRegisterModal()" class="btn-close">×</button>
            </div>
            
            <form id="quickRegisterForm">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label for="quickName" class="form-label required">お名前</label>
                        <input type="text" id="quickName" name="name" class="form-input" required 
                               placeholder="例: 田中太郎">
                    </div>
                    
                    <div class="form-group">
                        <label for="quickEmail" class="form-label">メールアドレス</label>
                        <input type="email" id="quickEmail" name="email" class="form-input" 
                               placeholder="例: tanaka@example.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="quickPhone" class="form-label required">電話番号</label>
                        <input type="tel" id="quickPhone" name="phone" class="form-input" required
                               placeholder="例: 090-1234-5678">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="quickNotes" class="form-label">メモ・要望</label>
                        <textarea id="quickNotes" name="notes" class="form-input" rows="3" 
                                  placeholder="例: 急ぎで物件をお探し。渋谷エリア希望。"></textarea>
                    </div>
                </div>
                
                <div class="quick-register-info">
                    <p>💡 <strong>ヒント:</strong> 基本情報のみ登録して、詳細は後で編集できます</p>
                    <p>📝 完全な顧客フォームは「顧客フォーム」ボタンから顧客に送信できます</p>
                </div>
                
                <div class="modal-actions">
                    <button type="button" onclick="closeQuickRegisterModal()" class="btn btn-outline">キャンセル</button>
                    <button type="submit" class="btn btn-primary">⚡ 登録する</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // フォーム送信イベント
    document.getElementById('quickRegisterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitQuickRegister();
    });
}

// クイック登録モーダルを閉じる
function closeQuickRegisterModal() {
    const modal = document.getElementById('quickRegisterModal');
    if (modal) {
        modal.remove();
    }
}

// クイック登録データ送信
async function submitQuickRegister() {
    try {
        const formData = new FormData(document.getElementById('quickRegisterForm'));
        
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            notes: formData.get('notes'),
            pipelineStatus: '初回相談',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'quick_register',
            // 詳細情報は空で作成（後で編集可能）
            age: null,
            occupation: '',
            annualIncome: null,
            preferences: {
                budgetMin: null,
                budgetMax: null,
                areas: [],
                roomType: '',
                requirements: []
            }
        };

        // バリデーション
        if (!customerData.name || !customerData.phone) {
            alert('名前と電話番号は必須です。');
            return;
        }

        // データ保存
        console.log('クイック登録データ:', customerData);
        
        // ローカルストレージに保存（デモ用）
        const existingCustomers = JSON.parse(localStorage.getItem('demoCustomers') || '[]');
        customerData.id = `quick-${Date.now()}`;
        existingCustomers.push(customerData);
        localStorage.setItem('demoCustomers', JSON.stringify(existingCustomers));

        // 顧客リストを更新
        if (window.customerManager) {
            customerManager.customers.push(customerData);
            customerManager.renderCustomers();
            customerManager.updateStats();
        }

        // 成功メッセージ
        alert(`${customerData.name} 様をクイック登録しました！\n詳細情報は後で編集できます。`);
        
        // モーダルを閉じる
        closeQuickRegisterModal();

    } catch (error) {
        console.error('クイック登録エラー:', error);
        alert('クイック登録に失敗しました。もう一度お試しください。');
    }
}
