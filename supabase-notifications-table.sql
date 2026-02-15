-- RentPipe お知らせ管理テーブル
-- Supabase SQL Editorで実行してください

-- notifications テーブル作成
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('info', 'success', 'warning', 'danger')),

  -- 表示設定
  type TEXT NOT NULL CHECK (type IN ('banner', 'page')),
  priority INTEGER DEFAULT 5,
  show_banner BOOLEAN DEFAULT false,
  show_on_pages TEXT[] DEFAULT '{}',

  -- 期間設定
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  -- 状態管理
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  dismissible BOOLEAN DEFAULT true,

  -- メタデータ
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_dates ON notifications(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS (Row Level Security) 有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ポリシー: すべてのユーザーが公開済みお知らせを読める
CREATE POLICY "Anyone can view published notifications"
  ON notifications
  FOR SELECT
  USING (status = 'published');

-- ポリシー: 管理者のみが全お知らせを読める（管理画面用）
-- 注: 管理者判定は email で行う想定
CREATE POLICY "Admins can view all notifications"
  ON notifications
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'jajaumajam@gmail.com'
      -- 他の管理者メールアドレスをここに追加
    )
  );

-- ポリシー: 管理者のみが作成・更新・削除できる
CREATE POLICY "Admins can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'jajaumajam@gmail.com'
    )
  );

CREATE POLICY "Admins can update notifications"
  ON notifications
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'jajaumajam@gmail.com'
    )
  );

CREATE POLICY "Admins can delete notifications"
  ON notifications
  FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN (
      'jajaumajam@gmail.com'
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 初期サンプルデータ（オプション）
INSERT INTO notifications (
  title,
  message,
  variant,
  type,
  priority,
  show_banner,
  start_date,
  end_date,
  status,
  dismissible,
  created_by
) VALUES (
  'ベータ版リリースのお知らせ',
  'RentPipeベータ版へようこそ！現在、全機能を無料でご利用いただけます。ご意見・ご要望は設定画面の「ご意見・ご要望」セクションからお気軽にお寄せください。',
  'info',
  'banner',
  1,
  true,
  '2026-02-01 00:00:00+00',
  '2026-12-31 23:59:59+00',
  'published',
  true,
  'system'
);

-- 確認用クエリ
SELECT * FROM notifications ORDER BY created_at DESC;
