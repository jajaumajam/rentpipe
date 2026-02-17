-- notifications テーブルのRLSポリシーを修正
-- Supabase SQL Editorで実行してください

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Anyone can view published notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

-- 新しいポリシー: 全ユーザーが読み取り可能（公開済みのみ）
CREATE POLICY "Public read published"
  ON notifications
  FOR SELECT
  USING (status = 'published');

-- 新しいポリシー: 管理者画面からの全読み取り（anon keyでアクセス）
-- セキュリティはアプリ側（checkAdminPermission）で担保
CREATE POLICY "Anon full read"
  ON notifications
  FOR SELECT
  USING (true);

-- 新しいポリシー: 書き込みを全許可（anon key対応）
-- ※ 管理者判定はアプリ側のcheckAdminPermission()で実施
CREATE POLICY "Anon insert"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon update"
  ON notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon delete"
  ON notifications
  FOR DELETE
  USING (true);

-- 確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';
