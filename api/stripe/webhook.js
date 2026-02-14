import { stripe, PLANS } from '../lib/stripe.js';
import { updateUserPlan, getUserByStripeCustomerId } from '../lib/supabase.js';

// Disable body parser to get raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Helper to read raw body from request
 */
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body and signature
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the event
    console.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    console.error('No userId found in checkout session');
    return;
  }

  console.log(`Checkout completed for user ${userId}`);

  // Get subscription to determine plan
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Determine plan from price ID
  const plan = getPlanFromPriceId(priceId);

  // Update user in database
  await updateUserPlan({
    userId,
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: subscription.status,
  });

  console.log(`User ${userId} upgraded to ${plan}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  await updateUserPlan({
    userId: user.id,
    plan,
    subscriptionStatus: subscription.status,
  });

  console.log(`Subscription updated for user ${user.id}: ${subscription.status}`);
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Downgrade to free plan
  await updateUserPlan({
    userId: user.id,
    plan: PLANS.FREE,
    subscriptionStatus: 'canceled',
  });

  console.log(`Subscription canceled for user ${user.id}`);
}

/**
 * Handle successful payment
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Update subscription status to active
  await updateUserPlan({
    userId: user.id,
    subscriptionStatus: 'active',
  });

  console.log(`Payment succeeded for user ${user.id}`);
}

/**
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Update subscription status to past_due
  await updateUserPlan({
    userId: user.id,
    subscriptionStatus: 'past_due',
  });

  console.log(`Payment failed for user ${user.id}`);
}

/**
 * Helper to determine plan from Stripe price ID
 */
function getPlanFromPriceId(priceId) {
  // Map price IDs to plans
  // These should match your Stripe product price IDs
  const priceToPlanMap = {
    [process.env.STRIPE_PRICE_SENIOR_AGENT]: PLANS.SENIOR_AGENT,
    // Add more price IDs as you create new plans
  };

  return priceToPlanMap[priceId] || PLANS.FREE;
}
