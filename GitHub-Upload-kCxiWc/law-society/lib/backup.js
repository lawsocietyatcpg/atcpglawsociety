import JSZip from 'jszip';
import { randomBytes } from 'node:crypto';

const assetName = path => {
  if (typeof path !== 'string') return null;
  const match = /(?:\/uploads\/|\/society-public\/)([a-f0-9]{32}\.(?:png|jpg|webp|pdf))$/.exec(path);
  return match?.[1] || null;
};
const referencedAssets = body => [
  body.settings?.logo,
  ...body.events.flatMap(event => [...(event.photos || []), ...(event.documents || []).map(document => document.path)]),
].filter(Boolean);

export async function createBackup(service, body) {
  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(body, null, 2));
  let total = 0;
  for (const name of new Set(referencedAssets(body).map(assetName).filter(Boolean))) {
    const downloaded = await service.storage.from('society-public').download(name);
    if (downloaded.error) throw new Error('One of the uploaded files is missing.');
    const bytes = Buffer.from(await downloaded.data.arrayBuffer());
    total += bytes.length;
    if (total > 50_000_000) throw new Error('The content backup exceeds 50 MB.');
    zip.file(`uploads/${name}`, bytes);
  }
  const raw = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const path = `backups/${randomBytes(16).toString('hex')}.zip`;
  const uploaded = await service.storage.from('society-backups').upload(path, raw, { contentType: 'application/zip', upsert: false });
  if (uploaded.error) throw new Error('Unable to prepare the backup download.');
  const signed = await service.storage.from('society-backups').createSignedUrl(path, 300, { download: 'law-society-content-backup.zip' });
  if (signed.error) throw new Error('Unable to prepare the backup download.');
  return signed.data.signedUrl;
}

export async function readUploadedBackup(service, path) {
  if (typeof path !== 'string' || !/^backups\/[a-f0-9]{32}\.zip$/.test(path)) throw new Error('Choose a valid backup file.');
  const downloaded = await service.storage.from('society-backups').download(path);
  if (downloaded.error) throw new Error('Backup upload is not available.');
  if (downloaded.data.size > 50_000_000) throw new Error('Backup is too large.');
  const zip = await JSZip.loadAsync(await downloaded.data.arrayBuffer(), { checkCRC32: true });
  const entries = Object.values(zip.files).filter(entry => !entry.dir);
  if (entries.length > 2000 || !zip.file('content.json')) throw new Error('This is not a Law Society content backup.');
  let total = 0;
  for (const entry of entries) {
    if (entry.name !== 'content.json' && !/^uploads\/[a-f0-9]{32}\.(png|jpg|webp|pdf)$/.test(entry.name)) throw new Error('Backup contains an unexpected file.');
    total += entry._data?.uncompressedSize || 0;
    if (total > 50_000_000) throw new Error('Backup contents are too large.');
  }
  const body = JSON.parse(await zip.file('content.json').async('string'));
  if (!body || typeof body !== 'object' || !body.settings || !Array.isArray(body.events) || !Array.isArray(body.topics) || !Array.isArray(body.posts) || !Array.isArray(body.comments) || !Array.isArray(body.reactions) || !Array.isArray(body.reports)) throw new Error('This is not a Law Society content backup.');
  if (body.events.length > 1000 || body.topics.length > 1000 || body.posts.length > 100000) throw new Error('Backup contains too many records.');
  for (const reference of referencedAssets(body)) {
    const name = assetName(reference);
    if (!name) continue;
    const archived = zip.file(`uploads/${name}`);
    const existing = await service.storage.from('society-public').exists(name);
    if (!archived && (!existing.data || existing.error)) throw new Error('Backup is missing an uploaded file.');
    if (archived && !existing.data) {
      const bytes = Buffer.from(await archived.async('uint8array'));
      const format = name.split('.').pop();
      const valid = format === 'pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
        : format === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
        : format === 'jpg' ? bytes.subarray(0, 3).equals(Buffer.from([255,216,255]))
        : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
      if (!valid || bytes.length > 5_000_000) throw new Error('Backup contains an invalid uploaded file.');
      const mime = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' }[format];
      const saved = await service.storage.from('society-public').upload(name, bytes, { contentType: mime, upsert: false });
      if (saved.error) throw new Error('Unable to restore an uploaded file.');
    }
  }
  const replace = value => {
    const name = assetName(value);
    return name ? service.storage.from('society-public').getPublicUrl(name).data.publicUrl : value;
  };
  body.settings.logo = replace(body.settings.logo);
  for (const event of body.events) {
    event.photos = (event.photos || []).map(replace);
    event.documents = (event.documents || []).map(document => ({ ...document, path: replace(document.path) }));
    if (event.photo_captions) event.photo_captions = Object.fromEntries(Object.entries(event.photo_captions).map(([key, value]) => [replace(key), value]));
  }
  return body;
}
