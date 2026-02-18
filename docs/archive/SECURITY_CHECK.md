# セキュリティ確認事項

## 🔍 Supabaseダッシュボードでの確認手順

### 1. Supabaseにログイン
https://app.supabase.com にアクセス

### 2. プロジェクト選択
プロジェクト: pjfspvwwzaemfmeizvhl を開く

### 3. RLS（Row Level Security）の確認
1. 左メニューから **Authentication** > **Policies** を選択
2. 各テーブル（customers, sales_pipelines, templates等）でRLSが有効か確認
3. 確認項目:
   - ✅ "Enable RLS" がONになっているか
   - ✅ ポリシーが設定されているか（SELECT, INSERT, UPDATE, DELETE）

### 4. APIキーの確認
1. 左メニューから **Settings** > **API** を選択
2. 表示されている "anon public" キーが以下と一致するか確認:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZnNwdnd3emFlbWZtZWl6dmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTE4MDUsImV4cCI6MjA4NjU2NzgwNX0.S2orVh93qxaYo_2ez1wvTzBakm1kNW4iwpVhPKmklXU
   ```

---

## ✅ 結果に応じた対応

### ケース1: RLSが全テーブルで有効
→ **安全**: Anon Keyが公開されても問題なし
→ 対応: 環境変数化のみで十分

### ケース2: RLSが一部のみ/未設定
→ **危険**: データへの不正アクセスの可能性
→ 対応: 
  1. 即座にRLS有効化
  2. APIキーのローテーション（Reset）
  3. 環境変数化
  4. Git履歴からの削除

---

## 📝 確認結果を教えてください

1. RLS設定状況: （有効 / 一部のみ / 無効）
2. どのテーブルにRLSが設定されているか
3. APIキーのリセットが必要か
