import { adminActions, applyAction } from './actions.js';
import { caller, clients, saveWebsiteState, websiteState } from './server.js';
import { changeAdministrator, createAdministrator, loginAdministrator, logoutAdministrator } from './admin.js';
import { readUploadedBackup } from './backup.js';

const retired = new Set(['login']);

export default async function handler(req, res, action) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (req.headers.origin !== `https://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return res.status(403).json({ error: 'Invalid request origin.' });
  if (typeof action !== 'string' || !/^[a-z-]{1,40}$/.test(action)) return res.status(404).json({ error: 'Unknown action.' });
  if (retired.has(action)) return res.status(410).json({ error: 'Please use the Google sign-in button.' });
  try {
    const connection = clients();
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Invalid request.' });
    if (action === 'admin-setup') { await createAdministrator(req, res, connection, data); return res.status(200).json({ ok: true }); }
    if (action === 'admin-login') { await loginAdministrator(res, connection.service, data); return res.status(200).json({ ok: true }); }
    if (action === 'change-credentials') { await changeAdministrator(req, res, connection.service, data); return res.status(200).json({ ok: true }); }
    if (action === 'logout') { await logoutAdministrator(req, res, connection.service); return res.status(200).json({ ok: true }); }
    const user = await caller(req, connection);
    if (!user) return res.status(401).json({ error: 'Please sign in to participate.' });
    if (adminActions.has(action) && user.role !== 'admin') return res.status(403).json({ error: 'Only administrators can do this.' });
    if (!adminActions.has(action) && !user.profileComplete) return res.status(403).json({ error: 'Complete your member details first.' });
    let uploadedUrl = null;
    if (action === 'attach-upload') {
      const path = data.path;
      if (typeof path !== 'string' || !/^[a-f0-9]{32}\.(png|jpg|webp|pdf)$/.test(path)) return res.status(400).json({ error: 'Invalid upload.' });
      if (!['logo', 'photo', 'document'].includes(data.target) || (path.endsWith('.pdf') !== (data.target === 'document'))) return res.status(400).json({ error: 'Invalid upload type.' });
      const exists = await connection.service.storage.from('society-public').exists(path);
      if (exists.error || !exists.data) return res.status(400).json({ error: 'Upload was not completed.' });
      uploadedUrl = connection.service.storage.from('society-public').getPublicUrl(path).data.publicUrl;
    }
    const restoredBackup = action === 'restore-uploaded-backup'
      ? await readUploadedBackup(connection.service, data.path) : null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const stored = await websiteState(connection.service);
      let body = structuredClone(stored.body);
      if (restoredBackup) {
        body = structuredClone(restoredBackup);
      } else if (action === 'restore-revision') {
        if (!Number.isSafeInteger(Number(data.id))) return res.status(400).json({ error: 'Invalid revision.' });
        const result = await connection.service.from('site_revisions').select('body').eq('id', data.id).maybeSingle();
        if (result.error || !result.data) return res.status(400).json({ error: 'This saved version is no longer available.' });
        body = result.data.body;
      } else {
        body = applyAction(body, action, data, user, uploadedUrl);
      }
      if (await saveWebsiteState(connection.service, stored.version, body, action, user.id)) {
        if (restoredBackup) await connection.service.storage.from('society-backups').remove([data.path]);
        return res.status(200).json({ ok: true });
      }
    }
    return res.status(409).json({ error: 'The website changed while you were editing. Refresh and try again.' });
  } catch (error) {
    if (/^(Please|Invalid|Unknown|Choose|This|Only|Enter|Links|The list|You have|Incorrect|Too many|Use |Sign in|Administrator already)/.test(error.message)) return res.status(400).json({ error: error.message });
    return res.status(503).json({ error: 'Unable to save right now. Please try again.' });
  }
}
