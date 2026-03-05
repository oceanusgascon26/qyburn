/**
 * Performance utilities: TTL cache, API latency measurement, and cache-through helper.
 */

// ─── TTL Cache ──────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 60_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /** Get a cached value. Returns undefined if missing or expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Set a value with optional custom TTL in milliseconds. */
  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  /** Invalidate a specific key. */
  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Clear all cached entries. */
  clear(): void {
    this.store.clear();
  }

  /** Get the number of entries (including potentially expired ones). */
  get size(): number {
    return this.store.size;
  }

  /** Prune all expired entries. Returns the number removed. */
  prune(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }
}

// ─── API Latency Measurement ────────────────────────────────

export interface LatencyResult<T> {
  result: T;
  durationMs: number;
}

/**
 * Measure the execution time of an async function.
 * Returns the result alongside the duration in milliseconds.
 */
export async function measureApiLatency<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<LatencyResult<T>> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;

  if (label) {
    console.log(`[Perf] ${label}: ${durationMs}ms`);
  }

  return { result, durationMs };
}

// ─── Cache-Through Helper ───────────────────────────────────

/**
 * Cache-through: returns cached value if available, otherwise calls
 * the fetcher, caches the result, and returns it.
 */
export async function cacheResponse<T>(
  cache: TTLCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

// ─── Shared Instances ───────────────────────────────────────

/** Global API response cache (5-minute TTL). */
export const apiCache = new TTLCache(5 * 60 * 1000);

/** Short-lived cache for dashboard / aggregate data (30s TTL). */
export const dashboardCache = new TTLCache(30_000);
