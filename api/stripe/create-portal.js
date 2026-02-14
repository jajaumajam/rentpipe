import { createClient } from '@supabase/supabase-js';
import { createBillingPortalSession } from '../lib/stripe.js';
import { getUserById } from '../lib/supabase.js';

/**
 * POST /api/stripe/create-portal
 * Create a Stripe billing portal session for subscription management
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Get user's Stripe customer ID
    const userData = await getUserById(user.id);

    if (!userData || !userData.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Create billing portal session
    const session = await createBillingPortalSession({
      customerId: userData.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return res.status(200).json({
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
