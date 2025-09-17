// Stripe設定 - クライアントサイド版
console.log('Stripe クライアントサイド設定読み込み中...');

window.StripeConfig = {
    publishableKey: 'pk_test_51S0lpPQMLO8hZlngadKDIkD4iTHSC9HCIeZxdAYl8wvqLtLN0ckuENttiDGzg5AUodyXJiTbufH22FCRcwvkPD8y00tVSGZZ3L',
    
    stripe: null,
    
    init: function() {
        if (window.Stripe && this.publishableKey.startsWith('pk_test_')) {
            this.stripe = window.Stripe(this.publishableKey);
            console.log('Stripe初期化完了');
            return true;
        } else {
            console.error('Stripe初期化失敗');
            return false;
        }
    },
    
    // 直接Stripe Checkoutにリダイレクト
    redirectToCheckout: async function(priceId, planName) {
        if (!this.stripe) {
            console.error('Stripeが初期化されていません');
            alert('決済システムの初期化でエラーが発生しました');
            return false;
        }
        
        try {
            console.log(`Stripe Checkout開始: ${planName} (${priceId})`);
            
            const { error } = await this.stripe.redirectToCheckout({
                lineItems: [
                    {
                        price: priceId,
                        quantity: 1,
                    }
                ],
                mode: 'subscription',
                successUrl: window.location.origin + '/checkout-success.html',
                cancelUrl: window.location.origin + '/pricing.html',
            });
            
            if (error) {
                console.error('Checkout エラー:', error);
                alert('決済ページへの移動でエラーが発生しました: ' + error.message);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('決済処理エラー:', error);
            alert('決済処理でエラーが発生しました: ' + error.message);
            return false;
        }
    }
};

console.log('Stripe クライアントサイド設定完了');
