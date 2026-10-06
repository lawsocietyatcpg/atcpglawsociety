import { createClient } from './vendor/supabase.js';

export async function initializeMemberAuth() {
  let response;
  try { response = await fetch('/api/public-config', { cache: 'no-store' }); }
  catch { return null; }
  if (!response.ok) return null;
  const config = await response.json();
  if (!config.supabaseUrl || !config.supabasePublishableKey) return null;
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, autoRefreshToken: true },
  });
  const session = await client.auth.getSession();
  if (session.error) throw session.error;
  const auth = {
    client,
    profile: null,
    email: session.data.session?.user?.email || '',
    async token() { return (await client.auth.getSession()).data.session?.access_token || null; },
    async loadProfile() {
      const token = await auth.token();
      if (!token) { auth.profile = null; return null; }
      const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load your member details.');
      auth.profile = (await response.json()).profile;
      return auth.profile;
    },
    async saveProfile(data) {
      const token = await auth.token();
      if (!token) throw new Error('Please sign in with Google first.');
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save your details.');
      auth.profile = result.profile;
      return auth.profile;
    },
    async signIn() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}${location.pathname}` },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      auth.profile = null;
    },
  };
  if (session.data.session) await auth.loadProfile();
  return auth;
}
