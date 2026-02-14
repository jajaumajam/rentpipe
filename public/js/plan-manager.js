/**
 * Plan Manager
 * Handles plan-based feature access and Supabase authentication
 */

(function() {
  'use strict';

  // Supabase createClient は window.supabase.createClient として利用可能
  const { createClient } = window.supabase;

class PlanManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentPlan = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase client and fetch user plan
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize Supabase client
      const supabaseUrl = window.SUPABASE_URL || '';
      const supabaseAnonKey = window.SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase not configured - running in local mode');
        this.currentPlan = 'free';
        this.initialized = true;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get current session
      const { data: { session } } = await this.supabase.auth.getSession();

      if (session) {
        this.currentUser = session.user;
        await this.fetchPlan();
      } else {
        // No session - user is in free plan
        this.currentPlan = 'free';
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing PlanManager:', error);
      this.currentPlan = 'free';
      this.initialized = true;
    }
  }

  /**
   * Fetch user's current plan from API
   */
  async fetchPlan() {
    try {
      const savedUser = window.supabaseGoogleSync?.getSavedUser();

      if (!savedUser || !savedUser.id || !savedUser.email) {
        this.currentPlan = 'free';
        return;
      }

      // サーバーサイドAPIから安全にプラン情報を取得
      console.log('🔄 APIからプラン情報を取得中...');

      const response = await fetch('/api/user/plan-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: savedUser.id,
          email: savedUser.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching plan from API:', errorData);
        // エラーの場合、localStorageの値を使用
        this.currentPlan = savedUser.plan || 'free';
        return;
      }

      const data = await response.json();
      this.currentPlan = data.plan || 'free';
      console.log('✅ プラン情報を取得:', this.currentPlan);

      // localStorageも更新
      savedUser.plan = this.currentPlan;
      localStorage.setItem('rentpipe_supabase_user', JSON.stringify(savedUser));

    } catch (error) {
      console.error('Error fetching plan:', error);
      // エラーの場合、localStorageの値を使用
      const savedUser = window.supabaseGoogleSync?.getSavedUser();
      this.currentPlan = savedUser?.plan || 'free';
    }
  }

  /**
   * Get current plan
   */
  getPlan() {
    return this.currentPlan || 'free';
  }

  /**
   * Check if user has access to a feature
   */
  hasFeatureAccess(feature) {
    const plan = this.getPlan();

    const PLAN_FEATURES = {
      free: ['customerManagement', 'pipeline', 'calendarBasic'],
      senior_agent: ['customerManagement', 'pipeline', 'calendarBasic', 'calendarAdvanced', 'googleForms', 'templates'],
      top_agent: ['customerManagement', 'pipeline', 'calendarBasic', 'calendarAdvanced', 'googleForms', 'templates', 'advancedAnalytics'],
    };

    const allowedFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    return allowedFeatures.includes(feature);
  }

  /**
   * Check feature access and show upgrade modal if needed
   */
  async checkFeatureAccess(feature, featureName) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.hasFeatureAccess(feature)) {
      return true;
    }

    // Show upgrade modal
    this.showUpgradeModal(featureName);
    return false;
  }

  /**
   * Show upgrade modal
   */
  showUpgradeModal(featureName) {
    const modal = document.createElement('div');
    modal.className = 'plan-upgrade-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h2>🚀 プランのアップグレードが必要です</h2>
        <p><strong>${featureName}</strong> は Senior Agent プラン以上でご利用いただけます。</p>

        <div class="plan-comparison">
          <div class="plan-card current">
            <h3>現在のプラン: Free</h3>
            <ul>
              <li>✓ 顧客管理</li>
              <li>✓ パイプライン</li>
              <li>✓ カレンダー連携（基本）</li>
            </ul>
          </div>

          <div class="plan-card upgrade">
            <h3>Senior Agent</h3>
            <p class="price">¥2,480<span>/月</span></p>
            <ul>
              <li>✓ すべてのFree機能</li>
              <li>✓ Googleフォーム連携</li>
              <li>✓ カレンダー連携（拡張）</li>
              <li>✓ 連絡テンプレート</li>
            </ul>
            <button class="btn-upgrade" onclick="window.location.href='/settings.html?tab=plan'">
              アップグレード
            </button>
          </div>
        </div>

        <button class="btn-close" onclick="this.closest('.plan-upgrade-modal').remove()">
          閉じる
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Sign in with Supabase
   */
  async signIn(email, password) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    this.currentUser = data.user;
    await this.fetchPlan();

    return data;
  }

  /**
   * Sign up with Supabase
   */
  async signUp(email, password) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    if (!this.supabase) {
      return;
    }

    await this.supabase.auth.signOut();
    this.currentUser = null;
    this.currentPlan = 'free';
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Check if user is signed in to Supabase
   */
  isSignedIn() {
    // localStorageにユーザー情報があればサインイン済みとみなす
    const savedUser = window.supabaseGoogleSync?.getSavedUser();
    return !!(this.currentUser || savedUser);
  }
}

// Create global instance
window.planManager = new PlanManager();

})(); // IIFE end
