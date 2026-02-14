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

console.log('✅ Config loaded');
