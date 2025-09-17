// 認証チェック無効化（テスト用）
console.log('🔧 認証チェック無効化モード');

// 何もしない - 全ページアクセス許可
console.log('✅ 全ページアクセス許可');

// テスト用のユーザー情報表示
setTimeout(() => {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.querySelector('.test-user-info')) {
        const userInfo = document.createElement('div');
        userInfo.className = 'test-user-info';
        userInfo.style.cssText = `
            color: white;
            font-size: 14px;
            margin-right: 15px;
        `;
        userInfo.textContent = '🔧 テストモード';
        navbar.appendChild(userInfo);
    }
}, 200);

window.handleLogout = function() {
    alert('テストモードです');
};
