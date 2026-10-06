import { authenticatedUser, configuration, profileRequest, validateProfile } from '../lib/member.js';
import { clients } from '../lib/server.js';
import { syncPendingMembers } from '../lib/sheets.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const config = configuration();
    const user = await authenticatedUser(req, config);
    if (!user) return res.status(401).json({ error: 'Please sign in with Google first.' });
    const profile = req.method === 'GET'
      ? await profileRequest(config, user, 'GET')
      : await profileRequest(config, user, 'POST', validateProfile(req.body));
    let sheetSync = 'not_applicable';
    if (req.method === 'POST') {
      try {
        const result = await syncPendingMembers(clients().service, { onlyUserId: user.id, limit: 1 });
        sheetSync = result.synced > 0 ? 'synced' : 'queued';
      } catch {
        // Registration is saved in Supabase and remains in the retry queue.
        sheetSync = 'queued';
      }
    }
    return res.status(200).json({ profile, sheetSync });
  } catch (error) {
    if (error.message.startsWith('Please')) return res.status(400).json({ error: error.message });
    return res.status(503).json({ error: 'Unable to save or load your details. Please try again.' });
  }
}
