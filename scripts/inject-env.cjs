#!/usr/bin/env node

/**
 * 環境変数注入スクリプト
 *
 * ビルド時にconfig.jsのプレースホルダーを実際の環境変数で置き換える
 * Vercelのビルドプロセスで自動実行される
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../public/js/config.js');

// 環境変数から値を取得（デフォルト値付き）
const ENV_VARS = {
  '__SUPABASE_URL__': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjfspvwwzaemfmeizvhl.supabase.co',
  '__SUPABASE_ANON_KEY__': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  '__STRIPE_PUBLISHABLE_KEY__': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  '__APP_URL__': process.env.NEXT_PUBLIC_APP_URL || 'https://rentpipe.vercel.app',
  '__ADMIN_EMAIL__': process.env.ADMIN_EMAIL || 'jajaumajam@gmail.com'
};

try {
  // config.jsを読み込む
  let configContent = fs.readFileSync(CONFIG_FILE, 'utf8');

  // プレースホルダーを環境変数で置き換え
  Object.entries(ENV_VARS).forEach(([placeholder, value]) => {
    if (!value && placeholder !== '__APP_URL__') {
      console.warn(`⚠️  Warning: ${placeholder} is not set`);
    }
    configContent = configContent.replace(
      new RegExp(`'${placeholder}'`, 'g'),
      `'${value}'`
    );
  });

  // ファイルに書き戻す
  fs.writeFileSync(CONFIG_FILE, configContent, 'utf8');

  console.log('✅ Environment variables injected into config.js');
  console.log('📝 Injected values:');
  Object.entries(ENV_VARS).forEach(([placeholder, value]) => {
    const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`   ${placeholder.replace(/__/g, '')}: ${displayValue || '(not set)'}`);
  });

} catch (error) {
  console.error('❌ Error injecting environment variables:', error.message);
  process.exit(1);
}
