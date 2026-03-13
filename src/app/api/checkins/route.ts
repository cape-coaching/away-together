import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateMatchCache } from "@/lib/redis";
import { persistUserVector } from "@/lib/match/vectors";
import { z } from "zod";

const CreateCheckinSchema = z.object({
  locationId:     z.string(),
  rating:         z.number().min(1).max(5),
  reviewText:     z.string().optional(),
  occasionTag:    z.string().optional(),
  visitedDate:    z.string().optional(),
  photoUrls:      z.array(z.string()).default([]),
  instagramPostId: z.string().optional(),
});

// GET /api/checkins?userId=&cursor=&limit=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId  = searchParams.get("userId");
  const cursor  = searchParams.get("cursor") ?? undefined;
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const checkins = await prisma.checkin.findMany({
    where:   { userId },
    orderBy: { visitedDate: "desc" },
    take:    limit + 1,
    cursor:  cursor ? { id: cursor } : undefined,
    skip:    cursor ? 1 : 0,
    include: { location: true },
  });

  const hasMore    = checkins.length > limit;
  const items      = hasMore ? checkins.slice(0, limit) : checkins;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor, hasMore });
}

// POST /api/checkins
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = CreateCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data    = parsed.data;
  const userId  = session.user.id;

  const checkin = await prisma.checkin.create({
    data: {
      userId,
      locationId:      data.locationId,
      rating:          data.rating,
      reviewText:      data.reviewText,
      occasionTag:     data.occasionTag,
      visitedDate:     data.visitedDate ? new Date(data.visitedDate) : new Date(),
      photoUrls:       data.photoUrls,
      instagramPostId: data.instagramPostId,
    },
    include: { location: true },
  });

  // Auto-add to "best of" itinerary if rating >= 4
  if (data.rating >= 4) {
    await upsertBestOfItinerary(userId, checkin.id, checkin.location.city);
  }

  // Recompute user vector and bust match cache async (don't block response)
  Promise.all([
    persistUserVector(userId),
    invalidateMatchCache(userId),
  ]).catch(console.error);

  return NextResponse.json(checkin, { status: 201 });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertBestOfItinerary(
  userId: string,
  checkinId: string,
  city: string
) {
  const title = `Best of ${city}`;

  let itinerary = await prisma.itinerary.findFirst({
    where: { userId, title, destination: city },
  });

  if (!itinerary) {
    itinerary = await prisma.itinerary.create({
      data: {
        userId,
        title,
        destination: city,
        visibility:  "draft",
        tags:        ["auto"],
      },
    });
  }

  const location = await prisma.checkin.findUnique({
    where:   { id: checkinId },
    include: { location: true },
  });

  if (!location) return;

  const orderIndex = await prisma.itineraryItem.count({
    where: { itineraryId: itinerary.id },
  });

  await prisma.itineraryItem.create({
    data: {
      itineraryId:  itinerary.id,
      checkinId,
      locationName: location.location.name,
      orderIndex,
    },
  });
}
