/**
 * Notification Manager
 * お知らせ通知の管理（バナー表示・既読管理）
 */

(function() {
  'use strict';

  const NotificationManager = {
    // 通知データ
    notifications: [
      {
        id: 'beta-launch-2026',
        type: 'banner',
        priority: 1,
        title: 'ベータ版リリースのお知らせ',
        message: 'RentPipeベータ版へようこそ！現在、全機能を無料でご利用いただけます。ご意見・ご要望は意見箱からお気軽にお寄せください。',
        variant: 'info', // info, success, warning, danger
        startDate: '2026-02-01',
        endDate: '2026-12-31',
        dismissible: true,
        showOnPages: [] // 空配列 = 全ページに表示
      }
      // 追加の通知はここに追加
    ],

    // localStorageキー
    STORAGE_KEY: 'rentpipe_notification_read_status',
    STORAGE_EXPIRY_DAYS: 90, // 既読データの保持期間

    /**
     * 初期化
     */
    init() {
      console.log('📢 Notification Manager 初期化中...');
      this.cleanupOldReadStatus();
      this.renderBanners();
      console.log('✅ Notification Manager 初期化完了');
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
     * バナーを表示
     */
    renderBanners() {
      const container = document.getElementById('notification-banners');
      if (!container) {
        console.warn('⚠️ notification-banners コンテナが見つかりません');
        return;
      }

      const activeNotifications = this.getActiveNotifications();

      if (activeNotifications.length === 0) {
        container.innerHTML = '';
        return;
      }

      // 最大2件まで表示
      const toShow = activeNotifications.slice(0, 2);

      container.innerHTML = toShow.map(notif => this.createBannerHTML(notif)).join('');

      // 閉じるボタンのイベントリスナー
      toShow.forEach(notif => {
        if (notif.dismissible) {
          const dismissBtn = document.getElementById(`dismiss-${notif.id}`);
          if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismiss(notif.id));
          }
        }
      });

      console.log(`📢 ${toShow.length}件のバナー通知を表示しました`);
    },

    /**
     * バナーHTML生成
     */
    createBannerHTML(notif) {
      const variantStyles = {
        info: 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;',
        success: 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;',
        warning: 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;',
        danger: 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;'
      };

      const style = variantStyles[notif.variant] || variantStyles.info;

      return `
        <div class="notification-banner" id="banner-${notif.id}" style="${style} padding: 16px 20px; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideDown 0.3s ease-out;">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">${notif.title}</div>
              <div style="font-size: 0.9rem; opacity: 0.95;">${notif.message}</div>
            </div>
            ${notif.dismissible ? `
              <button id="dismiss-${notif.id}" style="background: rgba(255,255,255,0.2); color: inherit; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 1.2rem; line-height: 1; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ×
              </button>
            ` : ''}
          </div>
        </div>
      `;
    },

    /**
     * バナーを閉じる
     */
    dismiss(notificationId) {
      const banner = document.getElementById(`banner-${notificationId}`);
      if (banner) {
        // アニメーション付きで削除
        banner.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          banner.remove();
          this.markAsRead(notificationId);
        }, 300);
      }
    },

    /**
     * 全既読状態をリセット（デバッグ用）
     */
    resetAllRead() {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🔄 全既読状態をリセットしました');
      this.renderBanners();
    },

    /**
     * 新しい通知を追加（管理者用）
     */
    addNotification(notification) {
      this.notifications.push(notification);
      this.renderBanners();
    }
  };

  // グローバルスコープに公開
  window.NotificationManager = NotificationManager;

  // CSSアニメーション追加
  if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  console.log('✅ Notification Manager ロード完了');

})();
