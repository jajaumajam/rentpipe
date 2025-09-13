// 📊 顧客データローダー（修正版）
console.log('📊 顧客データローダー初期化中...');

window.CustomerDataLoader = {
    // 顧客データ読み込み
    loadCustomers: function() {
        try {
            console.log('📊 顧客データ読み込み開始...');
            
            // ローカルストレージから顧客データ取得
            const customersJson = localStorage.getItem('customers');
            let customers = [];
            
            if (customersJson) {
                customers = JSON.parse(customersJson);
                console.log('✅ 既存顧客データ読み込み完了:', customers.length + '件');
            } else {
                console.log('⚠️ 顧客データが見つかりません');
            }
            
            // 顧客データがない場合は空配列を返す
            return customers;
            
        } catch (error) {
            console.error('❌ 顧客データ読み込みエラー:', error);
            return [];
        }
    },
    
    // 顧客リスト表示
    displayCustomers: function(customers) {
        const customerList = document.getElementById('customer-list');
        if (!customerList) {
            console.warn('⚠️ customer-list要素が見つかりません');
            return;
        }
        
        console.log('🎨 顧客リスト表示中:', customers.length + '件');
        
        if (customers.length === 0) {
            customerList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;">
                    <div style="font-size: 48px; margin-bottom: 15px;">👥</div>
                    <h3>まだ顧客が登録されていません</h3>
                    <p>新しい顧客を登録するか、テスト用データを作成してください。</p>
                    <div style="margin-top: 20px;">
                        <a href="customer-form.html" class="btn btn-primary" style="margin-right: 10px;">
                            📝 新規顧客登録
                        </a>
                        <button onclick="createTestCustomersAndReload()" class="btn btn-success">
                            🧪 テストデータ作成
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        customerList.innerHTML = customers.map(customer => {
            const formStatus = customer.googleForm ? 'created' : 'not-created';
            const statusText = customer.googleForm ? 'フォーム作成済み' : 'フォーム未作成';
            const statusClass = customer.googleForm ? 'status-created' : 'status-not-created';
            
            return `
                <div class="customer-card" data-customer-id="${customer.id}">
                    <div class="customer-header">
                        <div class="customer-info">
                            <h3>${customer.name || '名前未設定'}</h3>
                            <div class="customer-meta">
                                ${customer.email || 'メール未設定'} • ${customer.phone || '電話未設定'}
                            </div>
                            <div class="customer-meta">
                                予算: ${this.formatBudget(customer.preferences)} | 
                                エリア: ${this.formatAreas(customer.preferences)}
                            </div>
                            <div class="form-status-indicator ${statusClass}">
                                ${statusText}
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
            `;
        }).join('');
        
        console.log('✅ 顧客リスト表示完了');
    },
    
    // 予算フォーマット
    formatBudget: function(preferences) {
        if (!preferences) return '未設定';
        
        const min = preferences.budgetMin;
        const max = preferences.budgetMax;
        
        if (min && max) {
            return `${min}〜${max}万円`;
        } else if (min) {
            return `${min}万円〜`;
        } else if (max) {
            return `〜${max}万円`;
        } else {
            return '未設定';
        }
    },
    
    // エリアフォーマット
    formatAreas: function(preferences) {
        if (!preferences || !preferences.areas || preferences.areas.length === 0) {
            return '未設定';
        }
        
        return preferences.areas.slice(0, 2).join(', ') + 
               (preferences.areas.length > 2 ? ` 他${preferences.areas.length - 2}件` : '');
    }
};

// グローバル関数として公開
window.loadAndDisplayCustomers = function() {
    const customers = window.CustomerDataLoader.loadCustomers();
    window.CustomerDataLoader.displayCustomers(customers);
};

// テストデータ作成とリロード
window.createTestCustomersAndReload = function() {
    if (window.createTestCustomers) {
        window.createTestCustomers();
        setTimeout(() => {
            window.loadAndDisplayCustomers();
        }, 100);
    } else {
        console.error('❌ createTestCustomers関数が見つかりません');
    }
};

console.log('✅ 顧客データローダー準備完了');
