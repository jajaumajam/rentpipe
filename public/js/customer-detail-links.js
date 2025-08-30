// 顧客詳細ページリンク機能
console.log('🔗 顧客詳細リンク機能を初期化中...');

// 既存の顧客カード生成に詳細ボタンを追加
function addDetailLinksToCustomerCards() {
    // 既存の顧客カードに詳細ボタンを追加
    const customerCards = document.querySelectorAll('.customer-card');
    
    customerCards.forEach(card => {
        const customerId = card.dataset.customerId;
        if (!customerId) return;
        
        // 既存の詳細ボタンがあるかチェック
        if (card.querySelector('.detail-btn')) return;
        
        // 詳細ボタンを作成
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn btn-sm btn-outline detail-btn';
        detailBtn.innerHTML = '👀 詳細';
        detailBtn.style.cssText = 'font-size: 12px; padding: 4px 8px; margin-left: 8px;';
        detailBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewCustomerDetail(customerId);
        };
        
        // カードのアクション部分に追加
        const cardActions = card.querySelector('.card-actions, .customer-actions, .customer-controls');
        if (cardActions) {
            cardActions.appendChild(detailBtn);
        } else {
            // アクション部分がない場合は、カードの最後に追加
            const actionDiv = document.createElement('div');
            actionDiv.className = 'card-actions';
            actionDiv.style.cssText = 'margin-top: 10px; text-align: right;';
            actionDiv.appendChild(detailBtn);
            card.appendChild(actionDiv);
        }
    });
}

// 顧客詳細ページへの遷移
function viewCustomerDetail(customerId) {
    if (!customerId) {
        alert('顧客IDが取得できませんでした');
        return;
    }
    
    console.log(`🔍 顧客詳細表示: ${customerId}`);
    window.location.href = `customer-detail.html?id=${customerId}`;
}

// パイプラインカードにも詳細リンクを追加
function addDetailLinksToPipelineCards() {
    const pipelineCards = document.querySelectorAll('.pipeline-card');
    
    pipelineCards.forEach(card => {
        const customerId = card.dataset.customerId;
        if (!customerId) return;
        
        // 既存の詳細リンクがあるかチェック
        if (card.querySelector('.detail-link')) return;
        
        // クリックで詳細ページに遷移
        const detailLink = document.createElement('div');
        detailLink.className = 'detail-link';
        detailLink.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        detailLink.innerHTML = '👀';
        detailLink.title = '詳細表示';
        detailLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewCustomerDetail(customerId);
        };
        
        // カードのposition設定
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
        
        card.appendChild(detailLink);
    });
}

// 既存のレンダリング関数をオーバーライド
function enhanceExistingCustomerRendering() {
    // MutationObserverで動的に追加された要素を監視
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 顧客カードが追加された場合
                        if (node.classList?.contains('customer-card') || 
                            node.querySelector?.('.customer-card')) {
                            setTimeout(addDetailLinksToCustomerCards, 100);
                        }
                        
                        // パイプラインカードが追加された場合
                        if (node.classList?.contains('pipeline-card') || 
                            node.querySelector?.('.pipeline-card')) {
                            setTimeout(addDetailLinksToPipelineCards, 100);
                        }
                    }
                });
            }
        });
    });
    
    // 監視開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 初回実行
    setTimeout(() => {
        addDetailLinksToCustomerCards();
        addDetailLinksToPipelineCards();
    }, 500);
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceExistingCustomerRendering);
} else {
    enhanceExistingCustomerRendering();
}

// グローバル関数として公開
window.viewCustomerDetail = viewCustomerDetail;
window.addDetailLinksToCustomerCards = addDetailLinksToCustomerCards;
window.addDetailLinksToPipelineCards = addDetailLinksToPipelineCards;

console.log('✅ 顧客詳細リンク機能準備完了');
