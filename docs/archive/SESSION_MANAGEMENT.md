# セッション管理とセキュリティ

## 概要

RentPipeには、ユーザーのセキュリティとデータ保護を強化するため、以下の機能が実装されています：

1. **セッションタイムアウト** - 長期間操作がない場合の自動ログアウト
2. **アクティビティ監視** - ユーザー操作を検出して最終アクティビティ時刻を更新
3. **Googleトークン更新監視** - トークン期限切れを検出して再認証を促す

---

## セッションタイムアウト機能

### 仕組み

- **タイムアウト期間**: 7日間（最終操作から7日間操作がない場合）
- **チェック間隔**: 1分ごとにセッション有効性をチェック
- **自動ログアウト**: タイムアウト検出時に自動的にログアウト

### 実装詳細

**ファイル**: `public/js/session-manager.js`

```javascript
const SESSION_TIMEOUT_DAYS = 7;  // セッションタイムアウト（日数）

isSessionExpired() {
  const now = Date.now();
  const elapsed = now - this.lastActivityTime;
  const timeout = SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
  return elapsed > timeout;
}
```

### タイムアウト時の動作

1. セッション監視を停止
2. localStorage の認証情報をクリア
3. ユーザーに通知（アラート表示）
4. ログインページにリダイレクト

### クリアされるデータ

```javascript
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
```

---

## アクティビティ監視

### 監視対象イベント

以下のユーザー操作を検出して、最終アクティビティ時刻を更新します：

- **click** - クリック
- **keydown** - キー入力
- **scroll** - スクロール
- **mousemove** - マウス移動
- **touchstart** - タッチ操作

### デバウンス処理

頻繁な更新を防ぐため、1秒間のデバウンスを実装：

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

### メリット

- **セキュリティ向上**: 共有PCでログアウトし忘れた場合も自動保護
- **ユーザー体験**: 操作中はタイムアウトしない
- **データ鮮度**: 古い認証情報が残らない

---

## Googleトークン更新監視

### Google OAuthトークンの特性

- **アクセストークン**: 1時間で期限切れ
- **リフレッシュトークン**: Google Identity Servicesでは発行されない
- **再認証**: トークン期限切れ後は再認証が必要

### 実装

**チェック間隔**: 1分ごと

**更新タイミング**: 期限切れ5分前

```javascript
const TOKEN_REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000;  // 5分

async checkAndRefreshToken() {
  const timeUntilExpiry = tokenExpiry - Date.now();

  // 期限切れ5分前になったら通知
  if (timeUntilExpiry <= TOKEN_REFRESH_BEFORE_EXPIRY) {
    // ユーザーに再認証を促す
    this.refreshGoogleToken();
  }
}
```

### トークン期限切れ前の動作

1. ユーザーに確認ダイアログを表示
2. 「はい」を選択 → 設定ページに移動して再認証
3. 「いいえ」を選択 → そのまま継続（期限切れ後はGoogle API使用時にエラー）

### トークン期限切れ後の動作

1. Google認証情報をクリア
2. 次回クリック時にアラート表示
3. ユーザーに再認証を促す

---

## セッション情報の確認方法

### ブラウザコンソールで確認

```javascript
// セッション情報を表示
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

### プログラムから取得

```javascript
const info = window.sessionManager.getSessionInfo();
console.log(info);

// 返り値:
// {
//   lastActivityTime: 1739597425000,
//   lastActivityDate: Date,
//   elapsedMs: 7200000,
//   remainingMs: 597600000,
//   isExpired: false,
//   timeoutDays: 7
// }
```

---

## セキュリティ上のメリット

### 1. 共有PC対策

- 公共のPCやオフィスの共有PCでログアウトを忘れても、7日後に自動ログアウト
- 次のユーザーが誤ってデータにアクセスすることを防止

### 2. トークン漏洩リスク軽減

- 古いトークンが長期間残ることを防止
- 定期的な再認証でセキュリティを維持

### 3. データ整合性

- 古い認証情報（期限切れトークン、古いプラン情報）が残らない
- 常に最新の認証状態を保つ

### 4. XSS攻撃対策

- localStorageの認証情報が定期的にクリアされる
- 長期間の悪用リスクを低減

---

## カスタマイズ方法

### セッションタイムアウト期間の変更

**ファイル**: `public/js/session-manager.js`

```javascript
// 現在: 7日
const SESSION_TIMEOUT_DAYS = 7;

// 変更例: 30日に延長
const SESSION_TIMEOUT_DAYS = 30;

// 変更例: 1日に短縮（より厳格なセキュリティ）
const SESSION_TIMEOUT_DAYS = 1;
```

### チェック間隔の変更

```javascript
// 現在: 1分
const ACTIVITY_CHECK_INTERVAL = 60000;

// 変更例: 5分
const ACTIVITY_CHECK_INTERVAL = 5 * 60000;
```

### トークン更新タイミングの変更

```javascript
// 現在: 期限切れ5分前
const TOKEN_REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000;

// 変更例: 期限切れ10分前
const TOKEN_REFRESH_BEFORE_EXPIRY = 10 * 60 * 1000;
```

---

## ログインページでの動作

### 特別な処理

ログインページ（`login.html`）では、SessionManagerは初期化されません。

```javascript
// ログインページでは初期化しない
if (!window.location.pathname.includes('/login.html')) {
  window.sessionManager.initialize();
}
```

### 理由

- ログインページではまだ認証されていない
- セッションタイムアウトチェックは不要
- ログイン後、他のページに遷移した時点で初期化される

---

## トラブルシューティング

### Q1: セッションがすぐにタイムアウトしてしまう

**A:** ブラウザのタイムゾーン設定を確認してください。また、システムの日時が正確かチェックしてください。

### Q2: Googleトークンの期限切れ通知が表示されない

**A:** ブラウザコンソールを確認してください。エラーが出ていないか確認し、`window.sessionManager.logSessionInfo()` で状態を確認してください。

### Q3: アクティビティ監視が動作していない

**A:** ブラウザコンソールで以下を確認：

```javascript
window.sessionManager.isMonitoring  // → true であるべき
```

### Q4: 手動でセッションをクリアしたい

**A:** ブラウザコンソールで以下を実行：

```javascript
window.sessionManager.clearSession();
```

---

## ファイル構成

```
rentpipe/
├── public/
│   └── js/
│       └── session-manager.js      # セッション管理モジュール
└── SESSION_MANAGEMENT.md           # このドキュメント
```

### 読み込み順序

SessionManagerは他のモジュールより先に読み込まれる必要があります：

```html
<script src="js/session-manager.js"></script>  <!-- 最初 -->
<script src="js/navigation.js"></script>
<script src="js/integrated-auth-manager-v2.js"></script>
<!-- 他のスクリプト -->
```

---

## 今後の拡張案

### 1. サーバーサイドセッション管理

- Supabaseセッションとの統合
- サーバー側でのセッション検証
- より強固なセキュリティ

### 2. カスタマイズ可能なタイムアウト

- ユーザーが設定画面でタイムアウト期間を選択可能
- プラン別のタイムアウト設定（Freeプラン: 7日、有料プラン: 30日など）

### 3. セッションログ

- セッション開始/終了のログ記録
- 異常なアクセスパターンの検出

### 4. マルチデバイス対応

- 同一ユーザーの複数デバイスでのセッション管理
- デバイスごとのセッション制御

---

## セキュリティベストプラクティス

### 推奨事項

1. **定期的なログアウト**: 重要な操作後は手動でログアウト
2. **共有PCでの注意**: 他人と共有するPCでは必ずログアウト
3. **ブラウザの終了**: 作業終了後はブラウザを完全に閉じる
4. **パスワード管理**: ブラウザのパスワード保存機能を適切に使用

### 開発者向け

1. **HTTPS必須**: 本番環境では必ずHTTPSを使用
2. **CSP設定**: Content Security Policyを適切に設定
3. **定期的な監査**: セキュリティ監査を定期的に実施
4. **依存関係の更新**: ライブラリを最新に保つ

---

**最終更新**: 2026年2月15日
**バージョン**: 1.0.0
