import { configuration } from '../lib/member.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const { url, key } = configuration();
    // This is the Supabase publishable key. The secret key is never returned.
    return res.status(200).json({ supabaseUrl: url, supabasePublishableKey: key });
  } catch {
    return res.status(503).json({ error: 'Member registration is not configured yet.' });
  }
}
