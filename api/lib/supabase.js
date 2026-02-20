import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

/**
 * Supabase client for server-side operations (with service role key)
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }

  return data;
}

/**
 * Update user plan and Stripe info
 */
export async function updateUserPlan({
  userId,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  subscriptionStatus,
}) {
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (plan !== undefined) updates.plan = plan;
  if (stripeCustomerId !== undefined) updates.stripe_customer_id = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) updates.stripe_subscription_id = stripeSubscriptionId;
  if (subscriptionStatus !== undefined) updates.subscription_status = subscriptionStatus;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }

  return data;
}

/**
 * Get user by Stripe customer ID
 */
export async function getUserByStripeCustomerId(customerId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    return null;
  }

  return data;
}

/**
 * Get privacy settings for a user
 * Returns { agentName, agentCompany, thirdParties: [{id, name}], updatedAt } or null
 */
export async function getPrivacySettings(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('privacy_settings')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching privacy settings:', error);
    return null;
  }

  return data?.privacy_settings || null;
}

/**
 * Update privacy settings for a user
 */
export async function updatePrivacySettings(userId, settings) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      privacy_settings: { ...settings, updatedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('privacy_settings')
    .single();

  if (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }

  return data.privacy_settings;
}
