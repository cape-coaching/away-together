import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedMatches, setCachedMatches } from "@/lib/redis";
import { buildUserProfileVector, persistUserVector } from "@/lib/match/vectors";
import { computeMatchScore } from "@/lib/match/score";

// GET /api/match?limit=&forceRefresh=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit        = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  const userId       = session.user.id;

  // 1. Try Redis cache first
  if (!forceRefresh) {
    const cached = await getCachedMatches(userId);
    if (cached) {
      return NextResponse.json({ items: cached.slice(0, limit), fromCache: true });
    }
  }

  // 2. Ensure requesting user has a current vector
  let myVector = await getOrBuildVector(userId);

  // 3. Pull pre-computed scores from DB (nightly job keeps these fresh)
  const dbMatches = await prisma.userMatch.findMany({
    where:   { userId },
    orderBy: { score: "desc" },
    take:    limit,
    include: {
      matchedUser: {
        select: { id: true, username: true, name: true, avatarUrl: true, bio: true },
      },
    },
  });

  // 4. If no DB matches yet (new user), compute on-the-fly for up to 50 candidates
  let results;
  if (dbMatches.length === 0) {
    results = await computeFreshMatches(userId, myVector, limit);
  } else {
    results = dbMatches.map((m) => ({
      userId:      m.matchedUserId,
      user:        m.matchedUser,
      score:       Math.round(m.score),
      breakdown:   m.detailsJson as { geo: number; taste: number; style: number; engagement: number },
    }));
  }

  // 5. Cache and return
  await setCachedMatches(userId, results);

  return NextResponse.json({ items: results.slice(0, limit), fromCache: false });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrBuildVector(userId: string) {
  const stored = await prisma.userProfile.findUnique({ where: { userId } });
  if (stored) return stored.vectorJson as any;

  const vector = await buildUserProfileVector(userId);
  await persistUserVector(userId);
  return vector;
}

async function computeFreshMatches(userId: string, myVector: any, limit: number) {
  // Grab up to 50 public users who have a vector (excluding self)
  const candidates = await prisma.userProfile.findMany({
    where:   { userId: { not: userId } },
    take:    50,
    include: {
      user: {
        select: { id: true, username: true, name: true, avatarUrl: true, bio: true },
      },
    },
  });

  const scored = candidates
    .map((c) => {
      const theirVector = c.vectorJson as any;
      const result      = computeMatchScore(myVector, theirVector);
      return {
        userId:    c.userId,
        user:      c.user,
        score:     result.score,
        breakdown: result.breakdown,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Persist these to DB so subsequent calls are fast
  await prisma.$transaction(
    scored.map((m) =>
      prisma.userMatch.upsert({
        where:  { userId_matchedUserId: { userId, matchedUserId: m.userId } },
        create: { userId, matchedUserId: m.userId, score: m.score, detailsJson: m.breakdown },
        update: { score: m.score, detailsJson: m.breakdown },
      })
    )
  );

  return scored;
}
