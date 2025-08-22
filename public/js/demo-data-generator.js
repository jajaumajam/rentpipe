// RentPipe デモデータ生成機能
function generateDemoCustomers() {
    const demoCustomers = [
        {
            id: 'demo-1',
            name: '田中 太郎',
            email: 'tanaka@example.com',
            phone: '090-1234-5678',
            pipelineStatus: '初回相談',
            preferences: {
                budgetMin: 80000,
                budgetMax: 120000,
                areas: ['渋谷区', '港区'],
                roomType: '1LDK'
            },
            notes: '駅近希望、ペット可',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo-2',
            name: '佐藤 花子',
            email: 'sato@example.com',
            phone: '080-9876-5432',
            pipelineStatus: '物件紹介',
            preferences: {
                budgetMin: 100000,
                budgetMax: 150000,
                areas: ['目黒区', '世田谷区'],
                roomType: '2LDK'
            },
            notes: 'ファミリー向け物件希望',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'demo-3',
            name: '鈴木 太郎',
            email: 'suzuki@example.com',
            phone: '070-1111-2222',
            pipelineStatus: '内見',
            preferences: {
                budgetMin: 60000,
                budgetMax: 90000,
                areas: ['新宿区'],
                roomType: '1K'
            },
            notes: '学生、保証人あり',
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo-4',
            name: '高橋 美咲',
            email: 'takahashi@example.com',
            phone: '090-3333-4444',
            pipelineStatus: '申込',
            preferences: {
                budgetMin: 70000,
                budgetMax: 100000,
                areas: ['品川区'],
                roomType: '1DK'
            },
            notes: '急ぎ、来月入居希望',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo-5',
            name: '伊藤 一郎',
            email: 'ito@example.com',
            phone: '080-5555-6666',
            pipelineStatus: '審査',
            preferences: {
                budgetMin: 120000,
                budgetMax: 180000,
                areas: ['千代田区'],
                roomType: '2DK'
            },
            notes: '会社員、年収600万',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo-6',
            name: '山田 次郎',
            email: 'yamada@example.com',
            phone: '070-7777-8888',
            pipelineStatus: '契約',
            preferences: {
                budgetMin: 90000,
                budgetMax: 130000,
                areas: ['中央区'],
                roomType: '1LDK'
            },
            notes: '契約書準備中',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo-7',
            name: '木村 聡美',
            email: 'kimura@example.com',
            phone: '090-9999-0000',
            pipelineStatus: '完了',
            preferences: {
                budgetMin: 85000,
                budgetMax: 110000,
                areas: ['台東区'],
                roomType: '1K'
            },
            notes: '契約完了、満足度高',
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    // ローカルストレージに保存
    localStorage.setItem('rentpipe_demo_customers', JSON.stringify(demoCustomers));
    console.log('✅ デモ顧客データを生成しました:', demoCustomers.length + '件');
    
    return demoCustomers;
}

// デモデータ生成ボタンを追加
function addDemoDataButton() {
    const container = document.querySelector('.filter-container');
    if (container && !document.getElementById('generateDemoBtn')) {
        const button = document.createElement('button');
        button.id = 'generateDemoBtn';
        button.className = 'btn btn-primary';
        button.innerHTML = '📝 デモデータ生成';
        button.onclick = function() {
            generateDemoCustomers();
            if (window.pipelineManager) {
                window.pipelineManager.loadCustomers();
                window.pipelineManager.renderPipeline();
                window.pipelineManager.updateStats();
            }
            alert('デモデータを生成しました！');
        };
        container.appendChild(button);
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addDemoDataButton, 1000);
});
