# 開発環境セットアップガイド

## 前提条件

| ツール | 推奨バージョン |
|--------|-------------|
| Node.js | 18.x 以上 |
| npm | 9.x 以上 |
| ブラウザ | Chrome（Google APIデバッグ推奨） |

## 1. リポジトリのクローン

```bash
git clone <リポジトリURL>
cd rentpipe
```

## 2. 依存関係のインストール

```bash
npm install
```

依存パッケージ:
- `@supabase/supabase-js` — Supabase クライアント（APIルート用）
- `stripe` — Stripe サーバーサイドSDK（APIルート用）

## 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して各値を設定します:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe（テストモード）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...（ローカルテスト時はStripe CLIから取得）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_SENIOR_AGENT=price_...

# アプリ
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Google Cloud Console の設定

### 4-1. APIの有効化

[Google Cloud Console](https://console.cloud.google.com/) で以下のAPIを有効化します:
- Google Drive API
- Google Sheets API
- Google Calendar API
- Google Forms API

### 4-2. OAuth 2.0 クライアントIDの設定

1. 「認証情報」→「認証情報を作成」→「OAuthクライアントID」
2. アプリの種類: **ウェブアプリケーション**
3. 承認済みのJavaScriptオリジンに追加:
   - `http://localhost:3000`
   - `http://localhost:8000`
4. 承認済みのリダイレクトURIに追加:
   - `http://localhost:3000/login.html`
   - `http://localhost:8000/login.html`
5. `public/js/integrated-auth-manager-v2.js` の `CLIENT_ID` を更新

## 5. ローカルサーバーの起動

### 方法A: Vercel CLI（推奨 — APIルートも動作）

```bash
npm install -g vercel
vercel dev
```

→ `http://localhost:3000` でアクセス

### 方法B: 静的サーバー（フロントエンドのみ）

```bash
# npx serve
npx serve public

# または Python
python3 -m http.server 8000 --directory public
```

→ `http://localhost:8000` でアクセス
※ APIルート (`/api/*`) は動作しない

## 6. ビルド

```bash
npm run build
```

環境変数をフロントエンドJSに注入します（`scripts/inject-env.cjs`）。

## 7. デバッグのヒント

### Google認証が失敗する場合
1. OAuth クライアントIDのリダイレクトURIを確認
2. ブラウザのコンソールでエラーを確認
3. Google Cloud Console の「割り当てとシステムの状態」でAPIが有効か確認

### LocalStorageのデータ確認

```javascript
// 顧客データの確認
JSON.parse(localStorage.getItem('rentpipe_customers'))

// 認証状態の確認
JSON.parse(localStorage.getItem('rentpipe_auth'))

// 全LocalStorageのクリア（ログアウトと同等）
localStorage.clear()
```

### 通知の既読状態リセット

```javascript
window.NotificationManager.resetAllRead()
```

### 機能フラグの確認

```javascript
// 現在のプランと機能フラグを確認
window.FeatureFlags.getCurrentPlan()
window.FeatureFlags.getFeatures()
```

### Supabase接続確認

```javascript
// plan-manager.js が読み込まれたページで
window.PlanManager.fetchUserPlan()
```

## 8. プロジェクト構成と役割

### JavaScriptモジュールの読み込み順序

全ページ共通（header内):
```html
<script src="js/config.js"></script>
<script src="js/session-manager.js"></script>
<script src="js/notification-manager.js"></script>
<script src="js/navigation.js"></script>
```

ページ固有（body末尾）:
```html
<script src="js/integrated-auth-manager-v2.js"></script>
<script src="js/app-initializer.js"></script>
<script src="js/page-initializer.js"></script>
<!-- 各ページ固有のスクリプト -->
```

### 主要モジュールの責務

| モジュール | 責務 |
|-----------|------|
| `config.js` | アプリ全体の定数・URLを `window.*` に定義 |
| `integrated-auth-manager-v2.js` | Google OAuth フロー・トークン管理 |
| `app-initializer.js` | 認証確認・Google API初期化・データ同期の起動 |
| `session-manager.js` | 7日間タイムアウト・自動ログアウト |
| `unified-data-manager.js` | 顧客データのCRUD・LocalStorage管理 |
| `unified-sheets-manager.js` | Google Sheetsとの同期ロジック |
| `feature-flags.js` | `BETA_MODE` フラグとプラン別機能制御 |
| `plan-manager.js` | Supabaseからプラン情報取得・アップグレードUI |

## 9. よくある問題

### Q: 「ポップアップがブロックされました」が表示される
**A:** RentPipeはRedirect Flow（ポップアップなし）を使用しています。表示される場合はブラウザキャッシュが古い可能性があります。

### Q: Google Sheetsに同期されない
**A:**
1. `settings.html` でGoogle Sheets連携が有効になっているか確認
2. Google Sheets APIが有効か確認
3. コンソールでエラーを確認

### Q: 顧客データが消えた
**A:** LocalStorageをクリアすると顧客データが消えます。Google Drive バックアップから復元できます（`settings.html` > データ復元）。

### Q: ベータモードを無効にしたい（テスト目的）
**A:** `public/js/feature-flags.js` の `BETA_MODE = true` を `false` に変更します。ただし、Stripe の支払い機能が有効になるため、テストには注意が必要です。
