// 🎯 シンプル顧客管理システム（フォールバック用）
console.log('🎯 シンプル顧客管理システム初期化中...');

window.CustomerUnified = window.CustomerUnified || {
    // 顧客データ読み込み
    loadCustomers: async function() {
        try {
            console.log('📊 顧客データ読み込み中...');
            
            // ローカルストレージから顧客データ取得
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            
            // 顧客リストを表示
            this.displayCustomers(customers);
            
            console.log('✅ 顧客データ読み込み完了:', customers.length + '件');
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
        }
    },
    
    // 顧客リスト表示
    displayCustomers: function(customers) {
        const customerList = document.getElementById('customer-list');
        if (!customerList) return;
        
        if (customers.length === 0) {
            customerList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 15px;">👥</div>
                    <h3>まだ顧客が登録されていません</h3>
                    <p>新しい顧客を登録してください。</p>
                    <a href="customer-form.html" class="btn btn-primary" style="margin-top: 15px;">
                        📝 新規顧客登録
                    </a>
                </div>
            `;
            return;
        }
        
        customerList.innerHTML = customers.map(customer => `
            <div class="customer-card" data-customer-id="${customer.id}">
                <div class="customer-header">
                    <div class="customer-info">
                        <h3>${customer.name || '名前未設定'}</h3>
                        <div class="customer-meta">
                            ${customer.email || 'メール未設定'} • ${customer.phone || '電話未設定'}
                        </div>
                        <div class="form-status-indicator ${customer.googleForm ? 'status-created' : 'status-not-created'}">
                            ${customer.googleForm ? 'フォーム作成済み' : 'フォーム未作成'}
                        </div>
                    </div>
                    <div class="customer-actions">
                        ${customer.googleForm 
                            ? `<a href="${customer.googleForm.url}" target="_blank" class="btn btn-primary">📝 フォーム確認</a>
                               <a href="${customer.googleForm.responsesUrl}" target="_blank" class="btn btn-success">📊 回答確認</a>`
                            : `<button onclick="createGoogleForm('${customer.id}')" class="btn btn-success">📝 フォーム作成</button>`
                        }
                        <a href="customer-detail.html?id=${customer.id}" class="btn btn-outline">詳細</a>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

console.log('✅ シンプル顧客管理システム準備完了');
