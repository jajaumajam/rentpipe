import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Plan configurations
 */
export const PLANS = {
  FREE: 'free',
  SENIOR_AGENT: 'senior_agent',
  TOP_AGENT: 'top_agent',
};

/**
 * Features available per plan
 */
export const PLAN_FEATURES = {
  [PLANS.FREE]: {
    customerManagement: true,
    pipeline: true,
    calendarBasic: true,
    maxCustomers: null, // unlimited
  },
  [PLANS.SENIOR_AGENT]: {
    customerManagement: true,
    pipeline: true,
    calendarBasic: true,
    calendarAdvanced: true,
    googleForms: true,
    templates: true,
    maxCustomers: null, // unlimited
  },
  [PLANS.TOP_AGENT]: {
    customerManagement: true,
    pipeline: true,
    calendarBasic: true,
    calendarAdvanced: true,
    googleForms: true,
    templates: true,
    advancedAnalytics: true, // future feature
    maxCustomers: null,
  },
};

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({ userId, email, priceId, successUrl, cancelUrl }) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: email,
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Create a Stripe billing portal session
 */
export async function createBillingPortalSession({ customerId, returnUrl }) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(subscriptionId) {
  if (!subscriptionId) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}
