// 🧪 テスト用顧客データ自動作成
console.log('🧪 テスト用顧客データ作成中...');

function createTestCustomers() {
    const testCustomers = [
        {
            id: 'test-customer-001',
            name: '田中太郎',
            email: 'tanaka.taro@example.com',
            phone: '03-1234-5678',
            pipelineStatus: 'lead',
            preferences: {
                budgetMin: 10,
                budgetMax: 15,
                areas: ['新宿', '渋谷', '原宿'],
                roomType: '1LDK',
                requirements: ['ペット可', '楽器可']
            },
            notes: 'IT企業勤務。猫を飼っているためペット可物件希望。',
            urgency: 'medium',
            contactTime: 'evening',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'test_data'
        },
        {
            id: 'test-customer-002', 
            name: '佐藤花子',
            email: 'sato.hanako@example.com',
            phone: '03-2345-6789',
            pipelineStatus: 'contact',
            preferences: {
                budgetMin: 8,
                budgetMax: 12,
                areas: ['池袋', '大塚', '巣鴨'],
                roomType: 'ワンルーム',
                requirements: ['駅近', '2階以上']
            },
            notes: '大学院生。予算重視で駅近希望。',
            urgency: 'high',
            contactTime: 'daytime',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'test_data'
        },
        {
            id: 'test-customer-003',
            name: '山田次郎',
            email: 'yamada.jiro@example.com', 
            phone: '03-3456-7890',
            pipelineStatus: 'viewing',
            preferences: {
                budgetMin: 15,
                budgetMax: 20,
                areas: ['恵比寿', '中目黒', '代官山'],
                roomType: '2LDK',
                requirements: ['駐車場', 'オートロック', 'バストイレ別']
            },
            notes: '外資系企業勤務。高級エリア希望。車持ちのため駐車場必須。',
            urgency: 'low',
            contactTime: 'anytime',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'test_data'
        }
    ];
    
    // ローカルストレージに保存
    localStorage.setItem('customers', JSON.stringify(testCustomers));
    
    console.log('✅ テスト用顧客データ作成完了:', testCustomers.length + '件');
    
    return testCustomers;
}

// 自動実行
if (typeof window !== 'undefined') {
    // ブラウザ環境での自動実行
    document.addEventListener('DOMContentLoaded', function() {
        const existingCustomers = localStorage.getItem('customers');
        if (!existingCustomers || JSON.parse(existingCustomers).length === 0) {
            createTestCustomers();
            console.log('🔄 テスト顧客データを自動作成しました');
        }
    });
}

// グローバル関数として公開
window.createTestCustomers = createTestCustomers;
