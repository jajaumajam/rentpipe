
// 顧客詳細ページ専用の強化版ナビゲーション調整
function enhanceNavigationForCustomerDetail() {
    const currentPath = window.location.pathname;
    
    // customer-detail.htmlの場合のみ実行
    if (currentPath.includes('customer-detail.html')) {
        console.log('🎯 顧客詳細ページ: ナビゲーション強制調整開始...');
        
        // MutationObserverでナビゲーション要素の生成を監視
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        // ナビゲーションが追加されたかチェック
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            (node.classList?.contains('navbar') || node.querySelector?.('.navbar'))) {
                            console.log('🔍 ナビゲーション要素検出、調整実行...');
                            setTimeout(forceNavigationHighlight, 100);
                        }
                    });
                }
            });
        });
        
        // body全体を監視
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 定期的にもチェック（フォールバック）
        let attempts = 0;
        const intervalId = setInterval(() => {
            attempts++;
            const navLinks = document.querySelectorAll('.nav-link');
            
            if (navLinks.length > 0) {
                console.log(`📍 ナビゲーションリンク発見（試行${attempts}回目）`);
                forceNavigationHighlight();
                clearInterval(intervalId);
                observer.disconnect();
            }
            
            // 最大10回試行したら諦める
            if (attempts >= 10) {
                console.warn('⚠️ ナビゲーション調整を諦めました');
                clearInterval(intervalId);
                observer.disconnect();
            }
        }, 200);
    }
}

// 強制的にナビゲーションをハイライト
function forceNavigationHighlight() {
    const navLinks = document.querySelectorAll('.nav-link');
    console.log(`🔗 ナビゲーションリンク数: ${navLinks.length}`);
    
    let customerLinkFound = false;
    
    navLinks.forEach((link, index) => {
        const linkHref = link.getAttribute('href') || '';
        const linkText = link.textContent.trim();
        
        console.log(`リンク${index + 1}: ${linkText} → ${linkHref}`);
        
        // 全てのアクティブ状態をクリア
        link.classList.remove('active');
        
        // customer.htmlまたは顧客管理リンクを見つけたらアクティブにする
        if (linkHref.includes('customer.html') || linkText.includes('顧客管理')) {
            link.classList.add('active');
            customerLinkFound = true;
            console.log(`✅ 顧客管理リンクをアクティブに設定: ${linkText}`);
        }
    });
    
    if (!customerLinkFound) {
        console.warn('⚠️ 顧客管理リンクが見つかりませんでした');
        // デバッグ用：全リンクの詳細を表示
        navLinks.forEach((link, index) => {
            console.log(`詳細${index + 1}:`, {
                href: link.getAttribute('href'),
                text: link.textContent,
                classes: link.className
            });
        });
    }
    
    return customerLinkFound;
}

// 複数のタイミングで実行を試行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(enhanceNavigationForCustomerDetail, 100);
    });
} else {
    // すでにDOMが読み込まれている場合
    setTimeout(enhanceNavigationForCustomerDetail, 100);
}

// ページ読み込み完了後にも実行
window.addEventListener('load', () => {
    setTimeout(enhanceNavigationForCustomerDetail, 200);
});

console.log('✅ 顧客詳細ページ用強化版ナビゲーション調整を追加しました');
