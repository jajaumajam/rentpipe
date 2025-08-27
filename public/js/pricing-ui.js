// RentPipe 料金プランUI管理 - 修正版
console.log('💰 料金プランUI初期化中...');

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 DOM読み込み完了 - プラン表示開始...');
    
    // プラン設定が読み込まれているか確認
    if (!window.RentPipePlans) {
        console.error('❌ プラン設定が見つかりません');
        return;
    }
    
    // グリッド要素が存在するか確認
    const pricingGrid = document.getElementById('pricingGrid');
    if (!pricingGrid) {
        console.error('❌ pricingGrid要素が見つかりません');
        return;
    }
    
    console.log('✅ 必要な要素確認完了、プラン表示開始');
    renderPricingPlans();
});

// プラン表示関数
function renderPricingPlans() {
    const pricingGrid = document.getElementById('pricingGrid');
    const plans = window.RentPipePlans.plans;
    
    console.log('📋 表示するプラン数:', Object.keys(plans).length);
    
    // 各プランのカード作成
    Object.values(plans).forEach((plan, index) => {
        console.log(`📋 プラン${index + 1}作成中: ${plan.name}`);
        const planCard = createPlanCard(plan);
        pricingGrid.appendChild(planCard);
    });

    console.log('✅ 全プランカード表示完了');
}

// プランカード作成
function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = `plan-card${plan.popular ? ' popular' : ''}`;
    
    // 人気バッジ
    const popularBadge = plan.popular ? '<div class="popular-badge">人気プラン</div>' : '';
    
    // 機能リスト作成
    const featuresList = Object.entries(plan.features)
        .map(([key, included]) => {
            const description = window.RentPipePlans.featureDescriptions[key] || key;
            return `<li class="${included ? 'included' : 'excluded'}">${description}</li>`;
        })
        .join('');

    // 価格表示
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

// プラン選択処理
function selectPlan(planId) {
    console.log(`📋 プラン選択: ${planId}`);
    
    const plan = window.RentPipePlans.getPlan(planId);
    
    if (planId === 'free') {
        alert(`${plan.name}プランが選択されました。\n無料でご利用いただけます！`);
    } else {
        alert(`${plan.name}プラン（月額${plan.price.toLocaleString()}円）が選択されました。\n\nStripe決済統合は次のステップで実装します。`);
    }
}

console.log('✅ 料金プランUI準備完了');
