import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/users/[username]/follow
export async function POST(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = await prisma.user.findUnique({ where: { username: params.username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  await prisma.follow.upsert({
    where:  { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
    create: { followerId: session.user.id, followingId: target.id },
    update: {},
  });

  return NextResponse.json({ following: true });
}

// DELETE /api/users/[username]/follow
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = await prisma.user.findUnique({ where: { username: params.username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, followingId: target.id },
  });

  return NextResponse.json({ following: false });
}
