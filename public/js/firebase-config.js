// Firebase設定
const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "rentpipe-ab04e.firebaseapp.com",
    projectId: "rentpipe-ab04e",
    storageBucket: "rentpipe-ab04e.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Firebase初期化
let app;
let db;
let auth;

try {
    // Firebase初期化
    app = firebase.initializeApp(firebaseConfig);
    
    // Firestore初期化
    db = firebase.firestore();
    
    // Auth初期化
    auth = firebase.auth();
    
    console.log('Firebase initialized successfully');
    
    // グローバル変数として設定
    window.db = db;
    window.auth = auth;
    window.app = app;
    
} catch (error) {
    console.warn('Firebase initialization failed:', error);
    
    // デモ環境用のダミーオブジェクト
    window.db = {
        collection: function(name) {
            return {
                orderBy: function() { return this; },
                limit: function() { return this; },
                get: function() {
                    return Promise.resolve({
                        docs: [],
                        map: function() { return []; }
                    });
                },
                add: function(data) {
                    console.log('Demo: would add data', data);
                    return Promise.resolve({ id: 'demo-id' });
                },
                doc: function(id) {
                    return {
                        update: function(data) {
                            console.log('Demo: would update', id, data);
                            return Promise.resolve();
                        }
                    };
                }
            };
        }
    };
    
    window.auth = {
        onAuthStateChanged: function(callback) {
            callback(null);
        }
    };
    
    console.log('Using demo Firebase objects');
}
