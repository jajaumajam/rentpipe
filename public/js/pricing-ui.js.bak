// RentPipe 料金プランUI管理 - クライアントサイドStripe版
console.log('料金プランUI初期化中...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了 - プラン表示開始...');
    
    if (!window.RentPipePlans) {
        console.error('プラン設定が見つかりません');
        return;
    }
    
    const pricingGrid = document.getElementById('pricingGrid');
    if (!pricingGrid) {
        console.error('pricingGrid要素が見つかりません');
        return;
    }
    
    // Stripe初期化
    initializeStripe();
    
    console.log('必要な要素確認完了、プラン表示開始');
    renderPricingPlans();
});

// Stripe初期化
function initializeStripe() {
    if (window.StripeConfig) {
        setTimeout(() => {
            window.StripeConfig.init();
        }, 1000);
    }
}

// プラン表示関数
function renderPricingPlans() {
    const pricingGrid = document.getElementById('pricingGrid');
    const plans = window.RentPipePlans.plans;
    
    console.log('表示するプラン数:', Object.keys(plans).length);
    
    Object.values(plans).forEach((plan, index) => {
        console.log(`プラン${index + 1}作成中: ${plan.name}`);
        const planCard = createPlanCard(plan);
        pricingGrid.appendChild(planCard);
    });

    console.log('全プランカード表示完了');
}

// プランカード作成
function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = `plan-card${plan.popular ? ' popular' : ''}`;
    
    const popularBadge = plan.popular ? '<div class="popular-badge">人気プラン</div>' : '';
    
    const featuresList = Object.entries(plan.features)
        .map(([key, included]) => {
            const description = window.RentPipePlans.featureDescriptions[key] || key;
            return `<li class="${included ? 'included' : 'excluded'}">${description}</li>`;
        })
        .join('');

    const priceDisplay = plan.price === 0 
        ? '<div class="plan-price">無料</div>'
        : `<div class="plan-price">${plan.price.toLocaleString()}<span class="currency">円</span></div>`;

    card.innerHTML = `
        ${popularBadge}
        <div class="plan-name">${plan.name}</div>
        ${priceDisplay}
        <div class="plan-interval">${plan.price === 0 ? '' : '/ 月額'}</div>
        <div class="plan-description">${plan.description}</div>
        <div class="plan-description">顧客数上限: ${plan.customerLimit}人</div>
        <ul class="plan-features">
            ${featuresList}
        </ul>
        <button class="plan-button ${plan.id === 'free' ? 'free' : plan.popular ? 'popular' : 'paid'}" 
                onclick="selectPlan('${plan.id}')">
            ${plan.buttonText}
        </button>
    `;

    return card;
}

// プラン選択処理 - クライアントサイドStripe版
function selectPlan(planId) {
    console.log(`プラン選択: ${planId}`);
    
    const plan = window.RentPipePlans.getPlan(planId);
    
    if (planId === 'free') {
        alert(`${plan.name}プランが選択されました。\n無料でご利用いただけます！`);
        // フリープランの場合はメインアプリケーションにリダイレクト
        window.location.href = 'index.html';
        return;
    }
    
    // 有料プランの場合はStripe Checkout
    if (!plan.stripePrice) {
        alert('申し訳ございません。このプランは現在準備中です。');
        return;
    }
    
    if (!window.StripeConfig || !window.StripeConfig.stripe) {
        alert('決済システムの初期化中です。しばらくしてからお試しください。');
        return;
    }
    
    // 確認ダイアログ
    const confirmMessage = `${plan.name}プラン（月額${plan.price.toLocaleString()}円）を選択しますか？\n\n14日間の無料トライアル後に課金が開始されます。`;
    
    if (confirm(confirmMessage)) {
        // Stripe Checkout実行
        window.StripeConfig.redirectToCheckout(plan.stripePrice, plan.name);
    }
}

console.log('料金プランUI準備完了');
