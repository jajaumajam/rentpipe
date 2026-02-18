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

// アプリURL（ビルド時に環境変数から注入）
window.APP_URL = '__APP_URL__';

// 管理者メール（ビルド時に環境変数から注入）
window.ADMIN_EMAIL = '__ADMIN_EMAIL__';

// 意見箱（LINEオープンチャット） - 公開情報なのでハードコード可
window.FEEDBACK_LINE_URL = 'https://line.me/ti/g2/DsmrFz_36bh5BDMJ80DpDtNQ-0fjGDKx_cdoCg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';

// サポートメール - 公開情報なのでハードコード可
window.SUPPORT_EMAIL = 'support@rentpipe.example.com';

// アプリバージョン
window.APP_VERSION = '1.0.0-beta';

// AppConfigオブジェクトとしても利用可能
window.AppConfig = {
  FEEDBACK_LINE_URL: window.FEEDBACK_LINE_URL,
  SUPPORT_EMAIL: window.SUPPORT_EMAIL,
  VERSION: window.APP_VERSION,
  APP_NAME: 'RentPipe',
  DEBUG_MODE: false,
  ADMIN_EMAIL: window.ADMIN_EMAIL
};

console.log('✅ Config loaded');
