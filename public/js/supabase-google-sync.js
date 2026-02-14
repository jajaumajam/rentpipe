/**
 * Supabase Google OAuth Sync
 * Google OAuthのログイン情報を使って、Supabaseにユーザーを自動作成
 */

(function() {
  'use strict';

class SupabaseGoogleSync {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初期化
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // PlanManagerが初期化されるまで待つ
    if (!window.planManager) {
      console.warn('PlanManager not available');
      return;
    }

    await window.planManager.initialize();
    this.initialized = true;
  }

  /**
   * Google OAuthのユーザー情報を使ってSupabaseにサインイン/サインアップ
   */
  async syncGoogleUser(googleUser) {
    try {
      if (!googleUser || !googleUser.email) {
        console.error('Google user email not available');
        return null;
      }

      console.log('🔄 Syncing Google user to Supabase:', googleUser.email);

      // PlanManagerを初期化
      await this.initialize();

      if (!window.planManager || !window.planManager.supabase) {
        console.warn('Supabase not configured - skipping sync');
        return null;
      }

      const supabase = window.planManager.supabase;
      const email = googleUser.email;

      // まず、既存のセッションを確認
      const { data: { session } } = await supabase.auth.getSession();

      // 既にログイン済みで同じメールアドレスの場合はスキップ
      if (session && session.user.email === email) {
        console.log('✅ Already signed in to Supabase:', email);
        window.planManager.currentUser = session.user;
        await window.planManager.fetchPlan();
        return session.user;
      }

      // Magic Link（パスワードレス）でサインイン/サインアップ
      // ※ この方法では、ユーザーがメールを確認する必要がないように設定する

      // 実際には、OAuth Provider（Google）を使用するのが理想的ですが、
      // 簡易実装として、APIを使ってユーザーを直接作成します

      // まず、ユーザーが既に存在するか確認
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = データが見つからない（これは正常）
        console.error('Error checking existing user:', fetchError);
      }

      // ユーザーが存在する場合
      if (existingUsers && existingUsers.length > 0) {
        console.log('✅ User already exists in Supabase:', email);

        // セッションを作成するために、バックエンドAPIを使用
        // ここでは、クライアント側でできることが限られているため、
        // ユーザー情報を localStorage に保存して、PlanManager で使用
        const userData = existingUsers[0];
        localStorage.setItem('rentpipe_supabase_user', JSON.stringify({
          id: userData.id,
          email: userData.email,
          plan: userData.plan
        }));

        window.planManager.currentPlan = userData.plan;
        return userData;
      }

      // 新規ユーザーの場合、APIを使って作成
      console.log('📝 Creating new Supabase user:', email);

      // バックエンドAPIを呼び出してユーザーを作成
      const response = await fetch('/api/user/create-from-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: googleUser.name || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Supabase user');
      }

      const result = await response.json();
      console.log('✅ Supabase user created:', result);

      // ユーザー情報を localStorage に保存
      localStorage.setItem('rentpipe_supabase_user', JSON.stringify({
        id: result.userId,
        email: email,
        plan: 'free'
      }));

      window.planManager.currentPlan = 'free';
      return result;

    } catch (error) {
      console.error('Error syncing Google user to Supabase:', error);
      return null;
    }
  }

  /**
   * Google OAuthログイン後に呼び出される
   */
  async onGoogleSignIn(googleUser) {
    return await this.syncGoogleUser(googleUser);
  }

  /**
   * 保存されたユーザー情報を取得
   */
  getSavedUser() {
    try {
      const saved = localStorage.getItem('rentpipe_supabase_user');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Error getting saved user:', error);
      return null;
    }
  }

  /**
   * ユーザー情報をクリア
   */
  clearUser() {
    localStorage.removeItem('rentpipe_supabase_user');
  }
}

// グローバルインスタンスを作成
window.supabaseGoogleSync = new SupabaseGoogleSync();

})(); // IIFE end
