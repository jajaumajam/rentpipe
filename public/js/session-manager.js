/**
 * Session Manager
 * セッションタイムアウトとアクティビティ監視を管理
 */

(function() {
  'use strict';

  // ============================================
  // 設定
  // ============================================
  const SESSION_TIMEOUT_DAYS = 7;  // セッションタイムアウト（日数）
  const ACTIVITY_CHECK_INTERVAL = 60000;  // アクティビティチェック間隔（1分）
  const TOKEN_REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000;  // トークン更新タイミング（期限切れ5分前）

  class SessionManager {
    constructor() {
      this.lastActivityTime = null;
      this.activityCheckTimer = null;
      this.tokenRefreshTimer = null;
      this.isMonitoring = false;
    }

    /**
     * セッション管理を開始
     */
    initialize() {
      console.log('🔐 Session Manager 初期化中...');

      // 最終アクティビティ時刻を復元または初期化
      this.restoreLastActivity();

      // セッションタイムアウトチェック
      if (this.isSessionExpired()) {
        console.warn('⏰ セッションがタイムアウトしました');
        this.clearSession();
        return false;
      }

      // 現在のアクティビティ時刻を更新
      this.updateLastActivity();

      // アクティビティ監視を開始
      this.startActivityMonitoring();

      // Googleトークン更新監視を開始
      this.startTokenRefreshMonitoring();

      console.log('✅ Session Manager 初期化完了');
      return true;
    }

    /**
     * 最終アクティビティ時刻を復元
     */
    restoreLastActivity() {
      const saved = localStorage.getItem('rentpipe_last_activity');
      if (saved) {
        this.lastActivityTime = parseInt(saved, 10);
        console.log('📅 最終アクティビティ:', new Date(this.lastActivityTime).toLocaleString('ja-JP'));
      } else {
        // 初回の場合は現在時刻を設定
        this.lastActivityTime = Date.now();
      }
    }

    /**
     * セッションがタイムアウトしているかチェック
     */
    isSessionExpired() {
      if (!this.lastActivityTime) {
        return false;
      }

      const now = Date.now();
      const elapsed = now - this.lastActivityTime;
      const timeout = SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;

      return elapsed > timeout;
    }

    /**
     * 最終アクティビティ時刻を更新
     */
    updateLastActivity() {
      this.lastActivityTime = Date.now();
      localStorage.setItem('rentpipe_last_activity', this.lastActivityTime.toString());
    }

    /**
     * アクティビティ監視を開始
     */
    startActivityMonitoring() {
      if (this.isMonitoring) {
        return;
      }

      // ユーザー操作イベントをリスン
      const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];

      // デバウンス処理（頻繁な更新を防ぐ）
      let activityTimeout = null;
      const debouncedUpdate = () => {
        if (activityTimeout) {
          clearTimeout(activityTimeout);
        }
        activityTimeout = setTimeout(() => {
          this.updateLastActivity();
        }, 1000);
      };

      events.forEach(event => {
        document.addEventListener(event, debouncedUpdate, { passive: true });
      });

      // 定期的にセッションタイムアウトをチェック
      this.activityCheckTimer = setInterval(() => {
        if (this.isSessionExpired()) {
          console.warn('⏰ セッションタイムアウト検出');
          this.handleSessionTimeout();
        }
      }, ACTIVITY_CHECK_INTERVAL);

      this.isMonitoring = true;
      console.log(`👁️ アクティビティ監視開始（タイムアウト: ${SESSION_TIMEOUT_DAYS}日）`);
    }

    /**
     * セッションタイムアウト時の処理
     */
    handleSessionTimeout() {
      // 監視を停止
      this.stopMonitoring();

      // セッションをクリア
      this.clearSession();

      // ユーザーに通知
      alert('長期間操作がなかったため、セキュリティのため自動的にログアウトしました。\n\n再度ログインしてください。');

      // ログインページにリダイレクト
      window.location.href = '/login.html';
    }

    /**
     * セッションをクリア
     */
    clearSession() {
      console.log('🗑️ セッションクリア中...');

      // Google認証情報をクリア
      if (window.IntegratedAuthManager) {
        window.IntegratedAuthManager.clearGoogleAuth();
      }

      // localStorage をクリア（特定のキーのみ）
      const keysToRemove = [
        'google_auth_data',
        'google_access_token',
        'google_token_expiry',
        'rentpipe_supabase_user',
        'rentpipe_last_activity',
        'rentpipe_auth',
        'rentpipe_auth_simple',
        'rentpipe_user_info'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('✅ セッションクリア完了');
    }

    /**
     * Googleトークン更新監視を開始
     */
    startTokenRefreshMonitoring() {
      // 1分ごとにトークンの有効期限をチェック
      this.tokenRefreshTimer = setInterval(() => {
        this.checkAndRefreshToken();
      }, 60000);

      // 初回チェック
      this.checkAndRefreshToken();

      console.log('🔄 Googleトークン更新監視開始');
    }

    /**
     * トークンの有効期限をチェックして必要なら更新
     */
    async checkAndRefreshToken() {
      try {
        // Google認証データを取得
        const googleAuthData = localStorage.getItem('google_auth_data');
        if (!googleAuthData) {
          return;
        }

        const authData = JSON.parse(googleAuthData);
        const tokenExpiry = authData.tokenExpiry;

        if (!tokenExpiry) {
          return;
        }

        const now = Date.now();
        const timeUntilExpiry = tokenExpiry - now;

        // トークンが既に期限切れ
        if (timeUntilExpiry <= 0) {
          console.warn('⚠️ Googleトークンが期限切れです');
          this.handleTokenExpired();
          return;
        }

        // 期限切れ5分前になったら更新を試みる
        if (timeUntilExpiry <= TOKEN_REFRESH_BEFORE_EXPIRY) {
          console.log('🔄 Googleトークンを更新します...');
          await this.refreshGoogleToken();
        }

      } catch (error) {
        console.error('❌ トークンチェックエラー:', error);
      }
    }

    /**
     * Googleトークンを更新
     */
    async refreshGoogleToken() {
      try {
        // Google Identity Services の TokenClient を使用してトークンを更新
        // Note: Google OAuth 2.0 では、アクセストークンは1時間で期限切れ
        // リフレッシュトークンは発行されないため、ユーザーに再認証を促す

        console.log('ℹ️ Googleトークンの自動更新には再認証が必要です');

        // トークンが期限切れになる前にユーザーに通知
        const shouldRefresh = confirm(
          'Googleアカウントの認証が間もなく期限切れになります。\n\n' +
          '継続してGoogle Drive/Sheets機能を使用するには、再認証が必要です。\n\n' +
          '今すぐ再認証しますか？'
        );

        if (shouldRefresh) {
          // Google再認証を促す
          this.promptReauth();
        }

      } catch (error) {
        console.error('❌ トークン更新エラー:', error);
      }
    }

    /**
     * トークン期限切れ時の処理
     */
    handleTokenExpired() {
      console.warn('⏰ Googleトークンが期限切れになりました');

      // Google認証情報をクリア
      if (window.IntegratedAuthManager) {
        window.IntegratedAuthManager.clearGoogleAuth();
      }

      // ユーザーに通知（次回Google API使用時）
      const showReauthNotice = () => {
        alert(
          'Googleアカウントの認証が期限切れになりました。\n\n' +
          'Google Drive/Sheets機能を使用するには、再度ログインしてください。'
        );
        // 通知は1回のみ
        window.removeEventListener('click', showReauthNotice);
      };

      // 次回クリック時に通知
      window.addEventListener('click', showReauthNotice, { once: true });
    }

    /**
     * Google再認証を促す
     */
    promptReauth() {
      // 設定ページにリダイレクト（再認証を促す）
      if (confirm('設定ページに移動して再認証しますか？')) {
        window.location.href = '/settings.html?reauth=google';
      }
    }

    /**
     * 監視を停止
     */
    stopMonitoring() {
      if (this.activityCheckTimer) {
        clearInterval(this.activityCheckTimer);
        this.activityCheckTimer = null;
      }

      if (this.tokenRefreshTimer) {
        clearInterval(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }

      this.isMonitoring = false;
      console.log('⏸️ セッション監視停止');
    }

    /**
     * セッション情報を取得
     */
    getSessionInfo() {
      const now = Date.now();
      const elapsed = this.lastActivityTime ? now - this.lastActivityTime : 0;
      const timeout = SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
      const remaining = timeout - elapsed;

      return {
        lastActivityTime: this.lastActivityTime,
        lastActivityDate: this.lastActivityTime ? new Date(this.lastActivityTime) : null,
        elapsedMs: elapsed,
        remainingMs: remaining,
        isExpired: this.isSessionExpired(),
        timeoutDays: SESSION_TIMEOUT_DAYS,
      };
    }

    /**
     * セッション情報を表示（デバッグ用）
     */
    logSessionInfo() {
      const info = this.getSessionInfo();
      console.log('📊 セッション情報:', {
        最終アクティビティ: info.lastActivityDate?.toLocaleString('ja-JP'),
        経過時間: `${Math.floor(info.elapsedMs / 1000 / 60 / 60)}時間`,
        残り時間: `${Math.floor(info.remainingMs / 1000 / 60 / 60 / 24)}日`,
        期限切れ: info.isExpired,
        タイムアウト設定: `${info.timeoutDays}日`,
      });
    }
  }

  // グローバルインスタンスを作成
  window.sessionManager = new SessionManager();

  // ページ読み込み時に自動初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // ログインページでは初期化しない
      if (!window.location.pathname.includes('/login.html')) {
        window.sessionManager.initialize();
      }
    });
  } else {
    // 既に読み込み済みの場合
    if (!window.location.pathname.includes('/login.html')) {
      window.sessionManager.initialize();
    }
  }

  console.log('✅ Session Manager ロード完了');

})(); // IIFE end
