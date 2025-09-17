// クイック登録機能
function showQuickRegisterModal() {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('quickRegisterModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'quickRegisterModal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>⚡ クイック顧客登録</h2>
                <button onclick="closeQuickRegisterModal()" class="btn-close" type="button">×</button>
            </div>
            <form id="quickRegisterForm" onsubmit="submitQuickRegister(event)">
                <div class="modal-body">
                    <p style="color: #64748b; margin-bottom: 20px;">
                        電話中でも素早く登録。詳細は後から編集できます。
                    </p>
                    
                    <div class="form-group">
                        <label for="quickName">お名前 <span class="required">*</span></label>
                        <input type="text" id="quickName" name="name" required 
                               placeholder="例: 山田 太郎" style="width: 100%;">
                    </div>
                    
                    <div class="form-group">
                        <label for="quickPhone">電話番号 <span class="required">*</span></label>
                        <input type="tel" id="quickPhone" name="phone" required 
                               placeholder="例: 090-1234-5678" style="width: 100%;">
                    </div>
                    
                    <div class="form-group">
                        <label for="quickEmail">メールアドレス</label>
                        <input type="email" id="quickEmail" name="email" 
                               placeholder="例: yamada@example.com" style="width: 100%;">
                    </div>
                    
                    <div class="form-group">
                        <label for="quickStatus">ステータス</label>
                        <select id="quickStatus" name="status" style="width: 100%;">
                            <option value="初回相談" selected>初回相談</option>
                            <option value="物件紹介">物件紹介</option>
                            <option value="内見">内見</option>
                            <option value="申込">申込</option>
                            <option value="審査">審査</option>
                            <option value="契約">契約</option>
                            <option value="完了">完了</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="quickNote">メモ・要望</label>
                        <textarea id="quickNote" name="note" rows="3" 
                                  placeholder="例: 3月末までに引っ越し希望、ペット可物件希望"
                                  style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" onclick="closeQuickRegisterModal()" class="btn btn-outline">キャンセル</button>
                    <button type="submit" class="btn btn-primary">⚡ 登録する</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeQuickRegisterModal() {
    const modal = document.getElementById('quickRegisterModal');
    if (modal) {
        modal.remove();
    }
}

function submitQuickRegister(event) {
    event.preventDefault();
    
    const formData = {
        id: `customer_${Date.now()}`,
        name: document.getElementById('quickName').value,
        phone: document.getElementById('quickPhone').value,
        email: document.getElementById('quickEmail').value || '',
        pipelineStatus: document.getElementById('quickStatus').value,
        notes: document.getElementById('quickNote').value || '',
        preferences: {
            budgetMin: null,
            budgetMax: null,
            areas: [],
            roomType: '',
            requirements: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'quick_register'
    };

    // 既存の顧客データを取得
    const customers = JSON.parse(localStorage.getItem('rentpipe_demo_customers') || '[]');
    
    // 新規顧客を追加
    customers.push(formData);
    
    // 保存
    localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
    
    // モーダルを閉じる
    closeQuickRegisterModal();
    
    // 成功メッセージ
    alert(`✅ ${formData.name}様を登録しました`);
    
    // ページをリロードして一覧を更新
    if (typeof loadCustomers === 'function') {
        loadCustomers();
    } else {
        location.reload();
    }
}

// ページ読み込み時にボタンにイベントを設定
document.addEventListener('DOMContentLoaded', function() {
    const quickRegisterBtn = document.getElementById('quickRegisterBtn');
    if (quickRegisterBtn) {
        quickRegisterBtn.addEventListener('click', showQuickRegisterModal);
    }
});
