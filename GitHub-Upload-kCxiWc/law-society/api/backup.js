import { caller, clients, websiteState } from '../lib/server.js';
import { createBackup } from '../lib/backup.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const connection = clients();
    const user = await caller(req, connection);
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
    const stored = await websiteState(connection.service);
    const url = await createBackup(connection.service, stored.body);
    return res.redirect(302, url);
  } catch {
    return res.status(503).json({ error: 'Unable to create the backup. Please try again.' });
  }
}
