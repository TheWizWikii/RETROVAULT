/* Sincronización opcional con Supabase. La clave publicable/anon puede estar en frontend;
   la seguridad depende de Row Level Security (RLS), incluida en supabase-setup.sql. */
window.CloudSync = (() => {
  let client = null;
  let session = null;
  let ready = false;
  let timer = null;
  let listeners = [];

  const cfg = () => window.APP_CONFIG?.supabase || {};
  const configured = () => Boolean(cfg().url && cfg().publishableKey && !cfg().url.includes('TU_'));
  const emit = () => listeners.forEach(fn => { try { fn(getStatus()); } catch {} });
  const getStatus = () => ({ configured: configured(), ready, signedIn: Boolean(session?.user), email: session?.user?.email || '', userId: session?.user?.id || '' });

  async function init() {
    if (!configured() || !window.supabase?.createClient) { ready = true; emit(); return getStatus(); }
    client = window.supabase.createClient(cfg().url, cfg().publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await client.auth.getSession();
    if (error) console.warn('Supabase getSession:', error.message);
    session = data?.session || null;
    ready = true; emit();
    client.auth.onAuthStateChange((_event, newSession) => {
      session = newSession;
      emit();
      // No hacer llamadas async dentro del callback de auth.
      setTimeout(() => window.dispatchEvent(new CustomEvent('cloud-auth-changed')), 0);
    });
    return getStatus();
  }

  async function signUp(email, password) {
    if (!client) throw new Error('Supabase no está configurado.');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }
  async function signIn(email, password) {
    if (!client) throw new Error('Supabase no está configurado.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session; emit(); return data;
  }
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    session = null; emit();
  }
  async function pull() {
    if (!client || !session?.user) return null;
    const { data, error } = await client.from('user_app_state').select('payload,updated_at').eq('user_id', session.user.id).maybeSingle();
    if (error) throw error;
    return data || null;
  }
  async function push(payload) {
    if (!client || !session?.user) return false;
    const row = { user_id: session.user.id, payload, updated_at: new Date().toISOString() };
    const { error } = await client.from('user_app_state').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
    return true;
  }
  function schedulePush(snapshotFactory, delay = 900) {
    if (!client || !session?.user || typeof snapshotFactory !== 'function') return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await push(snapshotFactory()); window.dispatchEvent(new CustomEvent('cloud-saved')); }
      catch (e) { console.warn('Cloud save:', e); window.dispatchEvent(new CustomEvent('cloud-error', { detail: e.message })); }
    }, delay);
  }
  function onStatus(fn) { listeners.push(fn); fn(getStatus()); return () => listeners = listeners.filter(x => x !== fn); }
  return { init, signUp, signIn, signOut, pull, push, schedulePush, onStatus, getStatus };
})();
