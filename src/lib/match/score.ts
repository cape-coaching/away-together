import type { UserProfileVector } from "./vectors";

export interface MatchResult {
  score: number; // 0–100
  breakdown: { geo: number; taste: number; style: number; engagement: number };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function computeMatchScore(a: UserProfileVector, b: UserProfileVector): MatchResult {
  const geo   = computeGeoScore(a, b);
  const taste = computeTasteScore(a, b);
  const style = computeStyleScore(a, b);
  const engagement = computeEngagementScore(a, b);

  // Weights: 0.25 + 0.35 + 0.20 + 0.10 = 0.90
  // Remaining 0.10 reserved for future signals (mutual connections, cuisine overlap, etc.)
  const raw = 0.25 * geo + 0.35 * taste + 0.20 * style + 0.10 * engagement;
  const score = Math.round(Math.min((raw / 0.9) * 100, 100));

  return {
    score,
    breakdown: {
      geo:         Math.round(geo * 100),
      taste:       Math.round(taste * 100),
      style:       Math.round(style * 100),
      engagement:  Math.round(engagement * 100),
    },
  };
}

// ─── Dimension 1: Geographic overlap (weight 0.25) ────────────────────────────

function computeGeoScore(a: UserProfileVector, b: UserProfileVector): number {
  const countriesA = new Set(Object.keys(a.visitedCountries));
  const countriesB = new Set(Object.keys(b.visitedCountries));

  if (countriesA.size === 0 || countriesB.size === 0) return 0;

  const intersection = [...countriesA].filter(c => countriesB.has(c));
  const union = new Set([...countriesA, ...countriesB]);
  const countryJaccard = intersection.length / union.size;

  // City-level Jaccard within shared countries
  const citiesInSharedA = new Set(
    Object.keys(a.visitedCities).filter(() => intersection.some(c => a.visitedCountries[c]))
  );
  const citiesInSharedB = new Set(
    Object.keys(b.visitedCities).filter(() => intersection.some(c => b.visitedCountries[c]))
  );

  let cityJaccard = 0;
  if (citiesInSharedA.size > 0 || citiesInSharedB.size > 0) {
    const cityIntersection = [...citiesInSharedA].filter(c => citiesInSharedB.has(c));
    const cityUnion = new Set([...citiesInSharedA, ...citiesInSharedB]);
    cityJaccard = cityUnion.size > 0 ? cityIntersection.length / cityUnion.size : 0;
  }

  return clamp(0.6 * countryJaccard + 0.4 * cityJaccard);
}

// ─── Dimension 2: Taste alignment (weight 0.35) ───────────────────────────────

function computeTasteScore(a: UserProfileVector, b: UserProfileVector): number {
  const placeTypeSim = cosineSimilarity(a.placeTypeDist, b.placeTypeDist);
  const occasionSim  = cosineSimilarity(a.occasionDist,  b.occasionDist);
  const ratingAlign  = 1 - Math.abs(a.avgRating - b.avgRating) / 5;

  return clamp(0.5 * placeTypeSim + 0.35 * occasionSim + 0.15 * ratingAlign);
}

// ─── Dimension 3: Travel style (weight 0.20) ──────────────────────────────────

function computeStyleScore(a: UserProfileVector, b: UserProfileVector): number {
  const maxCPM    = Math.max(a.checkinsPerMonth, b.checkinsPerMonth, 1);
  const speedSim  = 1 - Math.abs(a.checkinsPerMonth - b.checkinsPerMonth) / maxCPM;
  const scopeSim  = 1 - Math.abs(a.geographicReach - b.geographicReach);
  const actSim    = 1 - Math.abs(a.activityLevel - b.activityLevel);

  return clamp(0.4 * speedSim + 0.35 * scopeSim + 0.25 * actSim);
}

// ─── Dimension 4: Engagement quality (weight 0.10) ───────────────────────────

function computeEngagementScore(a: UserProfileVector, b: UserProfileVector): number {
  const reviewMatch  = 1 - Math.abs(a.reviewTendency      - b.reviewTendency);
  const photoMatch   = 1 - Math.abs(a.photoAttachmentRate - b.photoAttachmentRate);
  const recencyMatch = 1 - Math.abs(a.recencyScore        - b.recencyScore);

  return clamp(0.4 * reviewMatch + 0.4 * photoMatch + 0.2 * recencyMatch);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;

  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    dot  += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
