import { randomBytes } from 'node:crypto';
import { caller, clients } from '../lib/server.js';

const formats = {
  'image/png': 'png', 'image/jpeg': 'jpg',
  'image/webp': 'webp', 'application/pdf': 'pdf',
  'application/zip': 'zip',
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (req.headers.origin !== `https://${req.headers.host}`) return res.status(403).json({ error: 'Invalid request origin.' });
  try {
    const connection = clients();
    const user = await caller(req, connection);
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
    const { target, type, size } = req.body || {};
    const extension = formats[type];
    const backup = target === 'backup';
    if (!['logo', 'photo', 'document', 'backup'].includes(target) || !extension || (extension === 'pdf') !== (target === 'document') || (extension === 'zip') !== backup || !Number.isSafeInteger(size) || size < 1 || size > (backup ? 50_000_000 : 5_000_000)) return res.status(400).json({ error: 'Choose a valid file within the size limit.' });
    const path = backup ? `backups/${randomBytes(16).toString('hex')}.zip` : `${randomBytes(16).toString('hex')}.${extension}`;
    const bucket = backup ? 'society-backups' : 'society-public';
    const { data, error } = await connection.service.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw error;
    return res.status(200).json({ path, token: data.token, bucket });
  } catch {
    return res.status(503).json({ error: 'Unable to prepare upload. Please try again.' });
  }
}
