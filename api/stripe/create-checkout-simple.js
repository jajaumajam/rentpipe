import { createCheckoutSession } from '../lib/stripe.js';
import { getUserById } from '../lib/supabase.js';

/**
 * POST /api/stripe/create-checkout-simple
 * Create a Stripe checkout session (simplified - no Supabase session required)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, priceId, planName } = req.body;

    if (!userId || !email || !priceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user exists in Supabase
    const user = await getUserById(userId);

    if (!user || user.email !== email) {
      return res.status(401).json({ error: 'User verification failed' });
    }

    console.log(`Creating checkout session for user: ${email}`);

    // Create checkout session
    const session = await createCheckoutSession({
      userId: userId,
      email: email,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings.html?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings.html?canceled=true`,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
