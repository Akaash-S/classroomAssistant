import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Lazily initializes the Supabase client.
 * This prevents crashes during Next.js static prerendering when env vars may not be available.
 */
export function getSupabase(): SupabaseClient {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Must be a valid HTTP/HTTPS URL (e.g. https://xxxx.supabase.co).`);
    }
    if (!key) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
    }

    _client = createClient(url, key);
    return _client;
}

// Keep a default export for backward compatibility — resolves lazily at runtime only
let _supabase: SupabaseClient | undefined;

// Proxy object so existing `import { supabase }` calls continue to work at runtime
// without eagerly initializing the client at module load time.
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (!_supabase) {
            try {
                _supabase = getSupabase();
            } catch (e) {
                // During SSR prerender the env might not be set — return a no-op
                console.warn('[Supabase] Not initialized:', e);
                return () => ({ data: null, error: new Error('Supabase not initialized') });
            }
        }
        return (_supabase as any)[prop];
    },
});
