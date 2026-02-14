import { getUserById } from '../lib/supabase.js';

/**
 * POST /api/user/plan-simple
 * Get user's plan information (simplified - no Supabase session required)
 * Uses service_role key for secure access
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    console.log(`Fetching plan for user: ${email}`);

    // Get user from Supabase using service_role key (bypasses RLS)
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify email matches
    if (user.email !== email) {
      return res.status(401).json({ error: 'Email verification failed' });
    }

    // Return plan information
    return res.status(200).json({
      userId: user.id,
      email: user.email,
      plan: user.plan || 'free',
      subscriptionStatus: user.subscription_status || null,
      hasActiveSubscription: user.subscription_status === 'active' || user.subscription_status === 'trialing',
    });

  } catch (error) {
    console.error('Error in /api/user/plan-simple:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
