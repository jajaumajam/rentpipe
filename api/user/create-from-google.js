import { supabaseAdmin } from '../lib/supabase.js';

/**
 * POST /api/user/create-from-google
 * Google OAuthのユーザー情報を使ってSupabaseにユーザーを作成
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Creating Supabase user from Google OAuth:', email);

    // まず、ユーザーが既に存在するか確認
    const { data: existingUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, plan')
      .eq('email', email);

    if (fetchError) {
      console.error('Error checking existing user:', fetchError);
    }

    // ユーザーが既に存在する場合
    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists:', email);
      return res.status(200).json({
        userId: existingUsers[0].id,
        email: existingUsers[0].email,
        plan: existingUsers[0].plan,
        isNew: false
      });
    }

    // 新規ユーザーを auth.users に作成
    // ※ パスワードは設定せず、OAuth専用ユーザーとして作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name: name || '',
        provider: 'google',
        created_from: 'google_oauth_sync'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData.user.id);

    // public.users テーブルには自動的に作成される（トリガーによって）
    // 少し待ってからデータを確認
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 作成されたユーザー情報を取得
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, plan')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error fetching created user:', userError);
      // エラーでも auth user は作成されているので、成功として返す
      return res.status(200).json({
        userId: authData.user.id,
        email: email,
        plan: 'free',
        isNew: true
      });
    }

    console.log('✅ User created successfully:', newUser);

    return res.status(200).json({
      userId: newUser.id,
      email: newUser.email,
      plan: newUser.plan,
      isNew: true
    });

  } catch (error) {
    console.error('Error in /api/user/create-from-google:', error);
    return res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
}
