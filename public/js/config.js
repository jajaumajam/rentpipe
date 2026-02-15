/**
 * RentPipe Configuration
 *
 * IMPORTANT: Supabase環境変数をここに設定してください
 *
 * Supabase Dashboard → Settings → API から取得:
 * - Project URL
 * - anon public key
 */

// Supabase設定
window.SUPABASE_URL = 'https://pjfspvwwzaemfmeizvhl.supabase.co'; // 例: https://xxxxx.supabase.co
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZnNwdnd3emFlbWZtZWl6dmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTE4MDUsImV4cCI6MjA4NjU2NzgwNX0.S2orVh93qxaYo_2ez1wvTzBakm1kNW4iwpVhPKmklXU'; // 例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Stripe設定（公開キー）
window.STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY'; // 例: pk_test_...

// アプリURL
window.APP_URL = 'https://rentpipe.vercel.app';

// 意見箱（LINEオープンチャット）
window.FEEDBACK_LINE_URL = 'https://line.me/ti/g2/DsmrFz_36bh5BDMJ80DpDtNQ-0fjGDKx_cdoCg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';

// サポートメール
window.SUPPORT_EMAIL = 'support@rentpipe.example.com';

// アプリバージョン
window.APP_VERSION = '1.0.0-beta';

// AppConfigオブジェクトとしても利用可能
window.AppConfig = {
  FEEDBACK_LINE_URL: window.FEEDBACK_LINE_URL,
  SUPPORT_EMAIL: window.SUPPORT_EMAIL,
  VERSION: window.APP_VERSION,
  APP_NAME: 'RentPipe',
  DEBUG_MODE: false
};

console.log('✅ Config loaded');
