import { createSign, randomUUID } from 'node:crypto';

let cachedToken = null;

function sheetSettings() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!spreadsheetId || !raw || !/^[\w-]{20,}$/.test(spreadsheetId)) throw new Error('Google Sheet sync is not configured.');
  const account = JSON.parse(raw);
  if (account.type !== 'service_account' || !account.client_email || !account.private_key) throw new Error('Google Sheet credentials are invalid.');
  return { spreadsheetId, tab, account };
}

async function accessToken(account) {
  if (cachedToken?.email === account.client_email && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const assertion = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(assertion);
  signer.end();
  const jwt = `${assertion}.${signer.sign(account.private_key).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Google did not accept the Sheet connection.');
  const result = await response.json();
  cachedToken = { email: account.client_email, value: result.access_token, expires: Date.now() + result.expires_in * 1000 };
  return cachedToken.value;
}

async function sheetCall(settings, token, method, range, body, append = false) {
  const encoded = encodeURIComponent(`'${settings.tab.replaceAll("'", "''")}'!${range}`);
  const suffix = append ? ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS' : method === 'GET' ? '' : '?valueInputOption=RAW';
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/${encoded}${suffix}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify({ range: `'${settings.tab}'!${range}`, majorDimension: 'ROWS', values: [body] }) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Google Sheet request failed (${response.status}).`);
  return response.json();
}

export async function syncPendingMembers(service, { onlyUserId = null, limit = 10 } = {}) {
  const settings = sheetSettings();
  const holder = randomUUID();
  const lock = await service.rpc('claim_member_sheet_sync', { lease_holder: holder });
  if (lock.error) throw new Error('Unable to start Sheet sync.');
  if (!lock.data) return { busy: true, synced: 0 };
  let synced = 0;
  try {
    const token = await accessToken(settings.account);
    const header = await sheetCall(settings, token, 'GET', 'E1:F1');
    if (header.values?.[0]?.[0] !== 'Member ID') await sheetCall(settings, token, 'PUT', 'E1', ['Member ID']);
    if (header.values?.[0]?.[1] !== 'Public display name') await sheetCall(settings, token, 'PUT', 'F1', ['Public display name']);
    const sheet = await sheetCall(settings, token, 'GET', 'A2:F');
    const rows = sheet.values || [];
    let query = service.from('member_sheet_queue')
      .select('user_id,version,synced_version,attempts')
      .eq('pending', true)
      .lte('next_attempt_at', new Date().toISOString())
      .order('updated_at', { ascending: true })
      .limit(limit);
    if (onlyUserId) query = query.eq('user_id', onlyUserId);
    const pending = await query;
    if (pending.error) throw new Error('Unable to read pending member registrations.');
    for (const queued of pending.data) {
      try {
        const result = await service.from('member_profiles')
          .select('full_name,intake,email,phone,display_name').eq('user_id', queued.user_id).single();
        if (result.error) throw new Error('Unable to read a member profile.');
        const values = [result.data.full_name, result.data.intake, result.data.email, result.data.phone, queued.user_id, result.data.display_name];
        const index = rows.findIndex(row => row[4] === queued.user_id);
        if (index >= 0) await sheetCall(settings, token, 'PUT', `A${index + 2}:F${index + 2}`, values);
        else {
          const appended = await sheetCall(settings, token, 'POST', 'A:F', values, true);
          const rowNumber = Number(/!A(\d+)/.exec(appended.updates?.updatedRange || '')?.[1]);
          if (rowNumber >= 2) rows[rowNumber - 2] = values;
          else rows.push(values);
        }
        const saved = await service.from('member_sheet_queue')
          .update({ synced_version: queued.version, attempts: 0, last_error: null, next_attempt_at: new Date().toISOString() })
          .eq('user_id', queued.user_id).eq('version', queued.version);
        if (saved.error) throw new Error('Unable to record Sheet sync status.');
        synced++;
      } catch (error) {
        const attempts = queued.attempts + 1;
        await service.from('member_sheet_queue').update({
          attempts,
          last_error: error.message.slice(0, 300),
          next_attempt_at: new Date(Date.now() + Math.min(3_600_000, 30_000 * 2 ** Math.min(attempts, 7))).toISOString(),
        }).eq('user_id', queued.user_id).eq('version', queued.version);
      }
    }
    return { busy: false, synced };
  } finally {
    await service.rpc('release_member_sheet_sync', { lease_holder: holder });
  }
}
