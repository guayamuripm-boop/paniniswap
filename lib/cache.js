const TTL = 5 * 60 * 1000

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, expiry } = JSON.parse(raw)
    if (Date.now() > expiry) { localStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

export function cacheSet(key, data, ttl = TTL) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }))
  } catch { /* quota exceeded */ }
}

export async function cacheFetch(key, fetcher, ttl) {
  const cached = cacheGet(key)
  if (cached) return cached
  const fresh = await fetcher()
  cacheSet(key, fresh, ttl)
  return fresh
}
