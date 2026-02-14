# ベータ版モード設定ガイド

## 概要

RentPipeは**ベータ版モード**と**正式版モード**を切り替えられる柔軟な設計になっています。

- **ベータ版モード**: 全機能を無料で開放（ユーザー獲得・検証フェーズ）
- **正式版モード**: プラン別の機能制限を有効化（収益化フェーズ）

この仕組みにより、収益化の見込みが立たない段階では無料で全機能を提供し、一定数のユーザーが利用を継続する段階でスムーズに有料プランに移行できます。

---

## モード切り替え方法

### 📍 設定ファイル: `public/js/feature-flags.js`

ファイルの冒頭にある `BETA_MODE` フラグを変更するだけで、即座にモードを切り替えられます。

```javascript
// ============================================
// ベータ版モード設定
// ============================================
// true: 全機能無料開放（ベータ版）
// false: プラン別機能制限を有効化（正式版）
const BETA_MODE = true;  // ← ここを変更
```

### ✅ ベータ版モード（`BETA_MODE = true`）

- すべてのユーザーが**全機能を無料**で利用可能
- プラン（Free/Senior Agent）に関係なく、すべての機能にアクセス可能
- **Stripe決済が完全に無効化**される（アップグレードボタン非表示、決済処理をブロック）
- settings.htmlに**「ベータ版期間中：全機能無料開放！」**バナーが表示される
- コンソールに緑色のメッセージが表示される:
  ```
  🚀 BETA MODE ENABLED: All features are available for free!
  ```

### 🔒 正式版モード（`BETA_MODE = false`）

- プラン別の機能制限が有効化される
- Freeプランでは基本機能のみ利用可能
- Senior Agentプランでは拡張機能も利用可能
- 制限された機能にアクセスしようとすると、アップグレードモーダルが表示される
- コンソールに青色のメッセージが表示される:
  ```
  ✅ Production mode: Plan-based feature restrictions are active
  ```

---

## プラン別機能一覧

### Free プラン（無料）

- ✅ 顧客管理（CRUD）
- ✅ パイプライン（カンバン）
- ✅ アーカイブ機能
- ✅ 顧客メモ
- ✅ Google Driveへのデータ保存
- ✅ Google Sheetsへの同期
- ✅ カレンダー連携（基本）
- ❌ **Googleフォーム連携**（Senior Agent以上）
- ❌ **カレンダー連携（拡張）**（Senior Agent以上）
- ❌ **連絡テンプレート管理**（Senior Agent以上）
- ❌ **フォローアップ自動化**（Senior Agent以上）

### Senior Agent プラン（¥2,480/月）

- ✅ すべてのFree機能
- ✅ **Googleフォーム連携**
- ✅ **カレンダー連携（拡張）**
- ✅ **連絡テンプレート管理**
- ✅ **フォローアップ自動化**

### Top Agent プラン（将来実装予定）

- ✅ すべてのSenior Agent機能
- ✅ 分析ダッシュボード
- ✅ チーム機能
- ✅ API アクセス

---

## 実装の仕組み

### 1. Feature Flags システム

`public/js/feature-flags.js` が機能制限の中核を担います。

```javascript
class FeatureFlags {
  hasAccess(featureName, userPlan = 'free') {
    // ベータ版モードの場合、全機能にアクセス可能
    if (this.betaMode) {
      return true;
    }

    // 正式版モード：プラン別の機能制限を適用
    const planFeatures = this.features[userPlan];
    return planFeatures[featureName] === true;
  }
}
```

### 2. PlanManager との連携

`public/js/plan-manager.js` がFeatureFlagsと連携します。

```javascript
hasFeatureAccess(feature) {
  const plan = this.getPlan();

  // FeatureFlagsが利用可能な場合はそれを使用
  if (window.featureFlags) {
    return window.featureFlags.hasAccess(feature, plan);
  }

  // フォールバック: 従来のロジック
  // ...
}
```

### 3. 各ページでの使用例

**templates.html でのテンプレート編集チェック:**

```javascript
async function editTemplate(templateId) {
  // プランチェック
  if (window.planManager) {
    const hasAccess = await window.planManager.checkFeatureAccess('templates', 'テンプレート編集');
    if (!hasAccess) {
      return; // アップグレードモーダルが表示される
    }
  }

  // ベータ版モードまたはSenior Agent以上の場合、ここに到達
  editingTemplateId = templateId;
  renderTemplates();
}
```

### 4. UIの動的変更

**settings.html のベータ版バナー表示:**

```javascript
async function updatePlanInfo() {
  // ベータ版バナーの表示制御
  const betaBanner = document.getElementById('betaBanner');
  if (betaBanner && window.featureFlags) {
    if (window.featureFlags.isBetaMode()) {
      betaBanner.style.display = 'block';  // ベータ版バナー表示
    } else {
      betaBanner.style.display = 'none';
    }
  }

  // ベータ版モードの場合は全機能を表示
  if (window.featureFlags && window.featureFlags.isBetaMode()) {
    features = [
      '顧客管理（無制限）',
      'パイプライン管理',
      'Googleカレンダー連携（基本・拡張）',
      'Googleフォーム連携',
      '連絡テンプレート管理',
      'フォローアップ自動化'
    ];
  }
}
```

---

## ベータ版から正式版への移行手順

### ステップ1: ユーザー獲得・検証フェーズ（現在）

1. `BETA_MODE = true` に設定
2. 全機能を無料で提供
3. ユーザーフィードバックを収集
4. 機能の改善・調整

### ステップ2: 収益化準備フェーズ

1. 一定数のユーザーが一定期間利用を継続していることを確認
2. Vercelの有料プラン（Pro: $20/月）に移行
3. ユーザーに正式版移行の事前告知（1〜2ヶ月前）
4. 移行スケジュールを公開

### ステップ3: 正式版移行

1. **`public/js/feature-flags.js` の `BETA_MODE` を `false` に変更**
2. Vercelにデプロイ（即座に機能制限が有効化される）
3. ユーザーに移行完了の通知
4. Freeプランユーザーには引き続き基本機能を提供
5. 拡張機能を使いたいユーザーにはSenior Agentプランへのアップグレードを案内

### ステップ4: 継続的な改善

- プラン別の利用状況を分析
- 機能の追加・調整
- 将来的にTop Agentプランの実装も検討

---

## 決済無効化の仕組み

ベータ版モード（`BETA_MODE = true`）では、Stripe決済が完全に無効化され、ユーザーに誤って請求が発生することを防ぎます。

### 実装箇所

#### 1. settings.html - handleUpgrade関数

```javascript
async function handleUpgrade() {
  // ベータ版モードチェック
  if (window.featureFlags && window.featureFlags.isBetaMode()) {
    alert('現在ベータ版期間中のため、全機能を無料でご利用いただけます。\n\n正式版リリース時に改めてプラン機能をご案内いたします。\nこの期間中に存分にお試しください！');
    return;  // 決済処理をブロック
  }
  // ... Stripe決済処理
}
```

#### 2. settings.html - updatePlanInfo関数

```javascript
async function updatePlanInfo() {
  // アップグレードボタンの表示制御
  if (window.featureFlags && window.featureFlags.isBetaMode()) {
    // ベータ版モードではアップグレードボタンを非表示
    upgradeButton.style.display = 'none';
    planComparison.style.display = 'none';
    subscriptionManagement.style.display = 'none';
  }
  // ...
}
```

#### 3. plan-manager.js - showUpgradeModal関数

```javascript
showUpgradeModal(featureName) {
  // ベータ版モードの場合は、モーダルを表示しない
  if (window.featureFlags && window.featureFlags.isBetaMode()) {
    return;
  }
  // ...
}
```

### 無効化される要素

- ✅ アップグレードボタン（プラン情報セクション）
- ✅ プラン比較セクション
- ✅ Senior Agentプランのアップグレードボタン
- ✅ サブスクリプション管理ボタン
- ✅ アップグレードモーダル
- ✅ Stripe Checkout への遷移

### メリット

1. **誤課金の防止**: ベータ版期間中にユーザーに請求が発生しない
2. **Vercel無料プラン準拠**: 商用利用（決済）を行わないため、無料プランで運営可能
3. **シンプルな切り替え**: `BETA_MODE = false` に変更するだけで決済機能が有効化される

---

## 注意点

### ⚠️ デプロイメント

`feature-flags.js` を変更したら、必ずVercelに再デプロイしてください。

```bash
# Vercel CLI を使用
vercel --prod

# または GitHub にプッシュ（自動デプロイ設定済みの場合）
git add public/js/feature-flags.js
git commit -m "Toggle BETA_MODE"
git push
```

### ⚠️ 既存ユーザーへの配慮

正式版に移行する際は、既存のベータ版ユーザーに対して:

1. **事前告知**: 1〜2ヶ月前に通知
2. **特典の提供**: 早期割引や無料期間の延長を検討
3. **Freeプランでも価値を提供**: 基本機能で十分に業務が回るようにする

### ⚠️ Vercel 無料プランの制限

Vercelの無料プランは**商用利用が禁止**されています。
有料プラン（Senior Agent）を提供する場合は、必ずVercel Proプランに移行してください。

---

## ファイル一覧

ベータ版モード関連のファイル:

```
rentpipe/
├── public/
│   └── js/
│       ├── feature-flags.js          # 🔑 機能フラグ管理（BETA_MODE設定）
│       └── plan-manager.js           # プラン管理（FeatureFlagsと連携）
└── BETA_MODE.md                      # このドキュメント
```

機能制限が実装されているページ:

- `public/templates.html` - テンプレート編集機能
- `public/settings.html` - Googleフォーム連携機能、ベータ版バナー表示
- *(今後追加可能)* `public/customer.html`, `public/pipeline.html` など

---

## FAQ

### Q1: ベータ版モードと正式版モードの違いは？

**A:** ベータ版モードでは全ユーザーが全機能を無料で利用可能。正式版モードではプラン別の機能制限が適用されます。

### Q2: ユーザーがプランをアップグレードしたら、即座に機能が使える？

**A:** はい。Stripe Webhookが自動的にSupabaseのプラン情報を更新するため、決済完了後すぐに拡張機能にアクセスできます。

### Q3: ベータ版期間中にStripe決済は動作する？

**A:** いいえ。ベータ版モード（`BETA_MODE = true`）では、**Stripe決済が完全に無効化**されます。具体的には：

- アップグレードボタンが非表示になる
- プラン比較セクションが非表示になる
- アップグレード処理を実行しようとすると、「現在ベータ版期間中のため、全機能を無料でご利用いただけます」というアラートが表示される
- サブスクリプション管理ボタンも非表示になる

これにより、ベータ版期間中に誤ってユーザーに請求が発生することを防ぎ、Vercel無料プランのポリシーにも準拠します。

### Q4: 新しい機能を追加したい場合は？

**A:** `feature-flags.js` の `PLAN_FEATURES` オブジェクトに新しい機能名を追加し、各プランでの利用可否を設定してください。

```javascript
const PLAN_FEATURES = {
  free: {
    // 既存の機能...
    newFeature: false,  // Freeプランでは無効
  },
  senior_agent: {
    // 既存の機能...
    newFeature: true,   // Senior Agentプランで有効
  }
};
```

### Q5: ベータ版モードかどうかをコードで確認する方法は？

**A:** `window.featureFlags.isBetaMode()` を使用してください。

```javascript
if (window.featureFlags && window.featureFlags.isBetaMode()) {
  console.log('ベータ版モード中です');
} else {
  console.log('正式版モードです');
}
```

---

**最終更新:** 2026年2月15日
