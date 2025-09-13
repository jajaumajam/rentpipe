// テスト用ダミーデータ作成
console.log('🧪 テスト用ダミーデータ作成中...');

const testCustomers = [
    {
        id: 'test-001',
        name: '田中太郎',
        email: 'tanaka@example.com',
        phone: '03-1234-5678',
        pipelineStatus: 'lead',
        preferences: {
            budgetMin: 10,
            budgetMax: 15,
            areas: ['新宿', '渋谷'],
            roomType: '1LDK'
        },
        createdAt: new Date().toISOString()
    },
    {
        id: 'test-002',
        name: '佐藤花子',
        email: 'sato@example.com',
        phone: '03-2345-6789',
        pipelineStatus: 'contact',
        preferences: {
            budgetMin: 8,
            budgetMax: 12,
            areas: ['池袋', '大塚'],
            roomType: 'ワンルーム'
        },
        createdAt: new Date().toISOString()
    }
];

localStorage.setItem('customers', JSON.stringify(testCustomers));
console.log('✅ テスト用ダミーデータ作成完了');
