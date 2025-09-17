// 共有デモアカウント設定
console.log('🔄 共有デモアカウント設定適用中...');

// 固定のデモテナントID
const SHARED_DEMO_TENANT_ID = 'shared-demo-tenant-2024';

// FirebaseDataManagerの getCurrentTenantId を上書き
if (window.FirebaseDataManager) {
    console.log('📊 共有デモモード: 固定テナントID使用');
    
    window.FirebaseDataManager.getCurrentTenantId = function() {
        return SHARED_DEMO_TENANT_ID;
    };
    
    console.log(`✅ 共有テナントID: ${SHARED_DEMO_TENANT_ID}`);
} else {
    console.warn('⚠️ FirebaseDataManagerが見つかりません');
}

console.log('✅ 共有デモアカウント設定完了');
