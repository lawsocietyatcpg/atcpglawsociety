import { createClient } from '@supabase/supabase-js';
import seed from '../seed.json' with { type: 'json' };
import { configuration } from './member.js';
import { cookieAdministrator } from './admin.js';

export function clients() {
  const { url, key } = configuration();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Server credential is missing.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return { publicClient: createClient(url, key, options), service: createClient(url, secret, options) };
}

export async function caller(req, clients) {
  const adminSession = await cookieAdministrator(req, clients.service);
  if (adminSession) return adminSession;
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return null;
  const { data, error } = await clients.publicClient.auth.getUser(match[1]);
  if (error || !data.user?.id) return null;
  const id = data.user.id;
  const [profileResult, adminResult] = await Promise.all([
    clients.service.from('member_profiles').select('display_name').eq('user_id', id).maybeSingle(),
    clients.service.from('society_admins').select('user_id').eq('user_id', id).maybeSingle(),
  ]);
  if (profileResult.error || adminResult.error) throw new Error('Unable to check account permissions.');
  return {
    id,
    email: data.user.email,
    name: profileResult.data?.display_name || data.user.email?.split('@')[0] || 'Member',
    role: adminResult.data ? 'admin' : 'student',
    profileComplete: Boolean(profileResult.data),
  };
}

export async function websiteState(service) {
  let result = await service.from('site_state').select('body,version').eq('id', 1).maybeSingle();
  if (result.error) throw new Error('Unable to read website content.');
  if (!result.data) {
    const inserted = await service.from('site_state').insert({ id: 1, body: seed });
    if (inserted.error && inserted.error.code !== '23505') throw new Error('Unable to initialise website content.');
    result = await service.from('site_state').select('body,version').eq('id', 1).single();
    if (result.error) throw new Error('Unable to read website content.');
  }
  return result.data;
}

export async function saveWebsiteState(service, version, body, action, actor) {
  const { error } = await service.rpc('save_site_state', {
    expected_version: version,
    new_body: body,
    action_name: action,
    actor_id: actor,
  });
  if (error) {
    if (error.code === '40001' || error.message?.includes('version_conflict')) return false;
    throw new Error('Unable to save website content.');
  }
  return true;
}
