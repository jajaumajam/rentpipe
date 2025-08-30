// 顧客詳細デバッグ機能
console.log('🐛 顧客詳細デバッグ機能開始...');

// 顧客データの確認
function debugCustomerData() {
    console.log('=== 顧客データデバッグ ===');
    
    // ローカルストレージの確認
    const customerData = localStorage.getItem('rentpipe_demo_customers');
    if (customerData) {
        const customers = JSON.parse(customerData);
        console.log(`📊 総顧客数: ${customers.length}`);
        console.log('顧客一覧:', customers.map(c => ({ id: c.id, name: c.name })));
    } else {
        console.log('❌ 顧客データが見つかりません');
    }
}

// 顧客詳細リンクのテスト
function testCustomerDetailLink(customerId) {
    console.log(`🔗 詳細リンクテスト: ${customerId}`);
    
    if (!customerId) {
        console.error('❌ 顧客IDが指定されていません');
        return;
    }
    
    // データ存在確認
    const customerData = localStorage.getItem('rentpipe_demo_customers');
    if (customerData) {
        const customers = JSON.parse(customerData);
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            console.log('✅ 顧客データ見つかりました:', customer);
            // 詳細ページに遷移
            const url = `customer-detail.html?id=${customerId}`;
            console.log(`🔄 遷移先URL: ${url}`);
            window.location.href = url;
        } else {
            console.error(`❌ ID: ${customerId} の顧客が見つかりません`);
            alert(`顧客ID ${customerId} のデータが見つかりません`);
        }
    } else {
        console.error('❌ 顧客データが存在しません');
        alert('顧客データが見つかりません。ページを再読み込みしてください。');
    }
}

// 顧客カードの詳細ボタンを強化版に置き換え
function enhanceDetailButtons() {
    console.log('🔧 詳細ボタンを強化版に置き換え中...');
    
    const customerCards = document.querySelectorAll('.customer-card');
    console.log(`📋 見つかった顧客カード数: ${customerCards.length}`);
    
    customerCards.forEach((card, index) => {
        const customerId = card.dataset.customerId;
        console.log(`カード${index + 1}: ID = ${customerId}`);
        
        if (!customerId) {
            console.warn(`❌ カード${index + 1}にIDが設定されていません`);
            return;
        }
        
        // 既存のボタンを削除
        const existingBtn = card.querySelector('.detail-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // 強化版詳細ボタンを追加
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn btn-sm btn-primary detail-btn-enhanced';
        detailBtn.innerHTML = '👀 詳細表示';
        detailBtn.style.cssText = `
            font-size: 12px; 
            padding: 6px 12px; 
            margin: 8px 0; 
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        `;
        
        detailBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ 詳細ボタンクリック: ${customerId}`);
            testCustomerDetailLink(customerId);
        };
        
        // カードに追加
        card.appendChild(detailBtn);
    });
}

// パイプラインカードも同様に強化
function enhancePipelineDetailButtons() {
    const pipelineCards = document.querySelectorAll('.pipeline-card');
    console.log(`📊 見つかったパイプラインカード数: ${pipelineCards.length}`);
    
    pipelineCards.forEach((card, index) => {
        const customerId = card.dataset.customerId;
        console.log(`パイプラインカード${index + 1}: ID = ${customerId}`);
        
        if (!customerId) return;
        
        // 既存のリンクを削除
        const existingLink = card.querySelector('.detail-link');
        if (existingLink) {
            existingLink.remove();
        }
        
        // 強化版詳細リンクを追加
        const detailLink = document.createElement('div');
        detailLink.className = 'detail-link-enhanced';
        detailLink.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
            z-index: 10;
        `;
        detailLink.innerHTML = '👀';
        detailLink.title = `${card.querySelector('.customer-name')?.textContent || '顧客'}の詳細表示`;
        detailLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ パイプライン詳細リンククリック: ${customerId}`);
            testCustomerDetailLink(customerId);
        };
        
        // カードのposition設定
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
        
        card.appendChild(detailLink);
    });
}

// グローバル関数として公開
window.debugCustomerData = debugCustomerData;
window.testCustomerDetailLink = testCustomerDetailLink;
window.enhanceDetailButtons = enhanceDetailButtons;
window.enhancePipelineDetailButtons = enhancePipelineDetailButtons;

// 自動実行
setTimeout(() => {
    debugCustomerData();
    enhanceDetailButtons();
    enhancePipelineDetailButtons();
}, 1000);

console.log('✅ 顧客詳細デバッグ機能準備完了');
