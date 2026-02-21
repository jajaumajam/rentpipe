import { getUserById, getPrivacySettings, updatePrivacySettings } from '../lib/supabase.js';

/**
 * GET/POST /api/user/privacy-settings
 * Manage user's privacy settings (third-party company names for form disclosure)
 *
 * Request body (both GET and POST): { userId, email }
 * POST additionally accepts: { agentName, agentCompany, thirdParties }
 *
 * Uses service_role key for secure access (same pattern as plan-simple.js)
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    // Verify user exists and email matches (using service_role key, bypasses RLS)
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email !== email) {
      return res.status(401).json({ error: 'Email verification failed' });
    }

    const { _action, agentName, agentCompany, thirdParties, privacyPolicyUrl } = req.body;

    // GET action: return current privacy settings
    // (_action: 'get' or HTTP GET method)
    if (req.method === 'GET' || _action === 'get') {
      const settings = await getPrivacySettings(userId);
      return res.status(200).json({ settings });
    }

    // POST: save privacy settings
    if (req.method === 'POST') {
      // Validate thirdParties format
      const validatedParties = Array.isArray(thirdParties)
        ? thirdParties
            .filter(p => p && typeof p.name === 'string' && p.name.trim())
            .map(p => ({ id: p.id || crypto.randomUUID(), name: p.name.trim() }))
        : [];

      const updated = await updatePrivacySettings(userId, {
        agentName: agentName?.trim() || '',
        agentCompany: agentCompany?.trim() || '',
        thirdParties: validatedParties,
        privacyPolicyUrl: privacyPolicyUrl?.trim() || '',
      });

      return res.status(200).json({ settings: updated });
    }

  } catch (error) {
    console.error('Error in /api/user/privacy-settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
