# Supabase Setup

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

## 2. Run the schema

1. Go to SQL Editor in Supabase dashboard
2. Copy the contents of `schema.sql`
3. Run the SQL

## 3. Configure environment variables

Copy the following to your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Enable email authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates if needed

## Schema Overview

The `users` table stores:
- `id` - UUID from auth.users
- `email` - User email
- `plan` - Subscription plan (free, senior_agent, top_agent)
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `subscription_status` - Stripe subscription status

**Important**: Customer data (contacts, contracts, etc.) is NOT stored in Supabase. Only plan/billing info.
