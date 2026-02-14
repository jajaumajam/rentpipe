# RentPipe デプロイメントガイド

このガイドでは、RentPipeをVercelにデプロイし、Supabase・Stripeと連携させる手順を説明します。

## 前提条件

- Node.js (v18以上)
- Vercelアカウント
- Supabaseアカウント
- Stripeアカウント
- Google Cloud Consoleプロジェクト（既存のものを使用）

---

## 1. Supabaseプロジェクトのセットアップ

### 1.1 プロジェクトを作成

1. [supabase.com](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定
4. プロジェクトが作成されるまで待機（2-3分）

### 1.2 データベーススキーマを設定

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/schema.sql` の内容をコピー
3. SQLエディタに貼り付けて実行
4. 実行成功を確認

### 1.3 認証を有効化

1. 「Authentication」→「Providers」を開く
2. 「Email」プロバイダーを有効化
3. （任意）メールテンプレートをカスタマイズ

### 1.4 認証情報を取得

1. 「Settings」→「API」を開く
2. 以下をコピーして保存:
   - `Project URL`
   - `anon public` key
   - `service_role` key（秘密鍵）

---

## 2. Stripeアカウントのセットアップ

### 2.1 プロダクトと価格を作成

1. [Stripe Dashboard](https://dashboard.stripe.com) にログイン
2. 「Products」→「Add product」をクリック
3. 以下の情報で作成:
   - **Name**: Senior Agent Plan
   - **Description**: RentPipe Senior Agent プラン - Googleフォーム連携、拡張カレンダー機能、テンプレート管理
   - **Pricing**: ¥2,480 / month (recurring)
4. 作成後、Price IDをコピー（`price_...`）

### 2.2 Webhookエンドポイントを設定

**注意**: この手順はVercelデプロイ後に実施してください。

1. 「Developers」→「Webhooks」を開く
2. 「Add endpoint」をクリック
3. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
4. 以下のイベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 「Add endpoint」をクリック
6. Webhook signing secret（`whsec_...`）をコピー

### 2.3 APIキーを取得

1. 「Developers」→「API keys」を開く
2. 以下をコピー:
   - **Publishable key** (`pk_test_...` または `pk_live_...`)
   - **Secret key** (`sk_test_...` または `sk_live_...`)

---

## 3. Vercelにデプロイ

### 3.1 依存関係をインストール

```bash
cd rentpipe
npm install
```

### 3.2 Vercel CLIでログイン

```bash
npm install -g vercel
vercel login
```

### 3.3 プロジェクトをリンク

```bash
vercel link
```

プロジェクト名、チーム、プロジェクトパスを設定します。

### 3.4 環境変数を設定

Vercelダッシュボードで環境変数を設定:

```bash
# または CLI で設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_PRICE_SENIOR_AGENT
vercel env add NEXT_PUBLIC_APP_URL
```

各値は前のステップで取得したものを入力します。

### 3.5 デプロイ

```bash
vercel --prod
```

デプロイが完了すると、URLが表示されます（例: `https://rentpipe.vercel.app`）。

---

## 4. 動作確認

### 4.1 アプリにアクセス

1. デプロイされたURLにアクセス
2. Googleアカウントでログイン（既存のGoogle OAuth設定を使用）

### 4.2 プラン機能のテスト

1. 設定画面（`/settings.html`）を開く
2. 「プラン管理」セクションで現在のプラン（Free）を確認
3. 「アップグレード」ボタンをクリック
4. Stripe Checkoutページにリダイレクトされることを確認

**テストカード情報（Stripeテストモード）:**
- カード番号: `4242 4242 4242 4242`
- 有効期限: 任意の未来の日付
- CVC: 任意の3桁
- 郵便番号: 任意

5. 支払いを完了
6. アプリにリダイレクトされる
7. 設定画面で「Senior Agent」プランに変更されていることを確認

### 4.3 機能制限のテスト

1. Freeプランでログインした状態で、Googleフォーム機能にアクセス
2. アップグレードモーダルが表示されることを確認
3. Senior Agentプランにアップグレード後、機能にアクセスできることを確認

---

## 5. 本番環境への移行

### 5.1 Stripeを本番モードに切り替え

1. Stripe Dashboard で「Test mode」を「Live mode」に切り替え
2. 本番用のAPIキーとWebhook secretを取得
3. Vercelの環境変数を本番用に更新

### 5.2 Google OAuth設定を更新

1. Google Cloud Consoleで承認済みのリダイレクトURIに本番URLを追加
2. 本番ドメインを承認済みJavaScriptオリジンに追加

### 5.3 Supabaseの設定を確認

1. RLS（Row Level Security）が有効になっていることを確認
2. 認証設定を確認
3. 本番環境用の認証情報を確認

---

## トラブルシューティング

### Webhook が動作しない

- Webhook URLが正しいか確認
- Webhook signing secretが環境変数に正しく設定されているか確認
- Vercelの関数ログでエラーを確認

### プラン情報が更新されない

- Supabaseの接続情報が正しいか確認
- ブラウザのコンソールでエラーを確認
- `/api/user/plan` エンドポイントが正しく動作しているか確認

### Stripe Checkout にリダイレクトされない

- Stripe Secret Keyが正しく設定されているか確認
- Price IDが正しいか確認
- ブラウザのネットワークタブでAPIリクエストを確認

---

## セキュリティチェックリスト

- [ ] Supabase Service Role Keyは環境変数で管理され、クライアント側に露出していない
- [ ] Stripe Secret Keyは環境変数で管理され、クライアント側に露出していない
- [ ] Supabase RLSが有効になっている
- [ ] Webhookエンドポイントで署名検証が有効
- [ ] HTTPS通信のみ許可されている
- [ ] 本番環境では適切なCORS設定がされている

---

## 次のステップ

Phase 1が完了しました！次は以下を検討してください:

1. **Phase 2: 決済機能の拡張**
   - Top Agentプランの追加
   - 年間プランの追加
   - クーポン機能

2. **Phase 3: 機能制限の強化**
   - フロントエンドでの詳細な機能制限
   - APIレベルでの機能制限

3. **Phase 4: UI/UX改善**
   - プラン比較ページの作成
   - オンボーディングフローの追加
   - ダッシュボードでのプラン情報表示

4. **Phase 5: モニタリング**
   - Sentryなどのエラートラッキング
   - Vercel Analyticsの導入
   - Stripe Dashboardでの売上モニタリング
