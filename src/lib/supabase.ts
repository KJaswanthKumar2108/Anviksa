import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Polyfill WebSocket for Node.js 20 environment if necessary
if (typeof window === 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  import('ws').then(ws => {
    (globalThis as any).WebSocket = ws.default || ws;
  }).catch(() => {});
}

export function getSupabaseCredentials() {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof process !== 'undefined' && process.env) || {};
  const supabaseUrl = env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';
  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-supabase-project') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
  return { supabaseUrl, supabaseAnonKey, isConfigured };
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  const isBrowser = typeof window !== 'undefined';
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser
    }
  });
  return _client;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY VIOLATION: Supabase service role client cannot be initialized in browser environment.');
  }
  const { supabaseUrl } = getSupabaseCredentials();
  const serviceRoleKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || null;
  if (!serviceRoleKey || !supabaseUrl) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const isSupabaseConfigured = Boolean(
  getSupabaseCredentials().isConfigured
);

// Dynamic client proxy ensuring availability across Node.js and browser environments
export const supabase: any = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
