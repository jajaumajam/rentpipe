        // 順次スクリプト読み込み（Google Drive統合対応）
        async function loadScriptsSequentially() {
            return new Promise((resolve, reject) => {
                loadScript('js/navigation.js', function() {
                    loadScript('js/unified-data-manager.js', function() {
                        loadScript('js/integrated-auth-manager-v2.js', function() {
                            loadScript('js/google-drive-api-v2.js', function() {
                                loadScript('js/google-drive-data-manager.js', function() {
                                    loadScript('js/customer-google-drive-integration.js', function() {
                                        console.log('✅ すべてのスクリプト読み込み完了');
                                        resolve();
                                    }, function() {
                                        console.warn('⚠️ customer-google-drive-integration.js 読み込み失敗（オプション機能）');
                                        resolve();
                                    });
                                }, function() {
                                    console.warn('⚠️ google-drive-data-manager.js 読み込み失敗（オプション機能）');
                                    resolve();
                                });
                            }, function() {
                                console.warn('⚠️ Google Drive API v2 読み込み失敗（オプション機能）');
                                resolve();
                            });
                        }, function() {
                            reject(new Error('integrated-auth-manager-v2.js 読み込み失敗'));
                        });
                    }, function() {
                        console.warn('⚠️ unified-data-manager.js 読み込み失敗（オプション機能）');
                        loadScript('js/integrated-auth-manager-v2.js', function() {
                            resolve();
                        }, function() {
                            reject(new Error('integrated-auth-manager-v2.js 読み込み失敗'));
                        });
                    });
                }, function() {
                    reject(new Error('navigation.js 読み込み失敗'));
                });
            });
        }
