import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/feed?cursor=&limit=
// Returns check-ins from users the current user follows, newest first.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  // Collect IDs of followed users
  const follows = await prisma.follow.findMany({
    where:  { followerId: session.user.id },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  // Include own check-ins in the feed
  const authorIds = [session.user.id, ...followingIds];

  const checkins = await prisma.checkin.findMany({
    where:   { userId: { in: authorIds } },
    orderBy: { visitedDate: "desc" },
    take:    limit + 1,
    cursor:  cursor ? { id: cursor } : undefined,
    skip:    cursor ? 1 : 0,
    include: {
      location: true,
      user: {
        select: { id: true, username: true, name: true, avatarUrl: true },
      },
    },
  });

  const hasMore    = checkins.length > limit;
  const items      = hasMore ? checkins.slice(0, limit) : checkins;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor, hasMore });
}
