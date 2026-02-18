# RentPipe アーキテクチャ設計書

## 1. システム全体構成

```
┌─────────────────────────────────────────────────────┐
│                   ユーザーのブラウザ                   │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           フロントエンド (Vanilla JS)           │  │
│  │                                               │  │
│  │  ┌────────────┐  ┌─────────────────────────┐  │  │
│  │  │LocalStorage│  │   Google APIs           │  │  │
│  │  │（顧客データ）│  │   Drive / Sheets        │  │  │
│  │  │            │  │   Calendar / Forms       │  │  │
│  │  └────────────┘  └─────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
             │                        │
             │ API呼び出し              │ OAuth
             ▼                        ▼
┌──────────────────┐         ┌──────────────────────┐
│   Vercel API     │         │   Google APIs        │
│   (Serverless)   │         │   (外部サービス)      │
│                  │         └──────────────────────┘
│  /api/user/*     │
│  /api/stripe/*   │
└──────────────────┘
         │           │
         ▼           ▼
┌─────────────┐  ┌────────────────┐
│  Supabase   │  │    Stripe      │
│  (users,    │  │  (決済・サブ   │
│notifications│  │  スクリプション)│
│  のみ)      │  └────────────────┘
└─────────────┘
```

## 2. 最重要設計判断: ゼロナレッジアーキテクチャ

### 概要
顧客データ（氏名・電話・住所・収入等の個人情報）を**RentPipeのサーバーには一切保存しない**。

### データの保存先

| データ種別 | 保存先 | 理由 |
|-----------|--------|------|
| 顧客個人情報 | LocalStorage + Google Drive | サーバーに渡さない |
| 顧客一覧 | Google Sheets（ユーザー所有） | ユーザーが直接管理可能 |
| フォローアップ予定 | Google Calendar（ユーザー所有） | ユーザーが直接管理可能 |
| **ユーザーID・メール** | **Supabase** | プラン管理に必須 |
| **プラン種別** | **Supabase** | プラン管理に必須 |
| **Stripe ID** | **Supabase** | 決済管理に必須 |
| お知らせ通知 | Supabase | 管理者が配信を制御するため |

### メリット
1. **プライバシー**: 個人情報保護法上のリスクを最小化
2. **信頼**: 「データはお客様のもの」という差別化ポイント
3. **コスト**: 大容量DBが不要
4. **セキュリティ**: 漏洩時のリスクが限定的

## 3. 認証アーキテクチャ

### 二層構造

```
[Google OAuth 2.0]
     ↓ 認証成功（アクセストークン取得）
[Google API アクセス]
     Drive / Sheets / Calendar / Forms を操作可能
     ↓ 並行して
[Supabase ユーザー確認]
     userId + email で Supabase DB にユーザー存在確認
     → プラン情報を取得
```

### 認証フロー

```
1. ユーザーが login.html を開く
2. 「Googleでログイン」をクリック
3. Google Identity Services の Redirect Flow を起動
   ※ ポップアップブロック対策のためRedirect Flowを採用
4. Googleの認証ページにリダイレクト
5. ユーザーが許可 → login.html にリダイレクトバック
6. アクセストークンを LocalStorage に保存
7. /api/user/create-from-google でSupabaseにユーザー登録（初回のみ）
8. customer.html にリダイレクト
```

### セッション管理

- **タイムアウト**: 7日間の無操作で自動ログアウト
- **アクティビティ監視**: click, keydown, scroll, mousemove, touchstart
- **Googleトークン**: 有効期限切れの5分前に再認証を促す
- **ストレージキー**:
  - `rentpipe_auth` — RentPipeユーザーデータ
  - `google_auth_data` — Googleユーザー情報・トークン
  - `rentpipe_last_activity` — 最終操作時刻

## 4. データフロー

### 顧客データの書き込み

```
ユーザー入力（customer-form.html）
    ↓
UnifiedDataManager.addCustomer()
    ↓
LocalStorage に保存
    ↓ 非同期
UnifiedSheetsManager.syncToSheets()
    ↓
Google Sheets に同期（ユーザー所有スプレッドシート）
    ↓
カスタムイベント 'rentpipe-data-updated' 発火
    ↓
PipelineManager など各UIが再レンダリング
```

### フォローアップカレンダー登録

```
customer-form.html で「フォローアップ」を有効化
    ↓
GoogleCalendarAPI.createFollowUpEvents()
    ↓
- 翌日お礼イベント
- 1ヶ月後イベント
- 6ヶ月後イベント
- 1年後イベント
- 契約種別に応じた更新提案イベント
    ↓
ユーザーのGoogleカレンダーに登録
イベントIDをcustomerデータに保存
```

### プラン確認フロー

```
機能にアクセス
    ↓
FeatureFlags.checkAccess(feature)
    ↓ BETA_MODE = true の場合
全機能許可（スキップ）
    ↓ BETA_MODE = false の場合
PlanManager.getUserPlan()
    ↓
/api/user/plan-simple を呼び出し
    ↓
Supabase DB からプラン取得
    ↓
プランに機能が含まれる → アクセス許可
プランに機能が含まれない → アップグレードモーダル表示
```

## 5. モジュール依存関係

```
config.js（定数・設定）
    ↓ 依存
integrated-auth-manager-v2.js（認証）
    ↓ 依存
google-drive-api-v2.js（Google Drive + OAuth）
    ├── google-sheets-api.js
    ├── google-calendar-api.js
    └── google-forms-api.js

app-initializer.js（起動オーケストレーター）
    ├── integrated-auth-manager-v2.js を利用
    ├── unified-data-manager.js を初期化
    └── unified-sheets-manager.js を初期化

unified-data-manager.js（顧客CRUD）
    └── data-migration.js（旧データ変換）

session-manager.js（セッション管理・独立）
notification-manager.js（通知・独立）
feature-flags.js（機能制御・独立）
plan-manager.js（プラン管理）
    └── feature-flags.js を利用
```

## 6. 顧客データ構造

```javascript
{
  id: string,                      // UUID

  basicInfo: {
    name, nameKana,               // 氏名・フリガナ
    email, phone, birthday, gender,
    currentAddress, currentHousing,
    occupation, companyName, yearsEmployed, annualIncome,
    movingReason, numberOfOccupants
  },

  preferences: {
    budget: { min, max, note },
    moveInDate, moveInDateNote,
    areas, areasNote,             // 希望エリア
    layout, layoutNote,           // 間取り
    roomSize, roomSizeNote,
    stationWalk, stationWalkNote, // 駅徒歩
    buildingAge: { value, type, note },
    floor, floorNote
  },

  equipment: {
    // 15項目のboolean: オートロック、浴室乾燥、洗濯機置場、
    // インターネット、駐車場、ペット可、楽器可、etc.
    equipmentNote
  },

  additionalInfo: { notes },
  agentMemo: string,

  contractInfo: {
    contractDate, contractType,   // 普通借家 / 定期借家
    contractPeriodMonths,
    contractEndDate, propertyAddress,
    monthlyRent, moveInDate
  },

  followUpSettings: {
    enabled: boolean,
    calendarEventsCreated: boolean,
    calendarEventIds: string[]
  },

  followUpHistory: array,
  pipelineStatus: string,         // 6ステージのいずれか
  isActive: boolean,
  archivedAt: date,
  archiveReason: string,          // 成約 / 失注 / その他
  createdAt, updatedAt: ISO string
}
```

### 後方互換性

旧フォーマット（`customer.name`）から新フォーマット（`customer.basicInfo.name`）への自動変換は `data-migration.js` が担当。

コード内でも防御的記述を使用:
```javascript
const name = customer.basicInfo?.name || customer.name || '名前未設定';
```

## 7. APIエンドポイント

| エンドポイント | メソッド | 認証 | 説明 |
|-------------|---------|------|------|
| `/api/user/create-from-google` | POST | なし | Googleログイン後のユーザー作成 |
| `/api/user/plan-simple` | POST | userId+email | プラン情報取得 |
| `/api/stripe/create-checkout-simple` | POST | userId+email | Stripeチェックアウトセッション作成 |
| `/api/stripe/create-portal-simple` | POST | userId+email | Stripeポータルセッション作成 |
| `/api/stripe/webhook` | POST | Stripe署名 | Stripeイベント処理 |

### 認証方式の選択理由

現在の実装では Supabase Auth セッション（JWT Bearer token）を使わず、
`userId + email` をリクエストボディで受け渡す「simple」方式を採用している。

**理由**: RentPipeはGoogleアカウントでのみ認証を行い、
Supabase Authのセッション管理機能は使用していないため。
APIの認証はSupabase DB上でのユーザー存在確認（userId + emailの一致）で代替している。

## 8. プラン・機能フラグシステム

### BETA_MODE

```javascript
// public/js/feature-flags.js
const BETA_MODE = true;  // ← false に変えると機能制限が有効化
```

`BETA_MODE = true` の間:
- 全プランで全機能が利用可能
- Stripeの決済ボタンは非表示
- ベータバナーが設定ページに表示

### プラン別機能マッピング

| 機能 | Free | Senior Agent | Top Agent |
|------|------|-------------|-----------|
| customerManagement | ✓ | ✓ | ✓ |
| pipeline | ✓ | ✓ | ✓ |
| googleSheets | ✓ | ✓ | ✓ |
| googleDrive | ✓ | ✓ | ✓ |
| googleForms | ✗ | ✓ | ✓ |
| calendarAdvanced | ✗ | ✓ | ✓ |
| templates | ✗ | ✓ | ✓ |
| analytics | ✗ | ✗ | ✓ |
| teamCollaboration | ✗ | ✗ | ✓ |
| apiAccess | ✗ | ✗ | ✓ |

## 9. デプロイ構成

```
[GitHub リポジトリ]
    ↓ push
[Vercel CI/CD]
    ↓ ビルド
    ├── scripts/inject-env.cjs 実行（環境変数をJSに注入）
    ├── public/ → 静的ホスティング
    └── api/ → Serverless Functions

[Firebase Hosting] ← レガシー（現在はVercelが主）
```

Vercelの設定 (`vercel.json`):
- APIルートのリライト: `/api/(.*)` → `/api/$1`
- セキュリティヘッダー: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`

## 10. 将来の拡張予定

### テンプレート機能（優先度: 高）
現状UIのみ。LocalStorageまたはGoogle Drive JSONでテンプレートを管理する予定。

### Google Forms完全統合（優先度: 中）
フォーム回答の自動取り込みと顧客レコードへの紐付け。

### 分析ダッシュボード（優先度: 低）
LocalStorageの顧客データを集計してパイプライン推移・成約率を表示。
（データはサーバーに送らず、クライアントサイドで計算）

### チーム機能（優先度: 低）
Google Driveの共有機能を活用したチーム共同利用。
顧客データはユーザーのGoogle Driveに存在するため、
Googleの共有機能で代替できる可能性がある。
