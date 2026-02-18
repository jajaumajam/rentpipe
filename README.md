# 🏠 RentPipe

不動産エージェント向け顧客管理CRMアプリケーションです。

## ✨ コンセプト

**「データは100%お客様のもの」**
顧客データはユーザー自身のGoogle Drive / Google Sheetsにのみ保存されます。
RentPipeのサーバーは、プラン管理・決済情報のみを保持します。

## 🚀 本番環境

| 環境 | URL |
|------|-----|
| 本番 | デプロイ先URLを記載 |
| ステージング | ローカル: `http://localhost:3000` |

## 🎯 主要機能

### 実装済み
| 機能 | 説明 |
|------|------|
| 顧客管理 | CRUD操作・60+フィールド・アーカイブ（成約/失注） |
| パイプライン | 6ステージKanbanボード（初回相談〜契約手続き） |
| Google Drive連携 | 顧客データのバックアップ・同期 |
| Google Sheets連携 | 顧客一覧の自動同期 |
| Google Calendar連携 | フォローアップ予定の自動登録 |
| Google Forms連携 | フォームからの顧客自動登録 |
| CSV/JSONインポート | 一括顧客登録 |
| セッション管理 | 7日間タイムアウト・自動ログアウト |
| お知らせ通知 | バナー通知（Supabase管理） |
| サブスクリプション | Stripe連携・プラン管理（ベータ中は無効） |

### プラン別機能（ベータ終了後）
| プラン | 価格 | 対象機能 |
|--------|------|---------|
| Free | ¥0 | 顧客管理、パイプライン、基本カレンダー |
| Senior Agent | ¥2,480/月 | Free + Google Forms、拡張カレンダー、テンプレート |
| Top Agent | 未定 | Senior Agent + 分析、チーム機能、API |

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Vanilla JavaScript (ES6+), HTML5, Tailwind CSS |
| 認証 | Google OAuth 2.0 (Redirect Flow) |
| Google API | Drive v3, Sheets, Calendar, Forms, Identity Services |
| バックエンド | Vercel (Serverless Functions) |
| データベース | Supabase (プラン管理のみ) |
| 決済 | Stripe (ベータ中は無効) |
| 顧客データ | LocalStorage + Google Drive（サーバー保存なし） |

## 📁 ファイル構造

```
rentpipe/
├── api/                          # Vercel Serverless Functions
│   ├── lib/
│   │   ├── stripe.js             # Stripe設定・ヘルパー
│   │   └── supabase.js           # Supabase設定・ヘルパー
│   ├── stripe/
│   │   ├── create-checkout-simple.js  # Stripeチェックアウトセッション作成
│   │   ├── create-portal-simple.js    # Stripeポータルセッション作成
│   │   └── webhook.js            # Stripe Webhookハンドラ
│   └── user/
│       ├── create-from-google.js # Googleログイン後のユーザー作成
│       └── plan-simple.js        # プラン情報取得
├── public/                       # フロントエンド静的ファイル
│   ├── index.html                # エントリポイント（loginへリダイレクト）
│   ├── login.html                # Googleログイン
│   ├── customer.html             # 顧客一覧
│   ├── customer-form.html        # 顧客登録・編集
│   ├── customer-import.html      # CSV/JSONインポート
│   ├── pipeline.html             # パイプライン（Kanban）
│   ├── forms.html                # Google Forms連携
│   ├── templates.html            # 連絡テンプレート管理
│   ├── settings.html             # 設定・プラン管理
│   ├── notifications.html        # お知らせ一覧
│   ├── admin.html                # 管理者用通知管理
│   ├── css/
│   │   ├── main.css              # カスタムスタイル
│   │   ├── tailwind.css          # Tailwind設定
│   │   ├── tailwind-output.css   # コンパイル済みTailwind
│   │   └── pipeline-responsive.css  # パイプライン用レスポンシブ
│   └── js/
│       ├── config.js             # アプリ設定（定数・URL）
│       ├── integrated-auth-manager-v2.js  # Google OAuth認証
│       ├── app-initializer.js    # アプリ起動オーケストレーター
│       ├── page-initializer.js   # ページ別初期化
│       ├── session-manager.js    # セッション管理（7日タイムアウト）
│       ├── unified-data-manager.js  # 顧客データCRUD
│       ├── unified-sheets-manager.js  # Google Sheets同期
│       ├── google-drive-api-v2.js  # Google Drive操作
│       ├── google-sheets-api.js  # Google Sheets低レベルAPI
│       ├── google-calendar-api.js  # Google Calendar連携
│       ├── google-forms-api.js   # Google Forms連携
│       ├── pipeline-unified.js   # パイプラインUI
│       ├── archive-manager.js    # アーカイブ機能
│       ├── data-migration.js     # データ形式マイグレーション
│       ├── navigation.js         # ナビゲーションUI
│       ├── notification-manager.js  # お知らせ通知
│       ├── feature-flags.js      # プラン別機能制御
│       ├── plan-manager.js       # プラン管理
│       └── supabase-google-sync.js  # Supabase連携
├── supabase/                     # Supabaseスキーマ・マイグレーション
│   ├── schema.sql                # メインスキーマ
│   ├── supabase-notifications-table.sql  # 通知テーブル
│   └── supabase-notifications-rls-fix.sql  # RLSポリシー修正
├── scripts/
│   └── inject-env.cjs            # ビルド時の環境変数注入
├── docs/
│   └── archive/                  # 過去のフェーズ完了ドキュメント
├── package.json
├── vercel.json                   # Vercel設定
├── firebase.json                 # Firebase設定（レガシー）
├── .env.example                  # 環境変数テンプレート
├── README.md                     # このファイル
├── DEVELOPMENT.md                # 開発環境セットアップ
├── DEPLOYMENT.md                 # デプロイ手順
├── ARCHITECTURE.md               # システム設計・アーキテクチャ
├── CHANGELOG.md                  # 変更履歴
├── BETA_RELEASE_CHECKLIST.md     # ベータ→正式リリースチェックリスト
└── CLAUDE_HANDOFF.md             # 引き継ぎ文書
```

## 🔧 セットアップ

詳細は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

### 前提条件

- Node.js 18+
- Google Cloud Consoleプロジェクト（OAuth設定済み）
- Supabaseプロジェクト
- Stripe アカウント（決済機能が必要な場合）

### 環境変数

`.env.example` をコピーして `.env` を作成し、各値を設定してください。

```bash
cp .env.example .env
```

必要な環境変数：

```env
NEXT_PUBLIC_SUPABASE_URL=        # SupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase公開キー
SUPABASE_SERVICE_ROLE_KEY=       # Supabaseサービスロールキー（サーバーのみ）
STRIPE_SECRET_KEY=               # Stripeシークレットキー（sk_test_...）
STRIPE_WEBHOOK_SECRET=           # StripeWebhookシークレット（whsec_...）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe公開キー（pk_test_...）
STRIPE_PRICE_SENIOR_AGENT=       # StripeのSenior AgentプランID
NEXT_PUBLIC_APP_URL=             # アプリのURL（本番: https://your-domain.com）
```

## 📊 データ設計

### ゼロナレッジアーキテクチャ

```
[RentPipeサーバー（Supabase）]
  ├── users テーブル
  │   ├── id
  │   ├── email
  │   ├── plan (free/senior_agent/top_agent)
  │   ├── stripe_customer_id
  │   └── subscription_status
  └── notifications テーブル（お知らせ管理）

[ユーザーのGoogleアカウント]
  ├── Google Drive: rentpipe-data.json（顧客データバックアップ）
  └── Google Sheets: RentPipe顧客管理（顧客一覧同期）

[ブラウザ LocalStorage]
  └── rentpipe_customers（顧客データ一次保存）
```

顧客の個人情報（氏名・電話・住所等）はRentPipeサーバーに**一切保存されません**。

## 📋 現在の状態

**バージョン**: 1.0.0-beta
**ベータモード**: 有効（`BETA_MODE = true`）
**状態**: ベータリリース済み・ユーザー獲得フェーズ

ベータ→正式リリースの手順は [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md) を参照してください。

## 🔗 ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 開発環境セットアップ・デバッグ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercelデプロイ手順 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システム構成・設計判断 |
| [CHANGELOG.md](./CHANGELOG.md) | バージョン別変更履歴 |
| [BETA_RELEASE_CHECKLIST.md](./BETA_RELEASE_CHECKLIST.md) | 正式リリース前チェックリスト |
| [CLAUDE_HANDOFF.md](./CLAUDE_HANDOFF.md) | 引き継ぎ文書 |
| [docs/archive/](./docs/archive/) | 過去のフェーズ完了ドキュメント |

---

*RentPipe — シンプル、安全、効率的な不動産エージェント向け顧客管理*
