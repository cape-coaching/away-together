import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[username]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where:  { username },
    select: {
      id:        true,
      username:  true,
      name:      true,
      bio:       true,
      avatarUrl: true,
      isPrivate: true,
      createdAt: true,
      _count: {
        select: {
          checkins:   true,
          following:  true,
          followers:  true,
          itineraries: { where: { visibility: "public" } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Private account: only return basic info unless viewer is following
  const isOwn = session?.user?.id === user.id;
  let isFollowing = false;
  if (!isOwn && session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId:  session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const canViewContent = !user.isPrivate || isOwn || isFollowing;

  return NextResponse.json({
    ...user,
    stats: {
      checkins:    user._count.checkins,
      following:   user._count.following,
      followers:   user._count.followers,
      itineraries: user._count.itineraries,
    },
    isOwn,
    isFollowing,
    canViewContent,
    _count: undefined,
  });
}
