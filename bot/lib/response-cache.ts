/**
 * Response Cache — In-memory caching for common Q&A responses.
 *
 * Normalizes queries for fuzzy matching, stores responses with TTL,
 * tracks hit frequency for FAQ analytics, and supports pattern-based
 * cache invalidation.
 */

// ─── Types ───────────────────────────────────────────────────

export interface CachedResponse {
  query: string;
  normalizedQuery: string;
  response: string;
  intent: string;
  hits: number;
  lastHit: Date;
  expiresAt: Date;
}

// ─── In-memory cache store ───────────────────────────────────

const cache = new Map<string, CachedResponse>();

const DEFAULT_TTL_MINUTES = 60;

// ─── Query Normalization ─────────────────────────────────────

/**
 * Normalize a query for cache key matching.
 * - Lowercase
 * - Remove punctuation
 * - Collapse whitespace
 * - Sort words alphabetically (so "VPN setup how" matches "how to setup VPN")
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0)
    .sort()
    .join(" ");
}

// ─── Cache Operations ────────────────────────────────────────

/**
 * Look up a cached response by normalized query.
 * Returns null on miss or if the entry has expired.
 */
export function getCachedResponse(query: string): CachedResponse | null {
  const normalized = normalizeQuery(query);
  const entry = cache.get(normalized);

  if (!entry) return null;

  // Check expiration
  if (entry.expiresAt.getTime() < Date.now()) {
    cache.delete(normalized);
    return null;
  }

  // Cache hit — update counters
  entry.hits++;
  entry.lastHit = new Date();

  return entry;
}

/**
 * Store a response in the cache.
 */
export function cacheResponse(
  query: string,
  response: string,
  intent: string,
  ttlMinutes: number = DEFAULT_TTL_MINUTES
): void {
  const normalized = normalizeQuery(query);
  const now = new Date();

  cache.set(normalized, {
    query,
    normalizedQuery: normalized,
    response,
    intent,
    hits: 0,
    lastHit: now,
    expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
  });
}

/**
 * Get the most frequently asked (cached) questions.
 * Sorted by hit count descending.
 */
export function getTopCachedQueries(limit: number = 10): CachedResponse[] {
  // First, prune expired entries
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt.getTime() < now) {
      cache.delete(key);
    }
  }

  return [...cache.values()]
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit);
}

/**
 * Invalidate cache entries matching a pattern.
 * If no pattern is provided, clears the entire cache.
 *
 * Pattern matching: checks if the original query or normalized query
 * contains the pattern string (case-insensitive).
 */
export function invalidateCache(pattern?: string): number {
  if (!pattern) {
    const count = cache.size;
    cache.clear();
    console.log(`[CACHE] Cleared entire cache (${count} entries)`);
    return count;
  }

  const patternLower = pattern.toLowerCase();
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    if (
      entry.query.toLowerCase().includes(patternLower) ||
      entry.normalizedQuery.includes(patternLower) ||
      entry.intent.toLowerCase().includes(patternLower)
    ) {
      cache.delete(key);
      removed++;
    }
  }

  console.log(
    `[CACHE] Invalidated ${removed} entries matching pattern "${pattern}"`
  );
  return removed;
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): {
  size: number;
  totalHits: number;
  avgHitsPerEntry: number;
} {
  const entries = [...cache.values()];
  const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);

  return {
    size: cache.size,
    totalHits,
    avgHitsPerEntry: entries.length > 0 ? totalHits / entries.length : 0,
  };
}
