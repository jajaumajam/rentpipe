/**
 * Notification Manager (Supabase連携版)
 * お知らせ通知の管理（バナー表示・既読管理）
 */

(function() {
  'use strict';

  const NotificationManager = {
    // 通知データ（Supabaseから取得）
    notifications: [],

    // Supabaseクライアント
    supabase: null,

    // localStorageキー
    STORAGE_KEY: 'rentpipe_notification_read_status',
    STORAGE_EXPIRY_DAYS: 90, // 既読データの保持期間

    // 初期化済みフラグ
    isInitialized: false,

    /**
     * 初期化
     */
    async init() {
      if (this.isInitialized) {
        console.log('📢 Notification Manager は既に初期化済み');
        return;
      }

      console.log('📢 Notification Manager 初期化中...');

      try {
        // Supabase初期化
        await this.initSupabase();

        // 通知を読み込み
        await this.loadNotifications();

        // 既読データをクリーンアップ
        this.cleanupOldReadStatus();

        // バナーを表示
        this.renderBanners();

        this.isInitialized = true;
        console.log('✅ Notification Manager 初期化完了');
      } catch (error) {
        console.error('❌ Notification Manager 初期化エラー:', error);
        // エラーが発生してもアプリは継続
      }
    },

    /**
     * Supabase初期化
     */
    async initSupabase() {
      if (this.supabase) return;

      if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase設定がありません - お知らせ機能は無効です');
        return;
      }

      // Supabase JSライブラリが読み込まれるまで待つ
      if (!window.supabase) {
        console.log('⏳ Supabase JSライブラリを読み込み中...');
        await this.loadSupabaseScript();
      }

      this.supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );

      console.log('✅ Supabase初期化完了（Notification Manager）');
    },

    /**
     * Supabase JSライブラリを動的ロード
     */
    loadSupabaseScript() {
      return new Promise((resolve, reject) => {
        if (window.supabase) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          console.log('✅ Supabase JSライブラリ読み込み完了');
          setTimeout(resolve, 100); // 少し待つ
        };
        script.onerror = () => reject(new Error('Supabase JSライブラリの読み込みに失敗'));
        document.head.appendChild(script);
      });
    },

    /**
     * 通知をSupabaseから読み込み
     */
    async loadNotifications() {
      if (!this.supabase) {
        console.warn('⚠️ Supabase未初期化 - 通知を読み込めません');
        return;
      }

      try {
        const now = new Date().toISOString();

        const { data, error } = await this.supabase
          .from('notifications')
          .select('*')
          .eq('status', 'published')
          .lte('start_date', now)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('priority', { ascending: true });

        if (error) {
          console.error('通知取得エラー:', error);
          return;
        }

        this.notifications = (data || []).map(n => ({
          id: n.id,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          variant: n.variant,
          startDate: n.start_date,
          endDate: n.end_date,
          dismissible: n.dismissible,
          showOnPages: n.show_on_pages || [],
          showBanner: n.show_banner
        }));

        console.log(`📊 ${this.notifications.length}件の通知を読み込みました`);
      } catch (error) {
        console.error('通知読み込みエラー:', error);
      }
    },

    /**
     * 既読状態を取得
     */
    getReadStatus() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return {};

        const parsed = JSON.parse(data);
        return parsed || {};
      } catch (error) {
        console.error('既読状態の取得エラー:', error);
        return {};
      }
    },

    /**
     * 既読としてマーク
     */
    markAsRead(notificationId) {
      try {
        const readStatus = this.getReadStatus();
        readStatus[notificationId] = {
          readAt: Date.now(),
          dismissed: true
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(readStatus));
        console.log(`📌 通知 ${notificationId} を既読にしました`);
      } catch (error) {
        console.error('既読マークエラー:', error);
      }
    },

    /**
     * 古い既読データをクリーンアップ
     */
    cleanupOldReadStatus() {
      try {
        const readStatus = this.getReadStatus();
        const now = Date.now();
        const expiryMs = this.STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        let cleaned = false;
        Object.keys(readStatus).forEach(id => {
          const readAt = readStatus[id].readAt || 0;
          if (now - readAt > expiryMs) {
            delete readStatus[id];
            cleaned = true;
          }
        });

        if (cleaned) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(readStatus));
          console.log('🗑️ 古い既読データをクリーンアップしました');
        }
      } catch (error) {
        console.error('クリーンアップエラー:', error);
      }
    },

    /**
     * アクティブな通知を取得
     */
    getActiveNotifications() {
      const now = new Date();
      const currentPage = window.location.pathname.split('/').pop() || 'customer.html';
      const readStatus = this.getReadStatus();

      return this.notifications
        .filter(notif => {
          // 既読チェック
          if (notif.dismissible && readStatus[notif.id]?.dismissed) {
            return false;
          }

          // 期間チェック
          const startDate = notif.startDate ? new Date(notif.startDate) : null;
          const endDate = notif.endDate ? new Date(notif.endDate) : null;

          if (startDate && now < startDate) return false;
          if (endDate && now > endDate) return false;

          // ページフィルター
          if (notif.showOnPages && notif.showOnPages.length > 0) {
            if (!notif.showOnPages.includes(currentPage)) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => (a.priority || 999) - (b.priority || 999));
    },

    /**
     * バナー表示用の通知を取得（customer.htmlのみ）
     */
    getBannerNotifications() {
      const currentPage = window.location.pathname.split('/').pop() || 'customer.html';
      if (currentPage !== 'customer.html') return [];
      return this.getActiveNotifications().filter(n => n.showBanner);
    },

    /**
     * バナーを表示
     */
    renderBanners() {
      const container = document.getElementById('notification-banners');
      if (!container) {
        console.warn('⚠️ notification-banners コンテナが見つかりません');
        return;
      }

      const bannerNotifications = this.getBannerNotifications();

      if (bannerNotifications.length === 0) {
        container.innerHTML = '';
        return;
      }

      const variantClasses = {
        info:    'bg-blue-50 border-blue-200 text-blue-900',
        success: 'bg-green-50 border-green-200 text-green-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        danger:  'bg-red-50 border-red-200 text-red-900'
      };
      const closeBtnClasses = {
        info:    'text-blue-500 hover:text-blue-700',
        success: 'text-green-500 hover:text-green-700',
        warning: 'text-yellow-600 hover:text-yellow-800',
        danger:  'text-red-500 hover:text-red-700'
      };

      container.innerHTML = bannerNotifications.map(notif => {
        const vc = variantClasses[notif.variant] || variantClasses.info;
        const bc = closeBtnClasses[notif.variant] || closeBtnClasses.info;

        return `
          <div
            class="notification-banner flex items-start gap-3 p-4 border rounded-xl mb-3 ${vc}"
            data-notification-id="${notif.id}"
            style="animation: slideDown 0.3s ease-out;">
            <div class="flex-1">
              <div class="font-semibold text-sm mb-0.5">${this.escapeHtml(notif.title)}</div>
              <div class="text-sm leading-relaxed opacity-90">${this.escapeHtml(notif.message)}</div>
            </div>
            ${notif.dismissible ? `
              <button
                onclick="NotificationManager.dismissBanner('${notif.id}')"
                class="${bc} bg-transparent border-0 cursor-pointer p-1 text-xl leading-none transition-opacity hover:opacity-70"
                title="閉じる">
                ✕
              </button>
            ` : ''}
          </div>
        `;
      }).join('');
    },

    /**
     * バナーを閉じる
     */
    dismissBanner(notificationId) {
      this.markAsRead(notificationId);

      const banner = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (banner) {
        banner.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          banner.remove();

          // バナーがすべてなくなったらコンテナを非表示
          const container = document.getElementById('notification-banners');
          if (container && container.children.length === 0) {
            container.innerHTML = '';
          }
        }, 300);
      }
    },

    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // グローバルに公開
  window.NotificationManager = NotificationManager;

  console.log('✅ NotificationManager (Supabase連携版) loaded');
})();
