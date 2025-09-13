// テスト環境セットアップ
const testCustomers = [
    {
        id: 'customer-' + Date.now(),
        name: 'テスト顧客 太郎',
        email: 'test@example.com',
        phone: '03-0000-0000',
        pipelineStatus: 'lead',
        preferences: {
            budgetMin: 10,
            budgetMax: 15,
            areas: ['新宿', '渋谷'],
            roomType: '1LDK',
            requirements: ['ペット可', '楽器可']
        },
        notes: 'テスト用の顧客データです',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual_test'
    }
];

localStorage.setItem('customers', JSON.stringify(testCustomers));
console.log('✅ テスト用顧客データを作成しました');
