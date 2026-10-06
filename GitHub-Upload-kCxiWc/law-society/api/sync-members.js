import { caller, clients } from '../lib/server.js';
import { syncPendingMembers } from '../lib/sheets.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const connection = clients();
    const cronSecret = process.env.CRON_SECRET;
    const scheduled = req.method === 'GET' && cronSecret && req.headers.authorization === `Bearer ${cronSecret}`;
    const user = scheduled ? null : await caller(req, connection);
    if (!scheduled && (req.method !== 'POST' || user?.role !== 'admin')) return res.status(403).json({ error: 'Administrator access required.' });
    const result = await syncPendingMembers(connection.service, { limit: 20 });
    return res.status(200).json(result);
  } catch {
    return res.status(503).json({ error: 'Member Sheet sync is not available. The registrations remain safely queued.' });
  }
}
