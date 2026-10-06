import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const cookieName = 'lawsoc_admin';
const now = () => new Date().toISOString();
const passwordHash = (password, salt) => pbkdf2Sync(password, Buffer.from(salt, 'hex'), 600000, 32, 'sha256').toString('hex');
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const validCredentials = (username, password) => {
  if (typeof username !== 'string' || !/^[A-Za-z0-9_.-]{3,50}$/.test(username)) throw new Error('Use 3–50 letters, numbers, dots, hyphens or underscores for the username.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Use a password with 12–128 characters.');
};

function sessionToken(req) {
  const raw = req.headers.cookie || '';
  const match = new RegExp(`(?:^|;\\s*)${cookieName}=([A-Za-z0-9_-]+)`).exec(raw);
  return match?.[1] || null;
}

export async function configured(service) {
  const result = await service.from('admin_credentials').select('id').eq('id', 1).maybeSingle();
  if (result.error) throw new Error('Unable to check administrator configuration.');
  return Boolean(result.data);
}

export async function cookieAdministrator(req, service) {
  const token = sessionToken(req);
  if (!token) return null;
  const result = await service.from('admin_sessions').select('owner_id,username')
    .eq('token_hash', tokenHash(token)).gt('expires_at', now()).maybeSingle();
  if (result.error) throw new Error('Unable to check administrator session.');
  return result.data ? { id: result.data.owner_id, name: result.data.username, role: 'admin', profileComplete: true } : null;
}

async function issueSession(res, service, ownerId, username) {
  const token = randomBytes(32).toString('base64url');
  const result = await service.from('admin_sessions').insert({
    token_hash: tokenHash(token), owner_id: ownerId, username,
    expires_at: new Date(Date.now() + 12 * 3600_000).toISOString(),
  });
  if (result.error) throw new Error('Unable to create administrator session.');
  res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);
}

export async function createAdministrator(req, res, connection, data) {
  if (await configured(connection.service)) throw new Error('Administrator already exists. Please sign in.');
  validCredentials(data.username, data.password);
  const expectedEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!expectedEmail) throw new Error('Official administrator email is not configured.');
  const bearer = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!bearer) throw new Error('Sign in with the Law Society Google account before administrator setup.');
  const { data: identity, error } = await connection.publicClient.auth.getUser(bearer[1]);
  const user = identity?.user;
  const google = user?.app_metadata?.providers?.includes('google') || user?.app_metadata?.provider === 'google';
  if (error || user?.email?.toLowerCase() !== expectedEmail || !user.email_confirmed_at || !google) throw new Error('Use the verified Law Society Google account for administrator setup.');
  const salt = randomBytes(24).toString('hex');
  const inserted = await connection.service.from('admin_credentials').insert({
    id: 1, owner_id: user.id, username: data.username,
    salt, digest: passwordHash(data.password, salt),
  });
  if (inserted.error) throw new Error('Unable to create administrator credentials.');
  await issueSession(res, connection.service, user.id, data.username);
}

export async function loginAdministrator(res, service, data) {
  const recent = await service.from('admin_login_attempts').select('id', { count: 'exact', head: true })
    .gt('attempted_at', new Date(Date.now() - 15 * 60_000).toISOString());
  if (recent.error) throw new Error('Unable to check login attempts.');
  if (recent.count >= 8) throw new Error('Too many unsuccessful attempts. Please wait 15 minutes.');
  const result = await service.from('admin_credentials').select('owner_id,username,salt,digest').eq('id', 1).maybeSingle();
  if (result.error) throw new Error('Unable to check administrator credentials.');
  const row = result.data;
  const validUsername = typeof data.username === 'string' && data.username === row?.username;
  const validPassword = typeof data.password === 'string' && data.password.length <= 128 && row
    && timingSafeEqual(Buffer.from(passwordHash(data.password, row.salt), 'hex'), Buffer.from(row.digest, 'hex'));
  if (!validUsername || !validPassword) {
    await service.from('admin_login_attempts').insert({});
    throw new Error('Incorrect username or password.');
  }
  await service.from('admin_login_attempts').delete().gt('attempted_at', '1970-01-01T00:00:00Z');
  await issueSession(res, service, row.owner_id, row.username);
}

export async function changeAdministrator(req, res, service, data) {
  const admin = await cookieAdministrator(req, service);
  if (!admin) throw new Error('Administrator sign-in required.');
  validCredentials(data.username, data.password);
  const result = await service.from('admin_credentials').select('owner_id,salt,digest').eq('id', 1).single();
  if (result.error) throw new Error('Unable to check current password.');
  const current = data.current_password;
  if (typeof current !== 'string' || !timingSafeEqual(Buffer.from(passwordHash(current, result.data.salt), 'hex'), Buffer.from(result.data.digest, 'hex'))) throw new Error('Incorrect current password.');
  const salt = randomBytes(24).toString('hex');
  const updated = await service.from('admin_credentials').update({ username: data.username, salt, digest: passwordHash(data.password, salt), updated_at: now() }).eq('id', 1);
  if (updated.error) throw new Error('Unable to update administrator credentials.');
  await service.from('admin_sessions').delete().gt('expires_at', '1970-01-01T00:00:00Z');
  await issueSession(res, service, result.data.owner_id, data.username);
}

export async function logoutAdministrator(req, res, service) {
  const token = sessionToken(req);
  if (token) await service.from('admin_sessions').delete().eq('token_hash', tokenHash(token));
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}
