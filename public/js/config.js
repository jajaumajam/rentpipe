/**
 * RentPipe Configuration
 *
 * セキュリティ: 機密情報は環境変数から注入されます
 * ビルド時に scripts/inject-env.js が実行され、プレースホルダーが置き換えられます
 */

// Supabase設定（ビルド時に環境変数から注入）
window.SUPABASE_URL = '__SUPABASE_URL__';
window.SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

// Stripe設定（ビルド時に環境変数から注入）
window.STRIPE_PUBLISHABLE_KEY = '__STRIPE_PUBLISHABLE_KEY__';

// Stripe Price IDs（ビルド時に環境変数から注入）
window.STRIPE_PRICE_SENIOR_AGENT = '__STRIPE_PRICE_SENIOR_AGENT__';

// アプリURL（ビルド時に環境変数から注入）
window.APP_URL = '__APP_URL__';

// 管理者メール（ビルド時に環境変数から注入）
window.ADMIN_EMAIL = '__ADMIN_EMAIL__';

// 意見箱（LINEオープンチャット） - 公開情報なのでハードコード可
window.FEEDBACK_LINE_URL = 'https://line.me/ti/g2/DsmrFz_36bh5BDMJ80DpDtNQ-0fjGDKx_cdoCg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';

// サポートメール（ビルド時に環境変数から注入）
window.SUPPORT_EMAIL = '__SUPPORT_EMAIL__';

// アプリバージョン
window.APP_VERSION = '1.0.0-beta';

// AppConfigオブジェクトとしても利用可能
// DEBUG_MODE: localhost / 127.0.0.1 では自動的に有効化、本番（Vercel）では無効
const _isLocalDev = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

window.AppConfig = {
  FEEDBACK_LINE_URL: window.FEEDBACK_LINE_URL,
  SUPPORT_EMAIL: window.SUPPORT_EMAIL || '',
  VERSION: window.APP_VERSION,
  APP_NAME: 'RentPipe',
  DEBUG_MODE: _isLocalDev,
  ADMIN_EMAIL: window.ADMIN_EMAIL,
  STRIPE_PRICE_SENIOR_AGENT: window.STRIPE_PRICE_SENIOR_AGENT
};

/**
 * ロガーユーティリティ
 * DEBUG_MODE = false の本番環境では console.log / console.warn を抑制する。
 * console.error は常に出力（障害追跡のため）。
 *
 * 使い方: 新規コードでは console.log の代わりに AppLogger.log を使う。
 * 既存コードは移行が完了するまでそのまま動作する。
 */
window.AppLogger = {
  log: function(...args) {
    if (window.AppConfig?.DEBUG_MODE) console.log(...args);
  },
  warn: function(...args) {
    if (window.AppConfig?.DEBUG_MODE) console.warn(...args);
  },
  error: function(...args) {
    // エラーは常に出力
    console.error(...args);
  },
  info: function(...args) {
    if (window.AppConfig?.DEBUG_MODE) console.info(...args);
  }
};

// 本番環境（DEBUG_MODE = false）では console.log / console.warn を抑制
// console.error は常に有効（障害追跡のため）
// ※ 開発時は DEBUG_MODE を true に変更するか、DevTools から AppConfig.DEBUG_MODE = true を実行してください
if (!window.AppConfig.DEBUG_MODE) {
  const noop = () => {};
  /* eslint-disable no-console */
  console.log   = noop;
  console.warn  = noop;
  console.info  = noop;
  console.debug = noop;
  /* eslint-enable no-console */
}

