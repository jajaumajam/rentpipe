// 📝 シンプル Google Forms アドオン（マルチAuth対応版）
// 既存のシステムを壊さず、最小限でGoogleForms機能を追加
console.log('📝 シンプル Google Forms アドオン 読み込み中...');

window.SimpleGoogleFormsAddon = {
    isInitialized: false,
    authData: null,
    
    // 初期化
    init: function() {
        if (this.isInitialized) return;
        
        console.log('🚀 Google Forms アドオン 初期化開始...');
        
        // 認証状態をチェック（複数の認証システム対応）
        this.checkAuthStatus();
        
        // 既存の顧客カードにボタンを追加
        this.addFormsButtonsToExistingCards();
        
        // 新しいカードが追加されたときの監視
        this.observeNewCards();
        
        // 認証状態インジケーターを追加
        this.addAuthStatusIndicator();
        
        this.isInitialized = true;
        console.log('✅ Google Forms アドオン 初期化完了');
    },
    
    // 認証状態をチェック（マルチAuth対応）
    checkAuthStatus: function() {
        try {
            console.log('🔍 マルチ認証システムチェック開始...');
            
            // 1. Google認証データをチェック
            const googleAuthData = localStorage.getItem('google_auth_simple');
            if (googleAuthData) {
                try {
                    const googleAuth = JSON.parse(googleAuthData);
                    const now = Date.now();
                    
                    if (!googleAuth.expires || now < googleAuth.expires) {
                        this.authData = {
                            email: googleAuth.email,
                            name: googleAuth.name,
                            picture: googleAuth.picture,
                            source: 'google',
                            isValid: true
                        };
                        console.log('✅ Google認証データ有効: ' + this.authData.email);
                        return;
                    } else {
                        console.warn('⚠️ Google認証トークンが期限切れ');
                    }
                } catch (error) {
                    console.warn('⚠️ Google認証データ解析エラー:', error);
                }
            }
            
            // 2. 統一認証システムをチェック
            const unifiedAuth = localStorage.getItem('rentpipe_authenticated');
            const unifiedUser = localStorage.getItem('rentpipe_user');
            if (unifiedAuth === 'true' && unifiedUser) {
                try {
                    const user = JSON.parse(unifiedUser);
                    this.authData = {
                        email: user.email,
                        name: user.displayName || user.email,
                        picture: user.photoURL,
                        source: 'unified',
                        isValid: true
                    };
                    console.log('✅ 統一認証データ有効: ' + this.authData.email);
                    return;
                } catch (error) {
                    console.warn('⚠️ 統一認証データ解析エラー:', error);
                }
            }
            
            // 3. シンプル認証システムをチェック
            const simpleAuth = localStorage.getItem('rentpipe_auth_simple');
            const simpleUser = localStorage.getItem('rentpipe_user_simple');
            if (simpleAuth === 'logged_in' && simpleUser) {
                try {
                    const user = JSON.parse(simpleUser);
                    this.authData = {
                        email: user.email,
                        name: user.name,
                        picture: user.picture,
                        source: 'simple',
                        isValid: true
                    };
                    console.log('✅ シンプル認証データ有効: ' + this.authData.email);
                    return;
                } catch (error) {
                    console.warn('⚠️ シンプル認証データ解析エラー:', error);
                }
            }
            
            // 4. すべての認証データが無効
            console.log('📝 全認証システムで未認証状態');
            this.authData = null;
            
        } catch (error) {
            console.error('❌ 認証状態確認エラー:', error);
            this.authData = null;
        }
    },
    
    // 認証状態インジケーターを追加
    addAuthStatusIndicator: function() {
        // 既存のインジケーターを削除
        const existingIndicator = document.getElementById('google-auth-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // ページ上部に認証状態を表示
        const pageHeader = document.querySelector('.page-header, h1, main');
        if (pageHeader) {
            const indicator = document.createElement('div');
            indicator.id = 'google-auth-indicator';
            indicator.style.cssText = `
                margin: 10px 0;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                text-align: center;
            `;
            
            this.updateAuthIndicator(indicator);
            
            // h1の後ろに挿入
            if (pageHeader.tagName === 'H1') {
                pageHeader.parentNode.insertBefore(indicator, pageHeader.nextSibling);
            } else {
                pageHeader.insertBefore(indicator, pageHeader.firstChild);
            }
        }
    },
    
    // 認証インジケーターの更新
    updateAuthIndicator: function(indicator) {
        if (!indicator) {
            indicator = document.getElementById('google-auth-indicator');
        }
        if (!indicator) return;
        
        if (this.authData && this.authData.isValid) {
            const sourceText = {
                'google': 'Google認証',
                'unified': '統一認証',
                'simple': 'シンプル認証'
            }[this.authData.source] || '認証済み';
            
            indicator.innerHTML = `
                ✅ <strong>Google Forms連携対応</strong> - ${this.authData.name} (${this.authData.email}) 
                <span style="font-size: 12px; opacity: 0.8;">[${sourceText}]</span>
                <button onclick="SimpleGoogleFormsAddon.signOut()" style="
                    margin-left: 10px; padding: 4px 8px; background: #ef4444; color: white; 
                    border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
                ">ログアウト</button>
            `;
            indicator.style.background = '#dcfce7';
            indicator.style.color = '#166534';
            indicator.style.border = '1px solid #4ade80';
        } else {
            indicator.innerHTML = `
                🔑 <strong>Google Forms機能を使用するにはログインが必要です</strong>
                <a href="login-google-simple.html" style="
                    margin-left: 10px; padding: 6px 12px; background: #3b82f6; color: white; 
                    text-decoration: none; border-radius: 4px; font-size: 12px;
                ">Googleでログイン</a>
            `;
            indicator.style.background = '#fef3c7';
            indicator.style.color = '#92400e';
            indicator.style.border = '1px solid #fbbf24';
        }
    },
    
    // ログアウト処理
    signOut: function() {
        if (confirm('ログアウトしますか？（全ての認証データがクリアされます）')) {
            // 全ての認証データをクリア
            const authKeys = [
                'google_auth_simple',
                'rentpipe_authenticated',
                'rentpipe_user', 
                'rentpipe_auth_simple',
                'rentpipe_user_simple',
                'rentpipe_unified_auth'
            ];
            
            authKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            this.authData = null;
            this.updateAuthIndicator();
            
            // フォームボタンを更新
            const formButtons = document.querySelectorAll('.google-forms-btn');
            formButtons.forEach(btn => {
                btn.style.opacity = '0.5';
                btn.title = '認証が必要です';
            });
            
            console.log('✅ 全認証データ ログアウト完了');
            
            // ログインページにリダイレクト
            setTimeout(() => {
                window.location.href = 'login-google-simple.html';
            }, 1000);
        }
    },
    
    // 既存の顧客カードにボタン追加
    addFormsButtonsToExistingCards: function() {
        setTimeout(() => {
            const customerCards = document.querySelectorAll('.customer-card, .customer-item, [data-customer-id]');
            console.log(`📊 ${customerCards.length}枚の顧客カードを発見`);
            
            customerCards.forEach((card, index) => {
                // 少しずつ遅延して追加
                setTimeout(() => {
                    this.addFormButtonToCard(card);
                }, index * 50);
            });
        }, 1000); // 既存システムの初期化完了を待つ
    },
    
    // 新しいカード監視
    observeNewCards: function() {
        const targetNode = document.getElementById('customersList') || document.querySelector('.customers-grid');
        if (!targetNode) {
            console.warn('⚠️ 顧客リストコンテナが見つかりません (customersList または .customers-grid)');
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && (node.classList?.contains('customer-card') || node.classList?.contains('customer-item'))) {
                        this.addFormButtonToCard(node);
                    }
                });
            });
        });
        
        observer.observe(targetNode, { childList: true, subtree: true });
    },
    
    // 顧客カードにフォームボタン追加
    addFormButtonToCard: function(card) {
        try {
            // 顧客IDを取得
            const customerId = card.dataset.customerId || 
                             card.getAttribute('data-customer-id') ||
                             card.querySelector('[data-customer-id]')?.dataset.customerId;
            
            if (!customerId) {
                console.warn('⚠️ 顧客IDが見つかりません:', card);
                return;
            }
            
            // 既にボタンが追加されているかチェック
            if (card.querySelector('.google-forms-btn')) {
                return;
            }
            
            // ボタンを追加する場所を探す
            let buttonContainer = card.querySelector('.card-actions, .customer-actions, .button-group');
            
            // なければ作成
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'card-actions';
                buttonContainer.style.cssText = 'margin-top: 8px; display: flex; gap: 5px; flex-wrap: wrap;';
                card.appendChild(buttonContainer);
            }
            
            // フォームボタン作成
            const formsBtn = document.createElement('button');
            formsBtn.className = 'btn btn-sm btn-success google-forms-btn';
            formsBtn.innerHTML = '📝 フォーム';
            formsBtn.title = this.authData ? 'Google Forms連携' : '認証が必要です';
            formsBtn.style.cssText = `
                font-size: 11px;
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                background: #16a34a;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
                opacity: ${this.authData ? '1' : '0.5'};
            `;
            
            formsBtn.onclick = (e) => {
                e.stopPropagation();
                this.handleFormsClick(customerId);
            };
            
            buttonContainer.appendChild(formsBtn);
            console.log(`✅ 顧客 ${customerId} にフォームボタン追加`);
            
        } catch (error) {
            console.error('❌ フォームボタン追加エラー:', error);
        }
    },
    
    // フォームボタンクリック処理
    handleFormsClick: function(customerId) {
        console.log(`📝 顧客 ${customerId} のフォームボタンクリック`);
        
        // 認証チェック（最新状態を確認）
        this.checkAuthStatus();
        
        if (!this.authData || !this.authData.isValid) {
            // 未認証の場合
            const confirmLogin = confirm('Google Forms機能を使用するには、ログインが必要です。\n\nログインページに移動しますか？');
            if (confirmLogin) {
                window.location.href = 'login-google-simple.html';
            }
            return;
        }
        
        // 認証済みの場合、メニューを表示
        const sourceText = {
            'google': 'Google認証',
            'unified': '統一認証', 
            'simple': 'シンプル認証'
        }[this.authData.source] || '認証済み';
        
        const menu = `
            <div class="simple-forms-menu" onclick="this.remove()" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center;
                justify-content: center; z-index: 10000;
            ">
                <div onclick="event.stopPropagation()" style="
                    background: white; border-radius: 8px; padding: 20px;
                    max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                ">
                    <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">📝 Google Forms機能</h3>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                        顧客専用のフォームを作成・管理します
                    </p>
                    <p style="margin: 0 0 15px 0; color: #059669; font-size: 12px;">
                        ✅ ${this.authData.name} でログイン中 <span style="opacity: 0.7;">[${sourceText}]</span>
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="SimpleGoogleFormsAddon.createForm('${customerId}')" 
                                style="padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            ✨ 専用フォームを作成
                        </button>
                        <button onclick="SimpleGoogleFormsAddon.showFormUrl('${customerId}')" 
                                style="padding: 10px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            🔗 フォームURLを確認
                        </button>
                        <button onclick="this.closest('.simple-forms-menu').remove()" 
                                style="padding: 10px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', menu);
    },
    
    // フォーム作成
    createForm: function(customerId) {
        console.log(`✨ 顧客 ${customerId} の専用フォーム作成`);
        
        // メニューを閉じる
        document.querySelector('.simple-forms-menu')?.remove();
        
        // プログレス表示
        const progress = `
            <div class="forms-progress" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); display: flex; align-items: center;
                justify-content: center; z-index: 10001;
            ">
                <div style="
                    background: white; border-radius: 8px; padding: 30px;
                    text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                ">
                    <div style="
                        border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6;
                        border-radius: 50%; width: 30px; height: 30px;
                        animation: spin 1s linear infinite; margin: 0 auto 15px;
                    "></div>
                    <h3 style="margin: 0 0 10px 0;">フォーム作成中...</h3>
                    <p style="margin: 0; color: #6b7280;">顧客専用のフォームを作成しています</p>
                </div>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', progress);
        
        // 2秒後に完了（実際のAPI呼び出しに置き換え）
        setTimeout(() => {
            document.querySelector('.forms-progress')?.remove();
            
            // 成功メッセージ
            const formUrl = `https://docs.google.com/forms/d/demo_form_${customerId}/viewform`;
            const success = `
                <div class="forms-success" onclick="this.remove()" style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center;
                    justify-content: center; z-index: 10000;
                ">
                    <div onclick="event.stopPropagation()" style="
                        background: white; border-radius: 8px; padding: 20px;
                        max-width: 500px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    ">
                        <h3 style="margin: 0 0 15px 0; color: #059669;">✅ フォーム作成完了</h3>
                        <p style="margin: 0 0 15px 0; color: #374151;">
                            顧客専用のフォームが作成されました！
                        </p>
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin: 10px 0;">
                            <input type="text" value="${formUrl}" readonly style="
                                width: 100%; border: none; background: transparent; font-family: monospace; font-size: 12px;
                            " onclick="this.select()">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                            <button onclick="window.open('${formUrl}', '_blank')" style="
                                padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;
                            ">📱 フォームを開く</button>
                            <button onclick="this.closest('.forms-success').remove()" style="
                                padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;
                            ">閉じる</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', success);
            
            // 顧客データにフォーム情報を保存（ダミー）
            this.saveFormData(customerId, {
                formId: `demo_form_${customerId}`,
                formUrl: formUrl,
                createdAt: new Date().toISOString(),
                createdBy: this.authData.email
            });
            
        }, 2000);
    },
    
    // フォームURL確認
    showFormUrl: function(customerId) {
        console.log(`🔗 顧客 ${customerId} のフォームURL確認`);
        
        // メニューを閉じる
        document.querySelector('.simple-forms-menu')?.remove();
        
        // フォームURLを表示（実際はデータから取得）
        const formUrl = `https://docs.google.com/forms/d/demo_form_${customerId}/viewform`;
        const urlDisplay = `
            <div class="forms-url-display" onclick="this.remove()" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center;
                justify-content: center; z-index: 10000;
            ">
                <div onclick="event.stopPropagation()" style="
                    background: white; border-radius: 8px; padding: 20px;
                    max-width: 500px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                ">
                    <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">🔗 フォームURL</h3>
                    <p style="margin: 0 0 15px 0; color: #6b7280;">
                        顧客専用フォームのURLです
                    </p>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin: 10px 0;">
                        <input type="text" value="${formUrl}" readonly style="
                            width: 100%; border: none; background: transparent; font-family: monospace; font-size: 12px;
                        " onclick="this.select()">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                        <button onclick="navigator.clipboard && navigator.clipboard.writeText('${formUrl}').then(() => alert('URLをコピーしました!'), () => prompt('URLをコピーしてください:', '${formUrl}'))" style="
                            padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer;
                        ">📋 コピー</button>
                        <button onclick="window.open('${formUrl}', '_blank')" style="
                            padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;
                        ">📱 開く</button>
                        <button onclick="this.closest('.forms-url-display').remove()" style="
                            padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;
                        ">閉じる</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', urlDisplay);
    },
    
    // フォームデータ保存（ダミー）
    saveFormData: function(customerId, formData) {
        try {
            console.log(`💾 顧客 ${customerId} のフォームデータ保存:`, formData);
            
            // ローカルストレージから顧客データを取得して更新
            const data = localStorage.getItem('rentpipe_demo_customers');
            if (data) {
                const customers = JSON.parse(data);
                const customerIndex = customers.findIndex(c => c.id === customerId);
                if (customerIndex !== -1) {
                    customers[customerIndex].googleForm = formData;
                    localStorage.setItem('rentpipe_demo_customers', JSON.stringify(customers));
                    console.log('✅ フォームデータ保存完了');
                }
            }
        } catch (error) {
            console.error('❌ フォームデータ保存エラー:', error);
        }
    }
};

// DOMが読み込まれてから初期化
document.addEventListener('DOMContentLoaded', function() {
    // 既存システムの初期化完了を待って実行
    setTimeout(() => {
        window.SimpleGoogleFormsAddon.init();
    }, 2000);
});

// 認証状態の定期チェック（10秒ごと）
setInterval(() => {
    if (window.SimpleGoogleFormsAddon.isInitialized) {
        window.SimpleGoogleFormsAddon.checkAuthStatus();
        window.SimpleGoogleFormsAddon.updateAuthIndicator();
    }
}, 10000);

// グローバル公開
window.SimpleGoogleFormsAddon = SimpleGoogleFormsAddon;

console.log('✅ シンプル Google Forms アドオン（マルチAuth対応版）準備完了');
