import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/user/plan
 * Get current user's plan information
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get the current user from the token
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user's plan information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user plan:', userError);
      return res.status(500).json({ error: 'Failed to fetch user plan' });
    }

    // Return plan information
    return res.status(200).json({
      userId: user.id,
      email: user.email,
      plan: userData?.plan || 'free',
      subscriptionStatus: userData?.subscription_status || null,
      hasActiveSubscription: userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing',
    });

  } catch (error) {
    console.error('Error in /api/user/plan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
