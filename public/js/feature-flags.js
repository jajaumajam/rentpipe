/**
 * Feature Flags Configuration
 * 機能制限の有効化/無効化を管理
 *
 * BETA_MODE = true: 全機能を無料で開放（ベータ版）
 * BETA_MODE = false: プラン別の機能制限を有効化（正式版）
 */

(function() {
  'use strict';

  // ============================================
  // ベータ版モード設定
  // ============================================
  // true: 全機能無料開放（ベータ版）
  // false: プラン別機能制限を有効化（正式版）
  const BETA_MODE = true;

  // ============================================
  // プラン別機能定義
  // ============================================
  const PLAN_FEATURES = {
    free: {
      // 基本機能
      customerManagement: true,      // 顧客管理（CRUD）
      pipeline: true,                // パイプライン（カンバン）
      archive: true,                 // アーカイブ機能
      customerNotes: true,           // 顧客メモ

      // Google連携（基本）
      googleDrive: true,             // Google Driveへのデータ保存
      googleSheets: true,            // Google Sheetsへの同期
      calendarBasic: true,           // カレンダー連携（基本）

      // 制限付き機能
      googleForms: false,            // Googleフォーム連携
      calendarAdvanced: false,       // カレンダー連携（拡張）
      templates: false,              // 連絡テンプレート管理
      followUpAutomation: false,     // フォローアップ自動化

      // 将来の拡張機能（全プランで無効）
      analytics: false,              // 分析ダッシュボード
      teamCollaboration: false,      // チーム機能
      apiAccess: false,              // API アクセス
    },

    senior_agent: {
      // 基本機能（全て有効）
      customerManagement: true,
      pipeline: true,
      archive: true,
      customerNotes: true,

      // Google連携（全て有効）
      googleDrive: true,
      googleSheets: true,
      calendarBasic: true,

      // 拡張機能（全て有効）
      googleForms: true,             // Googleフォーム連携
      calendarAdvanced: true,        // カレンダー連携（拡張）
      templates: true,               // 連絡テンプレート管理
      followUpAutomation: true,      // フォローアップ自動化

      // 将来の拡張機能（無効）
      analytics: false,
      teamCollaboration: false,
      apiAccess: false,
    },

    // 将来の上位プラン
    top_agent: {
      // 全機能有効（将来実装）
      customerManagement: true,
      pipeline: true,
      archive: true,
      customerNotes: true,
      googleDrive: true,
      googleSheets: true,
      calendarBasic: true,
      googleForms: true,
      calendarAdvanced: true,
      templates: true,
      followUpAutomation: true,
      analytics: true,
      teamCollaboration: true,
      apiAccess: true,
    }
  };

  // ============================================
  // 機能アクセスチェック
  // ============================================
  class FeatureFlags {
    constructor() {
      this.betaMode = BETA_MODE;
      this.features = PLAN_FEATURES;
    }

    /**
     * 機能へのアクセス権限をチェック
     * @param {string} featureName - 機能名
     * @param {string} userPlan - ユーザープラン (free, senior_agent, top_agent)
     * @returns {boolean} - アクセス可能ならtrue
     */
    hasAccess(featureName, userPlan = 'free') {
      // ベータ版モードの場合、全機能にアクセス可能
      if (this.betaMode) {
        console.log(`[FeatureFlags] Beta mode: ${featureName} is accessible for all users`);
        return true;
      }

      // 正式版モード：プラン別の機能制限を適用
      const plan = userPlan || 'free';
      const planFeatures = this.features[plan];

      if (!planFeatures) {
        console.warn(`[FeatureFlags] Unknown plan: ${plan}`);
        return false;
      }

      const hasAccess = planFeatures[featureName] === true;
      console.log(`[FeatureFlags] Plan: ${plan}, Feature: ${featureName}, Access: ${hasAccess}`);

      return hasAccess;
    }

    /**
     * 機能アクセスを試行（アクセス不可の場合はアップグレードモーダル表示）
     * @param {string} featureName - 機能名
     * @param {string} userPlan - ユーザープラン
     * @returns {boolean} - アクセス可能ならtrue
     */
    tryAccess(featureName, userPlan = 'free') {
      const hasAccess = this.hasAccess(featureName, userPlan);

      if (!hasAccess && !this.betaMode) {
        this.showUpgradeModal(featureName);
      }

      return hasAccess;
    }

    /**
     * アップグレードモーダルを表示
     * @param {string} featureName - 機能名
     */
    showUpgradeModal(featureName) {
      const featureNames = {
        googleForms: 'Googleフォーム連携',
        calendarAdvanced: 'カレンダー連携（拡張）',
        templates: '連絡テンプレート管理',
        followUpAutomation: 'フォローアップ自動化',
        analytics: '分析ダッシュボード',
        teamCollaboration: 'チーム機能',
        apiAccess: 'API アクセス',
      };

      const displayName = featureNames[featureName] || featureName;

      // PlanManagerのアップグレードモーダルを呼び出し
      if (window.planManager && typeof window.planManager.showUpgradeModal === 'function') {
        window.planManager.showUpgradeModal(displayName);
      } else {
        // フォールバック：シンプルなアラート
        alert(`この機能（${displayName}）はSenior Agentプラン以上で利用可能です。\n\nプランをアップグレードしてください。`);
      }
    }

    /**
     * ベータ版モードかどうかを取得
     * @returns {boolean}
     */
    isBetaMode() {
      return this.betaMode;
    }

    /**
     * プランで利用可能な機能一覧を取得
     * @param {string} userPlan - ユーザープラン
     * @returns {string[]} - 利用可能な機能名の配列
     */
    getAvailableFeatures(userPlan = 'free') {
      if (this.betaMode) {
        // ベータ版：全機能を返す
        return Object.keys(this.features.senior_agent);
      }

      const plan = userPlan || 'free';
      const planFeatures = this.features[plan];

      if (!planFeatures) {
        return [];
      }

      return Object.keys(planFeatures).filter(key => planFeatures[key] === true);
    }

    /**
     * 機能名の日本語表示名を取得
     * @param {string} featureName - 機能名
     * @returns {string} - 日本語表示名
     */
    getFeatureDisplayName(featureName) {
      const displayNames = {
        customerManagement: '顧客管理',
        pipeline: 'パイプライン',
        archive: 'アーカイブ',
        customerNotes: '顧客メモ',
        googleDrive: 'Google Drive連携',
        googleSheets: 'Google Sheets連携',
        calendarBasic: 'カレンダー連携（基本）',
        googleForms: 'Googleフォーム連携',
        calendarAdvanced: 'カレンダー連携（拡張）',
        templates: '連絡テンプレート管理',
        followUpAutomation: 'フォローアップ自動化',
        analytics: '分析ダッシュボード',
        teamCollaboration: 'チーム機能',
        apiAccess: 'API アクセス',
      };

      return displayNames[featureName] || featureName;
    }
  }

  // グローバルインスタンスを作成
  window.featureFlags = new FeatureFlags();

  // ベータ版モードの状態をコンソールに表示
  if (window.featureFlags.isBetaMode()) {
    console.log('%c🚀 BETA MODE ENABLED: All features are available for free!',
      'background: #4CAF50; color: white; font-size: 14px; padding: 5px 10px; border-radius: 3px;');
  } else {
    console.log('%c✅ Production mode: Plan-based feature restrictions are active',
      'background: #2196F3; color: white; font-size: 14px; padding: 5px 10px; border-radius: 3px;');
  }

})(); // IIFE end
