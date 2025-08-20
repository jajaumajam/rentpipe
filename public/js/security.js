// RentPipe セキュリティ管理システム
console.log('🛡️ セキュリティシステム初期化中...');

window.SecurityManager = {
    // セキュリティ設定
    config: {
        maxLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30分
        sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
        csrfTokenLength: 32
    },
    
    // ログイン試行回数の管理
    loginAttempts: new Map(),
    
    // XSS対策: HTMLエスケープ
    escapeHtml: function(text) {
        if (typeof text !== 'string') return text;
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;'
        };
        
        return text.replace(/[&<>"'/]/g, (m) => map[m]);
    },
    
    // 入力値のサニタイズ
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return input;
        
        // 危険な文字列を除去
        let sanitized = input
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        
        return this.escapeHtml(sanitized);
    },
    
    // メールアドレスのバリデーション
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // パスワード強度チェック
    checkPasswordStrength: function(password) {
        if (!password) return { strength: 0, message: 'パスワードを入力してください' };
        
        let strength = 0;
        const messages = [];
        
        // 長さチェック
        if (password.length >= 8) strength += 1;
        else messages.push('8文字以上');
        
        if (password.length >= 12) strength += 1;
        
        // 大文字小文字
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
        else messages.push('大文字と小文字を含む');
        
        // 数字
        if (/\d/.test(password)) strength += 1;
        else messages.push('数字を含む');
        
        // 特殊文字
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
        else messages.push('特殊文字を含む');
        
        const strengthLevels = ['弱い', '普通', '普通', '強い', '非常に強い'];
        const strengthColors = ['#dc3545', '#ffc107', '#ffc107', '#28a745', '#1e3a8a'];
        
        return {
            strength: strength,
            level: strengthLevels[strength] || '弱い',
            color: strengthColors[strength] || '#dc3545',
            percentage: (strength / 5) * 100,
            suggestions: messages.length > 0 ? 
                `より強力にするには: ${messages.join('、')}` : '強力なパスワードです！'
        };
    },
    
    // ログイン試行回数の記録
    recordLoginAttempt: function(email, success) {
        const key = this.sanitizeInput(email);
        const now = Date.now();
        
        if (!this.loginAttempts.has(key)) {
            this.loginAttempts.set(key, {
                count: 0,
                firstAttempt: now,
                lastAttempt: now,
                lockedUntil: null
            });
        }
        
        const attempts = this.loginAttempts.get(key);
        
        if (success) {
            // 成功時はリセット
            this.loginAttempts.delete(key);
            return { allowed: true };
        }
        
        // ロックアウト中かチェック
        if (attempts.lockedUntil && attempts.lockedUntil > now) {
            const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
            return {
                allowed: false,
                message: `アカウントがロックされています。${remainingTime}分後に再試行してください。`
            };
        }
        
        // 失敗回数を増やす
        attempts.count++;
        attempts.lastAttempt = now;
        
        // 上限チェック
        if (attempts.count >= this.config.maxLoginAttempts) {
            attempts.lockedUntil = now + this.config.lockoutDuration;
            return {
                allowed: false,
                message: '試行回数の上限に達しました。30分後に再試行してください。'
            };
        }
        
        const remaining = this.config.maxLoginAttempts - attempts.count;
        return {
            allowed: true,
            remaining: remaining,
            message: `残り試行回数: ${remaining}回`
        };
    },
    
    // CSRFトークン生成
    generateCSRFToken: function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        
        for (let i = 0; i < this.config.csrfTokenLength; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        sessionStorage.setItem('rentpipe_csrf_token', token);
        return token;
    },
    
    // CSRFトークン検証
    verifyCSRFToken: function(token) {
        const storedToken = sessionStorage.getItem('rentpipe_csrf_token');
        return storedToken && storedToken === token;
    },
    
    // データ暗号化（簡易版）
    encrypt: function(data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        
        // Base64エンコード（実際の本番環境では適切な暗号化を使用）
        return btoa(encodeURIComponent(data));
    },
    
    // データ復号化（簡易版）
    decrypt: function(encryptedData) {
        try {
            // Base64デコード
            return decodeURIComponent(atob(encryptedData));
        } catch (error) {
            console.error('復号化エラー:', error);
            return null;
        }
    },
    
    // セッション管理
    sessionManager: {
        // セッション開始
        startSession: function(user) {
            const session = {
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user: user,
                startedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + SecurityManager.config.sessionTimeout).toISOString(),
                lastActivity: new Date().toISOString()
            };
            
            sessionStorage.setItem('rentpipe_session', JSON.stringify(session));
            return session;
        },
        
        // セッション更新
        updateSession: function() {
            const sessionStr = sessionStorage.getItem('rentpipe_session');
            if (!sessionStr) return null;
            
            try {
                const session = JSON.parse(sessionStr);
                session.lastActivity = new Date().toISOString();
                sessionStorage.setItem('rentpipe_session', JSON.stringify(session));
                return session;
            } catch (error) {
                console.error('セッション更新エラー:', error);
                return null;
            }
        },
        
        // セッション検証
        validateSession: function() {
            const sessionStr = sessionStorage.getItem('rentpipe_session');
            if (!sessionStr) return false;
            
            try {
                const session = JSON.parse(sessionStr);
                const now = new Date();
                const expiresAt = new Date(session.expiresAt);
                
                if (now > expiresAt) {
                    console.log('セッションの有効期限が切れました');
                    this.endSession();
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('セッション検証エラー:', error);
                return false;
            }
        },
        
        // セッション終了
        endSession: function() {
            sessionStorage.removeItem('rentpipe_session');
            sessionStorage.removeItem('rentpipe_csrf_token');
        }
    },
    
    // コンテンツセキュリティポリシーの設定
    setCSP: function() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; " +
                      "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; " +
                      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                      "font-src 'self' https://fonts.gstatic.com; " +
                      "img-src 'self' data: https:; " +
                      "connect-src 'self' https://firebaseapp.com https://firebaseio.com";
        
        document.head.appendChild(meta);
    },
    
    // セキュリティ監査ログ
    auditLog: function(action, details) {
        const log = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            ip: 'client-side' // サーバーサイドで実際のIPを記録
        };
        
        // ローカルストレージに監査ログを保存（実際はサーバーに送信）
        const logs = JSON.parse(localStorage.getItem('rentpipe_audit_logs') || '[]');
        logs.push(log);
        
        // 最新100件のみ保持
        const recentLogs = logs.slice(-100);
        localStorage.setItem('rentpipe_audit_logs', JSON.stringify(recentLogs));
        
        console.log('📝 監査ログ:', action, details);
    },
    
    // 初期化
    initialize: function() {
        // CSPの設定
        this.setCSP();
        
        // CSRFトークンの生成
        this.generateCSRFToken();
        
        // アクティビティ監視
        document.addEventListener('click', () => {
            this.sessionManager.updateSession();
        });
        
        document.addEventListener('keypress', () => {
            this.sessionManager.updateSession();
        });
        
        console.log('✅ セキュリティシステム初期化完了');
    }
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    window.SecurityManager.initialize();
});

console.log('✅ セキュリティ管理システム準備完了');
