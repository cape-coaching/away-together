import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    password: process.env.REDIS_TOKEN,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Cache helpers ────────────────────────────────────────────────────────────

export const MATCH_CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function getCachedMatches(userId: string) {
  const raw = await redis.get(`match:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedMatches(userId: string, matches: unknown) {
  await redis.setex(`match:${userId}`, MATCH_CACHE_TTL, JSON.stringify(matches));
}

export async function invalidateMatchCache(userId: string) {
  await redis.del(`match:${userId}`);
}
