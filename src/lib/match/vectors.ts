import { prisma } from "@/lib/prisma";

// ─── User profile vector ──────────────────────────────────────────────────────
// Computed from all checkins. Stored in UserProfile.vectorJson.

export interface UserProfileVector {
  // Geographic
  visitedCountries: Record<string, { count: number; avgRating: number }>;
  visitedCities:    Record<string, { count: number; avgRating: number }>;
  geographicReach:  number; // distinct countries / total checkins (0–1)

  // Taste
  placeTypeDist: Record<string, number>; // normalized to sum 1.0
  occasionDist:  Record<string, number>; // normalized to sum 1.0
  avgRating:     number;
  ratingVariance: number;

  // Style
  checkinsPerMonth: number;
  activityLevel:    number; // checkins in past 30 days / 30

  // Engagement
  reviewTendency:      number; // % checkins with text review
  photoAttachmentRate: number; // % checkins with photos
  recencyScore:        number; // 1.0 = active today → 0.0 = inactive >90 days
}

export async function buildUserProfileVector(userId: string): Promise<UserProfileVector> {
  const checkins = await prisma.checkin.findMany({
    where: { userId },
    include: { location: true },
    orderBy: { visitedDate: "desc" },
  });

  if (checkins.length === 0) {
    return emptyVector();
  }

  // ── Geographic ──────────────────────────────────────────────────────────────
  const countryMap: Record<string, { total: number; count: number }> = {};
  const cityMap:    Record<string, { total: number; count: number }> = {};

  for (const c of checkins) {
    const country = c.location.countryCode;
    const city    = c.location.city;

    if (!countryMap[country]) countryMap[country] = { total: 0, count: 0 };
    countryMap[country].total += c.rating;
    countryMap[country].count += 1;

    if (!cityMap[city]) cityMap[city] = { total: 0, count: 0 };
    cityMap[city].total += c.rating;
    cityMap[city].count += 1;
  }

  const visitedCountries = Object.fromEntries(
    Object.entries(countryMap).map(([k, v]) => [k, { count: v.count, avgRating: v.total / v.count }])
  );
  const visitedCities = Object.fromEntries(
    Object.entries(cityMap).map(([k, v]) => [k, { count: v.count, avgRating: v.total / v.count }])
  );
  const geographicReach = Object.keys(visitedCountries).length / checkins.length;

  // ── Taste ───────────────────────────────────────────────────────────────────
  const placeTypeCounts: Record<string, number> = {};
  const occasionCounts:  Record<string, number> = {};
  let ratingSum = 0;

  for (const c of checkins) {
    const pt = c.location.placeType ?? "other";
    placeTypeCounts[pt] = (placeTypeCounts[pt] ?? 0) + 1;
    if (c.occasionTag) occasionCounts[c.occasionTag] = (occasionCounts[c.occasionTag] ?? 0) + 1;
    ratingSum += c.rating;
  }

  const totalCheckins = checkins.length;
  const placeTypeDist = normalize(placeTypeCounts, totalCheckins);
  const occasionDist  = normalize(occasionCounts,  totalCheckins);
  const avgRating     = ratingSum / totalCheckins;

  const ratingVariance =
    checkins.reduce((sum, c) => sum + Math.pow(c.rating - avgRating, 2), 0) / totalCheckins;

  // ── Style ───────────────────────────────────────────────────────────────────
  const oldestCheckin = checkins[checkins.length - 1];
  const monthsActive  = Math.max(
    1,
    (Date.now() - new Date(oldestCheckin.visitedDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const checkinsPerMonth = totalCheckins / monthsActive;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCount   = checkins.filter(c => new Date(c.visitedDate) > thirtyDaysAgo).length;
  const activityLevel = recentCount / 30;

  // ── Engagement ──────────────────────────────────────────────────────────────
  const withReview = checkins.filter(c => c.reviewText && c.reviewText.trim().length > 0).length;
  const withPhotos = checkins.filter(c => c.photoUrls.length > 0).length;
  const reviewTendency      = withReview / totalCheckins;
  const photoAttachmentRate = withPhotos / totalCheckins;

  const mostRecent  = new Date(checkins[0].visitedDate);
  const daysSinceActive = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceActive / 90);

  return {
    visitedCountries,
    visitedCities,
    geographicReach,
    placeTypeDist,
    occasionDist,
    avgRating,
    ratingVariance,
    checkinsPerMonth,
    activityLevel,
    reviewTendency,
    photoAttachmentRate,
    recencyScore,
  };
}

function normalize(counts: Record<string, number>, total: number): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / total]));
}

function emptyVector(): UserProfileVector {
  return {
    visitedCountries: {},
    visitedCities: {},
    geographicReach: 0,
    placeTypeDist: {},
    occasionDist: {},
    avgRating: 0,
    ratingVariance: 0,
    checkinsPerMonth: 0,
    activityLevel: 0,
    reviewTendency: 0,
    photoAttachmentRate: 0,
    recencyScore: 0,
  };
}

// Persist the vector to the database
export async function persistUserVector(userId: string) {
  const vector = await buildUserProfileVector(userId);
  await prisma.userProfile.upsert({
    where: { userId },
    update: { vectorJson: vector as object },
    create: { userId, vectorJson: vector as object },
  });
  return vector;
}
