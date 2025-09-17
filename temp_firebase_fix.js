        // Firebase認証状態確認（強化版）
        async function ensureFirebaseAuth() {
            console.log('🔥 Firebase認証状態確認開始');
            
            return new Promise((resolve, reject) => {
                if (!window.firebase || !firebase.auth) {
                    reject(new Error('Firebase認証が初期化されていません'));
                    return;
                }
                
                // 認証状態監視
                const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    console.log('🔍 Firebase認証状態:', user ? user.email : '未認証');
                    
                    if (user) {
                        console.log('✅ Firebase認証ユーザー確認:', {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        });
                        unsubscribe(); // 監視停止
                        resolve(user);
                    } else {
                        // Firebase認証が無い場合は、LocalStorageから復旧を試行
                        console.log('⚠️ Firebase認証なし - LocalStorage確認');
                        
                        const userInfo = localStorage.getItem('rentpipe_user_info');
                        if (userInfo) {
                            try {
                                const userData = JSON.parse(userInfo);
                                console.log('🔄 LocalStorageから認証データ復旧試行:', userData.email);
                                
                                // Firebase認証データがあるなら、Firebase側で認証を復旧
                                if (userData.uid && userData.email) {
                                    // Firebase認証復旧は複雑なので、代替手段を使用
                                    unsubscribe();
                                    resolve({
                                        uid: userData.uid,
                                        email: userData.email,
                                        displayName: userData.displayName,
                                        getIdToken: async () => {
                                            // LocalStorageからアクセストークンを取得
                                            return userData.accessToken || null;
                                        }
                                    });
                                    return;
                                }
                            } catch (e) {
                                console.error('❌ LocalStorage認証データ解析エラー:', e);
                            }
                        }
                        
                        unsubscribe();
                        reject(new Error('Firebase認証ユーザーが見つかりません。再ログインが必要です。'));
                    }
                });
                
                // 5秒でタイムアウト
                setTimeout(() => {
                    unsubscribe();
                    reject(new Error('Firebase認証確認タイムアウト'));
                }, 5000);
            });
        }
        
        // Google Drive API初期化（完全修正版）
        async function initializeDriveAPI() {
            if (!isAuthenticated) {
                log('drive-init-result', '❌ 認証されていません。先に認証状態を確認してください。', 'error');
                return;
            }
            
            console.log('🔧 Google Drive API初期化開始');
            log('drive-init-result', '🔧 Google Drive API初期化中...', 'info');
            
            try {
                // Google API Client Library が読み込まれているか確認
                if (!window.gapi) {
                    throw new Error('Google API Client Library が読み込まれていません');
                }
                
                // gapi client 初期化
                await new Promise((resolve, reject) => {
                    window.gapi.load('client', {
                        callback: resolve,
                        onerror: reject
                    });
                });
                
                console.log('🔑 Google API Client設定中...');
                
                // Firebase APIキーを使用してGoogle Drive APIを初期化
                await window.gapi.client.init({
                    apiKey: 'AIzaSyBvJGdan0lvVSkaAbbSXQkoh6YyPoGyTgM',
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                });
                
                console.log('✅ Google API Client初期化完了');
                
                // アクセストークン取得（複数の方法を試行）
                let accessToken = null;
                let tokenSource = '';
                
                // 方法1: Firebase認証からIDトークン取得
                try {
                    console.log('🔥 Firebase認証確認中...');
                    const firebaseUser = await ensureFirebaseAuth();
                    
                    if (firebaseUser && firebaseUser.getIdToken) {
                        accessToken = await firebaseUser.getIdToken();
                        tokenSource = 'Firebase IDToken';
                        console.log('✅ Firebase IDトークン取得成功');
                    }
                } catch (firebaseError) {
                    console.warn('⚠️ Firebase認証エラー:', firebaseError.message);
                }
                
                // 方法2: LocalStorageから直接取得
                if (!accessToken) {
                    console.log('🔄 LocalStorageからアクセストークン取得試行...');
                    const userInfo = localStorage.getItem('rentpipe_user_info');
                    
                    if (userInfo) {
                        try {
                            const userData = JSON.parse(userInfo);
                            if (userData.accessToken) {
                                accessToken = userData.accessToken;
                                tokenSource = 'LocalStorage AccessToken';
                                console.log('✅ LocalStorageアクセストークン取得成功');
                            }
                        } catch (e) {
                            console.warn('⚠️ LocalStorage解析エラー:', e);
                        }
                    }
                }
                
                // 方法3: 認証なしAPIキーのみで試行（制限あり）
                if (!accessToken) {
                    console.log('⚠️ アクセストークン無し - APIキーのみで制限機能テスト');
                    tokenSource = 'API Key Only (Limited)';
                    
                    // APIキーのみでの動作確認
                    try {
                        // 公開情報のみ取得可能なテスト
                        const publicTest = await window.gapi.client.request({
                            path: 'https://www.googleapis.com/drive/v3/about',
                            params: { fields: 'kind' }
                        });
                        console.log('✅ APIキーのみでの接続テスト成功');
                    } catch (apiOnlyError) {
                        throw new Error(`認証が必要です。再ログインしてください。\n\n詳細: ${apiOnlyError.message}`);
                    }
                } else {
                    // アクセストークンを設定
                    window.gapi.client.setToken({
                        access_token: accessToken
                    });
                    console.log(`✅ アクセストークン設定完了 (${tokenSource})`);
                    
                    // 認証付きDrive API接続テスト
                    console.log('🔍 認証付きGoogle Drive API接続テスト...');
                    const testResponse = await window.gapi.client.drive.about.get({
                        fields: 'user'
                    });
                    console.log('✅ 認証付きDrive API接続テスト成功:', testResponse.result.user.displayName);
                }
                
                driveAPIReady = true;
                
                let statusMessage = `✅ Google Drive API初期化完了

認証方式: ${tokenSource}
APIキー: 設定済み (Firebase)`;
                
                if (accessToken) {
                    statusMessage += `
アクセストークン: 設定済み
接続テスト: 成功

使用可能機能:
- ファイル一覧取得  
- ファイル作成・更新  
- フォルダー管理
- ファイルメタデータ操作`;
                } else {
                    statusMessage += `
アクセストークン: なし（制限モード）

制限事項:
- 個人ファイルアクセス不可
- フォルダー作成機能制限
- 公開リソースのみアクセス可能

推奨: ログアウト→再ログインで完全な権限を取得`;
                }
                
                log('drive-init-result', statusMessage, accessToken ? 'success' : 'warning');
                
                // フォルダー作成ボタンを有効化（アクセストークンがある場合のみ）
                if (accessToken) {
                    document.getElementById('folderBtn').disabled = false;
                } else {
                    document.getElementById('folderBtn').disabled = true;
                }
                
                console.log('✅ Google Drive API初期化完了');
                
            } catch (error) {
                console.error('❌ Google Drive API初期化エラー:', error);
                
                let errorMessage = `❌ Google Drive API初期化失敗

エラー: ${error.message}

🔧 推奨対処方法:
1. ログアウトして再ログイン
2. Google Drive権限を再許可
3. ブラウザのキャッシュをクリア`;
                
                if (error.message.includes('Firebase')) {
                    errorMessage += `

🔥 Firebase認証エラー対処:
1. ページを再読み込み
2. 数秒待ってから再実行
3. Firebase認証の完全初期化を待つ`;
                }
                
                log('drive-init-result', errorMessage, 'error');
                driveAPIReady = false;
            }
        }
