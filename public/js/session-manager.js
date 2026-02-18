/**
 * Session Manager
 * セッションタイムアウトとGoogleトークン監視を管理
 *
 * 方針:
 *   - 24時間操作なし → 自動ログアウト
 *   - Googleトークン失効 → 即時ログアウト
 *   - 途中の再認証ポップアップは一切表示しない
 */

(function() {
  'use strict';

  // ============================================
  // 設定
  // ============================================
  const SESSION_TIMEOUT_HOURS = 24;   // 非操作タイムアウト（時間）
  const ACTIVITY_CHECK_INTERVAL = 60000;  // チェック間隔（1分）

  class SessionManager {
    constructor() {
      this.lastActivityTime = null;
      this.activityCheckTimer = null;
      this.tokenCheckTimer = null;
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
        this.logout('timeout');
        return false;
      }

      // Googleトークンチェック（即時）
      if (this.isGoogleTokenExpired()) {
        console.warn('⏰ Googleトークンが失効しています');
        this.logout('token_expired');
        return false;
      }

      // 現在のアクティビティ時刻を更新
      this.updateLastActivity();

      // 監視開始
      this.startActivityMonitoring();
      this.startTokenMonitoring();

      console.log(`✅ Session Manager 初期化完了（タイムアウト: ${SESSION_TIMEOUT_HOURS}時間）`);
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
        this.lastActivityTime = Date.now();
      }
    }

    /**
     * セッションがタイムアウトしているかチェック
     */
    isSessionExpired() {
      if (!this.lastActivityTime) return false;
      const elapsed = Date.now() - this.lastActivityTime;
      const timeout = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
      return elapsed > timeout;
    }

    /**
     * Googleトークンが失効しているかチェック
     */
    isGoogleTokenExpired() {
      try {
        const raw = localStorage.getItem('google_auth_data');
        if (!raw) return false;  // Google未連携なら問題なし
        const data = JSON.parse(raw);
        if (!data.tokenExpiry) return false;
        return data.tokenExpiry <= Date.now();
      } catch (e) {
        return false;
      }
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
      if (this.isMonitoring) return;

      const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];

      let activityTimeout = null;
      const debouncedUpdate = () => {
        if (activityTimeout) clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
          this.updateLastActivity();
        }, 1000);
      };

      events.forEach(event => {
        document.addEventListener(event, debouncedUpdate, { passive: true });
      });

      // 定期チェック: 非操作タイムアウト
      this.activityCheckTimer = setInterval(() => {
        if (this.isSessionExpired()) {
          console.warn('⏰ 非操作タイムアウト検出');
          this.logout('timeout');
        }
      }, ACTIVITY_CHECK_INTERVAL);

      this.isMonitoring = true;
      console.log(`👁️ アクティビティ監視開始（タイムアウト: ${SESSION_TIMEOUT_HOURS}時間）`);
    }

    /**
     * Googleトークン監視を開始（1分ごと）
     */
    startTokenMonitoring() {
      this.tokenCheckTimer = setInterval(() => {
        if (this.isGoogleTokenExpired()) {
          console.warn('⏰ Googleトークン失効を検出');
          this.logout('token_expired');
        }
      }, ACTIVITY_CHECK_INTERVAL);

      console.log('🔄 Googleトークン監視開始');
    }

    /**
     * ログアウト処理（共通）
     * @param {'timeout'|'token_expired'|'manual'} reason
     */
    logout(reason = 'manual') {
      // 監視を停止
      this.stopMonitoring();

      // セッションをクリア
      this.clearSession();

      // ログインページへリダイレクト（理由をクエリパラメータで渡す）
      window.location.href = `/login.html?reason=${reason}`;
    }

    /**
     * セッションをクリア
     */
    clearSession() {
      console.log('🗑️ セッションクリア中...');

      if (window.IntegratedAuthManager) {
        window.IntegratedAuthManager.clearGoogleAuth();
      }

      const keysToRemove = [
        'google_auth_data',
        'google_access_token',
        'google_token_expiry',
        'rentpipe_supabase_user',
        'rentpipe_last_activity',
        'rentpipe_auth',
        'rentpipe_auth_simple',
        'rentpipe_user_info',
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('✅ セッションクリア完了');
    }

    /**
     * 監視を停止
     */
    stopMonitoring() {
      if (this.activityCheckTimer) {
        clearInterval(this.activityCheckTimer);
        this.activityCheckTimer = null;
      }
      if (this.tokenCheckTimer) {
        clearInterval(this.tokenCheckTimer);
        this.tokenCheckTimer = null;
      }
      this.isMonitoring = false;
      console.log('⏸️ セッション監視停止');
    }

    /**
     * セッション情報を取得（デバッグ用）
     */
    getSessionInfo() {
      const now = Date.now();
      const elapsed = this.lastActivityTime ? now - this.lastActivityTime : 0;
      const timeout = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
      const remaining = timeout - elapsed;

      return {
        lastActivityTime: this.lastActivityTime,
        lastActivityDate: this.lastActivityTime ? new Date(this.lastActivityTime) : null,
        elapsedMs: elapsed,
        remainingMs: remaining,
        isExpired: this.isSessionExpired(),
        timeoutHours: SESSION_TIMEOUT_HOURS,
      };
    }
  }

  // グローバルインスタンスを作成
  window.sessionManager = new SessionManager();

  // ページ読み込み時に自動初期化（ログインページは除外）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.location.pathname.includes('/login.html')) {
        window.sessionManager.initialize();
      }
    });
  } else {
    if (!window.location.pathname.includes('/login.html')) {
      window.sessionManager.initialize();
    }
  }

  console.log('✅ Session Manager ロード完了');

})();
