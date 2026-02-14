import { createBillingPortalSession } from '../lib/stripe.js';
import { getUserById } from '../lib/supabase.js';

/**
 * POST /api/stripe/create-portal-simple
 * Create a Stripe billing portal session (simplified - no Supabase session required)
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

    console.log(`Creating billing portal for user: ${email}`);

    // Get user from Supabase using service_role key
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify email matches
    if (user.email !== email) {
      return res.status(401).json({ error: 'Email verification failed' });
    }

    // Check if user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Create billing portal session
    const session = await createBillingPortalSession({
      customerId: user.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings.html`,
    });

    return res.status(200).json({
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
