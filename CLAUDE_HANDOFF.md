# RentPipe 開発引き継ぎ文書

## プロジェクト概要

**RentPipe** は不動産仲介業者向けの顧客管理CRMアプリケーションです。

### コンセプト
- **「データは100%お客様のもの」** - 顧客データはユーザー自身のGoogle Drive/Sheetsにのみ保存
- アプリ提供側は顧客の個人情報を一切保持しない（セキュリティ上の差別化ポイント）
- 決済・プラン管理のための最小限のバックエンドのみ追加予定

---

## 技術スタック（現在）

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Vanilla JavaScript, HTML, CSS |
| データ保存 | Google Drive API, Google Sheets API |
| 認証 | Google OAuth 2.0（API アクセス用） |
| 外部連携 | Google Calendar API, Google Forms |
| ホスティング | 静的サイト（未デプロイ、ローカル開発中） |

---

## ディレクトリ構成

```
rentpipe/
├── public/
│   ├── index.html              # ダッシュボード（トップページ）
│   ├── customer.html           # 顧客一覧・管理
│   ├── customer-form.html      # 顧客登録・編集フォーム
│   ├── pipeline.html           # パイプライン（カンバン）
│   ├── templates.html          # 連絡テンプレート管理
│   ├── settings.html           # 設定画面
│   ├── css/
│   │   └── main.css            # 共通スタイル
│   └── js/
│       ├── app-initializer.js       # アプリ初期化（認証・API読み込み）
│       ├── page-initializer.js      # ページ共通初期化
│       ├── integrated-auth-manager-v2.js  # Google OAuth認証管理
│       ├── google-drive-api-v2.js   # Google Drive API操作
│       ├── google-sheets-api.js     # Google Sheets API操作
│       ├── google-calendar-api.js   # Google Calendar API操作
│       ├── unified-data-manager.js  # 統一データ管理（CRUD操作）
│       ├── unified-sheets-manager.js # Sheets連携管理
│       ├── archive-manager.js       # アーカイブ機能（共通モジュール）
│       ├── pipeline-unified.js      # パイプライン機能
│       ├── navigation.js            # ナビゲーション
│       └── data-migration.js        # データ移行ユーティリティ
└── README.md
```

---

## 実装済み機能

### 顧客管理
- [x] 顧客の登録・編集・削除
- [x] 顧客検索・フィルタリング
- [x] 顧客アーカイブ（成約/失注）
- [x] 顧客復元（ステータス選択付き）

### パイプライン
- [x] カンバン形式での顧客表示
- [x] ドラッグ＆ドロップなしのステータス変更（モーダル選択）
- [x] ステータス: 初回相談 → 物件紹介 → 内見調整 → 申込準備 → 審査中 → 契約手続き → 完了

### Google連携
- [x] Google Drive にデータ保存（JSON形式）
- [x] Google Sheets に顧客一覧を同期
- [x] Google Calendar にフォローアップ予定を登録
- [x] Google Forms からの顧客自動登録

### フォローアップ機能
- [x] 入居日基準のフォローアップ（翌日お礼、1ヶ月後、6ヶ月後、1年後）
- [x] 契約種別に応じたフォロー（定期借家: 6ヶ月前、普通借家: 4ヶ月前）
- [x] カレンダーイベントにテンプレートリンクを含める
- [x] 連絡テンプレート管理（SMS/メール用）

### その他
- [x] 契約情報管理（物件名、賃料、契約期間など）
- [x] 初期費用自動計算
- [x] エージェントメモ

---

## 未実装・今後のタスク

### Phase 1: 最小バックエンド構築（優先度: 高）

決済機能とプラン管理に必須。顧客データはサーバーに保存しない。

```
必要なもの:
- ユーザー認証（Supabase Auth 推奨）
- ユーザーテーブル（email, plan, stripeCustomerId のみ）
- プラン確認API
- Stripe Webhook エンドポイント
```

**推奨技術スタック:**
- Vercel（ホスティング + API Routes）
- Supabase（Auth + 最小DB）
- Stripe（決済）

### Phase 2: 決済機能（優先度: 高）

```
- Stripe Checkout 連携
- サブスクリプション管理
- Webhook でプラン状態更新
- 解約処理
```

### Phase 3: 機能制限の実装（優先度: 高）

```javascript
// フロントエンドでのプランチェック例
const PLAN_FEATURES = {
  free: ['customerManagement', 'pipeline', 'calendarBasic'],
  senior: ['googleForms', 'calendarAdvanced', 'templates']
};

async function checkFeatureAccess(feature) {
  const { plan } = await fetchUserPlan();
  if (!PLAN_FEATURES[plan]?.includes(feature)) {
    showUpgradeModal();
    return false;
  }
  return true;
}
```

### Phase 4: Google認証の安定性強化（優先度: 中）

```
- トークン自動更新の改善
- セッションタイムアウト処理
- 再認証フローの改善
```

### Phase 5: Googleカレンダー連携の拡張（優先度: 中）

Senior Agent プランの目玉機能として拡張が必要。

```
検討中の機能:
- 内見予定の自動登録
- リマインダーのカスタマイズ
- 複数カレンダー対応
- 予定の一括管理
```

### Phase 6: UI/UXの大幅改善（優先度: 低〜中）

```
- Tailwind CSS 導入
- レスポンシブ対応強化
- ダークモード
- アニメーション追加
```

---

## 料金プラン（予定）

| プラン | 価格 | 機能 |
|--------|------|------|
| **Free** | ¥0 | 顧客数無制限、パイプライン、Googleカレンダー連携（基本） |
| **Senior Agent** | ¥2,480/月 | Googleフォーム連携、Googleカレンダー連携（拡張）、テンプレート |
| **Top Agent** | 未定 | 将来的な上位プラン（機能追加後に検討） |

---

## 重要な設計判断

### 1. データ保存方式
顧客データはユーザーのGoogle Drive/Sheetsにのみ保存。サーバーには保存しない。

**理由:**
- セキュリティ上の差別化（「お客様のデータは一切お預かりしません」）
- 個人情報保護法上のリスク軽減
- インフラコスト削減

### 2. バックエンドの役割
バックエンドは決済・プラン管理のみ。保存するのは:
- ユーザーID
- メールアドレス
- プラン種別
- Stripe関連ID

### 3. 認証の二重構造
- **Google OAuth**: Google API（Drive/Sheets/Calendar）へのアクセス用
- **Supabase Auth（予定）**: アプリのユーザー認証・プラン管理用

---

## 既知の課題・注意点

### 1. gapi.client の初期化順序
Google API クライアントは discovery docs のロード完了後に `setToken()` を呼ぶ必要がある。
`app-initializer.js` で `GoogleDriveAPIv2.initialize()` を先に実行してから `setToken()` を呼ぶよう修正済み。

### 2. 長時間放置後の認証切れ
現在、長時間放置するとトークンが期限切れになり、再読み込みが必要。
Phase 4 で改善予定。

### 3. データ構造の後方互換性
旧データ構造（`customer.name`）と新データ構造（`customer.basicInfo.name`）の両方に対応するコードが各所にある。

```javascript
// 例
const name = customer.basicInfo?.name || customer.name || '名前未設定';
```

---

## 開発環境セットアップ

### 必要なもの
- Node.js（npm用）
- Google Cloud Console プロジェクト（API キー、OAuth クライアントID）

### ローカル開発
```bash
cd rentpipe/public
# 任意のローカルサーバーで起動
npx serve .
# または
python -m http.server 8000
```

### Google Cloud Console 設定
1. Google Cloud Console でプロジェクト作成
2. 以下のAPIを有効化:
   - Google Drive API
   - Google Sheets API
   - Google Calendar API
3. OAuth 2.0 クライアントID を作成
4. `integrated-auth-manager-v2.js` の `CLIENT_ID` を更新

---

## 次のステップ（推奨）

1. **Vercel プロジェクト作成** - 静的サイトをデプロイ
2. **Supabase プロジェクト作成** - Auth + 最小ユーザーテーブル
3. **Stripe アカウント作成** - テストモードで開発開始
4. **API Routes 実装** - `/api/user/plan`, `/api/stripe/webhook`
5. **フロントエンドに機能制限追加** - プランチェック関数

---

## 参考リンク

- [Stripe Checkout ドキュメント](https://stripe.com/docs/checkout)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Vercel API Routes](https://vercel.com/docs/functions)
- [Google Calendar API](https://developers.google.com/calendar/api)

---

*この文書は 2026年2月12日 に作成されました。*
