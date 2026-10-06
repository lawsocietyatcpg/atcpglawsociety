import { caller, clients, websiteState } from '../lib/server.js';
import { configured } from '../lib/admin.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const connection = clients();
    const [stored, user, adminConfigured] = await Promise.all([
      websiteState(connection.service), caller(req, connection), configured(connection.service),
    ]);
    const state = structuredClone(stored.body);
    if (user?.role === 'admin') {
      const { data, error } = await connection.service.from('site_revisions')
        .select('id,created_at,action').order('id', { ascending: false }).limit(20);
      if (error) throw new Error('Unable to read content history.');
      state.revisions = data.map(row => ({ id: row.id, action: row.action, created: Date.parse(row.created_at) / 1000 }));
      const pending = await connection.service.from('member_sheet_queue')
        .select('user_id', { count: 'exact', head: true }).eq('pending', true);
      if (pending.error) throw new Error('Unable to read member sync status.');
      state.pending_member_sync_count = pending.count;
    } else {
      delete state.reports;
    }
    state.user = user?.profileComplete || user?.role === 'admin'
      ? { id: user.id, name: user.name, role: user.role }
      : null;
    state.admin_configured = adminConfigured;
    return res.status(200).json(state);
  } catch {
    return res.status(503).json({ error: 'Website content is temporarily unavailable.' });
  }
}
