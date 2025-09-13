// 🎯 Google Apps Script経由でのGoogle Forms連携
console.log('🎯 Google Apps Script Forms連携初期化中...');

window.GoogleAppsScriptForms = {
    // 🔧 重要: ここにStep 3で取得したウェブアプリURLを設定してください
    scriptUrl: 'https://script.google.com/macros/s/AKfycbw8TxNzPaLfjduZ4yGua8F6GhJFrLF-jwO3PaCEjcRTKNeZ4UjLfzOYTWh4reUumpv8/exec',
    
    // 初期化状態
    isInitialized: false,
    
    // 初期化
    initialize: function() {
        try {
            console.log('🔧 Google Apps Script Forms初期化開始...');
            
            // Script URLが設定されているかチェック
            if (this.scriptUrl.includes('AKfycbw8TxNzPaLfjduZ4yGua8F6GhJFrLF-jwO3PaCEjcRTKNeZ4UjLfzOYTWh4reUumpv8')) {
                console.warn('⚠️ Script URLが設定されていません。Google Apps ScriptのウェブアプリURLを設定してください。');
                return false;
            }
            
            this.isInitialized = true;
            console.log('✅ Google Apps Script Forms初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ Google Apps Script Forms初期化エラー:', error);
            return false;
        }
    },
    
    // Script URL設定
    setScriptUrl: function(url) {
        this.scriptUrl = url;
        console.log('✅ Script URL設定完了:', url);
    },
    
    // 顧客専用フォーム作成
    createCustomerForm: async function(customerData) {
        try {
            console.log('📝 Google Apps Script経由でフォーム作成開始:', customerData.name);
            
            // 初期化チェック
            if (!this.isInitialized) {
                const initResult = this.initialize();
                if (!initResult) {
                    throw new Error('Google Apps Script Formsが初期化されていません。Script URLを設定してください。');
                }
            }
            
            // Script URL再チェック
            if (this.scriptUrl.includes('AKfycbw8TxNzPaLfjduZ4yGua8F6GhJFrLF-jwO3PaCEjcRTKNeZ4UjLfzOYTWh4reUumpv8')) {
                throw new Error('Google Apps ScriptのウェブアプリURLが設定されていません。setScriptUrl()で設定してください。');
            }
            
            console.log('🚀 Google Apps Scriptへリクエスト送信中...');
            console.log('📨 送信データ:', customerData);
            
            // Google Apps Scriptにリクエスト送信
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerData: customerData
                }),
                mode: 'cors' // CORS設定
            });
            
            console.log('📥 レスポンス受信:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📋 レスポンス内容:', result);
            
            if (result.success) {
                console.log('✅ Google Apps Script経由フォーム作成成功:', result.form.id);
                
                // 顧客データに保存
                this.saveFormToCustomer(customerData.id, result.form);
                
                return result;
            } else {
                throw new Error(result.error || 'Google Apps Scriptでエラーが発生しました');
            }
            
        } catch (error) {
            console.error('❌ Google Apps Script経由フォーム作成エラー:', error);
            
            // 詳細なエラー情報をログ出力
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('💡 ヒント: Script URLが正しく設定されているか確認してください');
                console.error('💡 ヒント: Google Apps Scriptが正しくデプロイされているか確認してください');
            }
            
            return {
                success: false,
                error: 'フォーム作成に失敗しました: ' + error.message
            };
        }
    },
    
    // 顧客データにフォーム情報を保存
    saveFormToCustomer: function(customerId, formInfo) {
        try {
            console.log('💾 顧客データにフォーム情報保存中:', customerId);
            
            // 既存の顧客データを取得
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex !== -1) {
                // Google Forms情報を追加
                customers[customerIndex].googleForm = {
                    ...formInfo,
                    status: 'created',
                    method: 'google_apps_script',
                    sentAt: null,
                    lastResponseAt: null,
                    responseCount: 0
                };
                
                // ローカルストレージに保存
                localStorage.setItem('customers', JSON.stringify(customers));
                
                console.log('✅ 顧客データにフォーム情報保存完了');
            } else {
                console.warn('⚠️ 対象の顧客が見つかりません:', customerId);
            }
            
        } catch (error) {
            console.error('❌ フォーム情報保存エラー:', error);
        }
    },
    
    // Script URLのテスト
    testConnection: async function() {
        try {
            console.log('🧪 Google Apps Script接続テスト開始...');
            
            if (this.scriptUrl.includes('AKfycbw8TxNzPaLfjduZ4yGua8F6GhJFrLF-jwO3PaCEjcRTKNeZ4UjLfzOYTWh4reUumpv8')) {
                throw new Error('Script URLが設定されていません');
            }
            
            // テスト用データ
            const testData = {
                customerData: {
                    id: 'test-connection',
                    name: '接続テスト',
                    email: 'test@example.com',
                    phone: '03-0000-0000'
                }
            };
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const result = await response.json();
            
            console.log('✅ Google Apps Script接続テスト成功:', result);
            return { success: true, result: result };
            
        } catch (error) {
            console.error('❌ Google Apps Script接続テスト失敗:', error);
            return { success: false, error: error.message };
        }
    },
    
    // デバッグ情報取得
    getDebugInfo: function() {
        return {
            isInitialized: this.isInitialized,
            scriptUrl: this.scriptUrl,
            hasValidUrl: !this.scriptUrl.includes('AKfycbw8TxNzPaLfjduZ4yGua8F6GhJFrLF-jwO3PaCEjcRTKNeZ4UjLfzOYTWh4reUumpv8')
        };
    }
};

// 自動初期化
document.addEventListener('DOMContentLoaded', function() {
    window.GoogleAppsScriptForms.initialize();
});

console.log('✅ Google Apps Script Forms連携準備完了');
