# Phase 1: 最小バックエンド構築 - 完了

Phase 1の実装が完了しました！🎉

## 実装内容

### 1. バックエンドインフラ ✅

- **Vercel設定**
  - `vercel.json` - デプロイ設定
  - `package.json` - 依存関係管理
  - `.env.example` - 環境変数のテンプレート

- **Supabase設定**
  - `supabase/schema.sql` - 最小ユーザーテーブル定義
  - `supabase/README.md` - セットアップガイド
  - ユーザー認証（Email）
  - Row Level Security (RLS)

- **Stripe連携**
  - `api/lib/stripe.js` - Stripeヘルパー関数
  - `api/lib/supabase.js` - Supabaseヘルパー関数

### 2. API Routes ✅

実装したエンドポイント:

- **`/api/user/plan`** (GET)
  - 現在のユーザーのプラン情報を取得
  - 認証トークン必須

- **`/api/stripe/create-checkout`** (POST)
  - Stripe Checkoutセッションを作成
  - サブスクリプション開始

- **`/api/stripe/create-portal`** (POST)
  - Stripe請求管理ポータルセッションを作成
  - サブスクリプション管理・キャンセル

- **`/api/stripe/webhook`** (POST)
  - Stripeからのwebhookイベントを処理
  - プラン状態の自動更新
  - サポートイベント:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`

### 3. フロントエンド機能 ✅

- **`public/js/plan-manager.js`**
  - プラン管理クラス
  - 機能アクセスチェック
  - アップグレードモーダル表示
  - Supabase認証連携

- **`public/css/main.css`**
  - プランアップグレードモーダルのスタイル
  - レスポンシブ対応

- **設定画面（settings.html）**
  - プラン管理セクション追加
  - 現在のプラン表示
  - プラン比較表示
  - アップグレードボタン
  - サブスクリプション管理ボタン

- **テンプレート機能（templates.html）**
  - プランチェック実装例
  - 編集・保存時に機能制限確認

## データベーススキーマ

```sql
users テーブル:
  - id (UUID) - Supabase Auth連携
  - email (TEXT) - ユーザーメール
  - plan (TEXT) - free | senior_agent | top_agent
  - stripe_customer_id (TEXT) - Stripe顧客ID
  - stripe_subscription_id (TEXT) - StripeサブスクリプションID
  - subscription_status (TEXT) - active | canceled | past_due など
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

## 料金プラン定義

| プラン | 価格 | 機能 |
|--------|------|------|
| **Free** | ¥0 | 顧客管理、パイプライン、カレンダー連携（基本） |
| **Senior Agent** | ¥2,480/月 | Free + Googleフォーム連携、カレンダー拡張、テンプレート |
| **Top Agent** | 未定 | Senior Agent + 高度な分析、優先サポート |

## 機能制限マッピング

```javascript
PLAN_FEATURES = {
  free: ['customerManagement', 'pipeline', 'calendarBasic'],
  senior_agent: ['customerManagement', 'pipeline', 'calendarBasic',
                 'calendarAdvanced', 'googleForms', 'templates'],
  top_agent: ['全機能']
}
```

## 次のステップ（デプロイ前）

### 必須タスク

1. **Supabaseプロジェクト作成**
   - プロジェクト作成
   - `supabase/schema.sql` を実行
   - 認証情報取得

2. **Stripeアカウント設定**
   - プロダクト・価格作成（¥2,480/月）
   - APIキー取得
   - （Webhookは後で設定）

3. **Vercel環境変数設定**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_PRICE_SENIOR_AGENT
   NEXT_PUBLIC_APP_URL
   ```

4. **Vercelデプロイ**
   ```bash
   npm install
   vercel --prod
   ```

5. **Stripe Webhook設定**
   - エンドポイント: `https://your-app.vercel.app/api/stripe/webhook`
   - Webhook secretを環境変数に追加

6. **動作確認**
   - プラン表示確認
   - アップグレードフロー確認
   - 機能制限確認

### 推奨タスク

1. **Supabase Auth UI追加**
   - ログイン/サインアップモーダル
   - パスワードリセット

2. **エラーハンドリング強化**
   - API エラーの適切な表示
   - ユーザーフレンドリーなメッセージ

3. **ローディング状態の改善**
   - プラン読み込み中の表示
   - Checkout リダイレクト中の表示

## ドキュメント

- **DEPLOYMENT.md** - 詳細なデプロイメントガイド
- **CLAUDE_HANDOFF.md** - プロジェクト全体の引き継ぎ文書
- **supabase/README.md** - Supabaseセットアップガイド

## セキュリティ対策

✅ 実装済み:
- Supabase RLS（Row Level Security）
- API認証（Bearer Token）
- Stripe Webhook署名検証
- 環境変数による秘密鍵管理
- サーバー側でのプラン検証

⚠️ 今後の対応:
- APIレベルでの機能制限
- レート制限
- CORS設定の最適化

## ファイル一覧

```
新規作成ファイル:
├── api/
│   ├── lib/
│   │   ├── stripe.js         # Stripe連携
│   │   └── supabase.js       # Supabase連携
│   ├── stripe/
│   │   ├── create-checkout.js  # Checkout作成
│   │   ├── create-portal.js    # Portal作成
│   │   └── webhook.js         # Webhook処理
│   └── user/
│       └── plan.js            # プラン取得
├── public/
│   └── js/
│       └── plan-manager.js    # フロントエンドプラン管理
├── supabase/
│   ├── schema.sql            # DBスキーマ
│   └── README.md             # セットアップガイド
├── vercel.json               # Vercel設定
├── package.json              # 依存関係
├── .env.example              # 環境変数テンプレート
├── DEPLOYMENT.md             # デプロイガイド
└── PHASE1_COMPLETE.md        # このファイル

更新ファイル:
├── .gitignore                # Vercel, .env 追加
├── public/css/main.css       # モーダルスタイル追加
├── public/settings.html      # プラン管理UI追加
└── public/templates.html     # プランチェック追加
```

## トラブルシューティング

### よくある問題

**Q: Supabase認証が動作しない**
- A: 環境変数が正しく設定されているか確認
- A: ブラウザコンソールでエラーを確認

**Q: Webhook が動作しない**
- A: Webhook署名検証が有効か確認
- A: Vercelの関数ログでエラーを確認

**Q: プランが更新されない**
- A: `/api/user/plan` が正しく動作しているか確認
- A: Supabaseテーブルのデータを確認

---

**Phase 1 完了！次は実際にデプロイして動作確認を行いましょう。**

詳細な手順は `DEPLOYMENT.md` を参照してください。
