// 顧客フォーム編集時のステータス維持修正
console.log('📝 顧客フォームステータス維持機能初期化中...');

// フォーム読み込み時に既存ステータスを保持
window.preserveCustomerStatus = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('edit');
    
    if (customerId && window.UnifiedDataManager) {
        const customer = window.UnifiedDataManager.getCustomerById(customerId);
        if (customer) {
            // 既存ステータスを隠しフィールドに保存
            const existingStatus = customer.status || customer.pipelineStatus || '初回相談';
            
            // 隠しフィールドを作成
            let statusField = document.getElementById('preserveStatus');
            if (!statusField) {
                statusField = document.createElement('input');
                statusField.type = 'hidden';
                statusField.id = 'preserveStatus';
                statusField.name = 'preserveStatus';
                document.querySelector('form').appendChild(statusField);
            }
            statusField.value = existingStatus;
            
            console.log(`📋 既存ステータス保持: ${existingStatus}`);
        }
    }
};

// フォーム送信時にステータスを維持
window.maintainStatusOnSave = function(customerData) {
    const preservedStatus = document.getElementById('preserveStatus');
    if (preservedStatus && preservedStatus.value) {
        customerData.status = preservedStatus.value;
        customerData.pipelineStatus = preservedStatus.value;
        console.log(`📋 ステータス維持: ${preservedStatus.value}`);
    }
    return customerData;
};

// DOMContentLoaded時に実行
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(preserveCustomerStatus, 500);
});

console.log('✅ 顧客フォームステータス維持機能準備完了');
