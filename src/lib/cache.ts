/**
 * Small in-process cache for expensive, non-personal aggregate reads.
 * Multi-instance deployments should replace this with Redis; TTLs are short so
 * stale analytics can never affect checkout or business operations.
 */
interface Entry {
  expiresAt: number;
  value: unknown;
}

const globalCache = globalThis as unknown as { ilkaiiCache?: Map<string, Entry> };
const store = globalCache.ilkaiiCache ?? new Map<string, Entry>();
globalCache.ilkaiiCache = store;
const MAX_ENTRIES = 200;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);
  if (existing && existing.expiresAt > now) return existing.value as T;
  if (store.size >= MAX_ENTRIES) {
    for (const [entryKey, entry] of store) {
      if (entry.expiresAt <= now) store.delete(entryKey);
    }
    if (store.size >= MAX_ENTRIES) store.clear();
  }
  const value = await load();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
