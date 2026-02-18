# Phase 3: セッション管理とセキュリティ強化 - 完了報告

## 実装内容

Phase 2（ベータ版モード）に続き、**セッション管理とセキュリティ強化機能**を実装しました。

長期間操作がないユーザーのセッションを自動的にクリアし、共有PCでのログアウト忘れやトークン漏洩リスクを軽減します。

---

## 実装の背景

### 潜在的なセキュリティリスク

Phase 2までの実装では、以下のリスクがありました：

1. **localStorageデータの永続性**
   - 認証情報が無期限で保存される
   - 共有PCでログアウトし忘れた場合、次のユーザーがアクセス可能

2. **Googleアクセストークンの有効期限切れ**
   - トークンは1時間で期限切れ
   - 期限切れ後のGoogle API呼び出しでエラー
   - 自動再認証の仕組みがない

3. **古いデータの残存**
   - Supabaseユーザー情報やプラン情報が古いまま残る
   - データの整合性に問題が発生する可能性

### 解決策

**3つの柱で構成されるセッション管理システム**を実装：

1. **セッションタイムアウト** - 7日間操作がない場合に自動ログアウト
2. **アクティビティ監視** - ユーザー操作を検出して最終アクティビティ時刻を更新
3. **Googleトークン更新監視** - トークン期限切れを検出して再認証を促す

---

## 新規作成ファイル

### 1. `public/js/session-manager.js` 🔐

**セッション管理の中核を担うモジュール**

#### 主要機能

**セッションタイムアウト:**
- タイムアウト期間: 7日間（カスタマイズ可能）
- チェック間隔: 1分ごと
- タイムアウト検出時: 自動ログアウト + ログインページにリダイレクト

```javascript
const SESSION_TIMEOUT_DAYS = 7;  // セッションタイムアウト（日数）

isSessionExpired() {
  const elapsed = Date.now() - this.lastActivityTime;
  const timeout = SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
  return elapsed > timeout;
}
```

**アクティビティ監視:**
- 監視対象イベント: click, keydown, scroll, mousemove, touchstart
- デバウンス処理: 1秒間隔で更新
- 最終アクティビティ時刻を localStorage に保存

```javascript
const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];

events.forEach(event => {
  document.addEventListener(event, debouncedUpdate, { passive: true });
});
```

**Googleトークン更新監視:**
- チェック間隔: 1分ごと
- 更新タイミング: 期限切れ5分前
- 期限切れ検出時: ユーザーに再認証を促す

```javascript
const TOKEN_REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000;  // 5分

async checkAndRefreshToken() {
  const timeUntilExpiry = tokenExpiry - Date.now();

  if (timeUntilExpiry <= TOKEN_REFRESH_BEFORE_EXPIRY) {
    // ユーザーに再認証を促す
    const shouldRefresh = confirm('Googleアカウントの認証が間もなく期限切れになります...');
    if (shouldRefresh) {
      this.promptReauth();
    }
  }
}
```

#### セッションクリア時の動作

```javascript
clearSession() {
  // Google認証情報をクリア
  window.IntegratedAuthManager.clearGoogleAuth();

  // localStorageをクリア
  const keysToRemove = [
    'google_auth_data',
    'google_access_token',
    'google_token_expiry',
    'rentpipe_supabase_user',
    'rentpipe_last_activity',
    'rentpipe_auth',
    'rentpipe_auth_simple',
    'rentpipe_user_info'
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
}
```

### 2. `SESSION_MANAGEMENT.md`

セッション管理機能の詳細ドキュメント

- 仕組みの解説
- カスタマイズ方法
- トラブルシューティング
- セキュリティベストプラクティス

---

## 修正ファイル

### HTMLファイル（全7ファイル）

session-manager.js を読み込むように修正：

- `public/customer.html` - 顧客管理ページ
- `public/customer-form.html` - 顧客登録・編集ページ
- `public/pipeline.html` - パイプラインページ
- `public/templates.html` - テンプレート管理ページ
- `public/settings.html` - 設定ページ
- `public/forms.html` - フォームページ

**読み込み順序:**

```html
<!-- セッション管理を最初に読み込む -->
<script src="js/session-manager.js"></script>
<script src="js/navigation.js"></script>
<script src="js/integrated-auth-manager-v2.js"></script>
<!-- その他のスクリプト -->
```

**login.html は除外:**
- ログインページではセッション管理を初期化しない
- ログイン前なので認証チェックは不要

---

## 技術的なポイント

### 1. **IIFE (Immediately Invoked Function Expression) パターン**

グローバルスコープの汚染を防ぎつつ、`window.sessionManager` を外部から利用可能に。

```javascript
(function() {
  'use strict';

  class SessionManager { /* ... */ }

  window.sessionManager = new SessionManager();

  // ページ読み込み時に自動初期化
  if (!window.location.pathname.includes('/login.html')) {
    window.sessionManager.initialize();
  }
})();
```

### 2. **デバウンス処理**

頻繁なイベント（mousemove、scroll）による過剰な localStorage 更新を防止。

```javascript
let activityTimeout = null;
const debouncedUpdate = () => {
  if (activityTimeout) {
    clearTimeout(activityTimeout);
  }
  activityTimeout = setTimeout(() => {
    this.updateLastActivity();
  }, 1000);
};
```

### 3. **自動初期化**

ページ読み込み時に自動的にセッション管理を開始。

```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/login.html')) {
      window.sessionManager.initialize();
    }
  });
} else {
  // 既に読み込み済みの場合
  if (!window.location.pathname.includes('/login.html')) {
    window.sessionManager.initialize();
  }
}
```

### 4. **Google OAuth の制約への対応**

Google Identity Services では Refresh Token が発行されないため、トークン期限切れ時には再認証が必要。

**対応策:**
- 期限切れ5分前にユーザーに通知
- 確認ダイアログで再認証を促す
- 設定ページにリダイレクトして再認証をサポート

---

## セキュリティ上のメリット

### 1. **共有PC対策**

- 公共のPCやオフィスの共有PCでログアウトを忘れても、7日後に自動ログアウト
- 次のユーザーが誤ってデータにアクセスすることを防止

### 2. **トークン漏洩リスク軽減**

- 古いトークンが長期間残ることを防止
- 定期的な再認証でセキュリティを維持

### 3. **データ整合性の向上**

- 古い認証情報（期限切れトークン、古いプラン情報）が残らない
- 常に最新の認証状態を保つ

### 4. **XSS攻撃対策**

- localStorage の認証情報が定期的にクリアされる
- 長期間の悪用リスクを低減

---

## ユーザー体験への配慮

### 👍 良い点

1. **操作中はタイムアウトしない**
   - アクティビティ監視により、ユーザーが操作している間はセッションが維持される
   - 長時間の作業でも問題なし

2. **事前通知**
   - Googleトークン期限切れ5分前に通知
   - ユーザーが作業を中断せずに再認証できる

3. **透明性**
   - セッション情報をコンソールで確認可能（`window.sessionManager.logSessionInfo()`）
   - デバッグやサポートが容易

### ⚠️ 注意点

1. **7日間操作がない場合は自動ログアウト**
   - 長期休暇などで7日以上アクセスしない場合、再ログインが必要
   - カスタマイズ可能（30日に延長など）

2. **Googleトークンの再認証**
   - 長時間（1時間以上）アプリを開きっぱなしにすると、再認証が必要になる場合がある
   - 事前通知により、ユーザーが気づける

---

## カスタマイズ方法

### セッションタイムアウト期間の変更

**ファイル**: `public/js/session-manager.js`

```javascript
// 現在: 7日
const SESSION_TIMEOUT_DAYS = 7;

// 変更例: 30日に延長（有料プラン向け）
const SESSION_TIMEOUT_DAYS = 30;

// 変更例: 1日に短縮（より厳格なセキュリティ）
const SESSION_TIMEOUT_DAYS = 1;
```

### チェック間隔の変更

```javascript
// 現在: 1分
const ACTIVITY_CHECK_INTERVAL = 60000;

// 変更例: 5分（サーバー負荷軽減）
const ACTIVITY_CHECK_INTERVAL = 5 * 60000;
```

---

## 動作確認方法

### 1. セッション情報の確認

ブラウザコンソールで実行：

```javascript
window.sessionManager.logSessionInfo();

// 出力例:
// 📊 セッション情報: {
//   最終アクティビティ: '2026/2/15 14:30:25',
//   経過時間: '2時間',
//   残り時間: '6日',
//   期限切れ: false,
//   タイムアウト設定: '7日'
// }
```

### 2. セッションタイムアウトのテスト

**手動でタイムアウトをシミュレート:**

```javascript
// 最終アクティビティを8日前に設定
const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
localStorage.setItem('rentpipe_last_activity', eightDaysAgo.toString());

// ページをリロード
location.reload();

// → セッションタイムアウトが検出され、自動ログアウトされる
```

### 3. Googleトークン期限切れのテスト

**手動でトークン期限切れをシミュレート:**

```javascript
// トークン期限を3分後に設定
const threeMinutesLater = Date.now() + (3 * 60 * 1000);
const authData = JSON.parse(localStorage.getItem('google_auth_data'));
authData.tokenExpiry = threeMinutesLater;
localStorage.setItem('google_auth_data', JSON.stringify(authData));

// 3分待つと再認証ダイアログが表示される
```

---

## 今後の拡張案

### Phase 4: サーバーサイドセッション管理

- Supabaseセッションとの統合
- サーバー側でのセッション検証
- より強固なセキュリティ

### Phase 5: カスタマイズ可能なタイムアウト

- ユーザーが設定画面でタイムアウト期間を選択可能
- プラン別のタイムアウト設定
  - Freeプラン: 7日
  - Senior Agentプラン: 30日
  - Top Agentプラン: 無制限

### Phase 6: セッションログ

- セッション開始/終了のログ記録
- 異常なアクセスパターンの検出
- セキュリティ監査のサポート

---

## まとめ

### ✅ 達成したこと

- ✅ セッションタイムアウト機能の実装（7日間）
- ✅ アクティビティ監視による自動セッション延長
- ✅ Googleトークン期限切れ検出と再認証促進
- ✅ 自動ログアウトとデータクリア
- ✅ ユーザー体験を損なわない設計
- ✅ 詳細なドキュメント作成（SESSION_MANAGEMENT.md）

### 💡 メリット

1. **セキュリティ向上**
   - 共有PC対策
   - トークン漏洩リスク軽減
   - XSS攻撃対策

2. **データ整合性**
   - 古い認証情報の自動クリア
   - 常に最新の状態を維持

3. **ユーザー体験**
   - 操作中はタイムアウトしない
   - 事前通知により作業を中断しない
   - カスタマイズ可能

4. **運用の柔軟性**
   - タイムアウト期間を簡単に変更可能
   - プラン別の設定も将来実装可能

---

**実装日:** 2026年2月15日
**実装者:** Claude Sonnet 4.5
**バージョン:** 1.0.0
