# ベータ版 → 正式リリース チェックリスト

このドキュメントは、`BETA_MODE = false` に切り替えて正式リリースを行う際に確認すべき項目をまとめたものです。

---

## 🔴 必須: リリース前に完了すること

### インフラ・決済

- [ ] **Vercel Pro にアップグレード**
  - 理由: Stripe Webhookなど、一部のServerless Functionはfreeプランの制限を超える可能性がある
  - 手順: Vercel ダッシュボード → Settings → Billing

- [ ] **Stripe を本番モードに切り替える**
  - `STRIPE_SECRET_KEY` を `sk_live_...` に変更
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` を `pk_live_...` に変更
  - `STRIPE_PRICE_SENIOR_AGENT` を本番環境のPrice IDに変更

- [ ] **Stripe Webhook を本番URLに登録**
  - Stripe ダッシュボード → Developers → Webhooks
  - エンドポイントURL: `https://your-domain.com/api/stripe/webhook`
  - 受信イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - `STRIPE_WEBHOOK_SECRET` を本番のWebhookシークレットに更新

- [ ] **Supabase の本番設定を確認**
  - RLS (Row Level Security) が有効になっているか
  - `supabase/schema.sql` が最新のスキーマと一致しているか
  - 通知テーブルのRLSポリシー（`supabase/supabase-notifications-rls-fix.sql`）が適用されているか

- [ ] **環境変数の本番値をVercelに設定**
  - Vercel ダッシュボード → Settings → Environment Variables
  - 全ての `.env.example` の変数が設定されているか確認

### コード変更

- [ ] **`BETA_MODE = false` に変更**
  - ファイル: `public/js/feature-flags.js`
  - 変更箇所: `const BETA_MODE = true;` → `const BETA_MODE = false;`
  - これにより機能制限が有効になり、Stripeの支払いが動作するようになる

- [ ] **`admin.html` のハードコードされたメールアドレスを修正**
  - ファイル: `public/admin.html` 434行目付近
  - `jajaumajam@gmail.com` をハードコードしないよう環境変数または設定に移行

- [ ] **本番URLの確認**
  - `public/js/config.js` の各URLが本番ドメインを指しているか確認

### 動作確認

- [ ] **Free プランの機能制限が正しく動作するか確認**
  - 顧客管理 ✓（使える）
  - パイプライン ✓（使える）
  - Google Forms → アップグレード誘導モーダルが出るか
  - テンプレート → アップグレード誘導モーダルが出るか

- [ ] **Stripe Checkout フローの動作確認（テストモードで最終確認）**
  - `settings.html` からアップグレードボタンを押す
  - Stripe テストカード（`4242 4242 4242 4242`）で決済
  - Webhookが受信され、Supabaseのプランが更新されるか確認
  - アップグレード後に機能が解放されるか確認

- [ ] **Stripe Portal（サブスクリプション管理）の動作確認**
  - `settings.html` からポータルを開けるか確認
  - 解約フローが動作するか確認

---

## 🟡 推奨: リリース前に対応するもの

### 機能

- [ ] **テンプレート機能のバックエンド実装**
  - 現状: `templates.html` はUIのみ（保存・読込ロジックなし）
  - 実装方針: LocalStorageまたはGoogle Drive JSONでテンプレートを管理
  - 変数置換機能（`{{名前}}`、`{{電話番号}}` 等）

- [ ] **Google Forms 統合の完成**
  - フォーム回答と顧客レコードの紐付け
  - 回答の自動取り込みUI

### セキュリティ

- [ ] **APIレート制限の実装**
  - Vercel Edge ConfigまたはUpstash Redis を使ったレート制限

- [ ] **CORS設定の最適化**
  - `vercel.json` のCORS設定が本番ドメインのみを許可しているか確認

### モニタリング

- [ ] **エラーモニタリングの設定**
  - Sentry または Vercel Analytics の導入

- [ ] **Supabase のバックアップ設定確認**
  - Supabase ダッシュボード → Database → Backups

---

## 🟢 リリース後すぐに確認すること

- [ ] 本番環境で実際にログインできるか
- [ ] 顧客の登録・編集・削除が正常に動作するか
- [ ] Google Sheets への同期が動作するか
- [ ] Stripe の決済が正常に完了するか（テスト用クレジットカードで確認）
- [ ] Webhook が受信され、Supabaseのプランが正しく更新されるか
- [ ] お知らせ通知が表示されるか

---

## ⚡ クイックリリース手順

BETA_MODE を切り替えるだけの最小リリースを行う場合:

```bash
# 1. feature-flags.js を編集
#    BETA_MODE = true → BETA_MODE = false

# 2. Stripe 本番キーを環境変数に設定

# 3. Vercel にデプロイ
vercel --prod

# 4. Stripe Webhook を本番URLに登録

# 5. 動作確認
```

---

*最終確認日: （リリース時に記入）*
*担当者: （担当者名を記入）*
