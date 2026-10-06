const keys = ['full_name', 'intake', 'phone', 'display_name'];

export function configuration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    throw new Error('Supabase configuration is missing.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

export async function authenticatedUser(req, config) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return null;
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, authorization: `Bearer ${match[1]}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  const google = user?.app_metadata?.providers?.includes('google') || user?.app_metadata?.provider === 'google';
  return user?.id && user?.email && user.email_confirmed_at && google
    ? { id: user.id, email: user.email, token: match[1] } : null;
}

export async function profileRequest(config, user, method, fields) {
  const params = new URLSearchParams({ user_id: `eq.${user.id}`, select: 'user_id,full_name,intake,email,phone,display_name,created_at,updated_at' });
  const url = `${config.url}/rest/v1/member_profiles?${params}`;
  const headers = {
    apikey: config.key,
    authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  if (method === 'GET') {
    const result = await fetch(url, { headers });
    if (!result.ok) throw new Error('Unable to read the member profile.');
    return (await result.json())[0] || null;
  }
  const previous = await profileRequest(config, user, 'GET');
  const result = await fetch(previous ? url : `${config.url}/rest/v1/member_profiles`, {
    method: previous ? 'PATCH' : 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(previous ? fields : { user_id: user.id, email: user.email, ...fields }),
  });
  if (!result.ok) throw new Error('Unable to save the member profile. Please try again.');
  return (await result.json())[0];
}

export function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please complete your details.');
  const limits = { full_name: 160, intake: 120, phone: 40, display_name: 40 };
  const fields = {};
  for (const key of keys) {
    if (typeof body[key] !== 'string') throw new Error('Please complete every required field.');
    const value = body[key].trim();
    if (value.length < (key === 'phone' ? 5 : 2) || value.length > limits[key]) throw new Error('Please check your details and try again.');
    fields[key] = value;
  }
  if (!/^[+\d][\d\s()+.-]{4,39}$/.test(fields.phone)) throw new Error('Please enter a valid phone number.');
  return fields;
}
