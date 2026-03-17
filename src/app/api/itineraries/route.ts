import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/itineraries?userId=&visibility=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId     = searchParams.get("userId") ?? session.user.id;
  const visibility = searchParams.get("visibility"); // draft | public | null (all)

  // Only the owner can see their drafts
  const isOwner = userId === session.user.id;
  const where: Record<string, unknown> = { userId };
  if (visibility) {
    where.visibility = visibility;
  } else if (!isOwner) {
    where.visibility = "public";
  }

  const itineraries = await prisma.itinerary.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        take: 3,
        include: {
          checkin: {
            include: { location: true },
          },
        },
      },
    },
  });

  const result = itineraries.map((it) => ({
    id:          it.id,
    title:       it.title,
    description: it.description,
    destination: it.destination,
    visibility:  it.visibility,
    tags:        it.tags,
    itemCount:   it._count.items,
    previewItems: it.items.map((item) => ({
      id:           item.id,
      locationName: item.locationName,
      dayNumber:    item.dayNumber,
      photo:        item.checkin?.photoUrls?.[0] ?? null,
      rating:       item.checkin?.rating ?? null,
    })),
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
  }));

  return NextResponse.json({ items: result });
}
